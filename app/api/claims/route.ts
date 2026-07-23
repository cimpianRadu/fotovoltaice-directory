import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  MAX_CLAIMS_PER_LEAD,
  getClaims,
  getFullLeadById,
  saveClaimToSheet,
} from '@/lib/sheets';
import { sendClaimNotification } from '@/lib/email';
import { getProjectTypeLabel } from '@/lib/utils-shared';

function normalizePhone(s: string): string {
  return s.replace(/[\s.\-()]/g, '');
}

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

    const claimsForLead = (await getClaims()).filter((c) => c.leadId === leadId);

    if (claimsForLead.length >= MAX_CLAIMS_PER_LEAD) {
      return NextResponse.json(
        { error: 'Cererea a fost deja revendicată de numărul maxim de firme.', full: true },
        { status: 409 }
      );
    }

    const phone = normalizePhone(telefon);
    const firm = numeFirma.trim().toLowerCase();
    const duplicate = claimsForLead.some(
      (c) => normalizePhone(c.telefon) === phone || c.numeFirma.trim().toLowerCase() === firm
    );
    if (duplicate) {
      return NextResponse.json(
        { error: 'Firma ta a revendicat deja această cerere. Te contactăm telefonic.' },
        { status: 409 }
      );
    }

    const claim = {
      leadId,
      numeFirma: numeFirma.trim(),
      numeContact: numeContact.trim(),
      telefon: telefon.trim(),
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
