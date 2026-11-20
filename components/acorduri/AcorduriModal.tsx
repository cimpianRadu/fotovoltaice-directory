'use client';

// Modalul de acorduri (20 nov 2026): firma logată bifează termenii și grila de
// comision înainte să folosească portalul, revendicarea și Watt AI. Nu se
// închide fără bife: singura altă ieșire e „Ieși din cont”. Apare din nou doar
// când un acord primește o versiune nouă (vezi `lib/acorduri-shared.ts`).

import { useState } from 'react';
import {
  ACORDURI,
  DOCUMENT_PROMOVARE,
  GRILA_COMISION,
  type AcordId,
} from '@/lib/acorduri-shared';

export default function AcorduriModal({
  lipsa,
  actualizate = [],
  onAccepted,
}: {
  lipsa: AcordId[];
  /** Acordurile la care firma bifase o versiune mai veche. */
  actualizate?: AcordId[];
  onAccepted: () => void;
}) {
  const acorduri = ACORDURI.filter((a) => lipsa.includes(a.id));
  const [bifate, setBifate] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<'idle' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);
  const toate = acorduri.every((a) => bifate[a.id]);
  // Prima dată vs o versiune nouă a unui acord bifat deja.
  const primaData = actualizate.length === 0;

  async function accepta() {
    if (!toate) return;
    setStatus('saving');
    setError(null);
    try {
      const res = await fetch('/api/portal/acorduri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: acorduri.map((a) => a.id),
          versiuni: Object.fromEntries(acorduri.map((a) => [a.id, a.versiune])),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Nu am putut salva. Încearcă din nou.');
        setStatus('idle');
        return;
      }
      onAccepted();
    } catch {
      setError('Nu am putut salva. Încearcă din nou.');
      setStatus('idle');
    }
  }

  async function iesi() {
    await fetch('/api/portal/auth/logout', { method: 'POST' }).catch(() => {});
    window.location.href = '/portal/login';
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-gray-900/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="acorduri-titlu"
    >
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6">
        <h2 id="acorduri-titlu" className="text-lg font-bold text-gray-900">
          {primaData ? 'Cum lucrăm împreună' : 'Am actualizat condițiile'}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
          {primaData
            ? `Ca să folosești portalul, revendicarea cererilor și Watt AI, bifează ${acorduri.length === 1 ? 'acordul de mai jos' : 'cele două acorduri'}. O singură dată; le găsești oricând în portal, la „Alerte și utilizatori”.`
            : 'Ca să continui în portal, citește ce s-a schimbat și bifează din nou.'}
        </p>

        <div className="mt-4 space-y-3">
          {acorduri.map((a) => (
            <div key={a.id} className="rounded-xl border border-border p-3.5">
              {a.id === 'comision' && (
                <table className="mb-3 w-full text-left text-xs">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="pb-1 font-medium">Puterea contractată</th>
                      <th className="pb-1 font-medium">Comision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GRILA_COMISION.map((r) => (
                      <tr key={r.putere} className="border-t border-gray-100">
                        <td className="py-1.5 pr-2 text-gray-700">{r.putere}</td>
                        <td className="py-1.5 font-semibold text-gray-900">{r.comision}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={Boolean(bifate[a.id])}
                  onChange={(e) => setBifate((b) => ({ ...b, [a.id]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-amber-500"
                />
                <span className="text-sm leading-relaxed text-gray-800">{a.bifa}</span>
              </label>
              <p className="mt-2 pl-6.5 text-xs leading-relaxed text-gray-500">
                <a href={a.href} target="_blank" rel="noopener" className="font-medium text-primary-dark underline hover:no-underline">
                  Citește {a.titlu.toLowerCase()}
                </a>
                {' · '}versiunea din {a.dataVersiunii}. {a.schimbari}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-gray-500">
          <a
            href={DOCUMENT_PROMOVARE.href}
            target="_blank"
            rel="noopener"
            className="font-medium text-gray-700 underline hover:no-underline"
          >
            {DOCUMENT_PROMOVARE.titlu}
          </a>
          : {DOCUMENT_PROMOVARE.nota}
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={accepta}
          disabled={!toate || status === 'saving'}
          className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === 'saving' ? 'Se salvează...' : 'Accept și continui'}
        </button>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
          <span>
            Întrebări? 0751 547 174 ·{' '}
            <a href="mailto:contact@instalatori-fotovoltaice.ro" className="underline hover:no-underline">
              contact@instalatori-fotovoltaice.ro
            </a>
          </span>
          <button type="button" onClick={iesi} className="underline hover:text-gray-800">
            Ieși din cont
          </button>
        </div>
      </div>
    </div>
  );
}
