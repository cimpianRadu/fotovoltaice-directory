import { getMetrics, resolveRange, type MetricRow } from '@/lib/umami';
import RangePicker, { resolvePreset } from '../../RangePicker';
import { ErrorBanner } from '../page';
import guidesData from '@/data/guides.json';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ range?: string }>;

type Guide = {
  slug: string;
  title: string;
  published: boolean;
  publishedAt: string;
};

const GUIDES = guidesData.guides as Guide[];

function titleForPath(path: string): string {
  if (path === '/ghid') return 'Index ghiduri (/ghid)';
  const slug = path.replace(/^\/ghid\//, '').replace(/\/$/, '');
  const guide = GUIDES.find((g) => g.slug === slug);
  return guide?.title ?? slug;
}

export default async function GhiduriPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const preset = resolvePreset(sp.range);
  const { startAt, endAt, label } = resolveRange(preset);

  let allPages: MetricRow[] = [];
  let error: string | null = null;
  try {
    allPages = await getMetrics(startAt, endAt, 'path', 500);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
  }

  const ghidRows = allPages
    .filter((r) => r.x === '/ghid' || r.x.startsWith('/ghid/'))
    .sort((a, b) => b.y - a.y);

  const totalViews = ghidRows.reduce((sum, r) => sum + r.y, 0);
  const indexViews = ghidRows.find((r) => r.x === '/ghid')?.y ?? 0;
  const topicRows = ghidRows.filter((r) => r.x !== '/ghid');
  const topicViews = totalViews - indexViews;

  // Map: which guides have data, which don't
  const seenSlugs = new Set(
    topicRows.map((r) => r.x.replace(/^\/ghid\//, '').replace(/\/$/, '')),
  );
  const publishedGuides = GUIDES.filter((g) => g.published);
  const guidesWithoutTraffic = publishedGuides.filter((g) => !seenSlugs.has(g.slug));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Ghiduri</h1>
          <p className="text-sm text-slate-500 mt-1">
            {label} · {publishedGuides.length} ghiduri publicate · cache 1h
          </p>
        </div>
        <RangePicker pathname="/admin/analytics/ghiduri" preset={preset} />
      </div>

      {error && <ErrorBanner errors={[error]} />}

      <div className="grid grid-cols-3 gap-4">
        <SmallKpi label="Total views ghiduri" value={totalViews.toLocaleString('ro-RO')} />
        <SmallKpi label="Views /ghid (index)" value={indexViews.toLocaleString('ro-RO')} />
        <SmallKpi label="Views ghiduri individuale" value={topicViews.toLocaleString('ro-RO')} />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-slate-900">
            Toate ghidurile (sortate după views)
          </div>
          <div className="text-xs text-slate-400">{topicRows.length} cu trafic</div>
        </div>

        {topicRows.length === 0 ? (
          <div className="text-xs text-slate-500">Nicio dată în perioada selectată.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="text-left py-2 font-medium">Ghid</th>
                <th className="text-left py-2 font-medium w-64">Path</th>
                <th className="text-right py-2 font-medium w-24">Views</th>
                <th className="text-right py-2 font-medium w-24">% din total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topicRows.map((row) => {
                const pct = totalViews > 0 ? (row.y / totalViews) * 100 : 0;
                return (
                  <tr key={row.x} className="hover:bg-slate-50">
                    <td className="py-2 pr-3 text-slate-900">{titleForPath(row.x)}</td>
                    <td className="py-2 text-xs font-mono text-slate-500">{row.x}</td>
                    <td className="py-2 text-right tabular-nums font-medium">
                      {row.y.toLocaleString('ro-RO')}
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-500">
                      {pct.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {guidesWithoutTraffic.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-900 mb-1">
            Ghiduri publicate fără trafic în această perioadă
          </div>
          <div className="text-xs text-slate-500 mb-3">
            {guidesWithoutTraffic.length} ghid(uri) — candidați pentru SEO refresh sau intern
            linking suplimentar.
          </div>
          <ul className="space-y-1.5 text-sm">
            {guidesWithoutTraffic.map((g) => (
              <li key={g.slug} className="flex items-center justify-between">
                <span className="text-slate-700">{g.title}</span>
                <span className="text-xs font-mono text-slate-400">/ghid/{g.slug}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SmallKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
