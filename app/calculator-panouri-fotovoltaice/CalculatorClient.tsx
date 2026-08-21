'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { useSegment } from '@/components/segment/SegmentProvider';
import { formatCurrency, formatNumber, slugifyCounty } from '@/lib/utils-shared';
import type { KitPriceCurve } from '@/lib/kit-price-curve';
import {
  SCRAPED_DATA_MAX_KWP,
  SYSTEM_LIFETIME_YEARS,
  estimate,
  yieldFor,
  type Mounting,
} from '@/lib/pv-estimate';
import countiesData from '@/data/counties.json';
// Casa Verde Fotovoltaice (AFM) acoperă până la 90% din costul sistemului,
// beneficiarul pune întotdeauna minim 10%. Sursa: regulile programului, afm.ro.
const CASA_VERDE_MAX_COVERAGE = 0.90;

const MOUNTING_OPTIONS: { value: Mounting; label: string; hint: string }[] = [
  { value: 'inclinat', label: 'Acoperiș înclinat', hint: '~30°, orientare sud' },
  { value: 'terasa', label: 'Terasă', hint: 'plat, structură 10–15°' },
  { value: 'sol', label: 'Montaj la sol', hint: 'optim ~30°' },
];

function trackUmami(event: string, data?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { umami?: { track?: (e: string, d?: Record<string, unknown>) => void } };
  w.umami?.track?.(event, data);
}

