/**
 * Partea de browser a butonului „Raportează o problemă” (gândacul).
 *
 * ⚠️ Fișier IDENTIC în gaseste-dentist, instalatori-fotovoltaice și
 * clinici-estetice, la fel ca `components/report/*`, `app/api/report/route.ts`
 * și `lib/report-issue.ts`. Dacă schimbi unul, copiază-l în toate trei.
 *
 * - `openReportIssue()` deschide fereastra de oriunde (footer, chat, profil),
 *   printr-un eveniment pe `window`: fereastra e montată o singură dată, în layout.
 * - Bufferul de erori ține ultimele erori JavaScript din pagină, ca raportul să
 *   vină cu ele fără ca omul să știe ce e o consolă.
 */

export type ReportKind = 'bug' | 'date-gresite' | 'asistent' | 'altceva';

export interface ReportOpenOptions {
  kind?: ReportKind;
  /** Despre ce e raportul, completat dinainte: numele clinicii/firmei. */
  subject?: string;
  /** De unde s-a deschis: 'footer', 'chat', 'profil'. */
  source?: string;
}

const OPEN_EVENT = 'report-issue:open';

export function openReportIssue(opts: ReportOpenOptions = {}): void {
  window.dispatchEvent(new CustomEvent<ReportOpenOptions>(OPEN_EVENT, { detail: opts }));
}

export function onOpenReportIssue(cb: (opts: ReportOpenOptions) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<ReportOpenOptions>).detail || {});
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}

export interface ClientError {
  at: string;
  message: string;
  where?: string;
}

const MAX_ERRORS = 10;
const errors: ClientError[] = [];
let installed = false;

function push(e: ClientError) {
  // Aceeași eroare în buclă (un re-render care pică) nu umple bufferul.
  const last = errors[errors.length - 1];
  if (last && last.message === e.message) return;
  errors.push({ ...e, message: e.message.slice(0, 300) });
  if (errors.length > MAX_ERRORS) errors.shift();
}

/** Se cheamă o dată, din fereastra montată în layout. Erorile de dinainte de hidratare scapă. */
export function installErrorBuffer(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (e) => {
    push({
      at: new Date().toISOString(),
      message: e.message || String(e.error || 'eroare'),
      where: e.filename ? `${e.filename.replace(window.location.origin, '')}:${e.lineno}:${e.colno}` : undefined,
    });
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason;
    push({ at: new Date().toISOString(), message: `promisiune respinsă: ${r instanceof Error ? r.message : String(r)}` });
  });
}

export function recentClientErrors(): ClientError[] {
  return errors.slice();
}
