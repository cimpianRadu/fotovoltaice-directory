'use client';

// Watt AI, asistentul de după cerere (pilot 12 nov 2026, cererile „doar
// baterie” și „extindere”). O bulă în colțul din dreapta-jos, pe ecranul de
// confirmare și în contul clientului, cu o propoziție lângă ea; chatul se
// deschide la click. Pe telefon ocupă tot ecranul, pe desktop e o fereastră.
// Opțional: cererea e deja trimisă, Watt doar o completează. Omul vede tot
// timpul ce pleacă la firme.

import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { ASISTENT_MAX_CARACTERE, type RezumatCerere } from '@/lib/asistent-shared';

interface Mesaj {
  rol: 'client' | 'asistent';
  text: string;
  variante?: string[];
}

interface Stare {
  eligibil: boolean;
  mesaje?: Mesaj[];
  previzualizare?: RezumatCerere | null;
  incheiata?: boolean;
  notaClient?: 'util' | 'nu_prea' | null;
  ramase?: number;
}

function Fulger({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M13.5 2 4.8 13.4c-.3.4 0 .9.5.9H11l-1.3 7.2c-.1.6.6.9 1 .4l8.7-11.4c.3-.4 0-.9-.5-.9H13l1.4-7.2c.1-.6-.6-.9-.9-.4Z" />
    </svg>
  );
}

