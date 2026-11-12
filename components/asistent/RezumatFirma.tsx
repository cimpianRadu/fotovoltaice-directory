'use client';

// Sesiunea Watt AI pe cardul unei cereri, pentru firma logată (pilot 12 nov
// 2026), pe /cereri și în portal, pe marginea din dreapta a cardului (Radu,
// 12 nov). Pe card scrie „Precalificare” (Radu, 12 nov: nu „Sesiune AI”).
//
// - Pe cererile pe care firma nu le-a preluat: doar eticheta „Precalificare”, cu lacăt,
//   fără conținut și fără click, ca la poze („le vezi după ce preiei cererea”).
//   Serverul nici nu trimite detaliile (vezi /api/cereri/rezumate).
// - Pe cererile preluate: aceeași pastilă, cu numărul de detalii și un punct
//   până la prima deschidere (la hover, primul detaliu confirmat); la click,
//   fereastra cu rezumatul și notarea. Deschiderea se numără ca vizualizare.
//
// Toate cardurile de pe pagină împart o singură cerere la /api/cereri/rezumate;
// fără sesiune sau cu rezumatul oprit din portal, nu apare nimic.

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { trackEvent } from '@/lib/analytics';
import type { RezumatCerere } from '@/lib/asistent-shared';

type Preluata = RezumatCerere & { preluata: true; nota: 'util' | 'nu_prea' | null };
type Nepreluata = { preluata: false; detalii: number; atentionari: number };
type Sesiune = Preluata | Nepreluata;

let cerere: Promise<Record<string, Sesiune>> | null = null;

