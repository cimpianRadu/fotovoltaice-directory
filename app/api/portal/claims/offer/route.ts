import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPortalEmail } from '@/lib/portal-session';
import { getClaims, setClaimOffered } from '@/lib/sheets';

/**
 * Firma marchează că a trimis oferta clientului — pasul de după deblocarea
 * datelor. `offered: false` retrage marcajul (apăsat din greșeală).
 */
export async function POST(request: Request) {
  try {
    const email = await getPortalEmail();
    if (!email) {
      return NextResponse.json({ error: 'Sesiunea a expirat. Intră din nou.' }, { status: 401 });
    }

    const body = await request.json();
    const { claimTimestamp, leadId } = body as Record<string, string>;
    const offered = Boolean(body?.offered);
    if (!claimTimestamp || !leadId) {
      return NextResponse.json({ error: 'Revendicarea nu există.' }, { status: 400 });
    }

    const claims = await getClaims();
    const claim = claims.find((c) => c.timestamp === claimTimestamp && c.leadId === leadId);
    if (!claim || claim.email !== email) {
      return NextResponse.json({ error: 'Revendicarea nu există.' }, { status: 404 });
    }
    if (claim.releasedAt) {
      return NextResponse.json({ error: 'Ai renunțat la această cerere.' }, { status: 409 });
    }

    const offeredAt = offered ? new Date().toISOString() : '';
    const updated = await setClaimOffered(claimTimestamp, leadId, offeredAt);

    revalidatePath('/admin/crm');
    return NextResponse.json({ ok: true, offeredAt: updated.offeredAt });
  } catch (err) {
    console.error('[portal] claim offer error:', err);
    return NextResponse.json({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
  }
}
