import { getMetrics, getStats, resolveRange, type MetricRow } from '@/lib/umami';

const FEATURED_PAGES: { path: string; label: string; tier: string }[] = [
  { path: '/', label: 'Homepage', tier: 'Premium' },
  { path: '/clasament', label: '/clasament', tier: 'Premium' },
  { path: '/calculator-panouri-fotovoltaice', label: '/calculator', tier: 'Premium' },
  { path: '/ghid', label: '/ghid (index)', tier: 'Premium' },
  { path: '/verificare-anre', label: '/verificare-anre', tier: 'Plus' },
  { path: '/firme/judet/cluj', label: '/firme/judet/cluj', tier: 'Plus' },
  { path: '/firme/judet/bucuresti', label: '/firme/judet/bucuresti', tier: 'Plus' },
  { path: '/firme/judet/timis', label: '/firme/judet/timis', tier: 'Plus' },
];

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return String(n);
}

async function safeFetch<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export default async function TrafficWidget() {
  const { startAt, endAt } = resolveRange('last-30d');

  const [stats, paths] = await Promise.all([
    safeFetch(() => getStats(startAt, endAt)),
    safeFetch(() => getMetrics(startAt, endAt, 'path', 500)),
  ]);

  if (!paths) {
    return null;
  }

  const pathMap = new Map<string, number>();
  (paths as MetricRow[]).forEach((row) => pathMap.set(row.x, row.y));

  const totalPageviews = stats?.pageviews ?? 0;
  const totalVisitors = stats?.visitors ?? 0;

  const rows = FEATURED_PAGES.map((p) => ({
    ...p,
    views: pathMap.get(p.path) ?? 0,
  }));

  return (
    <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 via-white to-secondary/5 p-5 sm:p-6 mb-10">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Trafic real — ultimele 30 zile</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Date Umami live (cache 1h). Folosește-le ca să calculezi ROI-ul pe pachet.
          </p>
        </div>
        <div className="flex gap-3 text-right">
          <div>
            <p className="text-xs text-gray-500">Vizualizări</p>
            <p className="text-lg font-bold text-gray-900">{fmt(totalPageviews)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Vizitatori unici</p>
            <p className="text-lg font-bold text-gray-900">{fmt(totalVisitors)}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Pagină</th>
              <th className="text-left px-3 py-2 font-semibold text-gray-700">Pachet care apare aici</th>
              <th className="text-right px-3 py-2 font-semibold text-gray-700">Vizualizări 30d</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.path}>
                <td className="px-3 py-2 font-mono text-xs text-gray-700">{r.label}</td>
                <td className="px-3 py-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      r.tier === 'Premium'
                        ? 'bg-secondary/10 text-secondary-dark'
                        : 'bg-primary/10 text-primary-dark'
                    }`}
                  >
                    {r.tier}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono font-semibold text-gray-900">
                  {fmt(r.views)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
        <strong>Cum citești tabelul:</strong> Premium apare pe paginile globale (homepage, clasament, calculator, ghiduri) — cumulativ vezi suma vizualizărilor lor. Plus apare pe pagina județului tău și pe /verificare-anre. Cu pool-ul plin (3 firme Plus / județ, 5 firme Premium național), share-ul tău e <strong>~33% din vizualizările Plus</strong>, respectiv <strong>20% din vizualizările Premium</strong>.
      </p>
    </div>
  );
}
