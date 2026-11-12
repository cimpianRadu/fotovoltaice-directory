'use client';

import Link from 'next/link';
import { useState } from 'react';
import { OUTCOME_LABELS, type ClosingOutcome } from '@/lib/inchideri-rules';
import type { ClosingCandidate, SignalSource } from '@/lib/inchideri';

const SOURCE_LABELS: Record<SignalSource, string> = {
  renuntare: 'Motivul renunțării',
  jurnal_firma: 'Jurnalul firmei',
  notita_client: 'Notița clientului',
  concretizat: 'Status în portal',
};

const OUTCOMES = Object.keys(OUTCOME_LABELS) as ClosingOutcome[];

export default function ClosingCard({ candidate: c }: { candidate: ClosingCandidate }) {
  const [status, setStatus] = useState<ClosingOutcome>(c.suggested);
  const [anunta, setAnunta] = useState(c.firmsToNotify > 0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const top = c.signals[0];
  const motiv = `${top.firma}, ${top.at.slice(0, 10)}: „${top.quote}”`;

  async function send(action: 'inchide' | 'pastreaza') {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/inchideri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.leadId, action, status, motiv, anunta }),
      });
      const data = (await res.json()) as { error?: string; notified?: boolean };
      if (!res.ok) throw new Error(data.error || 'Nu s-a salvat.');
      setDone(
        action === 'inchide'
          ? `Închisă: ${OUTCOME_LABELS[status].toLowerCase()}${data.notified ? ', firmele active au primit emailul' : ''}.`
          : 'Rămâne deschisă. Revine aici doar dacă apare un semnal nou.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu s-a salvat.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm transition ${
        done ? 'border-border opacity-60' : c.clear ? 'border-emerald-200' : 'border-amber-200'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/admin/cereri/${encodeURIComponent(c.leadId)}`}
            className="font-semibold text-gray-900 hover:underline"
          >
            {c.summary || c.leadId}
          </Link>
          <p className="text-xs text-gray-500">
            {c.contact} · primită {c.leadId.slice(0, 10)} · stare acum: {c.crmStatus || 'noua'}
            {c.keptOpenAt && ` · lăsată deschisă pe ${c.keptOpenAt.slice(0, 10)}`}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            c.clear ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          Propus: {OUTCOME_LABELS[c.suggested]}
        </span>
      </div>

      <ul className="mt-3 space-y-2">
        {c.signals.map((s, i) => (
          <li key={i} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <p className="text-xs text-gray-500">
              {SOURCE_LABELS[s.source]} · {s.firma} · {s.at}
            </p>
            <p className="mt-0.5 text-gray-900">„{s.quote}”</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Motiv identificat: <strong className="text-gray-700">{OUTCOME_LABELS[s.outcome]}</strong>
              {s.source !== 'concretizat' && <> (după „{s.match}”)</>}
            </p>
            {s.doubts.length > 0 && (
              <p className="mt-0.5 text-xs text-amber-700">Atenție: {s.doubts.join('; ')}.</p>
            )}
          </li>
        ))}
      </ul>

      {c.activeClaims.length > 0 && (
        <div className="mt-3 text-sm">
          <p className="text-xs font-medium text-gray-700">Încă pe cerere:</p>
          <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
            {c.activeClaims.map((a, i) => (
              <li key={i}>
                {a.firma}: {a.status}
                {a.gaveSignal && ' (a scris chiar ea comentariul de mai sus, fără să renunțe)'}
                {a.laterNote && <span className="text-amber-700"> · notă mai nouă: „{a.laterNote}”</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {done ? (
        <p className="mt-3 text-sm font-medium text-gray-700">{done}</p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <div className="flex overflow-hidden rounded-lg border border-border text-xs">
            {OUTCOMES.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setStatus(o)}
                className={`px-2.5 py-1.5 transition ${
                  status === o ? 'bg-slate-900 text-white' : 'bg-white text-gray-600 hover:bg-slate-50'
                }`}
              >
                {OUTCOME_LABELS[o]}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => send('inchide')}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            Închide cererea
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => send('pastreaza')}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Lasă deschisă
          </button>
          {c.firmsToNotify > 0 && (
            <label className="ml-auto flex items-center gap-1.5 text-xs text-gray-600">
              <input type="checkbox" checked={anunta} onChange={(e) => setAnunta(e.target.checked)} />
              La închidere, anunță pe email {c.firmsToNotify === 1 ? 'firma activă' : `cele ${c.firmsToNotify} firme active`}
            </label>
          )}
          {error && <p className="w-full text-xs text-red-600">{error}</p>}
        </div>
      )}
    </article>
  );
}
