import Link from 'next/link';
import {
  getStats,
  getMetrics,
  resolveRange,
  formatDuration,
  pctDelta,
  type RangePreset,
  type StatsResponse,
  type MetricRow,
} from '@/lib/umami';

export const dynamic = 'force-dynamic';

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'this-month', label: 'Luna curentă' },
  { value: 'last-month', label: 'Luna trecută' },
  { value: 'last-30d', label: 'Ultimele 30 zile' },
  { value: 'last-7d', label: 'Ultimele 7 zile' },
];

type SearchParams = Promise<{ range?: string }>;

export default async function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const preset: RangePreset =
    PRESETS.find((p) => p.value === sp.range)?.value ?? 'this-month';
  const { startAt, endAt, label } = resolveRange(preset);

  let stats: StatsResponse | null = null;
  let topPages: MetricRow[] = [];
  let topEvents: MetricRow[] = [];
  let topReferrers: MetricRow[] = [];
  let error: string | null = null;

  try {
    [stats, topPages, topEvents, topReferrers] = await Promise.all([
      getStats(startAt, endAt),
      getMetrics(startAt, endAt, 'url', 30),
      getMetrics(startAt, endAt, 'event', 30),
      getMetrics(startAt, endAt, 'referrer', 15),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-900">
        <div className="font-semibold mb-2">Nu pot accesa Umami API</div>
        <div className="font-mono text-xs">{error}</div>
        <div className="mt-3 text-xs text-red-800">
          Verifică <code className="px-1 py-0.5 bg-red-100 rounded">UMAMI_API_KEY</code> în
          <code className="px-1 py-0.5 bg-red-100 rounded ml-1">.env.local</code>. Generează
          cheia din cloud.umami.is → Settings → API Keys.
        </div>
      </div>
    );
  }

  const sessions = stats!.visits.value;
  const avgDuration = sessions > 0 ? stats!.totaltime.value / sessions : 0;
  const prevAvgDuration =
    stats!.visits.prev > 0 ? stats!.totaltime.prev / stats!.visits.prev : 0;
  const bounceRate = sessions > 0 ? (stats!.bounces.value / sessions) * 100 : 0;
  const prevBounceRate =
    stats!.visits.prev > 0 ? (stats!.bounces.prev / stats!.visits.prev) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* Range picker */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500 mt-1">
            {label} · cache 1h · comparație vs perioada anterioară
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {PRESETS.map((p) => (
            <Link
              key={p.value}
              href={`/admin/analytics?range=${p.value}`}
              className={`px-3 py-1.5 text-xs rounded-md transition ${
                preset === p.value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Vizitatori"
          value={stats!.visitors.value.toLocaleString('ro-RO')}
          prev={stats!.visitors.value}
          prevPrev={stats!.visitors.prev}
        />
        <KpiCard
          label="Pageviews"
          value={stats!.pageviews.value.toLocaleString('ro-RO')}
          prev={stats!.pageviews.value}
          prevPrev={stats!.pageviews.prev}
        />
        <KpiCard
          label="Sesiuni"
          value={sessions.toLocaleString('ro-RO')}
          prev={sessions}
          prevPrev={stats!.visits.prev}
        />
        <KpiCard
          label="Timp mediu"
          value={formatDuration(avgDuration)}
          prev={avgDuration}
          prevPrev={prevAvgDuration}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Bounce rate"
          value={`${bounceRate.toFixed(1)}%`}
          prev={bounceRate}
          prevPrev={prevBounceRate}
          inverse
        />
        <KpiCard
          label="Pagini / sesiune"
          value={
            sessions > 0 ? (stats!.pageviews.value / sessions).toFixed(2) : '0'
          }
          prev={sessions > 0 ? stats!.pageviews.value / sessions : 0}
          prevPrev={stats!.visits.prev > 0 ? stats!.pageviews.prev / stats!.visits.prev : 0}
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsTable title="Top pagini" rows={topPages} unit="views" />
        <MetricsTable title="Top events" rows={topEvents} unit="events" />
      </div>

      <MetricsTable title="Top referrers" rows={topReferrers} unit="vizite" />

      <div className="text-xs text-slate-400 pt-4 border-t border-slate-200">
        Raw data via Umami Cloud API · website {`{49a078c7…}`}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  prev,
  prevPrev,
  inverse = false,
}: {
  label: string;
  value: string;
  prev: number;
  prevPrev: number;
  inverse?: boolean;
}) {
  const delta = pctDelta(prev, prevPrev);
  const isUp = delta.sign === '+';
  const isGood = inverse ? !isUp : isUp;
  const color =
    delta.sign === '' ? 'text-slate-400' : isGood ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className={`mt-1 text-xs ${color}`}>
        {delta.sign ? `${delta.sign}${delta.value}%` : '—'} vs anterior
      </div>
    </div>
  );
}

function MetricsTable({
  title,
  rows,
  unit,
}: {
  title: string;
  rows: MetricRow[];
  unit: string;
}) {
  if (!rows || rows.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-900 mb-2">{title}</div>
        <div className="text-xs text-slate-500">Nicio dată în perioada selectată.</div>
      </div>
    );
  }

  const max = Math.max(...rows.map((r) => r.y));

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-400">{rows.length} rânduri</div>
      </div>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.x} className="relative">
            <div
              className="absolute inset-y-0 left-0 bg-amber-50 rounded"
              style={{ width: `${(row.y / max) * 100}%` }}
            />
            <div className="relative flex items-center justify-between px-2 py-1.5 text-xs">
              <span className="truncate text-slate-700 font-mono">{row.x || '(empty)'}</span>
              <span className="ml-3 tabular-nums text-slate-900 font-medium">
                {row.y.toLocaleString('ro-RO')}{' '}
                <span className="text-slate-400 font-normal">{unit}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
