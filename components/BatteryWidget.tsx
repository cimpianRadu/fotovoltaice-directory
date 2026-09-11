'use client';

// Calculatorul de baterie: dimensionare după consum, apoi punctajul Casa Verde.
//
// Un singur card, trei pași, un pas vizibil odată. Prima versiune punea toate
// secțiunile una sub alta și ieșea peste 2.000 px, adică vreo cinci ecrane de
// telefon. Regula aici: fiecare pas încape pe un ecran, iar tot ce e explicație
// (tabelul de comparație, notele legale) stă în <details>, nu în fluxul principal.
//
// Trei decizii care rămân:
//
// 1. Toată logica stă în `lib/battery-sizing.ts`, funcții pure. Componenta doar
//    afișează. Altfel formula ar exista în două locuri și ar începe să difere.
// 2. Nu importă `lib/utils` (trage companies.json) și nici `lib/anre`. Doar
//    `lib/utils-shared`, conform disciplinei de bundle din CLAUDE.md.
// 3. Nicio cifră fără sursă. Pragul de admitere NU e afișat, pentru că nu îl
//    știe nimeni: în locul lui, profilurile de comparație din articol.

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency, formatNumber } from '@/lib/utils-shared';
import {
  PROGRAM,
  DAYS_PER_MONTH,
  CRITICAL_LOAD_KW,
  OWN_SHARE_FOR_MAX_POINTS,
  REFERENCE_PROFILES,
  bracketFor,
  kwpNeeded,
  capacityForKwp,
  supportThresholdKwp,
  scoreFor,
  grantFor,
} from '@/lib/battery-sizing';
import {
  DEFAULT_BUY_PRICE,
  DEFAULT_INJECTION_PRICE,
  DEFAULT_YIELD_KWH_PER_KWP,
  INSTANT_SELF_CONSUMPTION,
  ROUND_TRIP,
  USABLE_FRACTION,
  savingsFor,
  paybackYears,
} from '@/lib/battery-savings';
import { DEFAULT_TARIFF_RON_PER_KWH } from '@/lib/pv-constants';

/**
 * Tariful implicit. Era rescris aici cu un comentariu „aceeași valoare ca în
 * pv-estimate"; acum vine din `lib/pv-constants`, modulul fără dependențe de
 * date, deci nu mai poate ajunge să difere. Importul nu aduce nimic în bundle
 * în afară de numere.
 */
const TARIFF_RON_PER_KWH = DEFAULT_TARIFF_RON_PER_KWH;

function trackUmami(event: string, data?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { umami?: { track?: (e: string, d?: Record<string, unknown>) => void } };
  w.umami?.track?.(event, data);
}

