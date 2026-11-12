'use client';

// Asistentul de după cerere, pe ecranul de confirmare și în contul clientului
// (pilot 12 nov 2026, cererile „doar baterie” și „extindere”). Opțional: omul
// a trimis deja cererea, aici doar o completează. Sub conversație vede exact ce
// pleacă la firme, ca să nu fie nicio surpriză.

import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { ASISTENT_MAX_CARACTERE, type RezumatCerere } from '@/lib/asistent-shared';

interface Mesaj {
  rol: 'client' | 'asistent';
  text: string;
}

interface Stare {
  eligibil: boolean;
  mesaje?: Mesaj[];
  previzualizare?: RezumatCerere | null;
  incheiata?: boolean;
  ramase?: number;
}

export default function AsistentCerere({
  leadId,
  token,
  sursa,
}: {
  leadId: string;
  /** Tokenul de detalii (lib/lead-photos), același ca la poze și adresă. */
  token: string;
  sursa: 'confirmare' | 'cont';
}) {
  const [stare, setStare] = useState<Stare | null>(null);
  const [text, setText] = useState('');
  const [trimite, setTrimite] = useState(false);
  const [eroare, setEroare] = useState('');
  const [ascuns, setAscuns] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anulat = false;
    fetch(`/api/asistent?leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : { eligibil: false }))
      .then((j: Stare) => {
        if (anulat) return;
        setStare(j);
        if (j.eligibil) trackEvent('asistent_deschis', { sursa });
      })
      .catch(() => !anulat && setStare({ eligibil: false }));
    return () => {
      anulat = true;
    };
  }, [leadId, token, sursa]);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: 'smooth' });
  }, [stare?.mesaje?.length, trimite]);

  if (!stare?.eligibil || ascuns) return null;

  const mesaje = stare.mesaje || [];
  const aInceput = mesaje.some((m) => m.rol === 'client');
  const prev = stare.previzualizare;
  const ramase = stare.ramase ?? 0;

  async function post(body: Record<string, unknown>) {
    setEroare('');
    const r = await fetch('/api/asistent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, token, ...body }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Asistentul nu răspunde acum.');
    setStare(j as Stare);
  }

  async function trimiteMesaj(mesaj: string) {
    const curat = mesaj.trim();
    if (!curat || trimite) return;
    if (!aInceput) trackEvent('asistent_inceput', { sursa });
    trackEvent('asistent_mesaj', { sursa, nr: mesaje.filter((m) => m.rol === 'client').length + 1 });
    // Mesajul apare imediat; răspunsul înlocuiește tot cu starea de pe server.
    setStare((s) => (s ? { ...s, mesaje: [...(s.mesaje || []), { rol: 'client', text: curat }] } : s));
    setText('');
    setTrimite(true);
    try {
      await post({ mesaj: curat });
    } catch (err) {
      setEroare(err instanceof Error ? err.message : 'Asistentul nu răspunde acum.');
      setStare((s) => (s ? { ...s, mesaje: (s.mesaje || []).slice(0, -1) } : s));
      setText(curat);
    } finally {
      setTrimite(false);
    }
  }

  async function gata() {
    trackEvent('asistent_gata', { sursa, mesaje: mesaje.filter((m) => m.rol === 'client').length });
    try {
      await post({ gata: true });
    } catch (err) {
      setEroare(err instanceof Error ? err.message : 'Nu am putut salva.');
    }
  }

  return (
    <section className="rounded-xl border border-amber-200 bg-white p-5 sm:p-6" data-asistent={sursa}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Mai clarificăm câteva detalii despre baterie?</h3>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
            Opțional, 2-3 minute. Ce confirmați aici intră în cerere, iar firma vă face o ofertă potrivită din
            prima.
          </p>
        </div>
      </div>

      <div
        ref={listaRef}
        className="mt-4 max-h-[26rem] space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-3"
        aria-live="polite"
      >
        {mesaje.map((m, i) => (
          <div key={i} className={m.rol === 'client' ? 'flex justify-end' : 'flex justify-start'}>
            <p
              className={
                m.rol === 'client'
                  ? 'max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-white'
                  : 'max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-800 leading-relaxed'
              }
            >
              {m.text}
            </p>
          </div>
        ))}
        {trimite && (
          <div className="flex justify-start">
            <p className="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-500">
              Asistentul scrie…
            </p>
          </div>
        )}
      </div>

      {eroare && <p className="mt-2 text-sm text-red-700">{eroare}</p>}

      {!aInceput ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void trimiteMesaj('Da, să începem.')}
            disabled={trimite}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            Da, să începem
          </button>
          <button
            type="button"
            onClick={() => {
              trackEvent('asistent_refuzat', { sursa });
              setAscuns(true);
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Nu acum
          </button>
        </div>
      ) : ramase > 0 ? (
        <form
          className="mt-4 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void trimiteMesaj(text);
          }}
        >
          <label className="sr-only" htmlFor={`asistent-${sursa}`}>
            Răspunsul dumneavoastră
          </label>
          <textarea
            id={`asistent-${sursa}`}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, ASISTENT_MAX_CARACTERE))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void trimiteMesaj(text);
              }
            }}
            rows={2}
            placeholder="Scrieți aici…"
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={trimite || !text.trim()}
            className="h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            Trimite
          </button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-gray-600">Am ajuns la capătul conversației. Restul îl lămurește firma la telefon.</p>
      )}

      {prev && (prev.confirmate.length > 0 || prev.intrebari.length > 0) && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Ce văd firmele</p>
          {prev.confirmate.length > 0 && (
            <ul className="mt-1.5 space-y-0.5 text-sm text-emerald-900">
              {prev.confirmate.map((c) => (
                <li key={c.eticheta}>
                  <span className="text-emerald-700">{c.eticheta}:</span> {c.valoare}
                </li>
              ))}
            </ul>
          )}
          {prev.intrebari.length > 0 && (
            <>
              <p className="mt-2 text-xs font-medium text-emerald-800">Întrebări pentru firmă</p>
              <ul className="mt-0.5 list-disc pl-5 text-sm text-emerald-900">
                {prev.intrebari.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </>
          )}
          {stare.incheiata ? (
            <p className="mt-2 text-sm font-medium text-emerald-800">Mulțumim! Răspunsurile au intrat în cerere. ✓</p>
          ) : (
            <button
              type="button"
              onClick={() => void gata()}
              className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Am terminat
            </button>
          )}
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
        Răspunde un asistent AI, din ghidurile noastre despre baterii și Casa Verde Baterii. Poate greși; decizia
        tehnică și oferta le face instalatorul.
      </p>
    </section>
  );
}
