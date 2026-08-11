'use client';

// Varianta „light" a calculatorului: o singură întrebare, cât plătești lunar pe
// curent, și trei cifre în schimb. Județul, tipul de montaj, cota de autoconsum,
// tariful și subvenția rămân în calculatorul complet, unde se pot regla.
//
// Două lucruri sunt deliberate:
//
// 1. Județul implicit e București, exact ca în calculatorul complet, iar cifra e
//    scrisă pe widget. Altfel omul ar vedea aici un rezultat și dincolo altul,
//    pentru același consum, ceea ce ar arăta ca o eroare. Așa, clicul pe „vezi
//    calculul complet" duce la aceleași numere, plus posibilitatea de a schimba
//    județul.
// 2. Estimarea se face cu aceeași funcție `estimate()` ca pagina mare, nu cu o
//    formulă simplificată scrisă aici. O a doua implementare ar începe să
//    dea alte cifre în ziua în care se schimbă una dintre ele.

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
// rețea. O firmă consumă exact în programul de lucru, deci autoconsumul ei e
// mult mai mare, iar amortizarea iese alta. Widgetul trebuie să urmeze
// segmentul ales în header, altfel arată unei firme un calcul de casă.
const AUTOCONSUM_REZIDENTIAL = 0.35;
const AUTOCONSUM_FIRMA = 0.7;

function trackUmami(event: string, data?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as {
    umami?: { track?: (e: string, d?: Record<string, unknown>) => void };
  };
  w.umami?.track?.(event, data);
}

export default function QuickEstimateWidget({ priceCurve }: { priceCurve: KitPriceCurve }) {
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
    <div className="rounded-2xl border border-primary/25 bg-white shadow-sm overflow-hidden">
      <div className="bg-primary/10 px-6 py-4 border-b border-primary/20">
        <h2 className="text-lg font-bold text-secondary-dark">
          Cât v-ar costa un sistem fotovoltaic?
        </h2>
        <p className="text-sm text-gray-600 mt-0.5">
          O singură întrebare. Restul le calculăm noi.
        </p>
      </div>

      <div className="px-6 py-5">
        <label htmlFor="widget-factura" className="block text-sm font-medium text-gray-700">
          Cât plătiți lunar pe curent{isRezidential ? '' : ', la firmă'}?
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            id="widget-factura"
            type="number"
            inputMode="numeric"
            min={1}
            value={factura}
            onChange={(e) => setFactura(e.target.value)}
            onBlur={() => trackUmami('widget-estimate', { factura: Number(factura) || 0 })}
            className="w-40 rounded-lg border border-border px-3 py-2.5 text-lg font-semibold text-secondary-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-describedby="widget-ipoteze"
          />
          <span className="text-gray-600 font-medium">lei pe lună</span>
        </div>

        {result ? (
          <>
            <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-surface px-2 py-3">
                <dt className="text-xs text-gray-600">Sistem</dt>
                <dd className="text-xl font-bold text-secondary-dark mt-0.5">
                  {String(result.kwp).replace('.', ',')} kW
                </dd>
              </div>
              <div className="rounded-xl bg-surface px-2 py-3">
                <dt className="text-xs text-gray-600">Investiție</dt>
                <dd className="text-xl font-bold text-secondary-dark mt-0.5">
                  {formatCurrency(result.investitie)}
                </dd>
              </div>
              <div className="rounded-xl bg-surface px-2 py-3">
                <dt className="text-xs text-gray-600">Se întoarce în</dt>
                <dd className="text-xl font-bold text-secondary-dark mt-0.5">
                  {/* `payback` e null când sistemul nu se amortizează în cei 25 de
                      ani de viață. Se întâmplă la facturi foarte mici, unde
                      economia anuală e sub uzura investiției; nu inventăm o cifră. */}
                  {result.payback === null
                    ? `peste ${SYSTEM_LIFETIME_YEARS} ani`
                    : `${result.payback.toFixed(1).replace('.', ',')} ani`}
                </dd>
              </div>
            </dl>

            <p id="widget-ipoteze" className="mt-3 text-xs text-gray-500 leading-relaxed">
              Estimare pentru {JUDET_IMPLICIT}, la un tarif de{' '}
              {DEFAULT_TARIFF_RON_PER_KWH.toFixed(2).replace('.', ',')} lei/kWh și{' '}
              {Math.round(autoconsum * 100)}% autoconsum. Prețul e mediana ofertelor reale cu montaj
              din {priceCurve.stores} magazine. Pentru județul dumneavoastră și celelalte reglaje,
              deschideți calculatorul complet.
            </p>
          </>
        ) : (
          <p className="mt-5 text-sm text-gray-500">Scrieți suma de pe factură ca să vedeți estimarea.</p>
        )}

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <Link
            href="/cere-oferta"
            onClick={() => trackUmami('widget-cere-oferta')}
            className="flex-1 text-center rounded-lg bg-primary px-4 py-3 font-semibold text-secondary-dark hover:bg-primary-dark transition-colors"
          >
            Cere ofertă gratuit
          </Link>
          <Link
            href={linkCalculator}
            onClick={() => trackUmami('widget-calculator-complet')}
            className="flex-1 text-center rounded-lg border border-secondary/25 px-4 py-3 font-semibold text-secondary-dark hover:bg-surface transition-colors"
          >
            Vezi calculul complet
          </Link>
        </div>
      </div>
    </div>
  );
}
