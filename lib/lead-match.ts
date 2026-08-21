// Potriviri cerere → firme din director, pentru distribuția telefonică din
// /admin/crm: pe cine sun pentru cererea asta? Scorul e o sumă de semnale
// REALE din companies.json (județ, gama de kW, specializări, taguri) plus
// comportamentul firmei pe platformă (apeluri confirmate, plafon de
// revendicări, statusul din CRM Instalatori). Fiecare punct acordat sau scăzut
// are un motiv afișat în UI — decizia finală rămâne la om, nu la scor.

import type { Company } from './utils-shared';
import {
  MAX_ACTIVE_CLAIMS_PER_FIRM,
  claimHoldsFirmSlot,
  isSameFirm,
  normalizeFirmName,
  parseRequestedFirms,
  type ClaimStatus,
  type FirmStatus,
} from './sheets-shared';

export interface MatchLead {
  judet: string;
  segment: string;
  /** kW, text liber din formular („10", „10 kW"). Gol pe multe cereri. */
  putere: string;
  /**
   * Coloana L: firmele cerute explicit de client, „; " între ele. Opțional ca
   * să nu forțăm câmpul pe apelanții care potrivesc doar pe județ și putere.
   */
  preselectedCompany?: string;
}

export interface MatchClaim {
  leadId: string;
  numeFirma: string;
  telefon: string;
  contactedAt: string;
  // Necesare ca plafonul de aici să numere exact ca `countActiveClaimsForFirm`:
  // statusul mutat din portal eliberează slotul, deci nu mai e „revendicare fără
  // apel", e revendicare în lucru.
  releasedAt: string;
  firmStatus: ClaimStatus;
  firmNotes: unknown[];
}

export interface MatchCrmFirm {
  numeFirma: string;
  telefon: string;
  status: FirmStatus;
}