function incarcaSesiuni(): Promise<Record<string, Sesiune>> {
  if (!cerere) {
    cerere = fetch('/api/cereri/rezumate', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { rezumate: {} }))
      .then((j) => (j?.rezumate || {}) as Record<string, Sesiune>)
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

function Fulger({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M13.5 2 4.8 13.4c-.3.4 0 .9.5.9H11l-1.3 7.2c-.1.6.6.9 1 .4l8.7-11.4c.3-.4 0-.9-.5-.9H13l1.4-7.2c.1-.6-.6-.9-.9-.4Z" />
    </svg>
  );
}

function Deget({ jos = false }: { jos?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${jos ? 'rotate-180' : ''}`}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 11v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3a4 4 0 0 0 4-4V6a2 2 0 0 1 4 0v5h3a2 2 0 0 1 2 2l-1 5a2 3 0 0 1-2 2h-7a3 3 0 0 1-3-3" />
    </svg>
  );
}

/** O singură formă pe card, înainte și după preluare: o pastilă discretă, pe un rând. */
const PASTILA =
  'inline-flex min-w-0 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900';

const cheieDeschis = (leadId: string) => `watt-rezumat-deschis-${leadId}`;
const detaliiText = (n: number) => `${n} ${n === 1 ? 'detaliu' : 'detalii'}`;

export default function RezumatFirma({
  leadId,
  sursa,
  demo,
  className = '',
}: {
  leadId: string;
  sursa: 'cereri' | 'portal';
  /** Sesiune dată direct (previzualizare locală): fără cereri la server și fără note salvate. */
  demo?: Sesiune;
  /** Clase pentru eticheta din rândul cardului (marginea, alinierea). */
  className?: string;
}) {
  const [sesiune, setSesiune] = useState<Sesiune | null>(demo ?? null);
  const [deschis, setDeschis] = useState(false);
  // Citit o dată, la montare. Pe server pastila nu se afișează (sesiunea vine
  // din client), deci valoarea de acolo nu ajunge niciodată în HTML.
  const [vazut, setVazut] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return localStorage.getItem(cheieDeschis(leadId)) === '1';
    } catch {
      return false;
    }
  });
  const [nota, setNota] = useState<Preluata['nota']>(null);
  const [motiv, setMotiv] = useState('');
  const [faza, setFaza] = useState<'intrebare' | 'motiv' | 'multumim'>('intrebare');

  useEffect(() => {
    let anulat = false;
    if (demo) return;
    incarcaSesiuni().then((all) => {
      if (anulat) return;
      const s = all[leadId] || null;
      setSesiune(s);
      if (s?.preluata && s.nota) {
        setNota(s.nota);
        setFaza('multumim');
      }
    });
    return () => {
      anulat = true;
    };
  }, [leadId, demo]);

  if (!sesiune) return null;

  // Înainte de preluare: semnul că există o sesiune, nimic din ea.
  if (!sesiune.preluata) {
    const explicatie = `Precalificare: clientul a confirmat ${detaliiText(
      sesiune.detalii,
    )} cu Watt AI, asistentul nostru, după ce a trimis cererea. Se deschide după ce preiei cererea.`;
    return (
      <span
        title={explicatie}
        aria-label={explicatie}
        className={`inline-flex min-w-0 shrink-0 cursor-default items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 ${className}`}
      >
        {/* Lacăt, gri, fără hover: se vede că există, dar nu se deschide până la preluare. */}
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 shrink-0" aria-hidden fill="currentColor">
          <path d="M10 2a4 4 0 0 0-4 4v2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1V6a4 4 0 0 0-4-4Zm2 6V6a2 2 0 1 0-4 0v2h4Z" />
        </svg>
        Precalificare
      </span>
    );
  }

  const rezumat = sesiune;
  const detalii = rezumat.confirmate.length + rezumat.intrebari.length;
  const atentie = rezumat.semnale.filter((s) => s.tip === 'atentie');
  const info = rezumat.semnale.filter((s) => s.tip === 'info');
  const scurt = rezumat.confirmate[0]?.valoare || rezumat.rezumat;
  const eticheta = `Precalificare cu Watt AI: ${detaliiText(detalii)}${
    atentie.length ? `, ${atentie.length} ${atentie.length === 1 ? 'atenționare' : 'atenționări'}` : ''
  }. ${scurt}`;

  function deschide() {
    setDeschis(true);
    if (!vazut) {
      setVazut(true);
      try {
        localStorage.setItem(cheieDeschis(leadId), '1');
      } catch {
        /* nimic */
      }
    }
    if (demo) return;
    trackEvent('rezumat_ai_deschis', { sursa });
    void post({ leadId, vazut: true, sursa });
  }

  function noteaza(n: 'util' | 'nu_prea', m = '') {
    setNota(n);
    if (demo) return;
    trackEvent('rezumat_ai_nota', { nota: n, sursa, cu_motiv: Boolean(m) });
    void post({ leadId, nota: n, motiv: m });
  }

  const buton =
    'inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors';

  return (
    <>
      {/* Aceeași pastilă ca înainte de preluare, doar că se apasă și spune câte
          detalii are. Punctul albastru: încă nedeschisă. Restul, în fereastră. */}
      <button
        type="button"
        onClick={deschide}
        aria-label={eticheta}
        title={eticheta}
        data-rezumat-ai
        className={`${PASTILA} transition-colors hover:border-amber-300 hover:bg-amber-100 ${className}`}
      >
        {!vazut && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" aria-hidden />}
        <Fulger className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        <span className="truncate">
          Precalificare <span className="font-normal text-amber-800">· {detaliiText(detalii)}</span>
        </span>
      </button>

      <Modal open={deschis} onClose={() => setDeschis(false)} title="Precalificare cu Watt AI" width="max-w-md">
        <div className="text-sm">
          <p className="text-gray-500">Ce a confirmat clientul cu Watt AI, asistentul nostru, după ce a trimis cererea.</p>

          {rezumat.rezumat && <p className="mt-3 leading-relaxed text-gray-900">{rezumat.rezumat}</p>}

          {rezumat.confirmate.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Ce a confirmat clientul">
              {rezumat.confirmate.map((c) => (
                <li key={c.eticheta} className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-800">
                  <span className="text-gray-500">{c.eticheta}:</span> {c.valoare}
                </li>
              ))}
            </ul>
          )}

          {atentie.map((s) => (
            <p key={s.text} className="mt-3 flex gap-2 rounded-lg bg-amber-50 px-3 py-2 leading-snug text-amber-900">
              <span aria-hidden>⚠</span>
              <span>{s.text}</span>
            </p>
          ))}
          {info.map((s) => (
            <p key={s.text} className="mt-2 leading-snug text-gray-600">
              {s.text}
            </p>
          ))}

          {rezumat.intrebari.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-500">Clientul vrea să afle</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-gray-900">
                {rezumat.intrebari.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 border-t border-gray-100 pt-4">
            {faza === 'multumim' ? (
              <p className="text-gray-700">
                {nota === 'util'
                  ? 'Mulțumim! Ne bucurăm că v-a ajutat.'
                  : 'Mulțumim! Citim fiecare răspuns și îl folosim ca să facem precalificarea mai bună.'}
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
                <label className="block font-medium text-gray-900" htmlFor={`motiv-${leadId}`}>
                  Ce n-a mers? Ce lipsea, ce era greșit sau ce v-ar fi ajutat?
                </label>
                <textarea
                  id={`motiv-${leadId}`}
                  value={motiv}
                  onChange={(e) => setMotiv(e.target.value.slice(0, 500))}
                  rows={3}
                  autoFocus
                  placeholder="De exemplu: lipsea puterea invertorului, sau clientul a spus altceva la telefon"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-[16px] sm:text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <button type="submit" className={`${buton} bg-primary text-white hover:bg-primary-dark`}>
                    Trimite
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      noteaza('nu_prea');
                      setFaza('multumim');
                    }}
                    className={`${buton} border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-50`}
                  >
                    Fără motiv
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="mb-2 font-medium text-gray-900">V-a ajutat precalificarea?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      noteaza('util');
                      setFaza('multumim');
                    }}
                    className={`${buton} bg-primary text-white hover:bg-primary-dark`}
                  >
                    <Deget /> Da, util
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNota('nu_prea');
                      setFaza('motiv');
                    }}
                    className={`${buton} border border-gray-300 bg-white font-medium text-gray-700 hover:bg-gray-50`}
                  >
                    <Deget jos /> Nu prea
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
