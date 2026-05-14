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

  // Aggregate per-tier views for derived impressions
  const premiumViews = rows.filter((r) => r.tier === 'Premium').reduce((s, r) => s + r.views, 0);
  const plusJudetRows = rows.filter((r) => r.tier === 'Plus' && r.path.startsWith('/firme/judet/'));
  const avgJudetViews = plusJudetRows.length
    ? Math.round(plusJudetRows.reduce((s, r) => s + r.views, 0) / plusJudetRows.length)
    : 0;

  // Two scenarios per tier — pool empty now (cold-start) vs pool full (steady state).
  // Hidden-value early-adopter math: first paying advertiser gets 100% SOV,
  // CPM is 5× better on Premium and 3× better on Plus than the "pool plin" CPM
  // that anchors most calculations.
  const premiumImpressionsEmpty = premiumViews; // 1 firmă în pool = 100% SOV
  const premiumImpressionsFull = Math.round(premiumViews * 0.2); // 5 firme = 20% SOV
  const plusImpressionsEmpty = avgJudetViews; // 1 firmă în județ = 100% SOV
  const plusImpressionsFull = Math.round(avgJudetViews * 0.33); // 3 firme = 33% SOV

  const hasData = premiumViews > 0 || avgJudetViews > 0;

  // Effective CPM in EUR — both scenarios per tier
  const cpm = (price: number, imp: number) =>
    imp > 0 ? (price / (imp / 1000)).toFixed(1) : null;
  const premiumCpmEmpty = cpm(249, premiumImpressionsEmpty);
  const premiumCpmFull = cpm(249, premiumImpressionsFull);
  const plusCpmEmpty = cpm(99, plusImpressionsEmpty);
  const plusCpmFull = cpm(99, plusImpressionsFull);

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

      {/* Derived: what these numbers mean per tier — dual scenario (empty vs full) */}
      {hasData && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* Premium */}
          <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary-dark mb-2">
              Premium · 249€/lună
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-secondary/10">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-green-700 font-semibold">Acum (pool gol)</p>
                  <p className="text-[11px] text-gray-600">100% SOV · primul plătitor</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">~{fmt(premiumImpressionsEmpty)} impresii</p>
                  {premiumCpmEmpty && <p className="text-[11px] text-green-700 font-semibold">CPM ~{premiumCpmEmpty}€</p>}
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Pool plin (5 firme)</p>
                  <p className="text-[11px] text-gray-600">20% SOV · steady state</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-700">~{fmt(premiumImpressionsFull)} impresii</p>
                  {premiumCpmFull && <p className="text-[11px] text-gray-500">CPM ~{premiumCpmFull}€</p>}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed border-t border-secondary/10 pt-2">
              Bază: {fmt(premiumViews)} vizualizări cumulate pe homepage + ghiduri + /calculator + /clasament.
            </p>
          </div>

          {/* Plus */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-dark mb-2">
              Plus · 99€/lună (sau 59€ First-Mover)
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-baseline justify-between gap-2 pb-2 border-b border-primary/10">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-green-700 font-semibold">Acum (pool gol)</p>
                  <p className="text-[11px] text-gray-600">100% SOV · primul în județ</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">~{fmt(plusImpressionsEmpty)} impresii</p>
                  {plusCpmEmpty && <p className="text-[11px] text-green-700 font-semibold">CPM ~{plusCpmEmpty}€</p>}
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Pool plin (3/județ)</p>
                  <p className="text-[11px] text-gray-600">33% SOV · steady state</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-700">~{fmt(plusImpressionsFull)} impresii</p>
                  {plusCpmFull && <p className="text-[11px] text-gray-500">CPM ~{plusCpmFull}€</p>}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-2 leading-relaxed border-t border-primary/10 pt-2">
              Bază: ~{fmt(avgJudetViews)} vizualizări/lună pe pagina județului (medie pe județele top).
            </p>
          </div>
        </div>
      )}

      {/* ROI translation — annual cost vs leads needed to break even */}
      {hasData && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-900 mb-1.5">
            Tradus în lead-uri: când te recuperezi?
          </p>
          <div className="grid gap-2 sm:grid-cols-2 text-xs text-gray-700">
            <p>
              <strong>Plus 99€/lună × 12 = 1.188€/an.</strong> La închidere de 5% pe lead-urile directory (lead-uri intenționate) și ticket mediu ~25.000 RON/comandă, te recuperezi de la <strong>1 client închis/an</strong>.
            </p>
            <p>
              <strong>Premium 249€/lună × 12 = 2.988€/an.</strong> La aceeași matematică, ai nevoie de <strong>~2-3 clienți închiși/an</strong> ca să te scoți pe break-even. Restul = profit.
            </p>
          </div>
          <p className="text-[10px] text-gray-500 mt-2 italic leading-relaxed">
            Cifre estimative — close rate-ul tău real poate fi mai mare (lead-uri din directory au intenție declarată) sau mai mic. Folosește-le ca punct de plecare, nu ca promisiune.
          </p>
        </div>
      )}

      <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
        <strong>Cum citești:</strong> Premium apare pe paginile globale (homepage, clasament, calculator, ghiduri). Plus apare pe pagina județului tău și pe /verificare-anre. „Acum (pool gol)&quot; reflectă realitatea curentă — primul plătitor are <strong>100% SOV</strong> până apar concurenții. „Pool plin&quot; e scenariul când caps-urile sunt complete. Tu plătești același preț în ambele situații — early-adopter primește mai mult.
      </p>
    </div>
  );
}
