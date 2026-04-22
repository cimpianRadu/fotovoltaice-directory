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

export default function FinancialStability({ company }: Props) {
  const { revenue, profit, year } = company.financials;
  const employees = company.employees;

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

  return (
    <div className="bg-surface rounded-xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Stabilitate Financiară</h2>
        {hasFinancials && (
          <span className="text-xs text-gray-500">Sursa: ANAF {year}</span>
        )}
      </div>

      {!hasFinancials ? (
        <p className="text-sm text-gray-500">
          Datele financiare nu sunt încă disponibile public pentru această firmă.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {/* Revenue */}
            <div className="bg-white rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l6-6 4 4 8-8M21 7v6h-6" />
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide">Cifra de afaceri</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCompactRon(revenue)}</p>
              <p className="text-xs text-gray-500 mt-1">anul {year}</p>
            </div>

            {/* Profit + margin */}
            <div className="bg-white rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V6m0 10v2m8-6a8 8 0 11-16 0 8 8 0 0116 0z" />
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide">Profit net</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCompactRon(profit)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {profit > 0 && revenue > 0
                  ? `marjă ${margin.toFixed(1).replace('.', ',')}%`
                  : 'pe pierdere'}
              </p>
            </div>

            {/* Employees */}
            <div className="bg-white rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide">Angajați</span>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {employees > 0 ? formatNumber(employees) : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">echipă raportată</p>
            </div>

            {/* Indicator */}
            <div className="bg-white rounded-lg border border-border p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span className="text-xs font-medium uppercase tracking-wide">Stabilitate</span>
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
          </div>

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
        </>
      )}
    </div>
  );
}
