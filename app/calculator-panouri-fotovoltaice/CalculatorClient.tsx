'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { formatCurrency, formatNumber, slugifyCounty } from '@/lib/utils';
import pvgisData from '@/data/pvgis-yields.json';
import countiesData from '@/data/counties.json';

type Mounting = 'inclinat' | 'terasa' | 'sol';

const YIELDS = pvgisData.yields as Record<string, number>;
const FACTORS = pvgisData._factors as Record<Mounting, number>;
const GRID_BUYBACK_RON_PER_KWH = 0.30;
const SYSTEM_LIFETIME_YEARS = 25;
const ANNUAL_DEGRADATION = 0.005;
const M2_PER_KWP = 5;
const KG_CO2_PER_KWH = 0.299;

const MOUNTING_OPTIONS: { value: Mounting; label: string; hint: string }[] = [
  { value: 'inclinat', label: 'Acoperiș înclinat', hint: '~30°, orientare sud' },
  { value: 'terasa', label: 'Terasă', hint: 'plat, structură 10–15°' },
  { value: 'sol', label: 'Montaj la sol', hint: 'optim ~30°' },
];

function pricePerKwp(kwp: number): number {
  if (kwp < 50) return 4500;
  if (kwp < 200) return 3800;
  return 3500;
}

function trackUmami(event: string, data?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { umami?: { track?: (e: string, d?: Record<string, unknown>) => void } };
  w.umami?.track?.(event, data);
}

