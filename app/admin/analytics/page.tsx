import Link from 'next/link';
import {
  getStats,
  getMetrics,
  resolveRange,
  formatDuration,
  pctDelta,
  type RangePreset,
  type StatsResponse,
  type StatsBlock,
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

async function safeCall<T>(fn: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

function num(v: unknown): number {
  if (typeof v === 'number' && isFinite(v)) return v;
  return 0;
}

function curr(stats: StatsResponse | null, key: keyof StatsBlock): number {
  if (!stats) return 0;
  return num(stats[key]);
}

function prev(stats: StatsResponse | null, key: keyof StatsBlock): number {
  if (!stats || !stats.comparison) return 0;
  return num(stats.comparison[key]);
}

export default async function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const preset: RangePreset =
    PRESETS.find((p) => p.value === sp.range)?.value ?? 'this-month';
  const { startAt, endAt, label } = resolveRange(preset);

  const [statsRes, pagesRes, eventsRes, refsRes] = await Promise.all([
    safeCall(() => getStats(startAt, endAt)),
    safeCall(() => getMetrics(startAt, endAt, 'path', 30)),
    safeCall(() => getMetrics(startAt, endAt, 'event', 30)),
    safeCall(() => getMetrics(startAt, endAt, 'referrer', 15)),
  ]);

  const errors = [statsRes, pagesRes, eventsRes, refsRes]
    .map((r) => r.error)
    .filter(Boolean) as string[];

  const stats = statsRes.data;
  const topPages: MetricRow[] = Array.isArray(pagesRes.data) ? pagesRes.data : [];
  const topEvents: MetricRow[] = Array.isArray(eventsRes.data) ? eventsRes.data : [];
  const topReferrers: MetricRow[] = Array.isArray(refsRes.data) ? refsRes.data : [];

  const visitors = curr(stats, 'visitors');
  const visitorsPrev = prev(stats, 'visitors');
  const pageviews = curr(stats, 'pageviews');
  const pageviewsPrev = prev(stats, 'pageviews');
  const sessions = curr(stats, 'visits');
  const sessionsPrev = prev(stats, 'visits');
  const totaltime = curr(stats, 'totaltime');
  const totaltimePrev = prev(stats, 'totaltime');
  const bounces = curr(stats, 'bounces');
  const bouncesPrev = prev(stats, 'bounces');

  const avgDuration = sessions > 0 ? totaltime / sessions : 0;
  const avgDurationPrev = sessionsPrev > 0 ? totaltimePrev / sessionsPrev : 0;
  const bounceRate = sessions > 0 ? (bounces / sessions) * 100 : 0;
  const bounceRatePrev = sessionsPrev > 0 ? (bouncesPrev / sessionsPrev) * 100 : 0;
  const pagesPerSession = sessions > 0 ? pageviews / sessions : 0;
  const pagesPerSessionPrev = sessionsPrev > 0 ? pageviewsPrev / sessionsPrev : 0;

  return (
    <div className="space-y-8">
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

      {errors.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="font-semibold mb-2">
            {errors.length} {errors.length === 1 ? 'request a eșuat' : 'request-uri au eșuat'}
          </div>
          <ul className="space-y-1 text-xs font-mono">
            {errors.map((e, i) => (
              <li key={i} className="break-all">
                · {e}
              </li>
            ))}
          </ul>
          <div className="mt-3 text-xs">
            Verifică <code className="px-1 py-0.5 bg-amber-100 rounded">UMAMI_API_KEY</code> în
            Vercel env vars (Production scope, fără ghilimele) și redeploy.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Vizitatori" value={visitors.toLocaleString('ro-RO')} current={visitors} prev={visitorsPrev} />
        <KpiCard label="Pageviews" value={pageviews.toLocaleString('ro-RO')} current={pageviews} prev={pageviewsPrev} />
        <KpiCard label="Sesiuni" value={sessions.toLocaleString('ro-RO')} current={sessions} prev={sessionsPrev} />
        <KpiCard label="Timp mediu" value={formatDuration(avgDuration)} current={avgDuration} prev={avgDurationPrev} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Bounce rate"
          value={`${bounceRate.toFixed(1)}%`}
          current={bounceRate}
          prev={bounceRatePrev}
          inverse
        />
        <KpiCard
          label="Pagini / sesiune"
          value={pagesPerSession.toFixed(2)}
          current={pagesPerSession}
          prev={pagesPerSessionPrev}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricsTable title="Top pagini" rows={topPages} unit="views" />
        <MetricsTable title="Top events" rows={topEvents} unit="events" />
      </div>

      <MetricsTable title="Top referrers" rows={topReferrers} unit="vizite" />

      <div className="text-xs text-slate-400 pt-4 border-t border-slate-200">
        Raw data via Umami Cloud API · cache 1h
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  current,
  prev,
  inverse = false,
}: {
  label: string;
  value: string;
  current: number;
  prev: number;
  inverse?: boolean;
}) {
  const delta = pctDelta(current, prev);
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

function MetricsTable({ title, rows, unit }: { title: string; rows: MetricRow[]; unit: string }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="text-sm font-semibold text-slate-900 mb-2">{title}</div>
        <div className="text-xs text-slate-500">Nicio dată în perioada selectată.</div>
      </div>
    );
  }

  const max = Math.max(...rows.map((r) => num(r.y)), 1);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="text-xs text-slate-400">{rows.length} rânduri</div>
      </div>
      <div className="space-y-1">
        {rows.map((row, i) => {
          const y = num(row.y);
          const x = String(row.x ?? '');
          return (
            <div key={`${x}-${i}`} className="relative">
              <div
                className="absolute inset-y-0 left-0 bg-amber-50 rounded"
                style={{ width: `${(y / max) * 100}%` }}
              />
              <div className="relative flex items-center justify-between px-2 py-1.5 text-xs">
                <span className="truncate text-slate-700 font-mono">{x || '(empty)'}</span>
                <span className="ml-3 tabular-nums text-slate-900 font-medium">
                  {y.toLocaleString('ro-RO')}{' '}
                  <span className="text-slate-400 font-normal">{unit}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
