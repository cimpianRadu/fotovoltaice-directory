'use client';

// Rezumatul asistentului pe cardul unei cereri, pentru firma logată (pilot 12
// nov 2026). Apare pe /cereri și în portal. Toate cardurile de pe pagină
// împart o singură cerere la /api/cereri/rezumate; fără sesiune sau cu
// rezumatul oprit din portal, nu apare nimic.

import { useEffect, useState } from 'react';
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

export default function RezumatFirma({ leadId, sursa }: { leadId: string; sursa: 'cereri' | 'portal' }) {
  const [rezumat, setRezumat] = useState<Rezumat | null>(null);
  const [nota, setNota] = useState<Rezumat['nota']>(null);
  const [motiv, setMotiv] = useState('');
  const [cereMotiv, setCereMotiv] = useState(false);
  const [trimis, setTrimis] = useState(false);

  useEffect(() => {
    let anulat = false;
    incarcaRezumate().then((all) => {
      if (anulat) return;
      const r = all[leadId] || null;
      setRezumat(r);
      setNota(r?.nota ?? null);
    });
    return () => {
      anulat = true;
    };
  }, [leadId]);

  if (!rezumat) return null;

  async function noteaza(n: 'util' | 'nu_prea', m = '') {
    setNota(n);
    trackEvent('rezumat_ai_nota', { nota: n, sursa });
    await fetch('/api/cereri/rezumate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, nota: n, motiv: m }),
    }).catch(() => {});
  }

  return (
    <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm" data-rezumat-ai>
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-800">
        Rezumat din discuția clientului cu asistentul AI
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

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sky-200 pt-2">
        {trimis || (nota && !cereMotiv) ? (
          <span className="text-xs text-sky-900">
            {nota === 'util' ? 'Ați notat rezumatul util. Mulțumim!' : 'Mulțumim, ne ajută să-l facem mai bun.'}
          </span>
        ) : cereMotiv ? (
          <form
            className="flex w-full flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void noteaza('nu_prea', motiv.trim());
              setCereMotiv(false);
              setTrimis(true);
            }}
          >
            <input
              value={motiv}
              onChange={(e) => setMotiv(e.target.value.slice(0, 500))}
              placeholder="Ce lipsea sau era greșit? (opțional)"
              className="min-w-0 flex-1 rounded-md border border-sky-300 bg-white px-2 py-1 text-xs"
            />
            <button type="submit" className="rounded-md bg-sky-700 px-3 py-1 text-xs font-semibold text-white">
              Trimite
            </button>
          </form>
        ) : (
          <>
            <span className="text-xs text-sky-900">V-a ajutat rezumatul?</span>
            <button
              type="button"
              onClick={() => {
                void noteaza('util');
                setTrimis(true);
              }}
              className="rounded-md border border-sky-300 bg-white px-2.5 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100"
            >
              Util
            </button>
            <button
              type="button"
              onClick={() => {
                setNota('nu_prea');
                setCereMotiv(true);
              }}
              className="rounded-md border border-sky-300 bg-white px-2.5 py-1 text-xs font-medium text-sky-900 hover:bg-sky-100"
            >
              Nu prea
            </button>
          </>
        )}
      </div>
      <p className="mt-1.5 text-[11px] text-gray-500">
        Semnalele cu ⚠ le calculăm din tabelul nostru de dimensionare și din ghidul programului. Îl puteți opri din
        portal.
      </p>
    </div>
  );
}