const num = (n: number, d = 0) =>
  n.toLocaleString('ro-RO', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Taie zecimala inutilă: 27,0 devine 27, dar 27,5 rămâne 27,5. */
const pts = (n: number) => (Number.isInteger(n) ? String(n) : num(n, 1));

const STEPS = ['Consumul tău', 'Bateria', 'Punctajul', 'Economia'] as const;

interface Props {
  /** Ajunge în /cere-oferta?sursa=… și de acolo în Sheet, ca să știm ce produce widgetul. */
  sursa?: string;
  /**
   * Link către ghidul care explică programul. Se dă pe home page, unde widgetul
   * apare fără context; în ghid se omite, ca să nu trimită pagina spre ea însăși.
   */
  guideHref?: string;
}

export default function BatteryWidget({ sursa = 'widget-baterie', guideHref }: Props) {
  const [step, setStep] = useState(0);

  const [consum, setConsum] = useState('300');
  const [unit, setUnit] = useState<'kwh' | 'lei'>('kwh');
  const [kwp, setKwp] = useState('5');

  const [capacity, setCapacity] = useState('10');
  const [cost, setCost] = useState('15000');
  const [costTouched, setCostTouched] = useState(false);
  const [ownSharePct, setOwnSharePct] = useState(25);

  // Pasul 4. Prețurile sunt singurele mărimi noi: restul se reia din pașii 1-2,
  // ca omul să nu reintroducă date pe care le-a dat deja.
  const [buyPrice, setBuyPrice] = useState(DEFAULT_BUY_PRICE);
  const [injectionPrice, setInjectionPrice] = useState(DEFAULT_INJECTION_PRICE);
  /** Ce chip are panoul deschis. Unul singur odată. */
  const [openChip, setOpenChip] = useState<string | null>(null);
  /** Rândul de chip-uri plus panoul, ca să știm ce e „în afară". */
  const chipsRef = useRef<HTMLDivElement>(null);

  // Panoul se închidea doar reapăsând chip-ul sau alegând altul; un click
  // oriunde în rest îl lăsa deschis, ceea ce pe telefon arată ca un widget
  // blocat. `pointerdown`, nu `click`: se închide la atingere, nu după ridicarea
  // degetului. Escape, pentru cine navighează de la tastatură.
  useEffect(() => {
    if (!openChip) return;
    const outside = (e: PointerEvent) => {
      if (!chipsRef.current?.contains(e.target as Node)) setOpenChip(null);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenChip(null);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', esc);
    };
  }, [openChip]);

  // ---------- Pasul 1: dimensionarea ----------
  const s1 = useMemo(() => {
    const raw = parseFloat(consum) || 0;
    const kwhPerMonth = unit === 'lei' ? raw / TARIFF_RON_PER_KWH : raw;
    const bracket = bracketFor(kwhPerMonth);
    const pv = parseFloat(kwp) || 0;
    return {
      raw,
      bracket,
      pv,
      kwhPerMonth,
      daily: kwhPerMonth / DAYS_PER_MONTH,
      threshold: supportThresholdKwp(bracket.capacity[0]),
      topNeed: kwpNeeded(bracket.capacity[1]),
    };
  }, [consum, unit, kwp]);

  // ---------- Pașii 2-3: programul ----------
  const cap = Math.max(PROGRAM.minKwh, parseFloat(capacity) || PROGRAM.minKwh);
  const costValue = costTouched ? parseFloat(cost) || 0 : cap * PROGRAM.costStandardPerKwh;

  const s2 = useMemo(() => {
    const g = grantFor(cap, costValue);
    const minPct = Math.ceil(g.minOwnShare * 1000) / 10;
    const pct = Math.max(minPct, ownSharePct) / 100;
    const ownLei = costValue * pct;
    return {
      g,
      minPct,
      pct,
      ownLei,
      granted: Math.max(0, Math.min(g.maxGrant, costValue - ownLei)),
      score: scoreFor(cap, pct),
      atMax: Math.min(g.maxGrant, costValue * (1 - OWN_SHARE_FOR_MAX_POINTS)),
      scoreAtMax: scoreFor(cap, OWN_SHARE_FOR_MAX_POINTS),
    };
  }, [cap, costValue, ownSharePct]);

  // ---------- Pasul 4: economia ----------
  const s3 = useMemo(() => {
    const sav = savingsFor({
      consumLunarKwh: s1.kwhPerMonth,
      kwp: s1.pv,
      capacityKwh: cap,
      buyPrice,
      injectionPrice,
    });
    return {
      sav,
      /** Amortizarea pe banii tăi, adică pe contribuția proprie. */
      paybackOwn: paybackYears(s2.ownLei, sav.perYear),
      /** Amortizarea dacă plătești bateria integral, fără program. */
      paybackFull: paybackYears(costValue, sav.perYear),
    };
  }, [s1.kwhPerMonth, s1.pv, cap, buyPrice, injectionPrice, s2.ownLei, costValue]);

  const { bracket } = s1;
  const gapToMin = PROGRAM.minKwh - bracket.capacity[1];

  const go = (n: number) => {
    setStep(n);
    trackUmami('baterie-widget-pas', { pas: n + 1, sursa });
    // Pasul de economie e cel pe care vrem să-l măsurăm separat: cât de mulți
    // ajung până aici și, mai ales, câți văd un rezultat saturat (adică bateria
    // pe care o iau pentru punctaj e mai mare decât le folosește).
    if (n === 3) {
      trackUmami('baterie-economie-vazut', {
        sursa,
        capacitate: cap,
        lei_an: Math.round(s3.sav.perYear),
        saturat: s3.sav.saturated ? 'da' : 'nu',
        limiteaza: s3.sav.limiter,
      });
    }
  };

  // Cei cinci parametri ai pasului 4. Patru vin din pașii anteriori și se
  // ajustează de aici; doar prețurile sunt noi. Ținute într-un singur obiect ca
  // rândul de chip-uri și panoul de sub el să citească aceeași definiție.
  const CHIPS = ['buy', 'inject', 'kwp', 'cap', 'consum'] as const;
  const chipConf: Record<
    string,
    {
      label: string;
      display: string;
      value: number;
      min: number;
      max: number;
      step: number;
      set: (v: number) => void;
      hint: string;
    }
  > = {
    buy: {
      label: 'cumperi',
      display: `${num(buyPrice, 2)} lei`,
      value: buyPrice,
      min: 0.8,
      max: 2,
      step: 0.05,
      set: setBuyPrice,
      hint: 'Prețul de pe factură, cu tot cu distribuție și taxe. Implicit 1,30 lei, mijlocul intervalului rezidențial.',
    },
    inject: {
      label: 'recuperezi',
      display: `${num(injectionPrice, 2)} lei`,
      value: injectionPrice,
      min: 0,
      max: 2,
      step: 0.05,
      set: setInjectionPrice,
      hint: 'Cât primești înapoi pentru 1 kWh injectat. Sub compensare cantitativă e prețul energiei active din contract, nu un preț de nimic — de-aici vine cea mai mare parte din rezultat.',
    },
    kwp: {
      label: 'sistem',
      display: `${num(s1.pv, 1)} kWp`,
      value: s1.pv,
      min: 0,
      max: 20,
      step: 0.5,
      set: (v) => setKwp(String(v)),
      hint: 'Panourile pe care le ai deja. Ele dau surplusul din care se încarcă bateria.',
    },
    cap: {
      label: 'stocare',
      display: `${num(cap, 1)} kWh`,
      value: cap,
      min: PROGRAM.minKwh,
      max: 30,
      step: 1,
      set: (v) => {
        setCapacity(String(v));
        setCostTouched(false);
      },
      hint: `Capacitatea nominală. Programul cere minimum ${PROGRAM.minKwh} kWh și dă punctaj maxim de la ${PROGRAM.capacityForMaxPoints} kWh.`,
    },
    consum: {
      label: 'consum/lună',
      display: `${num(s1.kwhPerMonth)} kWh`,
      value: s1.kwhPerMonth,
      min: 100,
      max: 1500,
      step: 25,
      set: (v) => {
        setUnit('kwh');
        setConsum(String(v));
      },
      hint: 'Consumul casei. Din el iese cât apuci să scoți seara din baterie.',
    },
  };

  const input =
    'w-full min-w-0 rounded-l-lg border border-gray-300 px-3 py-2 text-base outline-none ' +
    'focus:border-primary focus:ring-2 focus:ring-primary/20';
  const suffix =
    'flex items-center rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-2.5 text-sm font-semibold text-gray-500';

  return (
    // `data-battery-calculator`: de el se agață `BatteryFab` ca să-și ascundă
    // pastila cât timp calculatorul e pe ecran. Un atribut, nu un id, fiindcă
    // widgetul apare și pe home, și pe fiecare pagină de ghid.
    <div
      data-battery-calculator
      className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
    >
      {/* Antet compact, cu pașii ca navigație. */}
      <div className="bg-secondary px-4 py-3.5 text-white sm:px-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-bold sm:text-lg">Ce baterie îți trebuie și cât economisești cu ea</h2>
          <span className="shrink-0 text-xs text-white/60">
            {step + 1}/{STEPS.length}
          </span>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          {STEPS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => go(i)}
              className="group flex-1 text-left"
              aria-current={i === step ? 'step' : undefined}
            >
              <span className={`block h-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-white/25'}`} />
              <span className={`mt-1 block text-[11px] ${i === step ? 'font-semibold text-white' : 'text-white/50'}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* ---------- Pasul 1 ---------- */}
        {step === 0 && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Cât consumi pe lună" htmlFor="bw-consum" hint={unit === 'kwh' ? 'Cifra de pe factură.' : 'Convertim la 1,30 lei/kWh.'}>
                <input
                  id="bw-consum"
                  type="number"
                  inputMode="decimal"
                  min={1}
                  step={10}
                  value={consum}
                  onChange={(e) => setConsum(e.target.value)}
                  className={input}
                />
                <div className="flex">
                  {(['kwh', 'lei'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => {
                        setUnit(u);
                        setConsum(u === 'kwh' ? '300' : '390');
                      }}
                      className={`border border-l-0 border-gray-300 px-2.5 text-sm font-semibold transition-colors ${
                        u === 'lei' ? 'rounded-r-lg' : ''
                      } ${unit === u ? 'border-primary bg-primary text-white' : 'bg-gray-50 text-gray-500'}`}
                    >
                      {u === 'kwh' ? 'kWh' : 'lei'}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Ce putere au panourile tale" htmlFor="bw-kwp" hint="Scrie 0 dacă nu ai încă panouri.">
                <input
                  id="bw-kwp"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.5}
                  value={kwp}
                  onChange={(e) => setKwp(e.target.value)}
                  className={input}
                />
                <span className={suffix}>kWp</span>
              </Field>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-primary-dark">
                  De cât ai nevoie, tehnic
                </div>
                <div className="text-2xl font-extrabold leading-tight text-secondary">
                  {bracket.capacity[0] === bracket.capacity[1]
                    ? `${bracket.capacity[0]} kWh`
                    : `${bracket.capacity[0]} - ${bracket.capacity[1]} kWh`}
                </div>
              </div>
              <div className="text-right text-xs leading-snug text-gray-500">
                {num(s1.daily, 1)} kWh/zi
                <br />
                {num(bracket.evening[0], 1)}-{num(bracket.evening[1], 1)} kWh seara
                <br />~{num(bracket.capacity[0] / CRITICAL_LOAD_KW)}-{num(bracket.capacity[1] / CRITICAL_LOAD_KW)} h
                backup
              </div>
            </div>

            {s1.pv <= 0 ? (
              <Note tone="stop">
                <b>Fără panouri nu ești eligibil.</b> Programul cere sistem deja racordat. Ți-ar trebui circa{' '}
                {num(s1.threshold, 1)}-{num(s1.topNeed[1], 1)} kWp.
              </Note>
            ) : s1.pv >= s1.threshold ? (
              <Note tone="ok">
                <b>Sistemul tău susține bateria.</b>{' '}
                {s1.pv >= s1.topNeed[0]
                  ? `La ${num(s1.pv, 1)} kWp ajungi până spre ${bracket.capacity[1]} kWh.`
                  : `La ${num(s1.pv, 1)} kWp acoperi ${bracket.capacity[0]} kWh; pentru ${bracket.capacity[1]} kWh ar trebui ~${num(s1.topNeed[0], 1)} kWp.`}
              </Note>
            ) : (
              <Note tone="warn">
                <b>Panourile sunt sub necesar.</b> {bracket.capacity[0]} kWh cer cel puțin {num(s1.threshold, 1)} kWp;
                cei {num(s1.pv, 1)} kWp ai tăi umplu ~{num(capacityForKwp(s1.pv), 1)} kWh.
              </Note>
            )}
          </>
        )}

        {/* ---------- Pasul 2 ---------- */}
        {step === 1 && (
          <>
            {gapToMin > 0 ? (
              <Note tone="warn" flush>
                <b>Programul cere mai mult decât îți trebuie.</b> Tehnic ai nevoie de {bracket.capacity[0]}-
                {bracket.capacity[1]} kWh, minimul finanțat e {PROGRAM.minKwh} kWh. Diferența te califică, nu îți aduce
                economie.
              </Note>
            ) : (
              <Note tone="ok" flush>
                <b>Necesarul tău trece de pragul programului.</b> Ai nevoie de {bracket.capacity[0]}-
                {bracket.capacity[1]} kWh, peste minimul de {PROGRAM.minKwh} kWh.
              </Note>
            )}

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field
                label="Bateria pe care o iei"
                htmlFor="bw-cap"
                hint={`Minimul: ${PROGRAM.minKwh} kWh. Punctaj maxim de la ${PROGRAM.capacityForMaxPoints} kWh.`}
              >
                <input
                  id="bw-cap"
                  type="number"
                  inputMode="decimal"
                  min={PROGRAM.minKwh}
                  step={1}
                  value={capacity}
                  onChange={(e) => {
                    setCapacity(e.target.value);
                    setCostTouched(false);
                  }}
                  className={input}
                />
                <span className={suffix}>kWh</span>
              </Field>

              <Field
                label="Costul total"
                htmlFor="bw-cost"
                hint={
                  costValue > cap * PROGRAM.costStandardPerKwh
                    ? `Doar ${formatCurrency(cap * PROGRAM.costStandardPerKwh)} intră în baza eligibilă.`
                    : `Standard: ${formatNumber(PROGRAM.costStandardPerKwh)} lei/kWh.`
                }
              >
                <input
                  id="bw-cost"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={500}
                  value={costTouched ? cost : String(Math.round(costValue))}
                  onChange={(e) => {
                    setCostTouched(true);
                    setCost(e.target.value);
                  }}
                  className={input}
                />
                <span className={suffix}>lei</span>
              </Field>
            </div>
          </>
        )}

        {/* ---------- Pasul 3 ---------- */}
        {step === 2 && (
          <>
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-baseline justify-between">
                <label htmlFor="bw-contrib" className="text-sm font-semibold text-gray-700">
                  Cât pui din buzunar
                </label>
                <span className="text-sm font-extrabold text-primary-dark">
                  {num(s2.pct * 100, 1)}%
                  <span className="ml-1.5 font-normal text-gray-500">{formatCurrency(s2.ownLei)}</span>
                </span>
              </div>
              <input
                id="bw-contrib"
                type="range"
                aria-label="Contribuția proprie, procent din valoarea proiectului"
                min={s2.minPct}
                max={100}
                step={0.5}
                value={Math.max(s2.minPct, ownSharePct)}
                onChange={(e) => setOwnSharePct(parseFloat(e.target.value))}
                onMouseUp={() => trackUmami('baterie-slider-contributie', { pct: Math.round(s2.pct * 100) })}
                className="mt-1.5 w-full accent-primary"
              />
              {/* Cele două capete ale sliderului, scrise la capetele lui: unde
                  e minimul și unde e maximul util. Într-un singur paragraf sub
                  slider, omul trebuia să citească o frază ca să afle că are o
                  limită jos; așa o vede în dreptul ei. */}
              <div className="mt-1 flex justify-between gap-3 text-[11px] text-gray-500">
                <span>minim {num(s2.minPct, 1)}%</span>
                <span>punctaj maxim de la {num(OWN_SHARE_FOR_MAX_POINTS * 100, 1)}%</span>
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                Minimul la {cap} kWh e {num(s2.minPct, 1)}%: plafonul de {formatNumber(PROGRAM.maxGrant)} lei îl urcă
                peste 25% la baterii mari.
              </p>
            </div>

            <div className="mt-3 flex items-stretch gap-3">
              <div className="flex shrink-0 flex-col justify-center rounded-xl bg-secondary px-4 py-2.5 text-center text-white">
                <div className="text-3xl font-extrabold leading-none">{pts(s2.score.total)}</div>
                <div className="text-[10px] text-white/60">din 100</div>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-1.5">
                {[
                  { l: 'Contribuție', v: s2.score.contribution, m: PROGRAM.maxPoints.contribution, c: 'bg-primary' },
                  { l: 'Capacitate', v: s2.score.capacity, m: PROGRAM.maxPoints.capacity, c: 'bg-secondary-light' },
                ].map((b) => (
                  <div key={b.l} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-[11px] text-gray-500">{b.l}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <span className={`block h-full rounded-full ${b.c}`} style={{ width: `${(b.v / b.m) * 100}%` }} />
                    </span>
                    <b className="w-12 shrink-0 text-right text-[11px] text-secondary">
                      {pts(b.v)}/{b.m}
                    </b>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Primești de la AFM</div>
                <div className="text-xl font-extrabold text-emerald-700">{formatCurrency(s2.granted)}</div>
              </div>
              <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Plătești tu</div>
                <div className="text-xl font-extrabold text-secondary">{formatCurrency(s2.ownLei)}</div>
              </div>
            </div>

            <Note tone="info">
              {s2.pct >= OWN_SHARE_FOR_MAX_POINTS ? (
                <>
                  <b>Ai maximul pe contribuție.</b> Peste {num(OWN_SHARE_FOR_MAX_POINTS * 100, 1)}% nu mai câștigi
                  puncte, doar plătești mai mult.
                </>
              ) : (
                <>
                  <b>Compromisul programului:</b> la {num(OWN_SHARE_FOR_MAX_POINTS * 100, 1)}% contribuție ai{' '}
                  {pts(s2.scoreAtMax.total)} puncte, cu {formatCurrency(s2.granted - s2.atMax)} mai puțin de la AFM.
                </>
              )}
            </Note>
          </>
        )}

        {/* ---------- Pasul 4 ---------- */}
        {step === 3 && (
          <>
            {/* Rezultatul stă sus și se recalculează sub deget, ca omul să vadă
                ce mișcă fiecare parametru fără să apese nimic. */}
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                {s3.sav.perYear > 0 ? 'Cu bateria câștigi' : 'Cu bateria pierzi'}
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span
                  className={`text-3xl font-extrabold leading-tight sm:text-4xl ${
                    s3.sav.perYear > 0 ? 'text-secondary' : 'text-red-700'
                  }`}
                >
                  {formatCurrency(Math.abs(Math.round(s3.sav.perYear)))}
                </span>
                <span className="text-sm text-gray-500">
                  pe an · {formatCurrency(Math.abs(Math.round(s3.sav.perMonth)))}/lună
                </span>
              </div>
            </div>

            {/* Cei cinci parametri, pe un rând. Câmpurile pe rânduri separate
                ocupau cinci ori mai mult, iar patru din cinci vin deja din pașii
                anteriori: aici se ajustează, nu se completează de la zero. */}
            <div ref={chipsRef}>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CHIPS.map((c) => {
                const conf = chipConf[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      const next = openChip === c ? null : c;
                      setOpenChip(next);
                      if (next) trackUmami('baterie-economie-chip', { parametru: c, sursa });
                    }}
                    aria-expanded={openChip === c}
                    className={`rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
                      openChip === c
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-white hover:border-primary/50'
                    }`}
                  >
                    <span className="block text-sm font-bold leading-tight text-secondary">
                      {conf.display}
                    </span>
                    <span className="block text-[10px] uppercase tracking-wide text-gray-500">{conf.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Panoul de ajustare stă sub rând, pe toată lățimea. Un popover
                ancorat de chip ar fi ieșit din card pe telefon, iar cardul are
                `overflow-hidden`, deci l-ar fi și tăiat. */}
            {/* Lățime limitată, nu toată lățimea cardului: pe desktop ieșea un
                slider de aproape 2.000 px pentru un interval de doi lei, iar
                valoarea din dreapta ajungea fix sub butonul flotant. */}
            {openChip && (
              <div className="mt-2 max-w-sm rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-semibold text-gray-700">{chipConf[openChip].label}</span>
                  <span className="text-sm font-extrabold text-primary-dark">{chipConf[openChip].display}</span>
                </div>
                <input
                  type="range"
                  aria-label={chipConf[openChip].label}
                  min={chipConf[openChip].min}
                  max={chipConf[openChip].max}
                  step={chipConf[openChip].step}
                  value={chipConf[openChip].value}
                  onChange={(e) => chipConf[openChip].set(parseFloat(e.target.value))}
                  onMouseUp={() => trackUmami('baterie-economie-slider', { parametru: openChip })}
                  className="mt-1.5 w-full accent-primary"
                />
                <p className="mt-1 text-[11px] leading-snug text-gray-600">{chipConf[openChip].hint}</p>
              </div>
            )}
            </div>

            {/* Amortizarea: singura cifră care spune dacă merită, și singura care
                leagă pasul 3 de ăsta. Subvenția se vede aici, nu în punctaj. */}
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Fără program</div>
                <div className="text-xl font-extrabold text-secondary">
                  {s3.paybackFull ? `${num(s3.paybackFull, 1)} ani` : 'nu se amortizează'}
                </div>
                <div className="text-[10px] text-gray-500">la {formatCurrency(costValue)}</div>
              </div>
              {/* Verde doar când chiar se amortizează. Un card verde peste
                  „nu se amortizează" citește ca rezultat bun dintr-o privire. */}
              <div
                className={`rounded-xl border px-3 py-2.5 ${
                  s3.paybackOwn ? 'border-emerald-200 bg-emerald-50' : 'border-border bg-surface'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Cu subvenția AFM</div>
                <div className={`text-xl font-extrabold ${s3.paybackOwn ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {s3.paybackOwn ? `${num(s3.paybackOwn, 1)} ani` : 'nu se amortizează'}
                </div>
                <div className="text-[10px] text-gray-500">la {formatCurrency(s2.ownLei)} din buzunar</div>
              </div>
            </div>

            {/* Pragul de saturație. Motivul pentru care widgetul ăsta există:
                peste el, kWh-ul în plus se plătește dar nu se folosește. */}
            {s3.sav.perYear > 0 && s3.sav.saturationKwh > 0 && (
              <Note tone={s3.sav.saturated ? 'warn' : 'ok'}>
                {s3.sav.saturated ? (
                  <>
                    <b>Peste {num(s3.sav.saturationKwh, 1)} kWh economia nu mai crește.</b>{' '}
                    {s3.sav.limiter === 'panouri'
                      ? `Panourile de ${num(s1.pv, 1)} kWp lasă în medie ${num(s3.sav.surplusPerDay, 1)} kWh surplus pe zi, atât are bateria de stocat.`
                      : `Seara consumi ${num(s3.sav.eveningPerDay, 1)} kWh, atât apuci să scoți din baterie.`}{' '}
                    Cei {num(cap - s3.sav.saturationKwh, 1)} kWh peste prag îți aduc puncte la AFM, nu lei pe factură.
                  </>
                ) : (
                  <>
                    <b>Bateria e limita, nu sistemul.</b> Fiecare kWh în plus încă aduce economie, până pe la{' '}
                    {num(s3.sav.saturationKwh, 1)} kWh.
                  </>
                )}
              </Note>
            )}

            {s3.sav.perYear <= 0 && (
              <Note tone="stop">
                {/* `formatCurrency` rotunjește la leu întreg, deci 1,25 și 1,30
                    ar apărea amândouă ca „1 RON". Prețurile unitare se scriu cu
                    două zecimale, ca pe chip-uri. */}
                <b>La prețurile astea bateria nu se justifică.</b> Recuperezi {num(injectionPrice, 2)} lei/kWh la
                injecție și cumperi cu {num(buyPrice, 2)} lei/kWh, iar din fiecare kWh stocat se pierd{' '}
                {num((1 - ROUND_TRIP) * 100)}% la conversie. Bateria are sens pentru backup, nu pentru factură.
              </Note>
            )}
          </>
        )}

        {/* Navigație + CTA */}
        <div className="mt-4 flex gap-2.5">
          {step > 0 && (
            <button
              type="button"
              onClick={() => go(step - 1)}
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
            >
              Înapoi
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => go(step + 1)}
              className="flex-1 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-secondary-dark"
            >
              {step === 0 ? 'Vezi ce punctaj faci' : step === 1 ? 'Calculează punctajul' : 'Vezi cât economisești'}
            </button>
          ) : (
            <a
              href={`/cere-oferta?sursa=${encodeURIComponent(sursa)}`}
              onClick={() =>
                trackUmami('baterie-widget-cta', {
                  capacitate: cap,
                  punctaj: Math.round(s2.score.total),
                  lei_an: Math.round(s3.sav.perYear),
                  amortizare: s3.paybackOwn ? Math.round(s3.paybackOwn * 10) / 10 : 0,
                  saturat: s3.sav.saturated ? 'da' : 'nu',
                })
              }
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-primary-dark sm:text-base"
            >
              Cere o ofertă pentru baterii
            </a>
          )}
        </div>

        {step === STEPS.length - 1 && (
          <p className="mt-2 text-center text-[11px] text-gray-500">
            Pentru bateria de {cap} kWh, de la instalatori cu atestat ANRE din județul tău.
          </p>
        )}

        {/* Ieșire spre ofertă și de la punctaj, nu doar de la ultimul pas.
            Până la pasul de economie, punctajul ERA ultimul pas și avea butonul
            de ofertă; mutându-l mai departe, oricine se oprea aici mai are acum
            un click de făcut. Link, nu buton, ca să nu concureze cu pasul
            următor — dar `sursa` diferită, ca să știm câți ies pe scurtătură. */}
        {step === 2 && (
          <p className="mt-2 text-center text-xs text-gray-500">
            <a
              href={`/cere-oferta?sursa=${encodeURIComponent(`${sursa}-punctaj`)}`}
              onClick={() =>
                trackUmami('baterie-widget-cta', {
                  capacitate: cap,
                  punctaj: Math.round(s2.score.total),
                  din_pas: 3,
                })
              }
              className="font-semibold text-primary-dark hover:underline"
            >
              sau cere direct o ofertă pentru bateria de {cap} kWh
            </a>
          </p>
        )}

        {/* Tot ce e explicație stă pliat, ca să nu umfle widgetul. */}
        <details className="mt-3 border-t border-border pt-3 text-xs text-gray-500">
          <summary className="cursor-pointer font-semibold text-gray-600">Cum se calculează și ce e încă incert</summary>

          <p className="mt-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
            <b>Estimare orientativă.</b> Cifrele vin din forma consolidată a proiectului de ghid, publicată de MMAP pe
            9 septembrie 2026. Tot proiect: ordinul nu e semnat și nu e în Monitorul Oficial, deci punctajul,
            plafoanele și condițiile se mai pot schimba.
          </p>

          <div className="mt-2.5 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border text-left uppercase tracking-wide text-gray-400">
                  <th className="py-1.5 pr-2 font-bold">Profil</th>
                  <th className="py-1.5 px-1.5 text-right font-bold">Bat.</th>
                  <th className="py-1.5 px-1.5 text-right font-bold">Contr.</th>
                  <th className="py-1.5 pl-1.5 text-right font-bold">Pct.</th>
                </tr>
              </thead>
              <tbody>
                {REFERENCE_PROFILES.map((p) => (
                  <tr key={p.label} className="border-b border-border">
                    <td className="py-1.5 pr-2">{p.label}</td>
                    <td className="py-1.5 px-1.5 text-right tabular-nums">{p.capacity}</td>
                    <td className="py-1.5 px-1.5 text-right tabular-nums">{num(p.ownShare * 100, 1)}%</td>
                    <td className="py-1.5 pl-1.5 text-right font-semibold tabular-nums">
                      {pts(scoreFor(p.capacity, p.ownShare).total)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-primary/10 font-bold text-secondary">
                  <td className="py-1.5 pr-2">Dosarul tău</td>
                  <td className="py-1.5 px-1.5 text-right tabular-nums">{cap}</td>
                  <td className="py-1.5 px-1.5 text-right tabular-nums">{num(s2.pct * 100, 1)}%</td>
                  <td className="py-1.5 pl-1.5 text-right tabular-nums">{pts(s2.score.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-2.5 leading-relaxed">
            <b className="text-gray-600">Economia</b> se calculează pe ce mută bateria zilnic: surplusul de peste zi
            care altfel ar pleca în rețea, mutat în consumul de seară. Ipotezele, toate din ghidurile publicate aici:
            autoconsum instant fără baterie {num(INSTANT_SELF_CONSUMPTION * 100)}% din producție (interval 20-30%),
            randament dus-întors {num(ROUND_TRIP * 100)}% pe sistemul complet, invertor și BMS incluse (88-92%),
            capacitate utilizabilă {num(USABLE_FRACTION * 100)}% din cea nominală (DoD al bateriilor LFP, 90-100%),
            producție {formatNumber(DEFAULT_YIELD_KWH_PER_KWP)} kWh/kWp pe an, media țării, împărțită pe luni după
            forma sezonieră PVGIS. Prețul de recuperare implicit, {num(DEFAULT_INJECTION_PRICE, 3)} lei/kWh, e prețul
            energiei active — sub compensare cantitativă asta primești pentru surplus, conform art. 73¹ alin. (3) din
            Legea nr. 160/2026, nu un preț de piață mult mai mic. Pune-ți cifrele de pe factura ta, sunt singurele care
            contează. <b className="text-gray-600">Calculul se face lună cu lună</b>, fiindcă în decembrie panourile
            produc a treia parte din cât produc în iulie, iar o baterie plină vara poate sta goală iarna. Consumul, în
            schimb, e ținut constant: un profil lunar de consum nu avem de unde lua fără să-l inventăm.
          </p>

          <p className="mt-2.5 leading-relaxed">
            Pragul de admitere nu se știe, depinde de câți se înscriu. La punctaj egal contează, în ordine, valoarea
            contribuției proprii, capacitatea, iar data înscrierii e ultimul criteriu. Puterea sistemului fotovoltaic nu
            mai punctează deloc în forma consolidată. Punctajul acordat la înscriere nu se mai majorează și ordinea de
            selecție nu se schimbă (art. 19 alin. 10); dacă documentele arată un punctaj mai mic decât cel declarat,
            dosarul se respinge (art. 20 alin. 5). Cota de {num(PROGRAM.maxShare * 100)}% e aplicată pe baza plafonată la
            standardul de cost, lectura prudentă, fiindcă proiectul nu precizează explicit dacă se aplică pe factura
            totală.
          </p>

          {guideHref && (
            <p className="mt-2.5">
              <a
                href={guideHref}
                onClick={() => trackUmami('baterie-widget-spre-ghid', { sursa })}
                className="font-semibold text-primary-dark hover:underline"
              >
                Ghidul complet Casa Verde Baterii 2026 &rarr;
              </a>
            </p>
          )}
        </details>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold text-gray-700">
        {label}
      </label>
      <div className="flex">{children}</div>
      <p className="mt-1 text-[11px] text-gray-500">{hint}</p>
    </div>
  );
}

function Note({
  tone,
  children,
  flush,
}: {
  tone: 'ok' | 'warn' | 'stop' | 'info';
  children: React.ReactNode;
  flush?: boolean;
}) {
  const tones = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    warn: 'border-amber-300 bg-amber-50 text-amber-900',
    stop: 'border-red-200 bg-red-50 text-red-900',
    info: 'border-primary/30 bg-primary/5 text-gray-700',
  };
  return (
    <div className={`${flush ? '' : 'mt-3'} rounded-lg border px-3.5 py-2.5 text-[13px] leading-snug ${tones[tone]}`}>
      {children}
    </div>
  );
}
