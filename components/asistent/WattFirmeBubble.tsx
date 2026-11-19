'use client';

// Watt AI pentru firmele logate (19 nov 2026): o bulă jos în stânga, pe tot
// site-ul public, doar cu sesiunea portalului. Gratuit până pe 10 decembrie, 5
// mesaje pe zi. Când Radu trimite un anunț din /admin/watt-firme, bula are un
// punct și un balon scurt cu începutul lui; firma îl poate închide și lucra
// mai departe. Dreapta e a caruselului de parteneri, iar popup-ul „Cere o
// ofertă” (pentru clienți) nu apare la firmele logate.

import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { PORTAL_HINT_COOKIE } from '@/lib/portal-auth';
import { WATT_FIRME_MAX_CARACTERE, type WattFirmeStare } from '@/lib/watt-firme-shared';

const INTREBARI = [
  'Care sunt cele mai potrivite cereri pentru mine acum?',
  'Ce întrebări au clienții mei pentru mine?',
  'Ce au confirmat clienții la cererile mele?',
  'Ce cereri noi au precalificare în județele mele?',
  'Cum se calculează punctajul Casa Verde Baterii?',
];

const cheieTeaser = (id: number) => `watt-firme-anunt-inchis-${id}`;
const CHEIE_NOTE = 'watt-firme-note';

/** O măsurătoare pentru /admin/watt-firme. Pierderea uneia nu strică nimic. */
function eveniment(tip: string, detalii = '') {
  fetch('/api/watt-firme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eveniment: tip, detalii }),
    keepalive: true,
  }).catch(() => {});
}

function Fulger({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M13.5 2 4.8 13.4c-.3.4 0 .9.5.9H11l-1.3 7.2c-.1.6.6.9 1 .4l8.7-11.4c.3-.4 0-.9-.5-.9H13l1.4-7.2c.1-.6-.6-.9-.9-.4Z" />
    </svg>
  );
}

function Avatar() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white" aria-hidden>
      <Fulger className="h-4 w-4" />
    </span>
  );
}

/** Cum arată un link în replică: „vezi cererea” în loc de un id lung. */
function eticheta(url: string): string {
  if (/[?&]cerere=/.test(url)) return 'vezi cererea';
  const cale = url.replace(/^https?:\/\/(www\.)?instalatori-fotovoltaice\.ro/, '');
  if (cale.startsWith('/portal')) return 'portal';
  return cale || url;
}

