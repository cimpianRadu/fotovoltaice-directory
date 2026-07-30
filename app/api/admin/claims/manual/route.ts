import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  MAX_ACTIVE_CLAIMS_PER_FIRM,
  MAX_CLAIMS_PER_LEAD,
  countActiveClaimsForFirm,
  getClaims,
  getFullLeadById,
  isSameFirm,
  saveClaimToSheet,
} from '@/lib/sheets';

/**
 * Revendicare marcată din /admin/crm după ce am sunat firma la telefon —
 * se comportă identic cu revendicarea de pe /cereri (aceleași plafoane, aceeași
 * regulă de duplicat) dar **NU trimite email de confirmare** către firmă (i-am
 * dat deja cererea manual) și e etichetată `source: 'manual'` în Sheet, ca să
 * o distingem în analytics de tracțiunea organică. Plafoanele sunt respectate
 * intenționat: dacă o firmă are deja 3 revendicări active necontactate, nu i
 * se mai dă a patra nici pe cale manuală — regula există ca să nu ocupe
 * degeaba sloturi.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId, numeFirma, numeContact, telefon } = body as Record<string, string>;

    if (!leadId || !numeFirma?.trim() || !numeContact?.trim() || !telefon?.trim()) {
      return NextResponse.json(
        { error: 'Firma, contactul și telefonul sunt obligatorii.' },
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
    const claimsForLead = allClaims.filter((c) => c.leadId === leadId);

    if (claimsForLead.length >= MAX_CLAIMS_PER_LEAD) {
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
    if (active >= MAX_ACTIVE_CLAIMS_PER_FIRM) {
      return NextResponse.json(
        {
          error: `Firma are deja ${active} revendicări active necontactate. Confirmă un apel ca să eliberezi un slot.`,
          firmCapped: true,
        },
        { status: 409 },
      );
    }

    await saveClaimToSheet({
      leadId,
      numeFirma: claimData.numeFirma,
      numeContact: numeContact.trim(),
      telefon: claimData.telefon,
      source: 'manual',
    });

    // Feedul public și CRM-ul citesc din Sheets prin ISR: invalidăm ambele ca
    // rândul nou să apară imediat, nu la următorul refresh de 5 min.
    revalidatePath('/cereri');
    revalidatePath('/admin/crm');

    return NextResponse.json({ ok: true, claims: claimsForLead.length + 1 });
  } catch (err) {
    console.error('Manual claim error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
