'use client';

// Varianta „light" a calculatorului: o singură întrebare, cât plătești lunar pe
// curent, și trei cifre în schimb. Județul, tipul de montaj, cota de autoconsum,
// tariful și subvenția rămân în calculatorul complet, unde se pot regla.
//
// Trei lucruri sunt deliberate:
//
// 1. Layout orizontal, pe toată lățimea benzii de ofertă de deasupra. Într-o
//    coloană îngustă și centrată, cardul mânca patru ecrane pe verticală și
//    lăsa jumătate de pagină goală pe orizontală.
// 2. Județul implicit e București, exact ca în calculatorul complet, iar cifra e
//    scrisă pe widget. Altfel omul ar vedea aici un rezultat și dincolo altul,
//    pentru același consum, ceea ce ar arăta ca o eroare.
// 3. Estimarea se face cu aceeași funcție `estimate()` ca pagina mare, nu cu o
//    formulă simplificată scrisă aici. O a doua implementare ar începe să dea
//    alte cifre în ziua în care se schimbă una dintre ele.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSegment } from '@/components/segment/SegmentProvider';
import { formatCurrency } from '@/lib/utils-shared';
import type { KitPriceCurve } from '@/lib/kit-price-curve';
import { estimate, DEFAULT_TARIFF_RON_PER_KWH, SYSTEM_LIFETIME_YEARS } from '@/lib/pv-estimate';

/** Aceleași valori implicite ca în calculatorul complet, pe fiecare segment. */
const JUDET_IMPLICIT = 'București';
const PRET_SURPLUS = 0.3;
// O casă consumă puțin ziua, când produc panourile, deci injectează mult în
// rețea, iar surplusul e plătit mult sub prețul la care cumperi. O firmă
// consumă exact în programul de lucru, deci autoconsumul ei e mai mare și
// aceeași investiție devine rentabilă mai repede. Widgetul urmează segmentul
// din header, altfel i-ar arăta unei firme un calcul de casă.
const AUTOCONSUM_REZIDENTIAL = 0.35;
const AUTOCONSUM_FIRMA = 0.7;

function trackUmami(event: string, data?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as {
    umami?: { track?: (e: string, d?: Record<string, unknown>) => void };
  };
  w.umami?.track?.(event, data);
}

// Cele trei casete stau pe un rând și la 390px lățime, unde „10.130 RON" nu
// încape la dimensiunea de desktop: textul ieșea din chenar și se suprapunea
// peste caseta următoare. Deci corpul cifrei crește cu ecranul, nu invers, iar
// Fără `break-words`: ăla rupea „RON" în „RO" și „N". Lăsăm ruperea normală,
// care se face pe spațiu, deci cel mult „19.786" și „RON" ajung pe rânduri diferite.
const Metric = ({ eticheta, valoare }: { eticheta: string; valoare: string }) => (
  <div className="rounded-xl bg-surface px-2 py-3 text-center">
    <dt className="text-[11px] sm:text-xs text-gray-600 leading-tight">{eticheta}</dt>
    <dd className="text-sm sm:text-lg lg:text-xl font-bold text-secondary-dark mt-1 leading-tight">
      {valoare}
    </dd>
  </div>
);