/** Linkurile din replici devin clicabile; restul rămâne text. */
function TextCuLinkuri({ text }: { text: string }) {
  // Linkul spre o cerere, apăsat din Watt: e rezultatul pe care îl măsurăm.
  const parti = text.split(/((?:https?:\/\/[^\s)]+)|(?:\/(?:cereri|portal)[^\s),]*))/g);
  return (
    <>
      {parti.map((p, i) =>
        p && (/^https?:\/\//.test(p) || /^\/(cereri|portal)/.test(p)) ? (
          <a
            key={i}
            href={p}
            onClick={() => eveniment('link', p.replace(/^https?:\/\/(www\.)?instalatori-fotovoltaice\.ro/, ''))}
            className="break-all font-medium text-primary-dark underline hover:no-underline"
          >
            {eticheta(p)}
          </a>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export default function WattFirmeBubble() {
  const [stare, setStare] = useState<WattFirmeStare | null>(null);
  const [deschis, setDeschis] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [text, setText] = useState('');
  const [trimite, setTrimite] = useState(false);
  const [eroare, setEroare] = useState('');
  // Notele 👍/👎 date deja, pe momentul replicii: nu se mai arată butoanele.
  const [note, setNote] = useState<Record<string, 'util' | 'nu_prea'>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(CHEIE_NOTE) || '{}');
    } catch {
      return {};
    }
  });
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Doar firmele logate: fără semnul din cookie nu cerem nimic de la server.
    if (!document.cookie.split('; ').some((c) => c.startsWith(`${PORTAL_HINT_COOKIE}=`))) return;
    let anulat = false;
    fetch('/api/watt-firme', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: WattFirmeStare | null) => {
        if (anulat || !s?.pornit) return;
        setStare(s);
        eveniment('afisat');
        if (s.anunt) {
          let inchis = false;
          try {
            inchis = localStorage.getItem(cheieTeaser(s.anunt.id)) === '1';
          } catch {}
          if (!inchis) {
            setTeaser(true);
            eveniment('teaser_afisat', String(s.anunt.id));
          }
        }
      })
      .catch(() => {});
    return () => {
      anulat = true;
    };
  }, []);

  useEffect(() => {
    if (deschis) setTimeout(() => listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight }), 0);
  }, [deschis, stare?.mesaje?.length, trimite]);

  if (!stare?.pornit) return null;

  const anunt = stare.anunt;
  const mesaje = stare.mesaje || [];
  const ramase = stare.ramase ?? 0;
  const aScris = mesaje.some((m) => m.rol === 'firma');

  function inchideTeaser() {
    setTeaser(false);
    if (anunt) {
      eveniment('teaser_inchis', String(anunt.id));
      try {
        localStorage.setItem(cheieTeaser(anunt.id), '1');
      } catch {}
    }
  }

  async function deschide(din: 'bula' | 'balon' = 'bula') {
    setDeschis(true);
    setTeaser(false);
    trackEvent('watt_firme_deschis', { anunt: anunt ? 'da' : 'nu' });
    eveniment('deschis', `${din}${anunt ? ':anunt' : ''}`);
    if (din === 'balon' && anunt) eveniment('teaser_deschis', String(anunt.id));
    if (!anunt) return;
    // Anunțul intră în conversație abia când firma deschide bula.
    const r = await fetch('/api/watt-firme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vazut: anunt.id }),
    }).catch(() => null);
    const s = r?.ok ? ((await r.json()) as WattFirmeStare) : null;
    if (s?.pornit) setStare(s);
  }

  function noteaza(la: string, nota: 'util' | 'nu_prea') {
    const next = { ...note, [la]: nota };
    setNote(next);
    try {
      localStorage.setItem(CHEIE_NOTE, JSON.stringify(next));
    } catch {}
    eveniment('nota', `${nota}:${la}`);
  }

  async function trimiteMesaj(mesaj: string, sursa: 'rapid' | 'scris' = 'scris') {
    const m = mesaj.trim();
    if (!m || trimite || ramase <= 0) return;
    setEroare('');
    setTrimite(true);
    setText('');
    // Mesajul apare imediat; răspunsul îl înlocuiește cu starea de pe server.
    setStare((s) => (s ? { ...s, mesaje: [...(s.mesaje || []), { rol: 'firma', text: m, la: new Date().toISOString() }] } : s));
    trackEvent('watt_firme_mesaj', { ramase: ramase - 1 });
    try {
      const r = await fetch('/api/watt-firme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mesaj: m, sursa }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setEroare(typeof j.error === 'string' ? j.error : 'Watt nu răspunde acum.');
        setStare((s) => (s ? { ...s, mesaje: (s.mesaje || []).slice(0, -1) } : s));
        setText(m);
      } else {
        setStare(j as WattFirmeStare);
      }
    } catch {
      setEroare('Nu s-a putut trimite. Verificați conexiunea.');
      setStare((s) => (s ? { ...s, mesaje: (s.mesaje || []).slice(0, -1) } : s));
      setText(m);
    } finally {
      setTrimite(false);
    }
  }

  return (
    <>
      {deschis && (
        <div
          role="dialog"
          aria-label="Watt AI pentru firme"
          className="fixed bottom-20 left-4 z-50 flex h-[min(520px,calc(100vh-7rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-[fadeInUp_200ms_ease-out]"
        >
          <div className="flex items-center gap-2.5 border-b border-gray-100 px-4 py-3">
            <Avatar />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">Watt AI pentru firme</p>
              <p className="text-[11px] text-gray-500">
                Gratuit până pe 10 decembrie · {ramase} {ramase === 1 ? 'mesaj rămas' : 'mesaje rămase'} azi
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDeschis(false)}
              aria-label="Închide"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div ref={listaRef} className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4" aria-live="polite">
            {mesaje.map((m, i) =>
              m.rol === 'firma' ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-white">
                    {m.text}
                  </p>
                </div>
              ) : (
                <div key={i} className="flex items-end gap-2">
                  <Avatar />
                  <div className="max-w-[85%]">
                    {m.anunt && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Anunț</p>
                    )}
                    <p
                      className={`whitespace-pre-line rounded-2xl rounded-bl-sm border px-3.5 py-2 text-sm leading-relaxed text-gray-800 ${
                        m.anunt ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <TextCuLinkuri text={m.text} />
                    </p>
                    {/* 👍/👎 doar pe răspunsurile la o întrebare a firmei, nu pe salut sau anunț. */}
                    {!m.anunt && mesaje[i - 1]?.rol === 'firma' && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                        {note[m.la] ? (
                          <span>{note[m.la] === 'util' ? 'Mulțumim! 👍' : 'Am notat. 👎'}</span>
                        ) : (
                          <>
                            <span>Util?</span>
                            <button
                              type="button"
                              onClick={() => noteaza(m.la, 'util')}
                              aria-label="Răspuns util"
                              className="rounded-full px-1.5 py-0.5 hover:bg-gray-100"
                            >
                              👍
                            </button>
                            <button
                              type="button"
                              onClick={() => noteaza(m.la, 'nu_prea')}
                              aria-label="Răspuns nu prea util"
                              className="rounded-full px-1.5 py-0.5 hover:bg-gray-100"
                            >
                              👎
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            {trimite && (
              <div className="flex items-end gap-2">
                <Avatar />
                <p className="flex gap-1 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3.5 py-3" aria-label="Watt AI scrie">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                </p>
              </div>
            )}
          </div>

          {eroare && <p className="bg-red-50 px-4 py-2 text-sm text-red-700">{eroare}</p>}

          {!aScris && !trimite && ramase > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-gray-100 px-4 pt-3">
              {INTREBARI.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void trimiteMesaj(q, 'rapid')}
                  className="rounded-full border border-primary/40 bg-white px-3 py-1.5 text-left text-xs text-secondary-dark hover:bg-primary/10"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {ramase > 0 ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void trimiteMesaj(text);
              }}
              className="flex items-end gap-2 px-4 py-3"
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, WATT_FIRME_MAX_CARACTERE))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void trimiteMesaj(text);
                  }
                }}
                rows={1}
                placeholder="Scrieți o întrebare..."
                aria-label="Mesaj pentru Watt AI"
                className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-[16px] sm:text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={trimite || !text.trim()}
                className="h-10 shrink-0 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                Trimite
              </button>
            </form>
          ) : (
            <p className="border-t border-gray-100 px-4 py-3 text-center text-xs text-gray-500">
              Ați folosit cele 5 mesaje de azi. Mâine puteți scrie din nou.
            </p>
          )}
        </div>
      )}

      {/* Balonul cu începutul anunțului: se închide cu ×, iar bula rămâne. */}
      {teaser && anunt && !deschis && (
        <div className="fixed bottom-20 left-4 z-40 w-[min(300px,calc(100vw-2rem))] rounded-2xl rounded-bl-sm border border-amber-200 bg-white p-3 pr-8 text-sm text-gray-800 shadow-lg animate-[fadeInUp_300ms_ease-out]">
          <button type="button" onClick={() => void deschide('balon')} className="text-left">
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-amber-700">Watt AI</span>
            <span className="line-clamp-3">{anunt.text}</span>
          </button>
          <button
            type="button"
            onClick={inchideTeaser}
            aria-label="Închide anunțul"
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => (deschis ? setDeschis(false) : void deschide())}
        aria-label={deschis ? 'Închide Watt AI' : 'Deschide Watt AI pentru firme'}
        title="Watt AI pentru firme"
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-white transition hover:bg-primary-dark"
      >
        <Fulger className="h-6 w-6" />
        {anunt && !deschis && (
          <span className="absolute right-0 top-0 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" aria-hidden />
        )}
      </button>
    </>
  );
}
