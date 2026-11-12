'use client';

// Rezumatul Watt AI pe cardul unei cereri, pentru firma logată (pilot 12 nov
// 2026). Apare pe /cereri și în portal. Toate cardurile de pe pagină împart o
// singură cerere la /api/cereri/rezumate; fără sesiune sau cu rezumatul oprit
// din portal, nu apare nimic. Când rezumatul stă în ecran, se numără o
// vizualizare, ca să știm câte firme îl văd, nu doar câte îl notează.

import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import type { RezumatCerere } from '@/lib/asistent-shared';

type Rezumat = RezumatCerere & { nota: 'util' | 'nu_prea' | null };

let cerere: Promise<Record<string, Rezumat>> | null = null;

function incarcaRezumate(): Promise<Record<string, Rezumat>> {
  if (!cerere) {
    cerere = fetch('/api/cereri/rezumate', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { rezumate: {} }))
      .then((j) => (j?.rezumate || {}) as Record<string, Rezumat>)
      .catch(() => ({}));
  }
  return cerere;
}

function post(body: Record<string, unknown>) {
  return fetch('/api/cereri/rezumate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null);
}

export default function RezumatFirma({ leadId, sursa }: { leadId: string; sursa: 'cereri' | 'portal' }) {
  const [rezumat, setRezumat] = useState<Rezumat | null>(null);
  const [nota, setNota] = useState<Rezumat['nota']>(null);
  const [motiv, setMotiv] = useState('');
  const [faza, setFaza] = useState<'intrebare' | 'motiv' | 'multumim'>('intrebare');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anulat = false;
    incarcaRezumate().then((all) => {
      if (anulat) return;
      const r = all[leadId] || null;
      setRezumat(r);
      setNota(r?.nota ?? null);
      if (r?.nota) setFaza('multumim');
    });
    return () => {
      anulat = true;
    };
  }, [leadId]);

  // O vizualizare pe montare, când cel puțin jumătate din rezumat e în ecran.
  useEffect(() => {
    const el = ref.current;
    if (!rezumat || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void post({ leadId, vazut: true, sursa });
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rezumat, leadId, sursa]);

  if (!rezumat) return null;

  function noteaza(n: 'util' | 'nu_prea', m = '') {
    setNota(n);
    trackEvent('rezumat_ai_nota', { nota: n, sursa, cu_motiv: Boolean(m) });
    void post({ leadId, nota: n, motiv: m });
  }

  return (
    <div ref={ref} className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm" data-rezumat-ai>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-sky-800">
        <span aria-hidden className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white">
          ⚡
        </span>
        Watt AI · ce a lămurit clientul după cerere
      </p>
      {rezumat.rezumat && <p className="mt-1.5 leading-relaxed text-gray-800">{rezumat.rezumat}</p>}

      {rezumat.confirmate.length > 0 && (
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
          {rezumat.confirmate.map((c) => (
            <div key={c.eticheta} className="flex gap-1.5">
              <dt className="text-gray-500">{c.eticheta}:</dt>
              <dd className="font-medium text-gray-900">{c.valoare}</dd>
            </div>
          ))}
        </dl>
      )}

      {rezumat.semnale.length > 0 && (
        <ul className="mt-2 space-y-1">
          {rezumat.semnale.map((s) => (
            <li key={s.text} className={s.tip === 'atentie' ? 'text-amber-800' : 'text-gray-600'}>
              {s.tip === 'atentie' ? '⚠ ' : '· '}
              {s.text}
            </li>
          ))}
        </ul>
      )}

      {rezumat.intrebari.length > 0 && (
        <>
          <p className="mt-2 text-xs font-medium text-sky-900">Clientul vrea să afle</p>
          <ul className="mt-0.5 list-disc pl-5 text-gray-800">
            {rezumat.intrebari.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-3 border-t border-sky-200 pt-2">
        {faza === 'multumim' ? (
          <p className="text-xs text-sky-900">
            {nota === 'util'
              ? 'Ați notat rezumatul util. Mulțumim!'
              : 'Mulțumim! Citim fiecare răspuns și îl folosim ca să facem rezumatul mai bun.'}
          </p>
        ) : faza === 'motiv' ? (
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              noteaza('nu_prea', motiv.trim());
              setFaza('multumim');
            }}
          >
            <label className="block text-xs font-medium text-sky-900" htmlFor={`motiv-${leadId}`}>
              Ce n-a mers? Ce lipsea, ce era greșit sau ce v-ar fi ajutat?
            </label>
            <textarea
              id={`motiv-${leadId}`}
              value={motiv}
              onChange={(e) => setMotiv(e.target.value.slice(0, 500))}
              rows={2}
              placeholder="De exemplu: lipsea puterea invertorului, sau clientul spusese altceva la telefon"
              className="w-full rounded-md border border-sky-300 bg-white px-2 py-1.5 text-xs"
            />
            <div className="flex gap-2">
              <button type="submit" className="rounded-md bg-sky-700 px-3 py-1 text-xs font-semibold text-white">
                Trimite
              </button>
              <button
                type="button"
                onClick={() => {
                  noteaza('nu_prea');
                  setFaza('multumim');
                }}
                className="rounded-md px-2 py-1 text-xs text-sky-900 underline"
              >
                Trimite fără motiv
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-sky-900">V-a ajutat rezumatul?</span>
            <button
              type="button"
              onClick={() => {
                noteaza('util');
                setFaza('multumim');
              }}
              className="rounded-md border border-sky-300 bg-white px-2.5 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100"
            >
              👍 Util
            </button>
            <button
              type="button"
              onClick={() => setFaza('motiv')}
              className="rounded-md border border-sky-300 bg-white px-2.5 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100"
            >
              👎 Nu prea
            </button>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-gray-500">
        Semnalele cu ⚠ le calculăm din tabelul nostru de dimensionare și din ghidul programului. Rezumatul se poate
        opri din portal.
      </p>
    </div>
  );
}
