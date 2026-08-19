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

const STEPS = ['Consumul tău', 'Bateria', 'Punctajul'] as const;

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

  const [capacity, setCapacity] = useState('12');
  const [pvTouched, setPvTouched] = useState(false);
  const [pvDeclarat, setPvDeclarat] = useState('5');
  const [cost, setCost] = useState('15000');
  const [costTouched, setCostTouched] = useState(false);
  const [ownSharePct, setOwnSharePct] = useState(25);

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
      daily: kwhPerMonth / DAYS_PER_MONTH,
      threshold: supportThresholdKwp(bracket.capacity[0]),
      topNeed: kwpNeeded(bracket.capacity[1]),
    };
  }, [consum, unit, kwp]);

  // ---------- Pașii 2-3: programul ----------
  const cap = Math.max(PROGRAM.minKwh, parseFloat(capacity) || PROGRAM.minKwh);
  const pvKw = parseFloat(pvDeclarat) || 0;
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
      score: scoreFor(cap, pvKw, pct),
      atMax: Math.min(g.maxGrant, costValue * (1 - OWN_SHARE_FOR_MAX_POINTS)),
      scoreAtMax: scoreFor(cap, pvKw, OWN_SHARE_FOR_MAX_POINTS),
    };
  }, [cap, costValue, ownSharePct, pvKw]);

  const { bracket } = s1;
  const gapToMin = PROGRAM.minKwh - bracket.capacity[1];

  const go = (n: number) => {
    setStep(n);
    trackUmami('baterie-widget-pas', { pas: n + 1, sursa });
  };

  const input =
    'w-full min-w-0 rounded-l-lg border border-gray-300 px-3 py-2 text-base outline-none ' +
    'focus:border-primary focus:ring-2 focus:ring-primary/20';
  const suffix =
    'flex items-center rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-2.5 text-sm font-semibold text-gray-500';

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      {/* Antet compact, cu pașii ca navigație. */}
      <div className="bg-secondary px-4 py-3.5 text-white sm:px-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-bold sm:text-lg">Ce baterie îți trebuie și ce punctaj faci</h2>
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
                  onChange={(e) => {
                    setKwp(e.target.value);
                    if (!pvTouched) setPvDeclarat(e.target.value);
                  }}
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

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Bateria pe care o iei" htmlFor="bw-cap" hint={`Minimul: ${PROGRAM.minKwh} kWh.`}>
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

              <Field label="Puterea PV declarată" htmlFor="bw-pv" hint={`1 punct/kW, max ${PROGRAM.maxPoints.pv}.`}>
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
                  className={input}
                />
                <span className={suffix}>kW</span>
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
              <p className="mt-1 text-[11px] text-gray-500">
                Minimul la {cap} kWh: {num(s2.minPct, 1)}%. Plafonul de {formatNumber(PROGRAM.maxGrant)} lei îl urcă
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
                  { l: 'Putere PV', v: s2.score.pv, m: PROGRAM.maxPoints.pv, c: 'bg-accent' },
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
              {step === 0 ? 'Vezi ce punctaj faci' : 'Calculează punctajul'}
            </button>
          ) : (
            <a
              href={`/cere-oferta?sursa=${encodeURIComponent(sursa)}`}
              onClick={() => trackUmami('baterie-widget-cta', { capacitate: cap, punctaj: Math.round(s2.score.total) })}
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

        {/* Tot ce e explicație stă pliat, ca să nu umfle widgetul. */}
        <details className="mt-3 border-t border-border pt-3 text-xs text-gray-500">
          <summary className="cursor-pointer font-semibold text-gray-600">Cum se calculează și ce e încă incert</summary>

          <p className="mt-2.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
            <b>Estimare orientativă.</b> Cifrele vin din proiectul de ghid AFM intrat în consultare publică pe 18 august
            2026, nu dintr-un act final. Punctajul, plafoanele și condițiile se pot schimba.
          </p>

          <div className="mt-2.5 overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border text-left uppercase tracking-wide text-gray-400">
                  <th className="py-1.5 pr-2 font-bold">Profil</th>
                  <th className="py-1.5 px-1.5 text-right font-bold">Bat.</th>
                  <th className="py-1.5 px-1.5 text-right font-bold">PV</th>
                  <th className="py-1.5 px-1.5 text-right font-bold">Contr.</th>
                  <th className="py-1.5 pl-1.5 text-right font-bold">Pct.</th>
                </tr>
              </thead>
              <tbody>
                {REFERENCE_PROFILES.map((p) => (
                  <tr key={p.label} className="border-b border-border">
                    <td className="py-1.5 pr-2">{p.label}</td>
                    <td className="py-1.5 px-1.5 text-right tabular-nums">{p.capacity}</td>
                    <td className="py-1.5 px-1.5 text-right tabular-nums">{p.pv}</td>
                    <td className="py-1.5 px-1.5 text-right tabular-nums">{num(p.ownShare * 100, 1)}%</td>
                    <td className="py-1.5 pl-1.5 text-right font-semibold tabular-nums">
                      {pts(scoreFor(p.capacity, p.pv, p.ownShare).total)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-primary/10 font-bold text-secondary">
                  <td className="py-1.5 pr-2">Dosarul tău</td>
                  <td className="py-1.5 px-1.5 text-right tabular-nums">{cap}</td>
                  <td className="py-1.5 px-1.5 text-right tabular-nums">{num(pvKw, 1)}</td>
                  <td className="py-1.5 px-1.5 text-right tabular-nums">{num(s2.pct * 100, 1)}%</td>
                  <td className="py-1.5 pl-1.5 text-right tabular-nums">{pts(s2.score.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-2.5 leading-relaxed">
            Pragul de admitere nu se știe, depinde de câți se înscriu. La punctaj egal contează, în ordine, valoarea
            contribuției proprii, capacitatea, puterea PV, iar data înscrierii e ultimul criteriu. Punctajul se
            calculează pe ce declari: dacă documentele nu susțin declarația, dosarul se respinge fără recalculare (art.
            19 alin. 7). Cota de {num(PROGRAM.maxShare * 100)}% e aplicată pe baza plafonată la standardul de cost,
            lectura prudentă, fiindcă proiectul nu precizează explicit dacă se aplică pe factura totală.
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