export default function QuickEstimateWidget({
  priceCurve,
  sursa,
}: {
  priceCurve: KitPriceCurve;
  /** Pagina pe care stă widgetul. Fără ea, în Umami cele două plasări se
      amestecă și nu se poate spune care aduce cereri. */
  sursa: 'home' | 'firme';
}) {
  const { segment } = useSegment();
  const isRezidential = segment === 'rezidential';
  const autoconsum = isRezidential ? AUTOCONSUM_REZIDENTIAL : AUTOCONSUM_FIRMA;

  const [factura, setFactura] = useState<string>('400');

  const result = useMemo(() => {
    const lei = Number(factura);
    if (!Number.isFinite(lei) || lei <= 0) return null;
    return estimate(
      {
        consumLunarKwh: lei / DEFAULT_TARIFF_RON_PER_KWH,
        judet: JUDET_IMPLICIT,
        tarif: DEFAULT_TARIFF_RON_PER_KWH,
        autoconsum,
        pretSurplus: PRET_SURPLUS,
      },
      priceCurve,
    );
  }, [factura, autoconsum, priceCurve]);

  const linkCalculator = `/calculator-panouri-fotovoltaice?segment=${
    isRezidential ? 'rezidential' : 'comercial'
  }&consum=${encodeURIComponent(factura || '400')}&unitate=lei`;

  return (
    <div className="rounded-2xl border border-primary/25 bg-white shadow-sm px-5 py-5 sm:px-7 sm:py-6">
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8 lg:items-center">
        {/* Întrebarea */}
        <div className="lg:col-span-4">
          <h2 className="text-lg font-bold text-secondary-dark">
            Cât v-ar costa un sistem fotovoltaic?
          </h2>
          <label htmlFor="widget-factura" className="mt-1 block text-sm text-gray-600">
            Scrieți cât plătiți lunar pe curent{isRezidential ? '' : ', la firmă'}. Restul le
            calculăm noi.
          </label>
          <div className="mt-3 flex items-center gap-2">
            <input
              id="widget-factura"
              type="number"
              inputMode="numeric"
              min={1}
              value={factura}
              onChange={(e) => setFactura(e.target.value)}
              onBlur={() =>
              trackUmami('widget-estimate', {
                sursa,
                segment,
                factura: Number(factura) || 0,
                kwp: result?.kwp ?? 0,
              })
            }
              className="w-32 rounded-lg border border-border px-3 py-2.5 text-lg font-semibold text-secondary-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-describedby="widget-ipoteze"
            />
            <span className="text-gray-600 font-medium">lei pe lună</span>
          </div>
        </div>

        {/* Răspunsul */}
        <div className="lg:col-span-5">
          {result ? (
            <dl className="grid grid-cols-3 gap-3">
              <Metric eticheta="Sistem" valoare={`${String(result.kwp).replace('.', ',')} kW`} />
              <Metric eticheta="Investiție" valoare={formatCurrency(result.investitie)} />
              <Metric
                eticheta="Devine rentabil în"
                // `payback` e null când sistemul nu se amortizează în cei 25 de ani
                // de viață. Se întâmplă la facturi foarte mici, unde economia
                // anuală e sub uzura investiției; nu inventăm o cifră.
                valoare={
                  result.payback === null
                    ? `peste ${SYSTEM_LIFETIME_YEARS} ani`
                    : `${result.payback.toFixed(1).replace('.', ',')} ani`
                }
              />
            </dl>
          ) : (
            <p className="text-sm text-gray-500">
              Scrieți suma de pe factură ca să vedeți estimarea.
            </p>
          )}
        </div>

        {/* Pașii următori */}
        <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-3">
          <Link
            href={`/cere-oferta?sursa=widget-${sursa}`}
            onClick={() =>
              trackUmami('widget-cere-oferta', {
                sursa,
                segment,
                factura: Number(factura) || 0,
              })
            }
            className="flex-1 text-center rounded-lg bg-primary px-4 py-3 font-semibold text-secondary-dark hover:bg-primary-dark transition-colors"
          >
            Cere oferte gratuit
          </Link>
          <Link
            href={linkCalculator}
            onClick={() =>
              trackUmami('widget-calculator-complet', {
                sursa,
                segment,
                factura: Number(factura) || 0,
              })
            }
            className="flex-1 text-center rounded-lg border border-secondary/25 px-4 py-2.5 text-sm font-semibold text-secondary-dark hover:bg-surface transition-colors"
          >
            Vezi calculul complet
          </Link>
        </div>
      </div>

      {result && (
        <p id="widget-ipoteze" className="mt-4 pt-4 border-t border-border text-xs text-gray-500">
          Estimare pentru {JUDET_IMPLICIT}, la un tarif de{' '}
          {DEFAULT_TARIFF_RON_PER_KWH.toFixed(2).replace('.', ',')} lei/kWh și{' '}
          {Math.round(autoconsum * 100)}% autoconsum, cota tipică {isRezidential ? 'la casă' : 'la firmă'}.
          Prețul e mediana ofertelor reale cu montaj din {priceCurve.stores} magazine. Pentru județul
          dumneavoastră și celelalte reglaje, deschideți calculatorul complet.
        </p>
      )}
    </div>
  );
}
