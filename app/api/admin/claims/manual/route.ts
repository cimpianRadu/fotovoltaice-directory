import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  MAX_ACTIVE_CLAIMS_PER_FIRM,
  MAX_CLAIMS_PER_LEAD,
  claimsHeldForLead,
  countActiveClaimsForFirm,
  getClaims,
  getFullLeadById,
  isSameFirm,
  saveClaimToSheet,
} from '@/lib/sheets';
import { isValidEmail } from '@/lib/portal-auth';

/**
 * Revendicare marcată din /admin/crm după ce am sunat firma la telefon —
 * se comportă identic cu revendicarea de pe /cereri (aceleași plafoane, aceeași
 * regulă de duplicat) dar **NU trimite email de confirmare** către firmă (i-am
 * dat deja cererea manual) și e etichetată `source: 'manual'` în Sheet, ca să
 * o distingem în analytics de tracțiunea organică. Plafoanele se aplică
 * implicit: dacă o firmă și-a umplut sloturile de revendicări active
 * necontactate, nu i se mai dă una pe cale automată — regula există ca să nu ocupe degeaba
 * sloturi. `override: true` le trece, pentru cazul în care ai dat cererea
 * telefonic unei firme în plus și vrei doar să consemnezi realitatea: un rând
 * lipsă înseamnă o firmă care nu-și vede cererea în /portal. Duplicatul rămâne
 * blocat oricum, două rânduri pentru aceeași firmă pe aceeași cerere n-au ce
 * descrie.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId, numeFirma, numeContact, telefon, email } = body as Record<string, string>;
    const override = Boolean(body?.override);

    if (!leadId || !numeFirma?.trim() || !numeContact?.trim() || !telefon?.trim()) {
      return NextResponse.json(
        { error: 'Firma, contactul și telefonul sunt obligatorii.' },
        { status: 400 },
      );
    }

    // Emailul a fost opțional până pe 12 aug 2026, iar rezultatul au fost 11
    // revendicări fără coloana I: firme cărora le dădusem cererea la telefon și
    // care, când intrau în /portal, vedeau o pagină goală. Revendicarea se
    // leagă de cont NUMAI pe adresa asta, deci una fără email e o promisiune
    // pe care portalul n-o poate ține.
    if (!email?.trim() || !isValidEmail(email)) {
      return NextResponse.json(
        {
          error:
            'Emailul firmei e obligatoriu — fără el revendicarea nu apare niciodată în portalul ei.',
        },
        { status: 400 },
      );
    }

    // Cererea trebuie să existe; getFullLeadById filtrează și cererile ascunse
    // manual din feedul public — nu vrem revendicări pe ceva declarat spam.
    const lead = await getFullLeadById(leadId);
    if (!lead) {
      return NextResponse.json({ error: 'Cererea nu mai este activă.' }, { status: 404 });
    }

    const allClaims = await getClaims();
    // Renunțările nu ocupă locuri, dar manual poți re-aloca și unei firme care
    // a renunțat (tu decizi, după apel) — de-aia duplicatul se verifică doar pe
    // revendicările încă ținute, spre deosebire de fluxul public.
    const claimsForLead = claimsHeldForLead(allClaims, leadId);

    if (!override && claimsForLead.length >= MAX_CLAIMS_PER_LEAD) {
      return NextResponse.json(
        { error: 'Cererea are deja numărul maxim de revendicări.', full: true },
        { status: 409 },
      );
    }

    const claimData = { numeFirma: numeFirma.trim(), telefon: telefon.trim() };

    const duplicate = claimsForLead.some((c) => isSameFirm(c, claimData));
    if (duplicate) {
      return NextResponse.json(
        { error: 'Firma are deja o revendicare pe această cerere.' },
        { status: 409 },
      );
    }

    const active = countActiveClaimsForFirm(allClaims, claimData);
    if (!override && active >= MAX_ACTIVE_CLAIMS_PER_FIRM) {
      return NextResponse.json(
        {
          error: `Firma are deja ${active} revendicări active necontactate. Confirmă un apel ca să eliberezi un slot.`,
          firmCapped: true,
        },
        { status: 409 },
      );
    }

    const claimTimestamp = await saveClaimToSheet({
      leadId,
      numeFirma: claimData.numeFirma,
      numeContact: numeContact.trim(),
      telefon: claimData.telefon,
      source: 'manual',
      email: email.trim(),
    });

    // Feedul public și CRM-ul citesc din Sheets prin ISR: invalidăm ambele ca
    // rândul nou să apară imediat, nu la următorul refresh de 5 min.
    revalidatePath('/cereri');
    revalidatePath('/admin/crm');
    revalidatePath('/admin/portal');

    // Timestampul e cheia rândului: cine dă cererea din /admin/portal aprobă
    // imediat după, iar aprobarea are nevoie de el.
    return NextResponse.json({ ok: true, claims: claimsForLead.length + 1, claimTimestamp });
  } catch (err) {
    console.error('Manual claim error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
