import { NextResponse } from 'next/server';
import { getClaims, getLeadsSince } from '@/lib/sheets';
import { claimsHeldForLead } from '@/lib/sheets-shared';
import {
  renderClaimsDailyDigest,
  sendClaimsDailyDigest,
  type ClaimsDigestClaim,
  type ClaimsDigestRelease,
} from '@/lib/email';
import { getProjectTypeLabel } from '@/lib/utils-shared';

// Rezumatul de seară cu revendicările și renunțările (9 nov 2026), în locul
// emailurilor trimise pe loc pentru fiecare. Rulează zilnic la 17:00 UTC (vezi
// vercel.json). Fereastra se taie la ora fixă, nu la `now`: cronul pornește cu
// câteva secunde întârziere, iar fără tăiere o revendicare de la limită ar
// apărea în două rezumate sau în niciunul.
const WINDOW_HOURS = 24;

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get('authorization') !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  } else {
    console.warn('[cron/revendicari-zi] CRON_SECRET not set — endpoint is publicly triggerable.');
  }

  const url = new URL(request.url);
  const hours = Number(url.searchParams.get('hours')) || WINDOW_HOURS;
  // `?preview=1` întoarce emailul ca pagină, fără să-l trimită (verificare locală).
  const preview = url.searchParams.get('preview') === '1';
  const end = new Date();
  end.setUTCMinutes(0, 0, 0);
  const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
  const inWindow = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= start.getTime() && t < end.getTime();
  };

  try {
    // Două citiri din Sheets, o dată pe zi.
    const [allClaims, leads] = await Promise.all([getClaims(), getLeadsSince(new Date(0))]);
    const leadById = new Map(leads.map((l) => [l.timestamp, l]));
    const summary = (leadId: string) => {
      const lead = leadById.get(leadId);
      if (!lead) return leadId;
      return `${getProjectTypeLabel(lead.tipProiect)} · ${lead.judet}${lead.putere ? ` · ${lead.putere} kW` : ''}`;
    };

    const claims: ClaimsDigestClaim[] = allClaims
      .filter((c) => inWindow(c.timestamp))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((c) => ({
        at: c.timestamp,
        numeFirma: c.numeFirma,
        leadId: c.leadId,
        leadSummary: summary(c.leadId),
        approved: Boolean(c.approvedAt),
      }));

    const releases: ClaimsDigestRelease[] = allClaims
      .filter((c) => c.releasedAt && inWindow(c.releasedAt))
      .sort((a, b) => a.releasedAt.localeCompare(b.releasedAt))
      .map((c) => ({
        at: c.releasedAt,
        claimedAt: c.timestamp,
        numeFirma: c.numeFirma,
        leadId: c.leadId,
        leadSummary: summary(c.leadId),
        motiv: c.releaseReason,
        leadWithoutFirm: claimsHeldForLead(allClaims, c.leadId).length === 0,
      }));

    if (preview) {
      const { html } = renderClaimsDailyDigest({ claims, releases });
      return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }

    if (claims.length === 0 && releases.length === 0) {
      return NextResponse.json({ sent: false, reason: 'nimic în fereastră', claims: 0, releases: 0 });
    }

    const result = await sendClaimsDailyDigest({ claims, releases });
    return NextResponse.json({
      sent: result.ok,
      reason: result.reason,
      claims: claims.length,
      releases: releases.length,
    });
  } catch (err) {
    console.error('[cron/revendicari-zi] failed:', err);
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
