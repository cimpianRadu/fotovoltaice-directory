'use client';

// Calculatorul de baterie: dimensionare după consum, apoi punctajul Casa Verde.
//
// Trei decizii deliberate:
//
// 1. Toată logica stă în `lib/battery-sizing.ts`, funcții pure. Componenta doar
//    afișează. Altfel formula ar exista în două locuri și ar începe să difere.
// 2. Nu importă `lib/utils` (trage companies.json) și nici `lib/anre`. Doar
//    `lib/utils-shared`, conform disciplinei de bundle din CLAUDE.md.
// 3. Nicio cifră nu e afișată fără sursă. Dimensionarea vine din ghidul nostru
//    publicat, punctajul din proiectul de ghid AFM. Pragul de admitere NU e
//    afișat, pentru că nu îl știe nimeni: în locul lui, profilurile de comparație.

import { useMemo, useState } from 'react';
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

/** Tariful implicit, același ca în `lib/pv-estimate.ts`, ca să nu iasă două cifre diferite. */
const TARIFF_RON_PER_KWH = 1.3;

function trackUmami(event: string, data?: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { umami?: { track?: (e: string, d?: Record<string, unknown>) => void } };
  w.umami?.track?.(event, data);
}

const num = (n: number, d = 0) =>
  n.toLocaleString('ro-RO', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Taie zecimala inutilă: 27,0 devine 27, dar 27,5 rămâne 27,5. */
const pts = (n: number) => (Number.isInteger(n) ? String(n) : num(n, 1));

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
  const [consum, setConsum] = useState('300');
  const [unit, setUnit] = useState<'kwh' | 'lei'>('kwh');
  const [kwp, setKwp] = useState('5');

  const [capacity, setCapacity] = useState('12');
  const [pvDeclarat, setPvDeclarat] = useState('5');
  const [pvTouched, setPvTouched] = useState(false);
  const [cost, setCost] = useState('15000');
  const [costTouched, setCostTouched] = useState(false);
  const [ownSharePct, setOwnSharePct] = useState(25);

  // ---------- Pasul 1: dimensionarea ----------
  const step1 = useMemo(() => {
    const raw = parseFloat(consum) || 0;
    const kwhPerMonth = unit === 'lei' ? raw / TARIFF_RON_PER_KWH : raw;
    const bracket = bracketFor(kwhPerMonth);
    const daily = kwhPerMonth / DAYS_PER_MONTH;
    const pv = parseFloat(kwp) || 0;
    const threshold = supportThresholdKwp(bracket.capacity[0]);
    const topNeed = kwpNeeded(bracket.capacity[1]);
    return { kwhPerMonth, bracket, daily, pv, threshold, topNeed, raw };
  }, [consum, unit, kwp]);

  // ---------- Pasul 2: punctajul ----------
  const cap = Math.max(PROGRAM.minKwh, parseFloat(capacity) || PROGRAM.minKwh);
  const pvKw = parseFloat(pvDeclarat) || 0;
  const costValue = costTouched ? parseFloat(cost) || 0 : cap * PROGRAM.costStandardPerKwh;

  const step2 = useMemo(() => {
    const g = grantFor(cap, costValue);
    const minPct = Math.ceil(g.minOwnShare * 1000) / 10;
    const pct = Math.max(minPct, ownSharePct) / 100;
    const ownLei = costValue * pct;
    const granted = Math.max(0, Math.min(g.maxGrant, costValue - ownLei));
    const score = scoreFor(cap, pvKw, pct);
    const atMax = Math.min(g.maxGrant, costValue * (1 - OWN_SHARE_FOR_MAX_POINTS));
    const scoreAtMax = scoreFor(cap, pvKw, OWN_SHARE_FOR_MAX_POINTS);
    return { g, minPct, pct, ownLei, granted, score, atMax, scoreAtMax };
  }, [cap, costValue, ownSharePct, pvKw]);

  const { bracket } = step1;
  const gapToMin = PROGRAM.minKwh - bracket.capacity[1];

  const bars = [
    { label: 'Contribuție proprie', value: step2.score.contribution, max: PROGRAM.maxPoints.contribution, cls: 'bg-primary' },
    { label: 'Capacitate stocare', value: step2.score.capacity, max: PROGRAM.maxPoints.capacity, cls: 'bg-secondary-light' },
    { label: 'Putere fotovoltaică', value: step2.score.pv, max: PROGRAM.maxPoints.pv, cls: 'bg-accent' },
  ];

  const inputCls =
    'w-full min-w-0 rounded-l-lg border border-gray-300 px-3 py-2.5 text-base outline-none ' +
    'focus:border-primary focus:ring-2 focus:ring-primary/20';
  const suffixCls =
    'flex items-center rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm font-semibold text-gray-500';

  return (
    <div className="my-10 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {/* ---------- Pasul 1 ---------- */}
      <div className="bg-secondary px-5 py-5 text-white sm:px-6">
        <span className="inline-block rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider">
          PASUL 1
        </span>
        <h2 className="mt-2 text-lg font-bold sm:text-xl">Ce baterie ți se potrivește</h2>
        <p className="mt-1 text-sm text-white/75">Dimensionarea după consumul tău, independent de program.</p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bw-consum" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Cât consumi pe lună
            </label>
            <div className="flex">
              <input
                id="bw-consum"
                type="number"
                inputMode="decimal"
                min={1}
                step={10}
                value={consum}
                onChange={(e) => setConsum(e.target.value)}
                className={inputCls}
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
                    className={`border border-l-0 border-gray-300 px-3 text-sm font-semibold transition-colors ${
                      u === 'lei' ? 'rounded-r-lg' : ''
                    } ${unit === u ? 'border-primary bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                  >
                    {u === 'kwh' ? 'kWh' : 'lei'}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              {unit === 'kwh' ? 'Scrie cifra de pe factură.' : 'Convertim la 1,30 lei/kWh.'}
            </p>
          </div>

          <div>
            <label htmlFor="bw-kwp" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Ce putere are sistemul tău
            </label>
            <div className="flex">
              <input
                id="bw-kwp"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.5}
                value={kwp}
                onChange={(e) => {
                  setKwp(e.target.value);
                  if (!pvTouched) setPvDeclarat(e.target.value);
                }}
                className={inputCls}
              />
              <span className={suffixCls}>kWp</span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">Scrie 0 dacă nu ai încă panouri.</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 px-4 py-4 text-center">
          <div className="text-xs font-bold uppercase tracking-wide text-primary-dark">De cât ai nevoie, tehnic</div>
          <div className="my-1 text-3xl font-extrabold text-secondary sm:text-4xl">
            {bracket.capacity[0] === bracket.capacity[1]
              ? `${bracket.capacity[0]} kWh`
              : `${bracket.capacity[0]} - ${bracket.capacity[1]} kWh`}
          </div>
          <div className="text-sm text-primary-dark">
            La {num(step1.daily, 1)} kWh/zi consum mediu
            {unit === 'lei' && ` (din ${num(step1.raw)} lei/lună)`}
          </div>
        </div>

        {(() => {
          const { pv, threshold, topNeed } = step1;
          if (pv <= 0)
            return (
              <Verdict tone="stop" title="Fără panouri nu ești eligibil la Casa Verde Baterii">
                Programul cere sistem fotovoltaic deja instalat și racordat. Pentru bateria de care ai nevoie ți-ar
                trebui circa {num(threshold, 1)}-{num(topNeed[1], 1)} kWp.
              </Verdict>
            );
          if (pv >= threshold)
            return (
              <Verdict tone="ok" title="Sistemul tău susține bateria">
                {pv >= topNeed[0]
                  ? `La ${num(pv, 1)} kWp ai surplus cât să umpli o baterie până spre ${bracket.capacity[1]} kWh.`
                  : `La ${num(pv, 1)} kWp acoperi confortabil ${bracket.capacity[0]} kWh. Pentru ${bracket.capacity[1]} kWh ți-ar trebui circa ${num(topNeed[0], 1)} kWp.`}
              </Verdict>
            );
          return (
            <Verdict tone="warn" title="Panourile tale sunt sub necesarul bateriei">
              O baterie de {bracket.capacity[0]} kWh cere cel puțin {num(threshold, 1)} kWp. Tu ai {num(pv, 1)} kWp,
              care umplu realist cam {num(capacityForKwp(pv), 1)} kWh.
            </Verdict>
          );
        })()}

        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          <Fact k="Consum zilnic" v={`${num(step1.daily, 1)} kWh`} n={`media lunară / ${num(DAYS_PER_MONTH, 1)}`} />
          <Fact
            k="Din care seara-noapte"
            v={`${num(bracket.evening[0], 1)} - ${num(bracket.evening[1], 1)} kWh`}
            n="acolo lucrează bateria"
          />
          <Fact
            k="Backup la pană"
            v={`~${num(bracket.capacity[0] / CRITICAL_LOAD_KW)}-${num(bracket.capacity[1] / CRITICAL_LOAD_KW)} ore`}
            n="circuite critice, 600 W"
          />
        </div>
      </div>

      {/* ---------- Pasul 2 ---------- */}
      <div className="bg-secondary-dark px-5 py-5 text-white sm:px-6">
        <span className="inline-block rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-extrabold tracking-wider">
          PASUL 2
        </span>
        <h2 className="mt-2 text-lg font-bold sm:text-xl">Ce punctaj face dosarul tău</h2>
        <p className="mt-1 text-sm text-white/75">
          Selecția nu mai e „primul venit, primul servit”. Se alege în ordinea punctajului.
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong className="font-semibold">Estimare orientativă.</strong> Cifrele vin din proiectul de ghid AFM intrat
          în consultare publică pe 18 august 2026, nu dintr-un act final. Punctajul, plafoanele și condițiile se pot
          schimba până la aprobarea ghidului. Verifică formularea definitivă înainte să semnezi ceva.
        </div>

        {gapToMin > 0 ? (
          <Verdict tone="warn" title="Programul cere mai mult decât îți trebuie" flush>
            Tehnic ai nevoie de {bracket.capacity[0]}-{bracket.capacity[1]} kWh, dar minimul programului e{' '}
            {PROGRAM.minKwh} kWh. Ca să fii eligibil cumperi cu circa {num(gapToMin)} kWh peste necesar, iar diferența
            nu îți aduce economie în plus, doar te califică.
          </Verdict>
        ) : (
          <Verdict tone="ok" title="Necesarul tău trece de pragul programului" flush>
            Ai nevoie de {bracket.capacity[0]}-{bracket.capacity[1]} kWh, peste minimul de {PROGRAM.minKwh} kWh, deci nu
            cumperi capacitate doar ca să te califici.
          </Verdict>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="bw-cap" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Bateria pe care o iei
            </label>
            <div className="flex">
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
                className={inputCls}
              />
              <span className={suffixCls}>kWh</span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">Minimul programului: {PROGRAM.minKwh} kWh.</p>
          </div>

          <div>
            <label htmlFor="bw-pv" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Puterea PV declarată
            </label>
            <div className="flex">
              <input
                id="bw-pv"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.5}
                value={pvDeclarat}
                onChange={(e) => {
                  setPvTouched(true);
                  setPvDeclarat(e.target.value);
                }}
                className={inputCls}
              />
              <span className={suffixCls}>kW</span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">1 punct pe kW, maximum {PROGRAM.maxPoints.pv}.</p>
          </div>

          <div>
            <label htmlFor="bw-cost" className="mb-1.5 block text-sm font-semibold text-gray-700">
              Costul total al proiectului
            </label>
            <div className="flex">
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
                className={inputCls}
              />
              <span className={suffixCls}>lei</span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
              {costValue > cap * PROGRAM.costStandardPerKwh
                ? `Peste standard: doar ${formatCurrency(cap * PROGRAM.costStandardPerKwh)} intră în baza eligibilă.`
                : `Implicit: standardul de cost, ${formatNumber(PROGRAM.costStandardPerKwh)} lei/kWh.`}
            </p>
          </div>
        </div>

        {/* Slider-ul de contribuție: piesa care face compromisul vizibil. */}
        <div className="mt-6 rounded-xl border border-border bg-surface px-4 py-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-gray-700">Cât pui din buzunar</span>
            <span className="text-base font-extrabold text-primary-dark">
              {num(step2.pct * 100, 1)}%
              <span className="ml-1.5 text-sm font-normal text-gray-500">= {formatCurrency(step2.ownLei)}</span>
            </span>
          </div>
          <input
            type="range"
            aria-label="Contribuția proprie, procent din valoarea proiectului"
            min={step2.minPct}
            max={100}
            step={0.5}
            value={Math.max(step2.minPct, ownSharePct)}
            onChange={(e) => setOwnSharePct(parseFloat(e.target.value))}
            onMouseUp={() => trackUmami('baterie-slider-contributie', { pct: Math.round(step2.pct * 100) })}
            className="mt-2 w-full accent-primary"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Minimul la capacitatea asta: {num(step2.minPct, 1)}%. Contribuția obligatorie e cel puțin 25%, dar plafonul
            de {formatNumber(PROGRAM.maxGrant)} lei o urcă peste 25% la baterii mari.
          </p>
        </div>

        {/* Punctajul */}
        <div className="mt-5 grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
          <div className="rounded-xl bg-secondary px-4 py-5 text-center text-white">
            <div className="text-5xl font-extrabold leading-none">{pts(step2.score.total)}</div>
            <div className="mt-1 text-xs text-white/70">puncte din 100</div>
          </div>
          <div className="flex flex-col gap-2.5">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-600">{b.label}</span>
                  <b className="text-secondary">
                    {pts(b.value)} / {b.max}
                  </b>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${b.cls}`} style={{ width: `${(b.value / b.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Banii */}
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Primești de la AFM</div>
            <div className="mt-0.5 text-2xl font-extrabold text-emerald-700">{formatCurrency(step2.granted)}</div>
            <div className="mt-0.5 text-xs text-gray-500">
              {step2.granted >= PROGRAM.maxGrant
                ? 'Plafonul absolut, atins.'
                : step2.granted >= step2.g.maxGrant - 0.5
                  ? `Maximul posibil la ${cap} kWh.`
                  : 'Sub maxim, pentru că pui mai mult din buzunar.'}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Plătești tu</div>
            <div className="mt-0.5 text-2xl font-extrabold text-secondary">{formatCurrency(step2.ownLei)}</div>
            <div className="mt-0.5 text-xs text-gray-500">
              {num(step2.pct * 100, 1)}% din {formatCurrency(costValue)}
            </div>
          </div>
        </div>

        {/* Compromisul */}
        <div className="mt-4 rounded-lg border border-primary/30 border-l-4 border-l-primary bg-primary/5 px-4 py-3 text-sm text-gray-700">
          {step2.pct >= OWN_SHARE_FOR_MAX_POINTS ? (
            <>
              Ai atins maximul de {PROGRAM.maxPoints.contribution} de puncte pe contribuție. Peste{' '}
              {num(OWN_SHARE_FOR_MAX_POINTS * 100, 1)}% nu mai câștigi niciun punct, doar plătești mai mult.
            </>
          ) : (
            <>
              <strong className="font-semibold text-secondary">Compromisul programului:</strong> dacă urci contribuția
              la {num(OWN_SHARE_FOR_MAX_POINTS * 100, 1)}% iei{' '}
              {pts(step2.scoreAtMax.total - step2.score.total)} puncte în plus (total {pts(step2.scoreAtMax.total)}),
              dar primești cu {formatCurrency(step2.granted - step2.atMax)} mai puțin de la AFM. Criteriul îl
              răsplătește pe cel care cere mai puțini bani.
            </>
          )}
        </div>

        {/* Profiluri de comparație */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-2 font-bold">Profil de comparație</th>
                <th className="py-2 px-2 text-right font-bold">Baterie</th>
                <th className="py-2 px-2 text-right font-bold">PV</th>
                <th className="py-2 px-2 text-right font-bold">Contrib.</th>
                <th className="py-2 pl-2 text-right font-bold">Punctaj</th>
              </tr>
            </thead>
            <tbody>
              {REFERENCE_PROFILES.map((p) => (
                <tr key={p.label} className="border-b border-border text-gray-600">
                  <td className="py-2 pr-2">{p.label}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{p.capacity} kWh</td>
                  <td className="py-2 px-2 text-right tabular-nums">{p.pv} kW</td>
                  <td className="py-2 px-2 text-right tabular-nums">{num(p.ownShare * 100, 1)}%</td>
                  <td className="py-2 pl-2 text-right font-semibold tabular-nums">
                    {pts(scoreFor(p.capacity, p.pv, p.ownShare).total)}
                  </td>
                </tr>
              ))}
              <tr className="bg-primary/10 font-bold text-secondary">
                <td className="py-2.5 pr-2">Dosarul tău</td>
                <td className="py-2.5 px-2 text-right tabular-nums">{cap} kWh</td>
                <td className="py-2.5 px-2 text-right tabular-nums">{num(pvKw, 1)} kW</td>
                <td className="py-2.5 px-2 text-right tabular-nums">{num(step2.pct * 100, 1)}%</td>
                <td className="py-2.5 pl-2 text-right tabular-nums">{pts(step2.score.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-lg border border-border border-l-4 border-l-secondary bg-surface px-4 py-3 text-sm text-gray-700">
          <strong className="font-semibold text-secondary">Nu se știe încă unde cade pragul de admitere.</strong>{' '}
          Depinde de câți se înscriu și cu ce dosare. La punctaj egal, departajarea merge pe valoarea contribuției
          proprii, apoi capacitate, apoi putere PV, iar data înscrierii e ultimul criteriu.
        </div>

        <a
          href={`/cere-oferta?sursa=${encodeURIComponent(sursa)}`}
          onClick={() => trackUmami('baterie-widget-cta', { capacitate: cap, punctaj: Math.round(step2.score.total) })}
          className="mt-5 block rounded-xl bg-primary px-4 py-3.5 text-center text-base font-bold text-white transition-colors hover:bg-primary-dark"
        >
          Cere o ofertă pentru baterii
        </a>
        <p className="mt-2 text-center text-xs text-gray-500">
          Pentru bateria de {cap} kWh, de la instalatori cu atestat ANRE din județul tău.
        </p>
        {guideHref && (
          <p className="mt-3 text-center text-sm">
            <a
              href={guideHref}
              onClick={() => trackUmami('baterie-widget-spre-ghid', { sursa })}
              className="font-semibold text-primary-dark hover:underline"
            >
              Citește ghidul complet Casa Verde Baterii 2026 &rarr;
            </a>
          </p>
        )}

        <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-gray-500">
          Punctajul se calculează pe ce declari la înscriere. Dacă documentele nu susțin declarația, dosarul se respinge
          fără recalculare și fără repoziționare în listă (art. 19 alin. 7). Cota de{' '}
          {num(PROGRAM.maxShare * 100)}% e aplicată aici pe baza plafonată la standardul de cost, lectura prudentă:
          proiectul de ghid nu precizează explicit dacă procentul se calculează pe factura totală sau pe baza plafonată.
        </p>
      </div>
    </div>
  );
}

function Verdict({
  tone,
  title,
  children,
  flush,
}: {
  tone: 'ok' | 'warn' | 'stop';
  title: string;
  children: React.ReactNode;
  flush?: boolean;
}) {
  const tones = {
    ok: 'border-emerald-200 bg-emerald-50',
    warn: 'border-amber-300 bg-amber-50',
    stop: 'border-red-200 bg-red-50',
  };
  const titles = { ok: 'text-emerald-700', warn: 'text-amber-700', stop: 'text-red-700' };
  return (
    <div className={`${flush ? '' : 'mt-4'} rounded-xl border px-4 py-3.5 ${tones[tone]}`}>
      <div className={`text-sm font-bold ${titles[tone]}`}>{title}</div>
      <div className="mt-0.5 text-sm text-gray-700">{children}</div>
    </div>
  );
}

function Fact({ k, v, n }: { k: string; v: string; n: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-3">
      <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{k}</div>
      <div className="mt-0.5 text-lg font-bold text-secondary">{v}</div>
      <div className="mt-0.5 text-xs text-gray-500">{n}</div>
    </div>
  );
}
