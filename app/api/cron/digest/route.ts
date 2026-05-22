import { NextResponse } from 'next/server';
import { getLeadsSince, getListingsSince } from '@/lib/sheets';
import { sendSubmissionsDigest } from '@/lib/email';

// Cron runs every 2 days (see vercel.json). A small overlap on the lookback
// window means we never miss a submission near the boundary — a rare duplicate
// in two consecutive digests is harmless, a missed lead is not.
const LOOKBACK_HOURS = Number(process.env.DIGEST_LOOKBACK_HOURS) || 50;

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  // Vercel Cron attaches `Authorization: Bearer ${CRON_SECRET}` automatically
  // when CRON_SECRET is set. Reject anything else so the endpoint can't be
  // triggered publicly. If CRON_SECRET is unset we allow it (read-only + email
  // to a fixed address), but log a warning to nudge setting it.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  } else {
    console.warn('[cron/digest] CRON_SECRET not set — endpoint is publicly triggerable.');
  }

  const url = new URL(request.url);
  const lookbackHours = Number(url.searchParams.get('hours')) || LOOKBACK_HOURS;
  const force = url.searchParams.get('always') === '1';
  const cutoff = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

  try {
    const [leads, listings] = await Promise.all([
      getLeadsSince(cutoff),
      getListingsSince(cutoff),
    ]);

    // Nothing new → skip the email by default to avoid every-2-days noise.
    if (leads.length === 0 && listings.length === 0 && !force) {
      return NextResponse.json({ sent: false, reason: 'no new submissions', leads: 0, listings: 0 });
    }

    const result = await sendSubmissionsDigest(leads, listings, lookbackHours);

    return NextResponse.json({
      sent: result.ok,
      reason: result.reason,
      leads: leads.length,
      listings: listings.length,
    });
  } catch (err) {
    console.error('[cron/digest] failed:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
