import { NextResponse } from 'next/server';
import { bucharestStamp, getPortalEmail } from '@/lib/portal-session';
import { addClaimNote, getClaims, getFirmEmailGroup } from '@/lib/sheets';

export async function POST(request: Request) {
  try {
    const email = await getPortalEmail();
    if (!email) {
      return NextResponse.json({ error: 'Sesiunea a expirat. Intră din nou.' }, { status: 401 });
    }

    const body = await request.json();
    const { claimTimestamp, leadId } = body as Record<string, string>;
    const text = String(body?.text || '').trim();
    if (!claimTimestamp || !leadId || !text) {
      return NextResponse.json({ error: 'Nota nu poate fi goală.' }, { status: 400 });
    }

    // Poți scrie doar pe revendicările firmei tale (emailul din sesiune plus
    // adresele legate de el) — id-urile vin din client, deci verificarea de
    // proprietate e obligatorie.
    const [claims, emails] = await Promise.all([getClaims(), getFirmEmailGroup(email)]);
    const claim = claims.find((c) => c.timestamp === claimTimestamp && c.leadId === leadId);
    if (!claim || !emails.includes(claim.email)) {
      return NextResponse.json({ error: 'Revendicarea nu există.' }, { status: 404 });
    }

    const { today, time } = bucharestStamp();
    const updated = await addClaimNote(claimTimestamp, leadId, text, today, time);
    return NextResponse.json({ ok: true, notes: updated.firmNotes });
  } catch (err) {
    console.error('[portal] claim note error:', err);
    return NextResponse.json({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
  }
}