export default function CalculatorClient() {
  const [consumLunar, setConsumLunar] = useState<string>('5000');
  const [judet, setJudet] = useState<string>('București');
  const [mounting, setMounting] = useState<Mounting>('inclinat');
  const [tarif, setTarif] = useState<string>('1.30');
  const [autoconsum, setAutoconsum] = useState<number>(70);
  const [showResult, setShowResult] = useState<boolean>(false);

  const countyOptions = useMemo(
    () => countiesData.counties.map((c) => ({ value: c, label: c })),
    [],
  );

  const yieldKwhPerKwp = useMemo(() => {
    const baseYield = YIELDS[judet] ?? 1250;
    return Math.round(baseYield * FACTORS[mounting]);
  }, [judet, mounting]);

  const result = useMemo(() => {
    const consumLunarNum = Number(consumLunar);
    const tarifNum = Number(tarif);
    if (!Number.isFinite(consumLunarNum) || consumLunarNum <= 0) return null;
    if (!Number.isFinite(tarifNum) || tarifNum <= 0) return null;

    const consumAnual = consumLunarNum * 12;

    const kwp = consumAnual / yieldKwhPerKwp;
    const kwpRounded = Math.max(1, Math.round(kwp * 10) / 10);
    const suprafata = Math.round(kwpRounded * M2_PER_KWP);
    const investitie = Math.round(kwpRounded * pricePerKwp(kwpRounded));

    const productieAnuala = Math.round(kwpRounded * yieldKwhPerKwp);
    const autoFactor = autoconsum / 100;
    const autoconsumKwh = Math.round(productieAnuala * autoFactor);
    const injectatKwh = productieAnuala - autoconsumKwh;
    const economieAutoconsum = Math.round(autoconsumKwh * tarifNum);
    const venitInjectat = Math.round(injectatKwh * GRID_BUYBACK_RON_PER_KWH);
    const economieAnuala = economieAutoconsum + venitInjectat;

    let cumulativeNet = -investitie;
    let payback: number | null = null;
    let totalProfit25 = -investitie;
    for (let an = 1; an <= SYSTEM_LIFETIME_YEARS; an++) {
      const degradationFactor = Math.pow(1 - ANNUAL_DEGRADATION, an - 1);
      const venitulAnuluiAcesta = economieAnuala * degradationFactor;
      cumulativeNet += venitulAnuluiAcesta;
      if (payback === null && cumulativeNet >= 0) {
        const venitAnAnterior = economieAnuala * Math.pow(1 - ANNUAL_DEGRADATION, an - 2);
        const remainingFromPrev = cumulativeNet - venitulAnuluiAcesta;
        const fraction = -remainingFromPrev / Math.max(venitAnAnterior, 1);
        payback = an - 1 + fraction;
      }
      if (an === SYSTEM_LIFETIME_YEARS) totalProfit25 = cumulativeNet;
    }

    const co2Tone = Math.round((productieAnuala * KG_CO2_PER_KWH) / 100) / 10;

    return {
      kwp: kwpRounded,
      yieldKwhPerKwp,
      suprafata,
      investitie,
      productieAnuala,
      autoconsumKwh,
      injectatKwh,
      economieAutoconsum,
      venitInjectat,
      economieAnuala,
      payback,
      totalProfit25,
      co2Tone,
      pricePerKwp: pricePerKwp(kwpRounded),
    };
  }, [consumLunar, tarif, autoconsum, yieldKwhPerKwp]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!result) return;
    setShowResult(true);
    trackUmami('calculator-submit', {
      judet,
      consum_kwh: Number(consumLunar),
      tip_montaj: mounting,
      kwp: result.kwp,
    });
    requestAnimationFrame(() => {
      document.getElementById('calculator-rezultat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  return (
    <div className="space-y-8">
      {/* Disclaimer top */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Estimare orientativă.</strong> Calculele folosesc medii statistice (producția specifică pe județ din modelul PVGIS, prețuri de piață pentru 2026, tarif prosumator de aproximativ 0,30 RON/kWh).
        Pentru o ofertă reală, cere oferte de la cel puțin trei instalatori — variația poate fi de ±20%, în funcție de acoperiș, orientare, umbrire, tip de invertor și condițiile concrete ale locației.
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consum lunar mediu (kWh) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={100}
              step={100}
              value={consumLunar}
              onChange={(e) => setConsumLunar(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">Vezi pe factură. Tipic: birou mic 1.500–3.000, hală 5.000–30.000.</p>
          </div>

          <div>
            <SearchableSelect
              label="Județ"
              name="judet"
              required
              value={judet}
              onValueChange={(v) => v && setJudet(v)}
              options={countyOptions}
              placeholder="Selectează județul"
            />
          </div>

          <div className="sm:col-span-2 -mt-1">
            <div className="rounded-lg bg-amber-50/60 border border-amber-200/70 p-3 flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM21.75 12a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 0 0-1.06 1.06l1.06 1.06ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.243a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.061 1.06l1.06 1.06Z" />
              </svg>
              <div className="text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-secondary-dark">Producție specifică în {judet}:</span>
                  <span className="font-semibold text-primary-dark">~{formatNumber(yieldKwhPerKwp)} kWh/kWp/an</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  Cantitatea de energie produsă într-un an de fiecare kWp instalat. Depinde de cât soare primește județul (radiația solară) și de tipul de montaj.
                  În România, valorile variază între ~1.140 kWh/kWp/an în zonele montane și ~1.380 kWh/kWp/an în sudul Dobrogei. Sursa: model PVGIS, medii multianuale 2005–2023.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tip montaj</label>
            <div className="grid grid-cols-3 gap-2">
              {MOUNTING_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setMounting(opt.value)}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    mounting === opt.value
                      ? 'border-primary bg-primary/5 text-secondary-dark'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.hint}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tarif energie actual (RON/kWh) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0.1}
              step={0.01}
              value={tarif}
              onChange={(e) => setTarif(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <p className="mt-1 text-xs text-gray-500">Preț total pe factură împărțit la kWh consumați (TVA inclus).</p>
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Cotă estimată de autoconsum
              </label>
              <span className="text-sm font-semibold text-primary-dark">{autoconsum}%</span>
            </div>
            <input
              type="range"
              min={30}
              max={90}
              step={5}
              value={autoconsum}
              onChange={(e) => setAutoconsum(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <p className="mt-1 text-xs text-gray-500">
              Cât din energia produsă o consumă firma direct (restul se injectează în rețea, plătit la tariful prosumator de aproximativ 0,30 RON/kWh). Pentru firme cu activitate de zi, tipic 60–80%.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Calculează estimarea
        </button>
      </form>

      {showResult && result && (
        <div id="calculator-rezultat" className="space-y-6 scroll-mt-24">
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-primary/20 p-6 sm:p-8">
            <p className="text-xs uppercase tracking-wider font-semibold text-primary-dark mb-2">
              Estimare pentru {judet}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-secondary-dark mb-1">
              Sistem recomandat: {formatNumber(result.kwp)} kWp
            </h2>
            <p className="text-sm text-gray-600">
              Producție specifică folosită: {formatNumber(result.yieldKwhPerKwp)} kWh/kWp/an · Suprafață necesară: ~{result.suprafata} m²
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Investiție estimată</p>
              <p className="text-2xl font-bold text-secondary-dark">{formatCurrency(result.investitie)}</p>
              <p className="text-xs text-gray-500 mt-1">~{formatNumber(result.pricePerKwp)} RON/kWp, sistem la cheie</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Economie anuală</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(result.economieAnuala)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(result.economieAutoconsum)} autoconsum + {formatCurrency(result.venitInjectat)} injectat
              </p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Amortizare</p>
              <p className="text-2xl font-bold text-secondary-dark">
                {result.payback ? `${result.payback.toFixed(1)} ani` : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Recuperarea investiției din economii</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-surface rounded-xl border border-border p-5">
              <p className="text-sm font-semibold text-secondary-dark mb-3">Producție anuală</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Total producție</dt>
                  <dd className="font-medium text-secondary-dark">{formatNumber(result.productieAnuala)} kWh</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Autoconsum ({autoconsum}%)</dt>
                  <dd className="font-medium text-secondary-dark">{formatNumber(result.autoconsumKwh)} kWh</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Injectat în rețea</dt>
                  <dd className="font-medium text-secondary-dark">{formatNumber(result.injectatKwh)} kWh</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <dt className="text-gray-600">CO₂ evitat</dt>
                  <dd className="font-medium text-green-700">{result.co2Tone} t/an</dd>
                </div>
              </dl>
            </div>

            <div className="bg-surface rounded-xl border border-border p-5">
              <p className="text-sm font-semibold text-secondary-dark mb-3">Profit pe durata de viață (25 ani)</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Investiție inițială</dt>
                  <dd className="font-medium text-secondary-dark">−{formatCurrency(result.investitie)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Economii cumulate</dt>
                  <dd className="font-medium text-secondary-dark">
                    {formatCurrency(result.totalProfit25 + result.investitie)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <dt className="text-gray-700 font-semibold">Profit net</dt>
                  <dd className="font-bold text-green-700">{formatCurrency(result.totalProfit25)}</dd>
                </div>
              </dl>
              <p className="text-xs text-gray-500 mt-3">
                Calculat cu o degradare a panourilor de 0,5% pe an. Nu include înlocuirea invertorului (necesară la 10–12 ani, aproximativ 5–8% din investiția inițială).
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>Cifrele de mai sus sunt estimări orientative.</strong> Pentru o ofertă reală, adaptată la consumul, acoperișul și locația firmei tale, cere oferte de la cel puțin trei instalatori autorizați ANRE.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/cere-oferta"
              data-umami-event="calculator-cta-oferta"
              data-umami-event-judet={judet}
              data-umami-event-kwp={String(result.kwp)}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-3 rounded-lg transition-colors"
            >
              Cere ofertă personalizată →
            </Link>
            <Link
              href={`/firme/judet/${slugifyCounty(judet)}`}
              data-umami-event="calculator-cta-firme"
              data-umami-event-judet={judet}
              className="flex items-center justify-center gap-2 bg-white hover:bg-surface text-secondary-dark border border-border font-semibold px-5 py-3 rounded-lg transition-colors"
            >
              Vezi instalatori în {judet} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
