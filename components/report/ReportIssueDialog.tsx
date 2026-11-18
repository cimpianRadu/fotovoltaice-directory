'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import BugIcon from './BugIcon';
import {
  installErrorBuffer,
  onOpenReportIssue,
  recentClientErrors,
  type ReportKind,
  type ReportOpenOptions,
} from '@/lib/report-issue-client';

/**
 * Fereastra „Raportează o problemă”. Montată o singură dată în layout, se
 * deschide din orice ReportIssueButton. Fișier identic în cele trei proiecte.
 *
 * Omul scrie ce s-a întâmplat (și, dacă vrea răspuns, emailul). Restul se
 * atașează singur: pagina, browserul, ecranul, versiunea site-ului, ultimele
 * erori JavaScript și id-ul conversației din chat. Textul conversației NU se
 * trimite: poate conține date despre sănătate; id-ul ajunge ca s-o găsim în panou.
 */

const KINDS: { id: ReportKind; label: string }[] = [
  { id: 'bug', label: 'Ceva nu merge' },
  { id: 'date-gresite', label: 'Informație greșită' },
  { id: 'asistent', label: 'Asistentul AI' },
  { id: 'altceva', label: 'Altceva' },
];

const PLACEHOLDER: Record<ReportKind, string> = {
  bug: 'Ce încercai să faci și ce s-a întâmplat? De ex.: am apăsat „Trimite” și nu s-a întâmplat nimic.',
  'date-gresite': 'Ce informație e greșită și care e cea corectă? De ex.: prețul la detartraj e acum 300 lei pe site-ul lor.',
  asistent: 'Ce ai întrebat și ce n-a mers în răspuns?',
  altceva: 'Spune-ne pe scurt.',
};

/** Parametrii care pot duce un token (linkuri private) nu pleacă în raport. */
const SECRET_PARAM = /^(k|t|token|key|cod|code|sig)$/i;

function safePath(): string {
  const url = new URL(window.location.href);
  for (const k of [...url.searchParams.keys()]) if (SECRET_PARAM.test(k)) url.searchParams.delete(k);
  return url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '');
}

function chatSessionId(): string {
  try {
    return sessionStorage.getItem('gd_chat_sid') || '';
  } catch {
    return '';
  }
}

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

export default function ReportIssueDialog() {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ReportOpenOptions>({});
  const [kind, setKind] = useState<ReportKind>('bug');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // capcană pentru boți
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [reportId, setReportId] = useState('');
  const textRef = useRef<HTMLTextAreaElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    installErrorBuffer();
    return onOpenReportIssue((o) => {
      lastFocus.current = document.activeElement as HTMLElement | null;
      setOpts(o);
      setKind(o.kind || 'bug');
      setState('idle');
      setMessage('');
      setOpen(true);
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    if (state === 'done') {
      setDescription('');
      setEmail('');
    }
    lastFocus.current?.focus?.();
  }, [state]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => textRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 5) {
      setState('error');
      setMessage('Scrie, te rog, măcar o propoziție despre ce s-a întâmplat.');
      return;
    }
    setState('sending');
    setMessage('');
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          subject: opts.subject || '',
          source: opts.source || '',
          description: description.trim(),
          email: email.trim(),
          website,
          context: {
            path: safePath(),
            title: document.title.slice(0, 200),
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}×${window.innerHeight}`,
            screen: `${window.screen.width}×${window.screen.height} @${window.devicePixelRatio}x`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            online: navigator.onLine,
            clientCommit: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
            chatSessionId: chatSessionId(),
            errors: recentClientErrors(),
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Raportul nu s-a trimis.');
      setReportId(data.id || '');
      setState('done');
      (window as GtagWindow).gtag?.('event', 'report_issue_sent', { tip: kind, sursa: opts.source || '' });
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error && err.message !== 'Failed to fetch' ? err.message : 'Nu s-a trimis. Verifică conexiunea și încearcă din nou.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-issue-title"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 text-slate-900 shadow-xl sm:max-w-md sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <BugIcon className="h-4 w-4" />
            </span>
            <h2 id="report-issue-title" className="text-base font-semibold">
              Raportează o problemă
            </h2>
          </div>
          <button type="button" onClick={close} aria-label="Închide" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {state === 'done' ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Mulțumim! Am primit raportul{reportId ? ` (${reportId})` : ''}.</p>
            <p>{email ? 'Îți scriem pe email când e rezolvat.' : 'Ne uităm la el cât de repede putem.'}</p>
            <button type="button" onClick={close} className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700">
              Închide
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            {opts.subject && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                Despre: <span className="font-medium text-slate-900">{opts.subject}</span>
              </p>
            )}

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-slate-700">Ce fel de problemă?</legend>
              <div className="flex flex-wrap gap-2">
                {KINDS.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    aria-pressed={kind === k.id}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      kind === k.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Ce s-a întâmplat?</span>
              <textarea
                ref={textRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={2000}
                rows={4}
                required
                placeholder={PLACEHOLDER[kind]}
                className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Emailul tău <span className="font-normal text-slate-400">(opțional, doar dacă vrei răspuns)</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={200}
                autoComplete="email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            {/* Capcană: oamenii nu văd câmpul, boții îl completează. */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            <p className="text-xs leading-relaxed text-slate-400">
              Atașăm automat pagina, browserul, dimensiunea ecranului și versiunea site-ului, ca să putem reproduce problema. Nu trimitem conversația din chat.
            </p>

            {state === 'error' && message && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={state === 'sending'}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            >
              {state === 'sending' ? 'Se trimite…' : 'Trimite raportul'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
