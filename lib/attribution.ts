/**
 * Atribuirea pe CANAL, first-touch.
 *
 * `resolveSource()` din LeadForm răspunde la „ce pagină a produs cererea" citind
 * `?sursa=` din URL-ul curent, la submit. Nu poate răspunde la „ce canal a adus
 * omul pe site", iar motivul e mecanic: pe Instagram și TikTok nu există linkuri
 * clicabile în postare. Omul vine din bio cu `?utm_source=tiktok`, aterizează pe
 * o pagină oarecare, mai citește două ghiduri și abia apoi ajunge la formular.
 * În acel moment parametrul nu mai e în URL, iar o citire la submit ar scrie gol
 * la fiecare cerere din TikTok. Concluzia ar ieși greșit „TikTok nu aduce nimic".
 *
 * De aici first-touch: se citește o singură dată, la prima încărcare din sesiune,
 * și se ține în `sessionStorage` până la trimitere. Sesiune, nu `localStorage`:
 * atribuirea răspunde la „de unde a venit vizita asta", nu „de unde ne cunoaște
 * omul de acum trei luni".
 *
 * Modulul e importat de componente client, deci nu are voie să atingă `lib/utils`
 * sau `lib/anre` (vezi CLAUDE.md). Nu are nicio dependință.
 */

export interface Attribution {
  /** Canalul: `utm_source`, sau dedus din click id / referrer. `direct` dacă nu se știe. */
  canal: string;
  /** `utm_campaign`, ca să se separe plătit de organic pe același canal. */
  campanie: string;
  /** Prima pagină din sesiune. Arată ce aterizare a pornit drumul spre formular. */
  paginaIntrare: string;
}

const STORAGE_KEY = 'if-atribuire';

const EMPTY: Attribution = { canal: '', campanie: '', paginaIntrare: '' };

/**
 * Ordinea contează: `gemini.google.com` trebuie să iasă „gemini", nu „google",
 * deci asistenții stau înaintea motoarelor de căutare.
 */
const CHANNEL_BY_HOST: ReadonlyArray<readonly [RegExp, string]> = [
  [/(^|\.)chatgpt\.com$/, 'chatgpt'],
  [/(^|\.)chat\.openai\.com$/, 'chatgpt'],
  [/(^|\.)perplexity\.ai$/, 'perplexity'],
  [/(^|\.)claude\.ai$/, 'claude'],
  [/(^|\.)gemini\.google\.com$/, 'gemini'],
  [/(^|\.)facebook\.com$/, 'facebook'],
  [/(^|\.)fb\.(com|me)$/, 'facebook'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)youtube\.com$/, 'youtube'],
  [/(^|\.)youtu\.be$/, 'youtube'],
  [/(^|\.)linkedin\.com$/, 'linkedin'],
  [/(^|\.)lnkd\.in$/, 'linkedin'],
  [/(^|\.)t\.co$/, 'x'],
  [/(^|\.)x\.com$/, 'x'],
  [/(^|\.)reddit\.com$/, 'reddit'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
  [/(^|\.)yahoo\./, 'yahoo'],
  [/(^|\.)google\./, 'google'],
];

/** Aceeași igienă ca `resolveSource`: valorile ajung într-o celulă de Sheet citită de om. */
function clean(raw: string | null | undefined, max = 60): string {
  return (raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._\-/ ]/g, '')
    .slice(0, max);
}

function channelFromHost(host: string): string {
  for (const [pattern, name] of CHANNEL_BY_HOST) {
    if (pattern.test(host)) return name;
  }
  return host;
}

/**
 * Exportată separat de `captureFirstTouch` ca să fie testabilă fără `window`.
 *
 * `fbclid` și `gclid` sunt plasa de siguranță care contează cel mai mult aici:
 * Facebook le adaugă singur pe linkurile din postări, deci un link pus fără UTM
 * (adică toate postările de până acum) rămâne totuși atribuibil.
 */
export function deriveAttribution(url: string, referrer: string): Attribution {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return EMPTY;
  }
  const q = parsed.searchParams;

  const campanie = clean(q.get('utm_campaign'));
  const paginaIntrare = clean(parsed.pathname, 120) || '/';

  const utm = clean(q.get('utm_source'));
  if (utm) return { canal: utm, campanie, paginaIntrare };
  if (q.get('fbclid')) return { canal: 'facebook', campanie, paginaIntrare };
  if (q.get('gclid')) return { canal: 'google', campanie: campanie || 'ads', paginaIntrare };

  if (referrer) {
    try {
      const from = new URL(referrer);
      // Navigare internă: nu e o intrare pe site, e drum prin site. Se întâmplă
      // la un reload pe o pagină interioară, iar „instalatori-fotovoltaice.ro"
      // scris ca sursă ar fi zgomot curat.
      if (from.host !== parsed.host) {
        return { canal: channelFromHost(from.host.toLowerCase()), campanie, paginaIntrare };
      }
    } catch {
      /* referrer nefolosibil: rămâne „direct" */
    }
  }

  return { canal: 'direct', campanie, paginaIntrare };
}

/**
 * Se apelează la fiecare încărcare de pagină, dar scrie o singură dată pe
 * sesiune. A doua oară e no-op tocmai ca să nu se piardă canalul real când omul
 * dă refresh pe un ghid la a treia pagină.
 */
export function captureFirstTouch(): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.sessionStorage.getItem(STORAGE_KEY)) return;
    const value = deriveAttribution(window.location.href, document.referrer);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Safari în navigare privată aruncă la scriere. Cererea trebuie să plece
    // oricum; atribuirea e un bonus, nu o condiție.
  }
}

/** Ce s-a reținut la intrarea în sesiune. Câmpuri goale dacă nu s-a putut citi nimic. */
export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Attribution>;
    return {
      canal: clean(parsed.canal),
      campanie: clean(parsed.campanie),
      paginaIntrare: clean(parsed.paginaIntrare, 120),
    };
  } catch {
    return EMPTY;
  }
}
