'use client';

// Watt AI pentru firmele logate (19 nov 2026): o bulă jos în stânga, pe tot
// site-ul public, doar cu sesiunea portalului. Gratuit până pe 10 decembrie, 5
// mesaje pe zi. Când Radu trimite un anunț din /admin/watt-firme, bula are un
// punct și un balon scurt cu începutul lui; firma îl poate închide și lucra
// mai departe. Dreapta e a caruselului de parteneri, iar popup-ul „Cere o
// ofertă” (pentru clienți) nu apare la firmele logate.

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';
import { PORTAL_HINT_COOKIE } from '@/lib/portal-auth';
import { ACORDURI_ACCEPTATE_EVENT } from '@/lib/acorduri-shared';
import { SALUT_WATT_FIRME, WATT_FIRME_MAX_CARACTERE, type WattFirmeStare } from '@/lib/watt-firme-shared';

// Trei, nu mai multe (Radu, 19 nov 2026): restul le poate scrie firma.
const INTREBARI = [
  'Care sunt cele mai potrivite cereri pentru mine acum?',
  'Ce au confirmat clienții la cererile mele?',
  'Cum funcționează platforma pentru firme?',
];

const cheieTeaser = (id: number) => `watt-firme-anunt-inchis-${id}`;
/** Salutul apare până când firma deschide bula sau îl închide, o singură dată. */
const CHEIE_SALUT = 'watt-firme-salut-inchis';

const citeste = (k: string) => {
  try {
    return localStorage.getItem(k) === '1';
  } catch {
    return false;
  }
};
const scrie = (k: string) => {
  try {
    localStorage.setItem(k, '1');
  } catch {}
};
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
  const pathname = usePathname();
  // Crește la bifarea acordurilor din /portal (pagina nu se reîncarcă acolo).
  const [acorduriBifate, setAcorduriBifate] = useState(0);
  // Balonul de deasupra bulei: anunțul lui Radu, iar fără anunț salutul lui Watt.
  const [balon, setBalon] = useState<null | 'anunt' | 'salut'>(null);
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
    const laBifa = () => setAcorduriBifate((n) => n + 1);
    window.addEventListener(ACORDURI_ACCEPTATE_EVENT, laBifa);
    return () => window.removeEventListener(ACORDURI_ACCEPTATE_EVENT, laBifa);
  }, []);

  // Bula stă în layout, deci nu se remontează la login (navigare fără reîncărcare):
  // reverificăm la fiecare schimbare de pagină și după bifarea acordurilor, până apare.
  const pornitRef = useRef(false);
  useEffect(() => {
    if (pornitRef.current) return;
    // Doar firmele logate: fără semnul din cookie nu cerem nimic de la server.
    if (!document.cookie.split('; ').some((c) => c.startsWith(`${PORTAL_HINT_COOKIE}=`))) return;
    let anulat = false;
    fetch('/api/watt-firme', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: WattFirmeStare | null) => {
        if (anulat || !s?.pornit) return;
        pornitRef.current = true;
        setStare(s);
        eveniment('afisat');
        if (s.anunt && !citeste(cheieTeaser(s.anunt.id))) {
          setBalon('anunt');
          eveniment('teaser_afisat', String(s.anunt.id));
        } else if (!s.anunt && !citeste(CHEIE_SALUT)) {
          // O clipă după încărcare, ca să nu sară în ochi odată cu pagina.
          setTimeout(() => {
            if (anulat) return;
            setBalon('salut');
            eveniment('teaser_afisat', 'salut');
          }, 1500);
        }
      })
      .catch(() => {});
    return () => {
      anulat = true;
    };
  }, [pathname, acorduriBifate]);

  useEffect(() => {
    if (deschis) setTimeout(() => listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight }), 0);
  }, [deschis, stare?.mesaje?.length, trimite]);

  if (!stare?.pornit) return null;

  const anunt = stare.anunt;
  const mesaje = stare.mesaje || [];
  const ramase = stare.ramase ?? 0;
  const aScris = mesaje.some((m) => m.rol === 'firma');

  function inchideBalon() {
    if (balon === 'anunt' && anunt) {
      eveniment('teaser_inchis', String(anunt.id));
      scrie(cheieTeaser(anunt.id));
    } else if (balon === 'salut') {
      eveniment('teaser_inchis', 'salut');
      scrie(CHEIE_SALUT);
    }
    setBalon(null);
  }

  async function deschide(din: 'bula' | 'balon' = 'bula') {
    setDeschis(true);
    if (din === 'balon') eveniment('teaser_deschis', balon === 'anunt' && anunt ? String(anunt.id) : 'salut');
    setBalon(null);
    // Odată deschisă bula, salutul și-a făcut treaba.
    scrie(CHEIE_SALUT);
    trackEvent('watt_firme_deschis', { anunt: anunt ? 'da' : 'nu' });
    eveniment('deschis', `${din}${anunt ? ':anunt' : ''}`);
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
          className="fixed bottom-24 left-4 z-50 flex h-[min(540px,calc(100vh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-[fadeInUp_200ms_ease-out]"
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

      {/* Balonul de deasupra bulei: anunțul (începutul lui) sau salutul. Se închide cu ×, bula rămâne. */}
      {balon && !deschis && (balon === 'salut' || anunt) && (
        <div className="fixed bottom-24 left-4 z-40 w-[min(310px,calc(100vw-2rem))] rounded-2xl rounded-bl-sm border border-amber-200 bg-white p-3.5 pr-9 text-sm text-gray-800 shadow-xl animate-[fadeInUp_300ms_ease-out]">
          <button type="button" onClick={() => void deschide('balon')} className="flex items-start gap-2.5 text-left">
            <Avatar />
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                {balon === 'anunt' ? 'Watt AI · anunț' : 'Watt AI'}
              </span>
              <span className={`leading-snug ${balon === 'anunt' ? 'line-clamp-4' : ''}`}>
                {balon === 'anunt' && anunt ? anunt.text : SALUT_WATT_FIRME}
              </span>
              <span className="mt-1.5 block text-xs font-semibold text-primary-dark">Întrebați-mă →</span>
            </span>
          </button>
          <button
            type="button"
            onClick={inchideBalon}
            aria-label="Închide mesajul"
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
        className="fixed bottom-4 left-4 z-40 flex h-14 items-center gap-2 rounded-full bg-primary pl-4 pr-5 text-base font-semibold text-white shadow-xl ring-4 ring-white transition hover:bg-primary-dark"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20" aria-hidden>
          <Fulger className="h-5 w-5" />
        </span>
        Watt AI
        {anunt && !deschis && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-white" aria-hidden />
        )}
      </button>
    </>
  );
}
