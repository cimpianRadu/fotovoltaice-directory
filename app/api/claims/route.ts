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
import { sendClaimNotification } from '@/lib/email';
import {
  getProjectTypeLabel,
  getRoofTypeLabel,
  getPhaseLabel,
  getFinancingLabel,
} from '@/lib/utils-shared';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { leadId, numeFirma, numeContact, telefon } = body as Record<string, string>;

    if (!leadId || !numeFirma?.trim() || !numeContact?.trim() || !telefon?.trim()) {
      return NextResponse.json(
        { error: 'Toate câmpurile sunt obligatorii.' },
        { status: 400 }
      );
    }

    // Lead-ul trebuie să existe în fereastra publică și să nu fie ascuns —
    // altfel un id inventat ar putea umple sheet-ul cu revendicări orfane.
    const lead = await getFullLeadById(leadId);
    if (!lead) {
      return NextResponse.json(
        { error: 'Cererea nu mai este activă.' },
        { status: 404 }
      );
    }

    const allClaims = await getClaims();
    const claimsForLead = allClaims.filter((c) => c.leadId === leadId);

    if (claimsForLead.length >= MAX_CLAIMS_PER_LEAD) {
      return NextResponse.json(
        { error: 'Cererea a fost deja revendicată de numărul maxim de firme.', full: true },
        { status: 409 }
      );
    }

    // Aceeași regulă de identificare ca la plafonul pe firmă, ca să nu poată o
    // firmă să treacă de una și să cadă în cealaltă cu aceleași date.
    const duplicate = claimsForLead.some((c) => isSameFirm(c, { numeFirma, telefon }));
    if (duplicate) {
      return NextResponse.json(
        { error: 'Firma ta a revendicat deja această cerere. Te contactăm telefonic.' },
        { status: 409 }
      );
    }

    // Plafonul pe firmă, verificat DUPĂ duplicat: cine reîncearcă aceeași cerere
    // trebuie să afle că o are deja, nu că e plin. Vezi MAX_ACTIVE_CLAIMS_PER_FIRM.
    const active = countActiveClaimsForFirm(allClaims, { numeFirma, telefon });
    if (active >= MAX_ACTIVE_CLAIMS_PER_FIRM) {
      return NextResponse.json(
        {
          error:
            `Ai deja ${active} cereri în lucru. Sună clienții pe care i-ai luat, ` +
            'îi întrebăm dacă i-ai contactat, apoi îți eliberăm locurile. ' +
            'Scrie-ne la contact@instalatori-fotovoltaice.ro dacă i-ai sunat deja.',
          firmCapped: true,
        },
        { status: 409 },
      );
    }

    const claim = {
      leadId,
      numeFirma: numeFirma.trim(),
      numeContact: numeContact.trim(),
      telefon: telefon.trim(),
      source: 'self' as const,
    };
    await saveClaimToSheet(claim);

    const claimCount = claimsForLead.length + 1;

    // Fără asta, feedul rămâne pe ISR-ul de 5 minute și o altă firmă vede
    // cererea ca nerevendicată imediat după ce a fost luată.
    revalidatePath('/cereri');

    // Fail-open: revendicarea e salvată chiar dacă emailul pică (fără RESEND_API_KEY etc.)
    await sendClaimNotification({
      claim,
      lead: {
        numeCompanie: lead.numeCompanie,
        numeContact: lead.numeContact,
        email: lead.email,
        telefon: lead.telefon,
        tipProiectLabel: getProjectTypeLabel(lead.tipProiect),
        judet: lead.judet,
        putere: lead.putere,
        suprafata: lead.suprafata,
        segment: lead.segment,
        timestamp: lead.timestamp,
        acoperisLabel: lead.tipAcoperis ? getRoofTypeLabel(lead.tipAcoperis) : '',
        fazareLabel: lead.fazare ? getPhaseLabel(lead.fazare) : '',
        consumLunar: lead.consumLunar,
        finantareLabel: lead.finantare ? getFinancingLabel(lead.finantare) : '',
      },
      claimCount,
      maxClaims: MAX_CLAIMS_PER_LEAD,
    });

    return NextResponse.json({ success: true, claims: claimCount });
  } catch (err) {
    console.error('Claims API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă. Vă rugăm încercați din nou.' },
      { status: 500 }
    );
  }
}
