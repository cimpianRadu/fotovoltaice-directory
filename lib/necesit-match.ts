// Potriviri cerere → firme de pe necesit.ro, pentru cazul în care directorul nu
// acoperă cererea. necesit.ro e platforma concurentă care ne bate la trafic, dar
// își expune public lista de instalatori, iar cererea de acolo e aproape integral
// rezidențială — exact segmentul unde directorul nostru e subțire.
//
// Datele vin din `data/necesit-firms.json`, regenerat cu
// `node scripts/necesit-scan.mjs --build`. Telefoanele NU sunt publicate de
// necesit; sunt recuperate din registrul ANRE, deci o parte din firme apar fără
// număr — pe alea le suni după ce le cauți, sau le deschizi profilul.

import raw from '@/data/necesit-firms.json';
import { normalizeFirmName } from './sheets-shared';

export interface NecesitFirm {
  slug: string;
  name: string;
  county: string;
  locality: string;
  partner: boolean;
  offers: string;
  responds: string;
  verified: boolean;
  rating: string;
  reviews: number;
  lastReviewMonths: number | null;
  employees: string;
  years: string;
  pvOnly: boolean;
  nonSolar: number;
  phone: string;
  anreName: string;
  anreActive: boolean;
  afm: boolean;
  url: string;
}

/** Rând din tabul „Listări": firma a completat singură formularul de listare. */
export interface ListingSignal {
  numeFirma: string;
  telefon: string;
  timestamp: string;
}

export interface NecesitMatch {
  slug: string;
  name: string;
  locality: string;
  phone: string;
  url: string;
  score: number;
  /** Data la care firma a cerut singură listare pe site. Gol dacă n-a cerut. */
  askedListingAt: string;
  /** De ce e pe listă. Se afișează ca atare. */
  reasons: string[];
  /** De ce să stai pe gânduri înainte să suni. */
  warnings: string[];
}

const DATA = raw as { generatedAt: string; firms: NecesitFirm[] };

const norm = (s: string): string =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[țţ]/g, 't').replace(/[șş]/g, 's').trim();

export const necesitGeneratedAt = DATA.generatedAt;

/**
 * Firmele de pe necesit din județul cererii, ordonate după cât de potrivite sunt
 * pe segment. Nu ne interesează dacă sunt sau nu în director: aici căutăm pe
 * cine mai putem suna, nu cine e deja al nostru.
 */
export function matchNecesitFirms(
  lead: { judet: string; segment: string },
  listings: ListingSignal[] = [],
  limit = 4,
): NecesitMatch[] {
  const county = norm(lead.judet || '');
  if (!county) return [];
  const rezidential = (lead.segment || 'comercial') === 'rezidential';

  // Cine a completat formularul de listare a ridicat singur mâna. E cel mai tare
  // semnal pe care îl putem avea despre o firmă și bate orice deducem noi din
  // date publice — deci îl căutăm după nume ȘI după telefon, ca la revendicări.
  const askedByName = new Map<string, ListingSignal>();
  const askedByPhone = new Map<string, ListingSignal>();
  for (const l of listings) {
    if (l.numeFirma) askedByName.set(normalizeFirmName(l.numeFirma), l);
    const digits = (l.telefon || '').replace(/\D/g, '').slice(-9);
    if (digits.length === 9) askedByPhone.set(digits, l);
  }

  const out: NecesitMatch[] = [];
  for (const f of DATA.firms) {
    if (norm(f.county) !== county) continue;

    const reasons: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    const phoneKey = f.phone.replace(/\D/g, '').slice(-9);
    const asked =
      askedByName.get(normalizeFirmName(f.name)) ??
      (f.anreName ? askedByName.get(normalizeFirmName(f.anreName)) : undefined) ??
      (phoneKey.length === 9 ? askedByPhone.get(phoneKey) : undefined);
    if (asked) score += 6;

    // Firma și-a lăsat numărul în formularul de listare. E mai proaspăt și mai
    // sigur decât registrul ANRE, deci acoperă exact golul de 43%: tocmai
    // firmele care au cerut listare erau cele pe care nu aveam pe ce le suna.
    const phone = f.phone || (asked?.telefon ?? '');

    // Validarea AFM e singura dovadă tare de rezidențial pe care o avem:
    // înseamnă că firma e acceptată să lucreze dosare Casa Verde.
    if (f.afm) {
      if (rezidential) {
        score += 4;
        reasons.push('validată AFM Casa Verde');
      } else {
        score += 1;
        reasons.push('validată AFM');
      }
    } else if (rezidential) {
      warnings.push('nevalidată AFM (fără dosare Casa Verde)');
    }

    // „Oferte trimise" / „Răspunde în X" apar doar la partenerii care plătesc:
    // firma e obișnuită să cumpere cereri și să răspundă la ele.
    if (f.partner && (f.offers || f.responds)) {
      score += 3;
      const how = [f.offers && `${f.offers} oferte trimise`, f.responds && `răspunde în ${f.responds}`]
        .filter(Boolean)
        .join(', ');
      reasons.push(`plătește pentru cereri pe necesit (${how})`);
    } else if (!f.partner) {
      // Nu e un defect al firmei, e argumentul de deschidere: apare în „Top 20
      // firme" pe Google, dar cererile de pe pagina ei se duc la concurenți.
      score += 1;
      reasons.push('listată pe necesit fără să colaboreze');
    }

    if (f.pvOnly) {
      score += 2;
      reasons.push('doar fotovoltaice');
    } else {
      warnings.push(`generalist (+${f.nonSolar} alte servicii)`);
    }

    if (f.lastReviewMonths !== null && f.lastReviewMonths <= 12) {
      score += 1;
      reasons.push('recenzii în ultimul an');
    }

    if (phone) {
      if (f.phone && f.anreActive) {
        score += 1;
        reasons.push('atestat ANRE activ');
      } else if (f.phone) {
        warnings.push('atestat ANRE inactiv');
      } else {
        reasons.push('telefon din formularul de listare');
      }
    } else {
      // Fără număr nu se poate suna acum, deci coboară — dar rămâne pe listă,
      // fiindcă profilul de pe necesit are datele ca s-o cauți.
      score -= 2;
      warnings.push('telefon negăsit în ANRE');
    }

    if (!rezidential) {
      warnings.push('necesit e platformă rezidențială');
    }

    const d = asked ? Date.parse(asked.timestamp || '') : NaN;
    out.push({
      askedListingAt:
        !asked
          ? ''
          : Number.isFinite(d)
            ? new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'dată necunoscută',
      slug: f.slug,
      name: f.name,
      locality: f.locality || f.county,
      phone,
      url: f.url,
      score,
      reasons,
      warnings,
    });
  }

  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}
