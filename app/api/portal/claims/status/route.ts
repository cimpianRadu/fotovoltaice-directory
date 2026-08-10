import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPortalEmail } from '@/lib/portal-session';
import { getClaims, setClaimFirmStatus } from '@/lib/sheets';
import { CLAIM_STATUSES, type ClaimStatus } from '@/lib/sheets-shared';

/**
 * Firma își setează statusul pe o revendicare din /portal (coloana F).
 * „Pierdut" NU trece pe aici: renunțarea eliberează locul cererii și cere un
 * motiv, deci rămâne pe /api/portal/claims/release.
 */
export async function POST(request: Request) {
  try {
    const email = await getPortalEmail();
    if (!email) {
      return NextResponse.json({ error: 'Sesiunea a expirat. Intră din nou.' }, { status: 401 });
    }

    const body = await request.json();
    const { claimTimestamp, leadId } = body as Record<string, string>;
    const status = String(body?.status || '') as ClaimStatus;
    if (!claimTimestamp || !leadId) {
      return NextResponse.json({ error: 'Revendicarea nu există.' }, { status: 400 });
    }
    if (!(CLAIM_STATUSES as readonly string[]).includes(status) || status === 'pierdut') {
      return NextResponse.json({ error: 'Status necunoscut.' }, { status: 400 });
    }

    const claims = await getClaims();
    const claim = claims.find((c) => c.timestamp === claimTimestamp && c.leadId === leadId);
    if (!claim || claim.email !== email) {
      return NextResponse.json({ error: 'Revendicarea nu există.' }, { status: 404 });
    }
    if (claim.releasedAt) {
      return NextResponse.json({ error: 'Ai renunțat la această cerere.' }, { status: 409 });
    }
    // Statusul descrie discuția cu clientul, iar discuția începe după ce firma
    // primește datele. Înainte de aprobare n-are ce să raporteze.
    if (!claim.approvedAt) {
      return NextResponse.json(
        { error: 'Statusul se poate seta după ce primești datele clientului.' },
        { status: 409 },
      );
    }

    const updated = await setClaimFirmStatus(claimTimestamp, leadId, status);

    revalidatePath('/admin/crm');
    revalidatePath('/admin/firme');
    return NextResponse.json({
      ok: true,
      status: updated.firmStatus,
      offeredAt: updated.offeredAt,
    });
  } catch (err) {
    console.error('[portal] claim status error:', err);
    return NextResponse.json({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
  }
}
