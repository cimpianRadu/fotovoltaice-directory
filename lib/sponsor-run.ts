/**
 * Fereastra de rulare a unui partener: din ce zi începe promovarea și câte zile
 * ține. Există ca să nu mai fie nevoie să ții minte tu când expiră un pachet
 * vândut pe perioadă determinată — slotul se stinge singur în ziua de după
 * ultima zi plătită.
 *
 * `run` e OPȚIONAL. Un partener fără `run` rulează nelimitat, controlat doar de
 * `active`. Așa arată abonamentele lunare care se prelungesc automat: nu au o
 * dată de final, au un preaviz.
 *
 * Cele două comută pe axe diferite și amândouă trebuie să fie adevărate ca
 * slotul să apară:
 *  - `active` = comutatorul manual, oprirea de urgență;
 *  - `run`    = perioada contractată, care curge singură.
 *
 * IMPORTANT — de ce se evaluează în browser, nu la build: `data/sponsors.json`
 * intră static în bundle-ul client (vezi disciplina din `SponsorBanner`), deci
 * orice `new Date()` rulat la nivel de modul ar fi înghețat la momentul
 * build-ului. Un `isRunning` calculat acolo ar însemna că promovarea se termină
 * abia la următorul deploy. De asta componentele cheamă `isRunning` la render,
 * după mount, cu ceasul vizitatorului.
 *
 * Zilele sunt zile calendaristice locale, nu intervale de 24h de la ora
 * semnării: fereastra e `[start 00:00, start + days 00:00)`, adică `days` zile
 * întregi cu prima zi inclusă. 24.08 + 60 de zile înseamnă ultima zi 22.10.
 */

export interface SponsorRun {
  /** Prima zi de rulare, format `AAAA-LL-ZZ` (același format ca `<input type="date">`). */
  start: string;
  /** Câte zile calendaristice ține, prima zi inclusă. */
  days: number;
}

/** Zece ani. Nu e o limită de business, e o plasă pentru degete pe tastatură. */
export const RUN_MAX_DAYS = 3650;

const DAY_MS = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Respinge și datele imposibile (2026-02-31), pe care `new Date` le rostogolește tăcut. */
export function isValidRunStart(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function isValidRun(run: SponsorRun): boolean {
  return (
    isValidRunStart(run.start) &&
    Number.isInteger(run.days) &&
    run.days >= 1 &&
    run.days <= RUN_MAX_DAYS
  );
}

function startOfDay(value: string): Date | null {
  if (!isValidRunStart(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Prima zi în care partenerul NU se mai vede. Fereastra e `[start, end)`. */
export function runEnd(run: SponsorRun): Date | null {
  const s = startOfDay(run.start);
  if (!s || !Number.isInteger(run.days) || run.days < 1) return null;
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + run.days);
}

/** Ultima zi în care partenerul se mai vede — cifra pe care o spui clientului. */
export function runLastDay(run: SponsorRun): Date | null {
  const end = runEnd(run);
  if (!end) return null;
  return new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
}

/**
 * Fără `run` sau cu un `run` stricat, răspunsul e „da". Un slot plătit care
 * dispare din cauza unei date scrise greșit e o pagubă mai mare decât unul care
 * rulează câteva zile în plus, iar datele stricate oricum nu trec de validarea
 * din `sponsors-store`.
 */
export function isRunning(run: SponsorRun | undefined, now: Date): boolean {
  if (!run) return true;
  const start = startOfDay(run.start);
  const end = runEnd(run);
  if (!start || !end) return true;
  return now >= start && now < end;
}

export type RunPhase = 'none' | 'upcoming' | 'running' | 'ended';

export interface RunStatus {
  phase: RunPhase;
  /**
   * Zile întregi până la start (`upcoming`), zile rămase cu tot cu azi
   * (`running`), respectiv zile trecute de la final (`ended`).
   */
  days: number;
  /** Ultima zi de rulare, pentru afișare. */
  lastDay: Date | null;
}

export function runStatus(run: SponsorRun | undefined, now: Date): RunStatus {
  if (!run) return { phase: 'none', days: 0, lastDay: null };

  const start = startOfDay(run.start);
  const end = runEnd(run);
  if (!start || !end) return { phase: 'none', days: 0, lastDay: null };

  const lastDay = runLastDay(run);

  if (now < start) {
    return { phase: 'upcoming', days: Math.ceil((start.getTime() - now.getTime()) / DAY_MS), lastDay };
  }
  if (now >= end) {
    return { phase: 'ended', days: Math.floor((now.getTime() - end.getTime()) / DAY_MS), lastDay };
  }
  return { phase: 'running', days: Math.ceil((end.getTime() - now.getTime()) / DAY_MS), lastDay };
}

/** `22.10.2026` — formatul în care scrii datele în contracte și facturi. */
export function formatRunDate(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(date.getDate())}.${p(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/** Ziua de azi în formatul cerut de `<input type="date">`, pe ceasul local. */
export function todayRunStart(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
