import { NextResponse } from 'next/server';
import {
  ACTIVE_CHECK_PER_DAY,
  ACTIVE_CHECK_START,
  activeChecksSentOn,
  sendActiveCheckResends,
  sendActiveChecks,
} from '@/lib/confirmare-activa';
import { isClientEmailDay } from '@/lib/client-email-schedule';
import {
  STATUS_CHECK_PER_DAY,
  STATUS_CHECK_START,
  sendStatusChecks,
  statusChecksSentOn,
} from '@/lib/verificare-status';

// Loturile programate ale emailurilor către client cu cereri vechi. Rulează
// zilnic la 06:00 UTC (09:00 în România, vara) și trimite:
//   - „mai căutați oferte?" (21 sept 2026), ACTIVE_CHECK_PER_DAY pe zi de la
//     ACTIVE_CHECK_START (până pe 7 oct doar pe loturi programate, a plecat unul).
//     Locurile rămase libere din lot, după cererile noi, merg la retrimiterea
//     către cine n-a răspuns (o singură dată, la 30+ zile de primul email);
//   - „Ați găsit o ofertă bună?" (6 oct 2026), STATUS_CHECK_PER_DAY pe zi de la
//     STATUS_CHECK_START, până se termină cererile eligibile.
// Duminica nu pleacă niciunul (lib/client-email-schedule).
// Fiecare trimite doar cât mai lipsește din lotul zilei: o a doua rulare în
// aceeași zi nu mai trimite nimic. `?dry=1` arată cui ar pleca.

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get('authorization') !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  } else {
    console.warn('[cron/confirmare-activa] CRON_SECRET not set — endpoint is publicly triggerable.');
  }

  const dry = new URL(request.url).searchParams.get('dry') === '1';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });

  if (!isClientEmailDay(today)) {
    return NextResponse.json({ ok: true, today, dry, skipped: 'duminică: nu trimitem emailuri către clienți' });
  }

  try {
    let activeCheck: Record<string, unknown> = { skipped: `începe pe ${ACTIVE_CHECK_START}` };
    if (today >= ACTIVE_CHECK_START) {
      const already = await activeChecksSentOn(today);
      const result = await sendActiveChecks({ limit: ACTIVE_CHECK_PER_DAY - already, dry });
      // Și încercările eșuate ocupă un loc: lotul zilei nu crește din cauza unei erori.
      const left = ACTIVE_CHECK_PER_DAY - already - result.sent.length - result.failed.length;
      const resend = await sendActiveCheckResends({ limit: left, dry });
      console.log(
        `[cron/confirmare-activa] ${today}: ${dry ? 'dry ' : ''}${result.sent.length} trimise, ${resend.sent.length} retrimise, ${result.failed.length + resend.failed.length} eșuate, ${already} deja azi`,
      );
      activeCheck = { already, ...result, resend };
    }

    let statusCheck: Record<string, unknown> = { skipped: `începe pe ${STATUS_CHECK_START}` };
    if (today >= STATUS_CHECK_START) {
      const already = await statusChecksSentOn(today);
      const result = await sendStatusChecks({ limit: STATUS_CHECK_PER_DAY - already, dry });
      console.log(`[cron/verificare-status] ${today}: ${dry ? 'dry ' : ''}${result.sent.length} trimise, ${result.failed.length} eșuate, ${already} deja azi, ${result.eligible} eligibile`);
      statusCheck = { already, ...result };
    }

    return NextResponse.json({ ok: true, today, dry, activeCheck, statusCheck });
  } catch (err) {
    console.error('[cron/confirmare-activa] error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Eroare internă' }, { status: 500 });
  }
}
