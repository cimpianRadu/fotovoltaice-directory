import { getClaims, getLeadsSince, isLeadHidden, isTestLead } from '@/lib/sheets';
import WeeklyChart from './WeeklyChart';
import { SERIES, type SeriesKey, type WeekPoint } from './series';

export const dynamic = 'force-dynamic';

// Cererile, revendicările și ofertele pe săptămâni (24 oct 2026, cerut de Radu:
// „câte cereri intră pe săptămână, cum e față de alte săptămâni, câte
// revendicări și câte oferte trimise”). Săptămâna e luni–duminică, ora României.
//
// Cereri: fără cele ascunse, comasate și de test. Revendicări: data preluării,
// oricum a intrat (din /cereri, dată de noi, abonament). Oferte: data la care
// firma a marcat oferta ca trimisă în portal (coloana N); dacă firma se întoarce
// la un status de dinaintea ofertei, marcajul dispare și oferta nu se mai numără.

const DAY_MS = 86_400_000;

function bucharestYmd(ms: number): string {
  return new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Bucharest' });
}

function todayBucharest(): string {
  return bucharestYmd(Date.now());
}

/** Lunea săptămânii în care cade ziua (YYYY-MM-DD). */
function mondayOf(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function addDays(ymd: string, n: number): string {
  return new Date(Date.parse(`${ymd}T00:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
}

/** 0 = luni … 6 = duminică. */
function weekday(ymd: string): number {
  return (new Date(`${ymd}T00:00:00Z`).getUTCDay() + 6) % 7;
}

function weekLabel(monday: string): string {
  const fmt = (ymd: string) =>
    new Date(`${ymd}T12:00:00Z`).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  return `${fmt(monday)} – ${fmt(addDays(monday, 6))}`;
}

const WEEKDAY_NAMES = ['luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă', 'duminică'];

function Delta({ now, before }: { now: number; before: number }) {
  const d = now - before;
  if (d === 0) return <span className="text-slate-500">la fel</span>;
  return (
    <span className={d > 0 ? 'font-medium text-emerald-700' : 'font-medium text-rose-700'}>
      {d > 0 ? '▲' : '▼'} {Math.abs(d)}
    </span>
  );
}

export default async function CereriAnalyticsPage() {
  let dates: Record<SeriesKey, string[]>;
  try {
    const [leads, claims] = await Promise.all([getLeadsSince(new Date(0)), getClaims()]);
    const real = leads.filter((l) => !isLeadHidden(l) && !isTestLead(l));
    const testIds = new Set(leads.filter(isTestLead).map((l) => l.timestamp));
    const realClaims = claims.filter((c) => !testIds.has(c.leadId));
    dates = {
      cereri: real.map((l) => l.timestamp),
      revendicari: realClaims.map((c) => c.timestamp),
      oferte: realClaims.map((c) => c.offeredAt).filter(Boolean),
    };
  } catch (err) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Nu am putut citi din Google Sheets: {err instanceof Error ? err.message : String(err)}
      </div>
    );
  }

  // Fiecare dată → ziua ei în ora României.
  const days: Record<SeriesKey, string[]> = {
    cereri: [],
    revendicari: [],
    oferte: [],
  };
  for (const key of Object.keys(dates) as SeriesKey[]) {
    days[key] = dates[key]
      .map((iso) => Date.parse(iso))
      .filter(Number.isFinite)
      .map(bucharestYmd);
  }

  const today = todayBucharest();
  const thisMonday = mondayOf(today);
  const first = [...days.cereri, ...days.revendicari].sort()[0] ?? today;

  const weeks: WeekPoint[] = [];
  for (let m = mondayOf(first); m <= thisMonday; m = addDays(m, 7)) {
    const end = addDays(m, 6);
    const count = (key: SeriesKey) => days[key].filter((d) => d >= m && d <= end).length;
    weeks.push({
      start: m,
      label: weekLabel(m),
      partial: m === thisMonday,
      cereri: count('cereri'),
      revendicari: count('revendicari'),
      oferte: count('oferte'),
    });
  }

  // Săptămâna în curs se compară cu aceeași bucată din săptămâna trecută: luni
  // până azi, nu cu o săptămână întreagă.
  const dow = weekday(today);
  const lastMonday = addDays(thisMonday, -7);
  const sameSpanLastWeek = (key: SeriesKey) =>
    days[key].filter((d) => d >= lastMonday && d <= addDays(lastMonday, dow)).length;
  const full = weeks.filter((w) => !w.partial);
  const lastFull = full.at(-1);
  const prev4 = full.slice(-4);
  const avg4 = (key: SeriesKey) =>
    prev4.length ? Math.round((prev4.reduce((n, w) => n + w[key], 0) / prev4.length) * 10) / 10 : 0;
  const current = weeks.at(-1)!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Cereri pe săptămâni</h1>
        <p className="mt-1 text-sm text-slate-500">
          Săptămâni de luni până duminică. Săptămâna în curs ({current.label}) e până azi, {WEEKDAY_NAMES[dow]}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {SERIES.map((s) => (
          <div key={s.key} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="h-0.5 w-4 rounded-full" style={{ background: s.color }} />
              {s.label}, săptămâna asta
            </div>
            <div className="mt-1 text-3xl font-semibold text-slate-900">{current[s.key]}</div>
            <div className="mt-1 text-xs text-slate-600">
              <Delta now={current[s.key]} before={sameSpanLastWeek(s.key)} /> față de {sameSpanLastWeek(s.key)}{' '}
              săptămâna trecută, până {WEEKDAY_NAMES[dow]}
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              Săptămâna trecută întreagă: {lastFull ? lastFull[s.key] : '—'} · media ultimelor 4: {avg4(s.key)}
            </div>
          </div>
        ))}
      </div>

      <WeeklyChart weeks={weeks} />

      <p className="text-[11px] leading-relaxed text-slate-400">
        Cereri: fără cele ascunse, comasate și de test. Revendicări: după ziua preluării, oricum a intrat (din
        /cereri, dată de noi, abonament), inclusiv cele la care firma a renunțat ulterior. Oferte: după ziua în
        care firma a marcat oferta ca trimisă în portal; o ofertă demarcată ulterior nu se mai numără.
      </p>
    </div>
  );
}
