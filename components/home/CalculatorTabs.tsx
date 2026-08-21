'use client';

// Cele două calculatoare de pe home page, într-un singur bloc cu taburi.
// Stăteau unul sub altul și, chiar compacte, ocupau împreună prea mult.
//
// Ambele rămân montate, cel inactiv doar ascuns: cine completează consumul pe
// un tab, trece pe celălalt și se întoarce, își găsește cifrele acolo. Un
// unmount la fiecare schimbare de tab le-ar șterge.
//
// Bara de taburi stă în afara cardurilor, nu în interiorul lor: fiecare widget
// își păstrează propriul chenar, iar un card în card ar arăta ca o greșeală.

import { useEffect, useState } from 'react';
import QuickEstimateWidget from '@/components/home/QuickEstimateWidget';
import BatteryWidget from '@/components/BatteryWidget';
import type { KitPriceCurve } from '@/lib/kit-price-curve';

const TABS = [
  { id: 'sistem', label: 'Sistem fotovoltaic', hint: 'Cât costă și în cât se amortizează' },
  { id: 'baterie', label: 'Baterie', hint: 'Ce capacitate și ce punctaj la Casa Verde' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function trackUmami(event: string, data?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { umami?: { track?: (e: string, d?: Record<string, unknown>) => void } };
  w.umami?.track?.(event, data);
}

interface Props {
  priceCurve: KitPriceCurve;
  /** Ghidul spre care trimite widgetul de baterii, afișat doar aici. */
  batteryGuideHref?: string;
}

export default function CalculatorTabs({ priceCurve, batteryGuideHref }: Props) {
  // Bateria e tabul implicit: e subiectul cu cerere acum (Casa Verde Baterii și
  // apelul de 150 mil. EUR) și ținta butonului flotant.
  const [active, setActive] = useState<TabId>('baterie');

  // Butonul flotant trimite spre #calculator-baterie. La navigarea dintr-o altă
  // pagină, tabul implicit rezolvă deja cazul; ascultătorul de aici acoperă
  // situația în care omul e deja pe home și a comutat pe tabul de sistem.
  useEffect(() => {
    const sync = () => {
      if (window.location.hash !== '#calculator-baterie') return;
      setActive('baterie');
      // Ancorarea nativă ratează: la încărcare browserul derulează înainte ca
      // ce e deasupra (hero, banda de sponsor, imaginile) să-și fi luat
      // înălțimea finală, și rămâne la zero. Verificat: cu hash în URL,
      // scrollY era 0 iar ancora la 1341px.
      // Instant, nu lin: cine deschide linkul vrea să fie deja acolo, nu să se
      // uite la o derulare de 1.300px. `instant` e și explicit necesar, fiindcă
      // `html` are `scroll-behavior: smooth`, care altfel ar prelua controlul.
      // De două ori, nu din superstiție: o dată acum, pentru cazul obișnuit, și
      // o dată după ce se golește coada de task-uri, fiindcă banda de sponsor și
      // imaginile de deasupra își iau înălțimea finală după prima pictare și ar
      // muta ancora de sub noi. `setTimeout`, nu `requestAnimationFrame`: rAF nu
      // rulează în contexte cu animațiile oprite (l-am prins într-un preview
      // headless, unde tot codul din el era mort).
      const jump = () =>
        document
          .getElementById('calculator-baterie')
          ?.scrollIntoView({ behavior: 'instant', block: 'start' });
      jump();
      setTimeout(jump, 0);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  return (
    <div id="calculator-baterie" className="scroll-mt-32 md:scroll-mt-24">
      {/* Taburi pastilă, detașate de card: cardurile au colțuri rotunjite pe toate
          laturile, iar un tab „lipit" de ele ar lăsa o crestătură vizibilă. */}
      <div role="tablist" aria-label="Calculatoare" className="mb-3 flex gap-2">
        {TABS.map((t) => {
          const on = active === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              id={`calc-tab-${t.id}`}
              aria-selected={on}
              aria-controls={`calc-panel-${t.id}`}
              type="button"
              onClick={() => {
                setActive(t.id);
                trackUmami('home-calculator-tab', { tab: t.id });
              }}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-left transition-colors ${
                on
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-white hover:border-primary/40'
              }`}
            >
              <span className={`block text-sm font-bold sm:text-base ${on ? 'text-secondary-dark' : 'text-gray-500'}`}>
                {t.label}
              </span>
              <span className={`mt-0.5 hidden text-xs sm:block ${on ? 'text-gray-600' : 'text-gray-400'}`}>
                {t.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id="calc-panel-sistem"
        aria-labelledby="calc-tab-sistem"
        className={active === 'sistem' ? '' : 'hidden'}
      >
        <QuickEstimateWidget priceCurve={priceCurve} sursa="home" />
      </div>

      <div
        role="tabpanel"
        id="calc-panel-baterie"
        aria-labelledby="calc-tab-baterie"
        className={active === 'baterie' ? '' : 'hidden'}
      >
        <BatteryWidget sursa="home-baterii" guideHref={batteryGuideHref} />
      </div>
    </div>
  );
}