export default function CalculatorClient({ priceCurve }: { priceCurve: KitPriceCurve }) {
  const { segment } = useSegment();
  const isRezidential = segment === 'rezidential';

  const [consumLunar, setConsumLunar] = useState<string>('5000');
  // Oamenii își știu factura în lei, nu în kWh. Fără varianta asta, jumătate
  // din vizitatori ar trebui să facă o împărțire ca să poată folosi pagina.
  const [unitateConsum, setUnitateConsum] = useState<'kwh' | 'lei'>('kwh');
  const [judet, setJudet] = useState<string>('București');
  const [mounting, setMounting] = useState<Mounting>('inclinat');
  const [tarif, setTarif] = useState<string>('1.30');
  const [autoconsum, setAutoconsum] = useState<number>(70);
  // Casa Verde nu are sesiune deschisă pe panouri în 2026, deci a preumple
  // câmpul cu un plafon ar face amortizarea să pară mai bună decât e.
  const [subventie, setSubventie] = useState<string>('0');
  const [pretSurplus, setPretSurplus] = useState<string>('0.30');
  const [showResult, setShowResult] = useState<boolean>(false);

  // When the visitor is in residential mode, apply home-appropriate defaults once
  // (lower consumption + lower daytime self-consumption). Skipped for commercial.
  // Consumul dat prin link bate valoarea implicită de segment: segmentul se
  // poate stabiliza după montare, iar altfel ar șterge cifra cerută explicit.
  const consumFromUrl = useRef(false);
  const residentialDefaultsApplied = useRef(false);
  useEffect(() => {
    if (isRezidential && !residentialDefaultsApplied.current) {
      residentialDefaultsApplied.current = true;
      if (!consumFromUrl.current) setConsumLunar('300');
      setAutoconsum(35);
    }
  }, [isRezidential]);

  // Starea poate veni din URL (`?consum=450&unitate=lei&judet=Timiș`), ca un
  // rezultat să poată fi trimis mai departe ca link. Citim din `window`, nu prin
  // `useSearchParams`, ca pagina să rămână static prerandată.
  const urlApplied = useRef(false);
  useEffect(() => {
    if (urlApplied.current) return;
    urlApplied.current = true;
    const p = new URLSearchParams(window.location.search);
    const consum = p.get('consum');
    const unitate = p.get('unitate');
    const j = p.get('judet');
    const tarifParam = p.get('tarif');
    if (j && countiesData.counties.includes(j)) setJudet(j);
    if (unitate === 'lei' || unitate === 'kwh') setUnitateConsum(unitate);
    if (tarifParam && Number(tarifParam) > 0) setTarif(tarifParam);
    if (consum && Number(consum) > 0) {
      consumFromUrl.current = true;
      setConsumLunar(consum);
      // Cu consum dat în link, omul a venit după rezultat, nu după formular.
      setShowResult(true);
    }
  }, []);

  const countyOptions = useMemo(
    () => countiesData.counties.map((c) => ({ value: c, label: c })),
    [],
  );

  const yieldKwhPerKwp = useMemo(() => yieldFor(judet, mounting), [judet, mounting]);

  // Consumul poate fi dat în kWh sau în lei; în lei îl împărțim la tariful de
  // mai jos, care e oricum cel folosit la calculul economiei.
  const consumLunarKwh = useMemo(() => {
    const n = Number(consumLunar);
    if (!Number.isFinite(n) || n <= 0) return 0;
    if (unitateConsum === 'kwh') return n;
    const t = Number(tarif);
    return Number.isFinite(t) && t > 0 ? n / t : 0;
  }, [consumLunar, unitateConsum, tarif]);

  const result = useMemo(
    () =>
      estimate(
        {
          consumLunarKwh,
          judet,
          mounting,
          tarif: Number(tarif),
          autoconsum: autoconsum / 100,
          pretSurplus: Math.max(Number(pretSurplus) || 0, 0),
          // Doar rezidențialul are Casa Verde; la firme plafonul nu se aplică.
          subventie: isRezidential ? Math.max(Number(subventie) || 0, 0) : 0,
          subventieMaxCoverage: CASA_VERDE_MAX_COVERAGE,
        },
        priceCurve,
      ),
    [consumLunarKwh, judet, mounting, tarif, autoconsum, pretSurplus, isRezidential, subventie, priceCurve],
  );

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
        <strong>Estimare orientativă.</strong> Producția specifică pe județ vine din modelul PVGIS.
        Prețul sistemelor până în {SCRAPED_DATA_MAX_KWP} kWp este mediana a {priceCurve.totalOffers} oferte
        reale cu montaj inclus, de la {priceCurve.stores} magazine, verificate la{' '}
        {new Date(priceCurve.scrapedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })};
        peste această putere rămân estimări de piață, pentru că un sistem comercial include racordare și avize
        pe care un kit de magazin nu le are.
        Pentru o ofertă reală, cereți oferte de la cel puțin trei instalatori: variația poate fi de ±20%,
        în funcție de acoperiș, orientare, umbrire, tip de invertor și condițiile concrete ale locației.
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consum lunar mediu <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                // `any`, nu un pas fix: consumul nu vine în trepte, iar un step
                // de 50 sau 100 face ca 350 să fie respins de validarea nativă.
                step="any"
                value={consumLunar}
                onChange={(e) => setConsumLunar(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <div className="shrink-0 inline-flex rounded-lg border border-gray-300 p-0.5">
                {(['kwh', 'lei'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnitateConsum(u)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      unitateConsum === u
                        ? 'bg-primary text-white'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    {u === 'kwh' ? 'kWh' : 'lei'}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {unitateConsum === 'lei' ? (
                <>
                  Suma de pe factură. O împărțim la tariful de mai jos, deci ies{' '}
                  <strong>~{formatNumber(Math.round(consumLunarKwh))} kWh pe lună</strong>.
                </>
              ) : isRezidential ? (
                'Vezi pe factură. Tipic pentru o casă: 150–500 kWh/lună.'
              ) : (
                'Vezi pe factură. Tipic: birou mic 1.500–3.000, hală 5.000–30.000.'
              )}
            </p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preț pentru energia injectată în rețea (RON/kWh)
            </label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={pretSurplus}
              onChange={(e) => setPretSurplus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              Cât valorează surplusul pe care îl trimiteți în rețea. Valoarea implicită este cea din
              regimul aplicat până acum.{' '}
              <strong>
                Legea 160/2026 schimbă regula: pentru prosumatorii sub 200 kW, compensarea devine lunară,
                la prețul energiei din contract.
              </strong>{' '}
              Legea este în vigoare din 26 iulie 2026, dar ANRE are termen până la aproximativ 24 septembrie
              să publice metodologia, deci până atunci regula nouă nu este operațională. Dacă vreți să vedeți
              cum arată calculul după, puneți aici tariful dumneavoastră.{' '}
              <Link
                href="/ghid/legea-160-2026-prosumatori-compensare-lunara-gaz-surplus"
                className="text-primary-dark font-medium hover:underline whitespace-nowrap"
              >
                Ce schimbă legea →
              </Link>
            </p>
          </div>

          {isRezidential && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plafon subvenție Casa Verde (RON)
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={subventie}
                onChange={(e) => setSubventie(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <p className="mt-1 text-xs text-gray-500">
                Programul AFM &laquo;Casa Verde Fotovoltaice&raquo; acoperă <strong>până la 90% din cost</strong> (contribuția ta minimă este 10%), în limita plafonului.
                Plafonul a fost ~20.000 lei, iar în ediția 2024 a ajuns la 30.000 lei (cu baterie). Verifică sesiunea curentă pe afm.ro. Lasă 0 dacă nu aplici.{' '}
                <Link
                  href="/ghid/casa-verde-fotovoltaice-2026"
                  className="text-primary-dark font-medium hover:underline whitespace-nowrap"
                >
                  Mai multe detalii despre Casa Verde →
                </Link>
              </p>
            </div>
          )}

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
              {isRezidential
                ? 'Cât din energia produsă o consumi direct în casă (restul se injectează în rețea, la prețul stabilit mai sus). Fără baterie, o casă cu consum mai ales seara are tipic 25–40%.'
                : 'Cât din energia produsă o consumă firma direct (restul se injectează în rețea, la prețul stabilit mai sus). Pentru firme cu activitate de zi, tipic 60–80%.'}
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
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                {result.subventie > 0 ? 'Investiție netă (după subvenție)' : 'Investiție estimată'}
              </p>
              <p className="text-2xl font-bold text-secondary-dark">{formatCurrency(result.investitie)}</p>
              {result.subventie > 0 ? (
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(result.investitieBruta)} − {formatCurrency(result.subventie)} subvenție Casa Verde
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">~{formatNumber(result.pricePerKwp)} RON/kWp, sistem la cheie</p>
              )}
              {result.pricePoint ? (
                <p className="text-xs text-gray-500 mt-2 leading-relaxed border-t border-border pt-2">
                  Mediana a {result.pricePoint.offers} oferte reale cu montaj, pentru sisteme{' '}
                  {result.pricePoint.label}. Cele mai ieftine pornesc de la{' '}
                  {formatNumber(result.pricePoint.min)} RON/kWp, cele mai scumpe ajung la{' '}
                  {formatNumber(result.pricePoint.max)} RON/kWp, deci pentru sistemul dumneavoastră
                  intervalul realist este{' '}
                  <strong>
                    {formatCurrency(Math.round(result.kwp * result.pricePoint.min))} -{' '}
                    {formatCurrency(Math.round(result.kwp * result.pricePoint.max))}
                  </strong>
                  .
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-2 leading-relaxed border-t border-border pt-2">
                  Estimare de piață pentru sisteme comerciale. Peste {SCRAPED_DATA_MAX_KWP} kWp prețul
                  depinde de racordare, avize și structură, care nu apar în prețurile publicate de magazine.
                </p>
              )}
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
                {result.investitie <= 0
                  ? 'Imediat'
                  : result.payback
                    ? `${result.payback.toFixed(1).replace('.', ',')} ani`
                    : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {result.investitie <= 0
                  ? 'Subvenția acoperă integral sistemul'
                  : 'Recuperarea investiției din economii'}
              </p>
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
                  <dd className="font-medium text-green-700">
                    {String(result.co2Tone).replace('.', ',')} t/an
                  </dd>
                </div>
              </dl>
            </div>

            <div className="bg-surface rounded-xl border border-border p-5">
              <p className="text-sm font-semibold text-secondary-dark mb-3">
                Profit pe durata de viață ({SYSTEM_LIFETIME_YEARS} ani)
              </p>
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
            <strong>Cifrele de mai sus sunt estimări orientative.</strong> Pentru o ofertă reală, adaptată
            la consumul, acoperișul și locația {isRezidential ? 'casei tale' : 'firmei tale'}, cere oferte
            de la cel puțin trei instalatori autorizați ANRE.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/cere-oferta?sursa=calculator-rezultat"
              data-umami-event="calculator-cta-oferta"
              data-umami-event-judet={judet}
              data-umami-event-kwp={String(result.kwp)}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-3 rounded-lg transition-colors"
            >
              Cere oferte personalizate →
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
