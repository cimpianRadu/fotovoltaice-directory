import { NextResponse } from 'next/server';
import { ACTIVE_CHECK_BATCHES, activeChecksSentOn, sendActiveChecks } from '@/lib/confirmare-activa';

// Loturile programate ale emailului „mai căutați oferte?" (21 sept 2026). Rulează
// zilnic la 06:00 UTC (09:00 în România, vara) și trimite doar în zilele din
// ACTIVE_CHECK_BATCHES, cât mai lipsește din lotul zilei: o a doua rulare în
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
  const batch = ACTIVE_CHECK_BATCHES[today] ?? 0;
  if (!batch) return NextResponse.json({ ok: true, today, skipped: 'nicio trimitere programată azi' });

  try {
    const already = await activeChecksSentOn(today);
    const result = await sendActiveChecks({ limit: batch - already, dry });
    console.log(`[cron/confirmare-activa] ${today}: ${dry ? 'dry ' : ''}${result.sent.length} trimise, ${result.failed.length} eșuate, ${already} deja azi`);
    return NextResponse.json({ ok: true, today, dry, already, ...result });
  } catch (err) {
    console.error('[cron/confirmare-activa] error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Eroare internă' }, { status: 500 });
  }
}
