import { formatNumber, getCompanies, type Company } from '@/lib/utils';

interface Props {
  company: Company;
}

/** Format revenue/profit as compact RON: 12,23M / 850k / 0 */
function formatCompactRon(n: number): string {
  if (!n || n <= 0) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace('.', ',')}M RON`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k RON`;
  return `${n} RON`;
}

/** Variație față de anul precedent, ca text. Null când nu avem bază de comparație. */
function formatDelta(current: number, previous: number): { text: string; up: boolean } | null {
  if (previous == null || previous <= 0 || current == null) return null;
  const pct = ((current - previous) / previous) * 100;
  if (!isFinite(pct)) return null;
  const abs = Math.abs(pct);
  const value =
    abs >= 100 ? `${Math.round(abs)}%` : `${abs.toFixed(1).replace('.', ',')}%`;
  return { text: `${pct >= 0 ? '+' : '−'}${value}`, up: pct >= 0 };
}

function DeltaNote({
  delta,
  prevYear,
}: {
  delta: { text: string; up: boolean } | null;
  prevYear: number;
}) {
  if (!delta) return null;
  return (
    <>
      {' · '}
      <span className={delta.up ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
        {delta.text}
      </span>{' '}
      față de {prevYear}
    </>
  );
}

export default function FinancialStability({ company }: Props) {
  const { revenue, profit, year } = company.financials;
  const employees = company.employees;
  const history = company.financials.history || [];
  const prev = history.length >= 2 ? history[history.length - 2] : null;

  // Stability indicator — based on profit margin
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  let indicator: { label: string; dots: number; tone: string };
  if (profit <= 0) indicator = { label: 'Informație lipsă', dots: 0, tone: 'text-gray-500' };
  else if (margin >= 10) indicator = { label: 'Solidă', dots: 5, tone: 'text-green-600' };
  else if (margin >= 5) indicator = { label: 'Bună', dots: 4, tone: 'text-green-600' };
  else if (margin >= 2) indicator = { label: 'Stabilă', dots: 3, tone: 'text-yellow-600' };
  else indicator = { label: 'Fragilă', dots: 2, tone: 'text-orange-600' };

  // Percentile vs all firms in directory (by revenue)
  const allRevenues = getCompanies()
    .map((c) => c.financials.revenue)
    .filter((r) => r > 0)
    .sort((a, b) => a - b);
  const rank = allRevenues.filter((r) => r < revenue).length;
  const percentile = allRevenues.length > 0 && revenue > 0
    ? Math.round((rank / allRevenues.length) * 100)
    : 0;

  const hasFinancials = revenue > 0;
  const age = company.founded > 0 ? new Date().getFullYear() - company.founded : 0;
  const maxRevenue = Math.max(...history.map((h) => h.revenue), 1);

  const revenueDelta = prev ? formatDelta(revenue, prev.revenue) : null;
  const profitDelta = prev ? formatDelta(profit, prev.profit) : null;
  const employeeDiff = prev?.employees != null && employees > 0 ? employees - prev.employees : null;

  const cardClass = 'bg-white rounded-lg border border-border p-4';
  const labelClass = 'text-xs font-medium uppercase tracking-wide';

  return (
    <div className="bg-surface rounded-xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Firma în cifre</h2>
        {hasFinancials && (
          <span className="text-xs text-gray-500">Sursa: ANAF {year}</span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Fondat */}
        {company.founded > 0 && (
          <div className={cardClass}>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className={labelClass}>Fondat</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{company.founded}</p>
            <p className="text-xs text-gray-500 mt-1">
              {age > 0 ? `${age} ani de activitate` : 'firmă nouă'}
            </p>
          </div>
        )}

        {/* Capacitate maximă */}
        {company.capacity.maxProjectKw > 0 && (
          <div className={cardClass}>
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className={labelClass}>Capacitate maximă</span>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatNumber(company.capacity.maxProjectKw)} kW
            </p>
            <p className="text-xs text-gray-500 mt-1">pe proiect</p>
          </div>
        )}

        {hasFinancials && (
          <>
            {/* Revenue */}
            <div className={cardClass}>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 8-8M21 7v6h-6" />
                </svg>
                <span className={labelClass}>Cifra de afaceri</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCompactRon(revenue)}</p>
              <p className="text-xs text-gray-500 mt-1">
                anul {year}
                {prev && <DeltaNote delta={revenueDelta} prevYear={prev.year} />}
              </p>
            </div>

            {/* Profit + margin */}
            <div className={cardClass}>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 10v2m8-6a8 8 0 11-16 0 8 8 0 0116 0z" />
                </svg>
                <span className={labelClass}>Profit net</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCompactRon(profit)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {profit > 0 && revenue > 0
                  ? `marjă ${margin.toFixed(1).replace('.', ',')}%`
                  : 'pe pierdere'}
                {prev && profit > 0 && prev.profit <= 0 ? (
                  <>
                    {' · '}
                    <span className="text-green-600 font-medium">revenire pe profit</span> față de{' '}
                    {prev.year}
                  </>
                ) : (
                  prev && <DeltaNote delta={profitDelta} prevYear={prev.year} />
                )}
              </p>
            </div>

            {/* Employees */}
            <div className={cardClass}>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className={labelClass}>Angajați</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {employees > 0 ? formatNumber(employees) : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                echipă raportată
                {employeeDiff != null && employeeDiff !== 0 && prev && (
                  <>
                    {' · '}
                    <span className={employeeDiff > 0 ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
                      {employeeDiff > 0 ? '+' : '−'}
                      {Math.abs(employeeDiff)}
                    </span>{' '}
                    față de {prev.year}
                  </>
                )}
              </p>
            </div>

            {/* Indicator */}
            <div className={cardClass}>
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className={labelClass}>Stabilitate</span>
              </div>
              <p className={`text-xl font-bold ${indicator.tone}`}>{indicator.label}</p>
              <div className="flex gap-1 mt-1.5" aria-label={`Scor ${indicator.dots} din 5`}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${i < indicator.dots ? 'bg-primary' : 'bg-gray-200'}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {!hasFinancials && (
        <p className="text-sm text-gray-500 mt-3">
          Datele financiare nu sunt încă disponibile public pentru această firmă.
        </p>
      )}

      {/* Evoluție multianuală */}
      {history.length >= 2 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Evoluția cifrei de afaceri</span>
            <span>bilanțuri ANAF {history[0].year}–{history[history.length - 1].year}</span>
          </div>
          <div className="flex items-end gap-2 h-24">
            {history.map((h, i) => {
              const isLast = i === history.length - 1;
              return (
                <div key={h.year} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                  <span className={`text-[10px] leading-none ${isLast ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                    {formatCompactRon(h.revenue).replace(' RON', '')}
                  </span>
                  <div
                    className={`w-full rounded-t ${isLast ? 'bg-primary' : 'bg-primary/35'}`}
                    style={{ height: `${Math.max((h.revenue / maxRevenue) * 100, 3)}%` }}
                    title={`${h.year}: ${formatCompactRon(h.revenue)}`}
                  />
                  <span className={`text-[11px] leading-none ${isLast ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                    {h.year}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Percentile bar */}
      {percentile > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Poziție între firmele din director (după cifră)</span>
            <span className="font-semibold text-gray-700">
              top {100 - percentile}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full transition-all"
              style={{ width: `${percentile}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
