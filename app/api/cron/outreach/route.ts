import { NextResponse } from 'next/server';
import {
  getUnprocessedLeads,
  getUnprocessedListings,
  markLeadEmailed,
  markListingEmailed,
  getFirmLastContacted,
  logOutreach,
} from '@/lib/sheets';
import { sendEmail } from '@/lib/email';
import { leadClientEmail, leadFirmEmail, listingConfirmEmail, pickFirmsForLead } from '@/lib/outreach';
import companiesData from '@/data/companies.json';

// Daily routine that emails the current backlog from the Google Sheet:
//  - each new lead: forward to up to 5 rotated firms (B), confirm to the client (A)
//  - each new listing whose firm is already live in companies.json: confirm (D)
// Idempotent via the "Email trimis" marker column, so re-runs never duplicate.
// Incompatible / not-yet-published listings are left untouched for manual review.

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Soft cap per run to warm up the fresh sending domain. Leads are processed
// atomically (all their emails or none), so the real total may round up by a
// few. Bump OUTREACH_MAX_EMAILS once the domain reputation is established.
const MAX_EMAILS = Number(process.env.OUTREACH_MAX_EMAILS) || 30;
const FIRMS_PER_LEAD = 5;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function normCui(s: string): string {
  return (s || '').toUpperCase().replace(/[^0-9]/g, '');
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  } else {
    console.warn('[cron/outreach] CRON_SECRET not set — endpoint is publicly triggerable.');
  }

  // Guard: without a Resend key nothing can send. Bail before touching the sheet
  // so we never mark rows as emailed when no email actually went out.
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, reason: 'RESEND_API_KEY not set', sent: 0 });
  }

  // A listing is "published" once its CUI is in companies.json (the deployed
  // directory). Map normalized CUI -> slug so D links to the real profile.
  const publishedByCui = new Map<string, string>();
  for (const c of companiesData.companies as { cui?: string; slug: string }[]) {
    if (c.cui) publishedByCui.set(normCui(c.cui), c.slug);
  }

  let sent = 0;
  const stats = { leadsA: 0, leadsB: 0, listingsD: 0, skipped: 0, noFirms: 0, failed: 0 };

  try {
    const [leads, listings, lastContacted] = await Promise.all([
      getUnprocessedLeads(),
      getUnprocessedListings(),
      getFirmLastContacted(),
    ]);

    // ── Leads: notify firms (B), then confirm to the client (A) ──
    for (const { row, lead } of leads) {
      if (sent >= MAX_EMAILS) break;
      if (!lead.email) { stats.skipped++; continue; } // can't confirm; leave for review

      const firms = pickFirmsForLead(lead.judet, lead.segment, lastContacted, FIRMS_PER_LEAD);
      // No firm covers this county/segment. Don't send the client confirmation
      // (it would claim we forwarded the request when we did not) and leave the
      // row unprocessed so it surfaces for manual handling.
      if (firms.length === 0) { stats.noFirms++; continue; }

      const firmMsg = leadFirmEmail(lead);
      const contacted: { leadRow: number; firmId: string; firmEmail: string }[] = [];

      for (const f of firms) {
        const r = await sendEmail({ to: f.email, subject: firmMsg.subject, html: firmMsg.html, replyTo: firmMsg.replyTo });
        if (r.ok) {
          sent++; stats.leadsB++;
          contacted.push({ leadRow: row, firmId: f.id, firmEmail: f.email });
          lastContacted.set(f.id, Date.now()); // rotate within this run too
        } else {
          stats.failed++;
        }
        await sleep(500);
      }

      const clientMsg = leadClientEmail(lead);
      const ra = await sendEmail({ to: lead.email, subject: clientMsg.subject, html: clientMsg.html, replyTo: clientMsg.replyTo });
      if (ra.ok) { sent++; stats.leadsA++; } else { stats.failed++; }

      // Mark processed after the attempt regardless of the client result: the
      // firm notifications already went out, and re-running would re-blast them.
      if (contacted.length) await logOutreach(contacted);
      await markLeadEmailed(row);
      await sleep(500);
    }

    // ── Listings: confirm (D) only for firms already live, and only if PV-verified ──
    for (const { row, listing } of listings) {
      if (sent >= MAX_EMAILS) break;
      const slug = publishedByCui.get(normCui(listing.cui));
      const compatible = listing.anreStatus === 'verified-pv';
      if (!slug || !compatible || !listing.email) { stats.skipped++; continue; }

      const msg = listingConfirmEmail(listing, slug);
      const r = await sendEmail({ to: listing.email, subject: msg.subject, html: msg.html, replyTo: msg.replyTo });
      // D is the firm's own confirmation (low volume, safe to retry), so mark
      // only on success and let a failed send retry next run.
      if (r.ok) { sent++; stats.listingsD++; await markListingEmailed(row); } else { stats.failed++; }
      await sleep(500);
    }

    return NextResponse.json({ ok: true, sent, capped: sent >= MAX_EMAILS, ...stats });
  } catch (err) {
    console.error('[cron/outreach] failed:', err);
    return NextResponse.json({ error: 'internal error', sent, ...stats }, { status: 500 });
  }
}
