import { NextResponse } from 'next/server';
import { planOpenLeadsDigest, sendOpenLeadsDigestPlan } from '@/lib/open-leads-digest';

// Rezumatul de luni către firmele cu alertele pe județ pornite (17 oct 2026):
// cererile cu fonduri proprii și „cât mai repede” care încă au loc în județele
// lor, din ultimele 14 zile. Vezi lib/open-leads-digest.ts. Rulează lunea la 05:00 UTC (vercel.json),
// 08:00 vara în România, 07:00 iarna. `?dry=1` arată cui ar pleca;
// `?editie=2026-10-19` simulează o zi anume (doar cu dry, la verificare).

// Prima ediție (luni 19 oct 2026) merge și la firmele cu cont fără alerte, cu
// îndemnul să le pornească, pe 30 de zile în loc de 14. Cable Connect nu: au
// spus că au intrat din greșeală pe site.
const FIRST_EDITION = '2026-10-19';
const FIRST_EDITION_EXCLUDE = ['s.nelu.f@gmail.com', 'cableconnectromania@gmail.com'];

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get('authorization') !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  } else {
    console.warn('[cron/firme-saptamanal] CRON_SECRET not set — endpoint is publicly triggerable.');
  }

  const dry = new URL(request.url).searchParams.get('dry') === '1';
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
  const editie = dry ? new URL(request.url).searchParams.get('editie') : null;
  const first = (editie || today) === FIRST_EDITION;
  try {
    const plan = first
      ? (await planOpenLeadsDigest({ withoutAlerts: true, maxAgeDays: 30 })).filter(
          (p) => !p.to.some((e) => FIRST_EDITION_EXCLUDE.includes(e)),
        )
      : await planOpenLeadsDigest();
    if (dry) return NextResponse.json({ ok: true, dry, today, first, plan });
    const results = await sendOpenLeadsDigestPlan(plan);
    console.log(
      `[cron/firme-saptamanal] ${results.filter((r) => r.ok).length} trimise, ${results.filter((r) => !r.ok).length} eșuate`,
    );
    return NextResponse.json({ ok: true, dry, results });
  } catch (err) {
    console.error('[cron/firme-saptamanal] error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Eroare internă' }, { status: 500 });
  }
}
