'use client';

// Modalul de acorduri (20 nov 2026): firma logată bifează termenii și grila de
// comision înainte să folosească portalul, revendicarea și Watt AI. Nu se
// închide fără bife: singura altă ieșire e „Ieși din cont”. Apare din nou doar
// când un acord primește o versiune nouă (vezi `lib/acorduri-shared.ts`).
//
// Butonul stă fix jos, iar doar conținutul se derulează: pe telefon modalul e
// mai înalt decât ecranul, iar „Accept” nu trebuie căutat. Pagina din spate nu
// se derulează cât e deschis, iar focusul rămâne în modal (Tab ciclează).

import { useEffect, useRef, useState } from 'react';
import {
  ACORDURI,
  DOCUMENT_PROMOVARE,
  GRILA_COMISION,
  type AcordId,
} from '@/lib/acorduri-shared';

const FOCUSABILE = 'a[href], button:not([disabled]), input:not([disabled])';

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
  const panou = useRef<HTMLDivElement>(null);
  const ramase = acorduri.filter((a) => !bifate[a.id]).length;
  // Prima dată vs o versiune nouă a unui acord bifat deja.
  const primaData = actualizate.length === 0;

  useEffect(() => {
    const inainte = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // setTimeout, nu focus direct: pe unele browsere focusul dat la montare se pierde.
    const t = setTimeout(() => panou.current?.focus(), 0);
    return () => {
      document.body.style.overflow = inainte;
      clearTimeout(t);
    };
  }, []);

  function tineFocusul(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab' || !panou.current) return;
    const el = [...panou.current.querySelectorAll<HTMLElement>(FOCUSABILE)];
    if (el.length === 0) return;
    const primul = el[0];
    const ultimul = el[el.length - 1];
    const activ = document.activeElement;
    if (e.shiftKey && (activ === primul || activ === panou.current)) {
      e.preventDefault();
      ultimul.focus();
    } else if (!e.shiftKey && activ === ultimul) {
      e.preventDefault();
      primul.focus();
    }
  }

  async function accepta() {
    if (ramase > 0) return;
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

  const textButon =
    status === 'saving'
      ? 'Se salvează...'
      : ramase === 0
        ? 'Accept și continui'
        : ramase === acorduri.length && acorduri.length > 1
          ? 'Bifează ambele acorduri ca să continui'
          : 'Mai e un acord de bifat';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-gray-900/60 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="acorduri-titlu"
      aria-describedby="acorduri-intro"
      onKeyDown={tineFocusul}
    >
      <div
        ref={panou}
        tabIndex={-1}
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl outline-none sm:max-h-[90vh] sm:rounded-2xl"
      >
        <div className="overflow-y-auto overscroll-contain px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
          <h2 id="acorduri-titlu" className="text-lg font-bold leading-snug text-gray-900">
            {primaData ? 'Am publicat termenii de colaborare și aici, în cont' : 'Am actualizat condițiile'}
          </h2>
          <p id="acorduri-intro" className="mt-1.5 text-sm leading-relaxed text-gray-600">
            {primaData
              ? 'Termenii și grila de comision, până acum trimise pe email, sunt de azi și în cont. Le bifezi o singură dată și le găsești oricând în portal, la „Condiții de colaborare”.'
              : 'Ca să continui în portal, citește ce s-a schimbat și bifează din nou.'}
          </p>

          <div className="mt-4 space-y-3">
            {acorduri.map((a) => {
              const bifat = Boolean(bifate[a.id]);
              return (
                <div
                  key={a.id}
                  className={`rounded-xl border p-3.5 transition-colors ${
                    bifat ? 'border-amber-300 bg-amber-50/50' : 'border-border'
                  }`}
                >
                  {a.id === 'comision' && (
                    <>
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-gray-500">
                            <th className="pb-1 font-medium">Puterea contractată</th>
                            <th className="pb-1 text-right font-medium">Comision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {GRILA_COMISION.map((r) => (
                            <tr key={r.putere} className="border-t border-gray-100">
                              <td className="py-1.5 pr-2 text-gray-700">{r.putere}</td>
                              <td className="py-1.5 text-right font-semibold whitespace-nowrap text-gray-900">
                                {r.comision}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="mt-1 mb-3 text-[11px] text-gray-500">
                        TVA 21% se adaugă la factură. Peste 100 kW, procentul îl stabilim în scris pe proiect.
                      </p>
                    </>
                  )}
                  <label className="flex cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={bifat}
                      onChange={(e) => setBifate((b) => ({ ...b, [a.id]: e.target.checked }))}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-amber-500"
                    />
                    <span className="text-sm leading-relaxed text-gray-800">{a.bifa}</span>
                  </label>
                  <p className="mt-2 pl-7.5 text-xs leading-relaxed text-gray-500">
                    <a
                      href={a.href}
                      target="_blank"
                      rel="noopener"
                      className="font-medium text-primary-dark underline hover:no-underline"
                    >
                      Citește {a.titlu.toLowerCase()}
                    </a>
                    {' · '}versiunea din {a.dataVersiunii}
                    {actualizate.includes(a.id) && (
                      <span className="mt-1 block text-gray-700">Ce s-a schimbat: {a.schimbari}</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-gray-500">
            <a
              href={DOCUMENT_PROMOVARE.href}
              target="_blank"
              rel="noopener"
              className="font-medium text-gray-700 underline hover:no-underline"
            >
              {DOCUMENT_PROMOVARE.titlu}
            </a>{' '}
            contează doar dacă alegi un pachet plătit. Nu le bifezi aici.
          </p>
        </div>

        <div className="border-t border-border bg-white px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          {error && (
            <p className="mb-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={accepta}
            disabled={ramase > 0 || status === 'saving'}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
          >
            {textButon}
          </button>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-gray-500">
            <span>
              Întrebări? <a href="tel:+40751547174" className="underline hover:no-underline">0751 547 174</a>
            </span>
            <button type="button" onClick={iesi} className="underline hover:text-gray-800">
              Ieși din cont
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