function Avatar({ mic = false }: { mic?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary text-white ${mic ? 'h-7 w-7' : 'h-9 w-9'}`}
    >
      <Fulger className={mic ? 'h-4 w-4' : 'h-5 w-5'} />
    </span>
  );
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
  const [deschis, setDeschis] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [text, setText] = useState('');
  const [trimite, setTrimite] = useState(false);
  const [eroare, setEroare] = useState('');
  const [arataFirme, setArataFirme] = useState(false);
  // Nota clientului după încheiere: „Nu prea” deschide un câmp opțional.
  const [motivDeschis, setMotivDeschis] = useState(false);
  const [motiv, setMotiv] = useState('');
  const [noteaza, setNoteaza] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bulaRef = useRef<HTMLDivElement>(null);
  const fereastraRef = useRef<HTMLElement>(null);
  const teaserKey = `watt-teaser-${leadId}`;

  useEffect(() => {
    let anulat = false;
    fetch(`/api/asistent?leadId=${encodeURIComponent(leadId)}&token=${encodeURIComponent(token)}`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : { eligibil: false }))
      .then((j: Stare) => {
        if (anulat) return;
        setStare(j);
        if (!j.eligibil) return;
        trackEvent('asistent_deschis', { sursa });
        let ascuns = false;
        try {
          ascuns = localStorage.getItem(teaserKey) === '1';
        } catch {
          /* fără storage: propoziția apare oricum */
        }
        if (!ascuns && !j.incheiata) setTimeout(() => !anulat && setTeaser(true), 1200);
      })
      .catch(() => !anulat && setStare({ eligibil: false }));
    return () => {
      anulat = true;
    };
  }, [leadId, token, sursa, teaserKey]);

  // Colțul din dreapta-jos e al caruselului de parteneri pe desktop; cât Watt
  // e pe pagină, caruselul stă ascuns (vezi globals.css).
  useEffect(() => {
    if (!stare?.eligibil) return;
    document.documentElement.dataset.watt = '1';
    return () => {
      delete document.documentElement.dataset.watt;
    };
  }, [stare?.eligibil]);

  // Pe telefon chatul ocupă tot ecranul: pagina din spate nu se derulează.
  useEffect(() => {
    if (!deschis || window.matchMedia('(min-width: 640px)').matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [deschis]);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: 'smooth' });
  }, [stare?.mesaje?.length, trimite, deschis]);

  // Click în afara bulei: propoziția de lângă ea dispare pentru vizita asta
  // (✕ o ascunde de tot), iar chatul deschis se strânge înapoi în bulă, cu
  // conversația păstrată. Esc face același lucru. Pe telefon chatul ocupă tot
  // ecranul, deci n-are „afară”; acolo se închide din ✕.
  useEffect(() => {
    if (!teaser && !deschis) return;
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (bulaRef.current?.contains(t) || fereastraRef.current?.contains(t)) return;
      setTeaser(false);
      setDeschis(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setTeaser(false);
      setDeschis(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [teaser, deschis]);

  if (!stare?.eligibil) return null;

  const mesaje = stare.mesaje || [];
  const aInceput = mesaje.some((m) => m.rol === 'client');
  const prev = stare.previzualizare;
  const confirmate = prev?.confirmate || [];
  const intrebari = prev?.intrebari || [];
  const areDate = confirmate.length > 0 || intrebari.length > 0;
  const ramase = stare.ramase ?? 0;
  // „Am terminat” apare după ce Watt a scris rezumatul pentru firmă, nu de la
  // primul răspuns: altfel omul încheie după o întrebare și firma primește puțin.
  const gataDeIncheiat = Boolean(prev?.rezumat);
  const ultim = mesaje[mesaje.length - 1];
  const variante = !trimite && ultim?.rol === 'asistent' ? ultim.variante || [] : [];
  const despre = /extinder/i.test(mesaje[0]?.text || '') ? 'extindere' : 'baterie';
  const teaserText = !aInceput
    ? `Am câteva întrebări despre ${despre}, ca oferta firmei să fie potrivită din prima.`
    : 'Continuăm? Mai sunt câteva detalii pentru firmă.';

  function ascundeTeaser() {
    setTeaser(false);
    try {
      localStorage.setItem(teaserKey, '1');
    } catch {
      /* nimic */
    }
  }

  function deschide() {
    setDeschis(true);
    setTeaser(false);
    trackEvent('asistent_bula', { sursa, inceput: aInceput });
    setTimeout(() => inputRef.current?.focus(), 150);
  }

  async function post(body: Record<string, unknown>) {
    setEroare('');
    const r = await fetch('/api/asistent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, token, ...body }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Watt AI nu răspunde acum.');
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
      setEroare(err instanceof Error ? err.message : 'Watt AI nu răspunde acum.');
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

  async function trimiteNota(nota: 'util' | 'nu_prea', cuMotiv = '') {
    if (noteaza) return;
    trackEvent('asistent_nota_client', { sursa, nota });
    setNoteaza(true);
    try {
      await post({ nota, motiv: cuMotiv });
      setMotivDeschis(false);
    } catch (err) {
      setEroare(err instanceof Error ? err.message : 'Nu am putut salva.');
    } finally {
      setNoteaza(false);
    }
  }

  return (
    <>
      {/* Bula și propoziția de lângă ea */}
      {!deschis && (
        <div
          ref={bulaRef}
          className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6"
          data-watt-bula
        >
          {teaser && (
            <div className="relative w-[min(280px,calc(100vw-2rem))] animate-[fadeInUp_300ms_ease-out] rounded-2xl rounded-br-sm border border-gray-200 bg-white p-3.5 pr-8 shadow-xl">
              <button
                type="button"
                onClick={ascundeTeaser}
                aria-label="Ascunde mesajul"
                className="absolute right-2 top-2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden fill="currentColor">
                  <path d="M5.3 4.3a1 1 0 0 0-1.4 1.4L8.6 10l-4.7 4.3a1 1 0 1 0 1.4 1.4L10 11.4l4.3 4.3a1 1 0 0 0 1.4-1.4L11.4 10l4.3-4.3a1 1 0 0 0-1.4-1.4L10 8.6 5.3 4.3Z" />
                </svg>
              </button>
              <button type="button" onClick={deschide} className="block text-left">
                <span className="text-xs font-semibold text-gray-900">Watt AI</span>
                <span className="mt-0.5 block text-sm leading-snug text-gray-700">{teaserText}</span>
                <span className="mt-2 inline-block text-xs font-semibold text-primary-dark">
                  {aInceput ? 'Continuă →' : 'Începe, durează 2 minute →'}
                </span>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={deschide}
            aria-label="Deschide Watt AI, asistentul cererii"
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-amber-100 transition-transform hover:scale-105 hover:bg-primary-dark"
          >
            <Fulger className="h-7 w-7" />
            {!aInceput && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-white">
                1
              </span>
            )}
          </button>
        </div>
      )}

      {/* Fereastra de chat */}
      {deschis && (
        <section
          ref={fereastraRef}
          role="dialog"
          aria-label="Watt AI, asistentul cererii"
          data-asistent={sursa}
          className="fixed inset-0 z-[60] flex flex-col bg-white sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[620px] sm:max-h-[calc(100vh-3rem)] sm:w-[400px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-gray-200 sm:shadow-2xl"
        >
          <header className="flex items-center gap-3 border-b border-gray-100 bg-secondary px-4 py-3 text-white pt-[max(0.75rem,env(safe-area-inset-top))]">
            <Avatar />
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">Watt AI</p>
              <p className="truncate text-xs text-white/70">Asistentul cererii · răspunde din ghidurile noastre</p>
            </div>
            <button
              type="button"
              onClick={() => setDeschis(false)}
              aria-label="Închide chatul"
              className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden fill="currentColor">
                <path d="M5.3 4.3a1 1 0 0 0-1.4 1.4L8.6 10l-4.7 4.3a1 1 0 1 0 1.4 1.4L10 11.4l4.3 4.3a1 1 0 0 0 1.4-1.4L11.4 10l4.3-4.3a1 1 0 0 0-1.4-1.4L10 8.6 5.3 4.3Z" />
              </svg>
            </button>
          </header>

          {/* Ce văd firmele: mereu la vedere, strâns într-un rând */}
          {areDate && (
            <div className="border-b border-emerald-100 bg-emerald-50 px-4 py-2 text-xs text-emerald-900">
              <button
                type="button"
                onClick={() => setArataFirme((v) => !v)}
                className="flex w-full items-center justify-between gap-2 text-left"
                aria-expanded={arataFirme}
              >
                <span className="truncate">
                  <span className="font-semibold">Firmele văd:</span>{' '}
                  {[...confirmate.map((c) => c.eticheta), ...(intrebari.length ? ['întrebările dvs.'] : [])].join(' · ')}
                </span>
                <span className="shrink-0 font-medium">{arataFirme ? 'Ascunde' : 'Vezi'}</span>
              </button>
              {arataFirme && (
                <div className="mt-2 space-y-1">
                  {confirmate.map((c) => (
                    <p key={c.eticheta}>
                      <span className="text-emerald-700">{c.eticheta}:</span> {c.valoare}
                    </p>
                  ))}
                  {intrebari.map((q) => (
                    <p key={q}>
                      <span className="text-emerald-700">Întrebare:</span> {q}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div ref={listaRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4" aria-live="polite">
            {mesaje.map((m, i) =>
              m.rol === 'client' ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-white">
                    {m.text}
                  </p>
                </div>
              ) : (
                <div key={i} className="flex items-end gap-2">
                  <Avatar mic />
                  <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3.5 py-2 text-sm leading-relaxed text-gray-800">
                    {m.text}
                  </p>
                </div>
              ),
            )}
            {trimite && (
              <div className="flex items-end gap-2">
                <Avatar mic />
                <p className="flex gap-1 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3.5 py-3" aria-label="Watt AI scrie">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                </p>
              </div>
            )}
            {stare.incheiata && !trimite && (
              <div className="rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm">
                {stare.notaClient ? (
                  <p className="text-center text-gray-600">Mulțumim pentru părere! ✓</p>
                ) : motivDeschis ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void trimiteNota('nu_prea', motiv);
                    }}
                  >
                    <label htmlFor={`watt-motiv-${sursa}`} className="font-medium text-gray-900">
                      Ce n-a mers? <span className="font-normal text-gray-500">(opțional)</span>
                    </label>
                    <textarea
                      id={`watt-motiv-${sursa}`}
                      value={motiv}
                      onChange={(e) => setMotiv(e.target.value.slice(0, 500))}
                      rows={2}
                      className="mt-2 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-[16px] sm:text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setMotivDeschis(false)}
                        className="rounded-full px-3 py-1.5 text-gray-600 hover:bg-gray-100"
                      >
                        Înapoi
                      </button>
                      <button
                        type="submit"
                        disabled={noteaza}
                        className="rounded-full bg-primary px-4 py-1.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                      >
                        Trimite
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-center font-medium text-gray-900">V-a fost util Watt AI?</p>
                    <div className="mt-2 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => void trimiteNota('util')}
                        disabled={noteaza}
                        className="rounded-full bg-primary px-4 py-1.5 font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
                      >
                        👍 Da, util
                      </button>
                      <button
                        type="button"
                        onClick={() => setMotivDeschis(true)}
                        disabled={noteaza}
                        className="rounded-full border border-gray-300 px-4 py-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        👎 Nu prea
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {eroare && <p className="bg-red-50 px-4 py-2 text-sm text-red-700">{eroare}</p>}

          {/* Răspunsuri rapide */}
          {!aInceput ? (
            <div className="flex flex-wrap gap-2 border-t border-gray-100 px-4 py-3">
              <button
                type="button"
                onClick={() => void trimiteMesaj('Da, să începem.')}
                disabled={trimite}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
              >
                Da, să începem
              </button>
              <button
                type="button"
                onClick={() => {
                  trackEvent('asistent_refuzat', { sursa });
                  ascundeTeaser();
                  setDeschis(false);
                }}
                className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Nu acum
              </button>
            </div>
          ) : (
            (variante.length > 0 || (gataDeIncheiat && !stare.incheiata)) && (
              <div className="flex flex-wrap gap-2 border-t border-gray-100 px-4 pt-3">
                {variante.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => void trimiteMesaj(v)}
                    className="rounded-full border border-primary/40 bg-amber-50 px-3 py-1.5 text-sm text-amber-900 hover:bg-amber-100"
                  >
                    {v}
                  </button>
                ))}
                {gataDeIncheiat && !stare.incheiata && (
                  <button
                    type="button"
                    onClick={() => void gata()}
                    className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    ✓ Am terminat
                  </button>
                )}
              </div>
            )
          )}

          {aInceput &&
            (ramase > 0 ? (
              <form
                className="flex items-end gap-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void trimiteMesaj(text);
                }}
              >
                <label className="sr-only" htmlFor={`watt-${sursa}`}>
                  Răspunsul dumneavoastră
                </label>
                <textarea
                  ref={inputRef}
                  id={`watt-${sursa}`}
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, ASISTENT_MAX_CARACTERE))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void trimiteMesaj(text);
                    }
                  }}
                  rows={1}
                  placeholder="Scrieți un mesaj…"
                  className="max-h-28 min-h-[44px] flex-1 resize-none rounded-2xl border border-gray-300 px-4 py-2.5 text-[16px] sm:text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={trimite || !text.trim()}
                  aria-label="Trimite"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark disabled:opacity-40"
                >
                  <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden fill="currentColor">
                    <path d="M3.1 2.6a.8.8 0 0 0-1 1l1.9 5.6c.1.3.4.5.7.5H11a.3.3 0 0 1 0 .6H4.7c-.3 0-.6.2-.7.5l-1.9 5.6a.8.8 0 0 0 1 1l14.4-6.6a.8.8 0 0 0 0-1.5L3.1 2.6Z" />
                  </svg>
                </button>
              </form>
            ) : (
              <p className="px-4 pb-4 pt-3 text-sm text-gray-600">
                Am ajuns la capătul conversației. Restul îl lămurește firma la telefon.
              </p>
            ))}

          <p className="px-4 pb-3 text-[11px] leading-snug text-gray-400">
            Watt AI e un asistent AI. Poate greși; decizia tehnică și oferta le face instalatorul.
          </p>
        </section>
      )}
    </>
  );
}