export interface FirmMatch {
  id: string;
  slug: string;
  name: string;
  city: string;
  county: string;
  phone: string;
  score: number;
  /** De ce e pe listă. Se afișează ca atare, ca să se vadă pe ce stă scorul. */
  reasons: string[];
  /** De ce să stai pe gânduri înainte să suni. */
  warnings: string[];
}

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function parseKw(putere: string): number {
  const n = parseFloat(putere.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const NATIONAL_TAGS = ['acoperire-nationala', 'retea-nationala'];
// Semnale că firma lucrează cu persoane fizice, nu doar cu hale.
const RESI_TAGS = ['pv-rezidential', 'casa-verde', 'prosumator', 'afm-validat', 'validat-afm'];
const COM_SPECS = [
  'hale-industriale', 'parcuri-logistice', 'cladiri-birouri', 'retail',
  'agricol', 'spitale', 'scoli', 'hoteluri',
];
const COM_TAGS = ['pv-comercial', 'PV comercial', 'pv-industrial', 'focus-industrial', 'instalatii-industriale', 'EPC'];

export function matchFirmsForLead(
  lead: MatchLead,
  leadId: string,
  companies: Company[],
  claims: MatchClaim[],
  crmFirms: MatchCrmFirm[],
  limit = 4,
): FirmMatch[] {
  const leadCounty = norm(lead.judet);
  const kw = parseKw(lead.putere);
  const rezidential = (lead.segment || 'comercial') === 'rezidential';
  // Firmele pe care clientul le-a cerut cu numele. Nu le potrivim noi, le-a
  // ales el: urcă primele pe listă și trec de poarta geografică (dacă a cerut o
  // firmă din alt județ, tot ea e prima de sunat, ea decide dacă se deplasează).
  const requested = new Set(parseRequestedFirms(lead.preselectedCompany).map(normalizeFirmName));

  const out: FirmMatch[] = [];

  for (const c of companies) {
    const firmIdent = { numeFirma: c.name, telefon: c.contact.phone };

    // Are deja cererea revendicată — n-are sens s-o recomand tot ei.
    if (claims.some((cl) => cl.leadId === leadId && isSameFirm(cl, firmIdent))) continue;

    const reasons: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    const askedByClient = requested.size > 0 && requested.has(normalizeFirmName(c.name));
    if (askedByClient) {
      score += 10;
      reasons.push('cerută de client');
    }

    // Geografia e poartă, nu doar punctaj: o firmă care nici nu acoperă
    // județul nu are ce căuta pe lista de apeluri.
    if (leadCounty) {
      if (norm(c.location.county) === leadCounty) {
        score += 3;
        reasons.push('sediul în județ');
      } else if (c.coverage.some((j) => norm(j) === leadCounty)) {
        score += 2;
        reasons.push('acoperă județul');
      } else if (c.tags?.some((t) => NATIONAL_TAGS.includes(t))) {
        score += 1;
        reasons.push('acoperire națională');
      } else if (askedByClient) {
        warnings.push('nu acoperă județul în director');
      } else {
        continue;
      }
    }

    // 0 în date înseamnă „nedeclarat", nu „zero kW": fără prag cunoscut nu
    // acordăm și nu scădem nimic pe mărime.
    const min = c.capacity.minProjectKw > 0 ? c.capacity.minProjectKw : 0;
    const max = c.capacity.maxProjectKw > 0 ? c.capacity.maxProjectKw : Infinity;
    const hasRange = min > 0 || Number.isFinite(max);
    if (kw > 0 && hasRange) {
      const range =
        min > 0 && Number.isFinite(max)
          ? `${min}–${max} kW`
          : min > 0
            ? `de la ${min} kW`
            : `până la ${max} kW`;
      if (kw >= min && kw <= max) {
        score += 3;
        reasons.push(`${kw} kW în gama firmei (${range})`);
      } else if (kw < min) {
        // Exact cazul „firmă mare, doar comercial": proiectul e sub pragul ei.
        score -= 3;
        warnings.push(`proiect sub minimul firmei (${min} kW)`);
      } else {
        score -= 2;
        warnings.push(`proiect peste maximul firmei (${max} kW)`);
      }
    }

    if (rezidential) {
      const faceRezidential =
        c.specializations.includes('rezidential') ||
        c.tags?.some((t) => RESI_TAGS.includes(t));
      if (faceRezidential) {
        score += 2;
        reasons.push('face rezidențial');
      } else if (min >= 50) {
        score -= 2;
        warnings.push(`profil comercial (proiecte de la ${min} kW)`);
      }
    } else {
      const faceComercial =
        c.specializations.some((s) => COM_SPECS.includes(s)) ||
        c.tags?.some((t) => COM_TAGS.includes(t));
      if (faceComercial) {
        score += 2;
        reasons.push('profil comercial/industrial');
      }
    }

    // Comportamentul pe platformă cântărește: o firmă care a confirmat apeluri
    // livrează; una cu plafonul plin ține sloturi ocupate degeaba.
    const firmClaims = claims.filter((cl) => isSameFirm(cl, firmIdent));
    if (firmClaims.some((cl) => cl.contactedAt)) {
      score += 1;
      reasons.push('a confirmat apeluri pe cereri');
    }
    const active = firmClaims.filter((cl) =>
      claimHoldsFirmSlot({ ...cl, noteCount: cl.firmNotes.length }),
    ).length;
    if (active >= MAX_ACTIVE_CLAIMS_PER_FIRM) {
      score -= 3;
      warnings.push(`plafon plin (${active} revendicări nemișcate)`);
    }

    // Pipeline-ul din CRM Instalatori: firmele cu care avem relație primesc
    // leadurile primele — exact asta le vindem.
    const crm = crmFirms.find((f) => isSameFirm(f, firmIdent));
    if (crm?.status === 'client') {
      score += 2;
      reasons.push('client la noi');
    } else if (crm?.status === 'interesat') {
      score += 1;
      reasons.push('interesată, în CRM');
    } else if (crm?.status === 'refuzat') {
      score -= 3;
      warnings.push('refuzată în CRM Instalatori');
    } else if (crm?.status === 'nu_raspunde') {
      warnings.push('nu răspunde la telefon (CRM)');
    }

    if (score <= 0) continue;

    out.push({
      id: c.id,
      slug: c.slug,
      name: c.name,
      city: c.location.city,
      county: c.location.county,
      phone: c.contact.phone,
      score,
      reasons,
      warnings,
    });
  }

  // La scor egal, firma cu pragul de proiect mai mic primele: pe cererile
  // mici (majoritatea) e mai probabil să sune înapoi.
  const minKwOf = (id: string) =>
    companies.find((c) => c.id === id)?.capacity.minProjectKw ?? 0;
  return out
    .sort((a, b) => b.score - a.score || minKwOf(a.id) - minKwOf(b.id))
    .slice(0, limit);
}
