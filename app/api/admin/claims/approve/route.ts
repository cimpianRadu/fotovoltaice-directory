import { NextResponse, after } from 'next/server';
import { notifyClientFirmTook } from '@/lib/client-notify';
import { revalidatePath } from 'next/cache';
import { getFullLeadById, setClaimApproved } from '@/lib/sheets';
import { sendClaimApprovedEmail } from '@/lib/email';
import { getProjectTypeLabel } from '@/lib/utils-shared';

/**
 * Aprobarea unei revendicări, după apelul de confirmare cu firma: deblochează
 * datele clientului în /portal și, dacă revendicarea are email, anunță firma.
 * `approved: false` retrage aprobarea (apăsat din greșeală).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { claimTimestamp, leadId } = body as Record<string, string>;
    const approved = Boolean(body?.approved);

    if (!claimTimestamp || !leadId) {
      return NextResponse.json({ error: 'Lipsește identificatorul revendicării.' }, { status: 400 });
    }

    const approvedAt = approved ? new Date().toISOString() : '';
    const claim = await setClaimApproved(claimTimestamp, leadId, approvedAt);

    if (approved && claim.email) {
      // Fail-open — aprobarea e salvată chiar dacă emailul pică.
      const lead = await getFullLeadById(leadId);
      const leadSummary = lead
        ? `${getProjectTypeLabel(lead.tipProiect)} · ${lead.judet}${lead.putere ? ` · ${lead.putere} kW` : ''}`
        : leadId;
      await sendClaimApprovedEmail({ to: claim.email, leadSummary });
    }
    // Clientul află cine l-a preluat; o singură dată pe revendicare, chiar dacă
    // aprobarea e scoasă și pusă la loc (lib/email-cont, client_emails).
    if (approved) after(() => notifyClientFirmTook(leadId, claimTimestamp));

    revalidatePath('/admin/crm');
    // Același buton există și pe fișa de portal a firmei.
    revalidatePath('/admin/portal');
    return NextResponse.json({ ok: true, approvedAt });
  } catch (err) {
    console.error('Claim approve error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
