import { NextResponse } from 'next/server';
import {
  CLAIM_REMINDER_MAX,
  getClaims,
  getLeadsSince,
  bucharestDay,
  claimIdleBusinessDays,
  claimReminderDue,
  isBusinessDay,
  markClaimReminded,
} from '@/lib/sheets';
import { sendClaimInactiveEmail } from '@/lib/email';
import { getProjectTypeLabel } from '@/lib/utils-shared';

/**
 * Zilnic: firmele care au datele unui client de 2 zile LUCRĂTOARE și n-au atins
 * deloc revendicarea primesc emailul „mai ești interesat?", apoi unul la 4 zile
 * lucrătoare, de maxim CLAIM_REMINDER_MAX ori. Cadența și pragurile stau în
 * `claimReminderDue`; aici rămâne doar trimiterea și marcajul (coloanele O + P
 * din „Revendicări").
 *
 * Nu se trimite în weekend sau de sărbătoare legală, oricât ar arăta cadența:
 * un email de duminică dimineața spune că nu ne interesează cum lucrează omul.
 *
 * Fără email în coloana I nu avem unde trimite; alea rămân treaba telefonului.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Plasă pentru prima rulare (sau după o pauză): nu trimitem un val într-o dimineață. */
const MAX_PER_RUN = 25;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  } else {
    console.warn('[cron/claim-nudge] CRON_SECRET not set — endpoint is publicly triggerable.');
  }

  // `?dry=1` arată exact cine ar primi emailul, fără să trimită și fără să
  // scrie marcajul. De rulat înainte de orice schimbare de cadență.
  const dry = new URL(request.url).searchParams.get('dry') === '1';

  const now = Date.now();
  if (!isBusinessDay(bucharestDay(now)) && !dry) {
    return NextResponse.json({ ok: true, skipped: 'zi nelucrătoare', sent: 0 });
  }

  try {
    const [claims, leads] = await Promise.all([getClaims(), getLeadsSince(new Date(0))]);
    const leadById = new Map(leads.map((l) => [l.timestamp, l]));

    const due = claims.filter(
      (c) => c.email && claimReminderDue({ ...c, noteCount: c.firmNotes.length }, now),
    );

    const batch = due.slice(0, MAX_PER_RUN);
    if (due.length > batch.length) {
      console.warn(
        `[cron/claim-nudge] ${due.length - batch.length} revendicări peste plafonul de ${MAX_PER_RUN}, rămân pe mâine.`,
      );
    }

    const sent: string[] = [];
    const failed: string[] = [];

    for (const c of batch) {
      const lead = leadById.get(c.leadId);
      const leadSummary = lead
        ? [getProjectTypeLabel(lead.tipProiect), lead.judet, lead.putere ? `${lead.putere} kW` : '']
            .filter(Boolean)
            .join(' · ')
        : c.leadId;
      const days = claimIdleBusinessDays(c.approvedAt, now);
      const attempt = c.reminderCount + 1;
      const label = `${c.email} → ${leadSummary} (${days} zile lucrătoare, reminder ${attempt}/${CLAIM_REMINDER_MAX})`;

      if (dry) {
        sent.push(label);
        continue;
      }

      const res = await sendClaimInactiveEmail({ to: c.email, leadSummary, days, attempt });
      if (!res.ok) {
        // Fără marcaj: cronul de mâine reîncearcă. O tăcere definitivă e mai
        // rea decât un email întârziat cu o zi.
        failed.push(`${c.email}: ${res.reason ?? 'necunoscut'}`);
        continue;
      }
      await markClaimReminded(c.timestamp, c.leadId, new Date(now).toISOString(), attempt);
      sent.push(label);
    }

    return NextResponse.json({
      ok: true,
      dry,
      candidates: due.length,
      sent: sent.length,
      failed: failed.length,
      details: { sent, failed },
    });
  } catch (err) {
    console.error('[cron/claim-nudge] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
