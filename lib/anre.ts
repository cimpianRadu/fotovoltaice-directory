import anreData from '@/data/anre-atestate.json';

// PV-relevant ANRE cert codes (others like A3/E1/E2/D1/D2 are for grids/verification,
// not directly meaningful for end users choosing a PV installer).
export const PV_RELEVANT_CODES = ['C2A', 'C1A', 'B', 'BP', 'BE'] as const;
export type PvRelevantCode = (typeof PV_RELEVANT_CODES)[number];

const CODE_ORDER: Record<string, number> = {
  C2A: 1,
  C1A: 2,
  B: 3,
  BP: 4,
  BE: 5,
};

export interface AnreMatch {
  societate: string;
  judet: string;
}

export interface AnreCertificate {
  nrAtestat: string;
  tipTarif: string;
  dataEmitere: string;
  dataExpirare: string;
  stare: string;
}

export interface ResolvedCert {
  code: string;            // e.g. "C2A"
  variant: string | null;  // e.g. "vizare periodica" or null
  nrAtestat: string;
  dataEmitere: string;
  dataExpirare: string;
  stare: string;           // "Atestat" | "Expirat" | "Retras" | "ScosDinEvidenta"
  isActive: boolean;
  tipTarifRaw: string;
}

interface AnreFirm {
  societate: string;
  sediu: string;
  localitate: string;
  judet: string;
  telefon: string;
  certificates: AnreCertificate[];
}

const anreFirms = anreData as AnreFirm[];

// Index by exact societate + judet (tiebreaker for name collisions)
const firmIndex = new Map<string, AnreFirm>();
for (const f of anreFirms) {
  firmIndex.set(`${f.societate}|${f.judet}`, f);
}

function parseTipTarif(tipTarif: string): { code: string; variant: string | null } | null {
  if (!tipTarif) return null;
  // "Tarif C2A", "Tarif C2A*-vizare periodica", "Tarif A3 Vizare"
  const m = tipTarif.match(/Tarif\s+([A-Za-z0-9]+)(.*)$/i);
  if (!m) return null;
  const code = m[1].toUpperCase();
  const rest = (m[2] || '').trim();
  let variant: string | null = null;
  if (/vizare\s*periodica/i.test(rest)) variant = 'vizare periodica';
  else if (/vizare/i.test(rest)) variant = 'vizare';
  return { code, variant };
}

export function findAnreFirm(match: AnreMatch | null | undefined): AnreFirm | null {
  if (!match) return null;
  return firmIndex.get(`${match.societate}|${match.judet}`) || null;
}

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(s\.?r\.?l\.?|s\.?a\.?|s\.?c\.?|srl|sa)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Diacritic-insensitive lookup of ANRE firms by name within a county.
 * Used by the listing form to verify a firm has an ANRE entry on submit.
 * Returns matches where the normalized firm name equals or contains the
 * normalized query (or vice versa). Empty if name shorter than 3 chars.
 */
export function findAnreFirmsByName(rawName: string, judet: string): AnreFirm[] {
  if (!rawName || !judet) return [];
  const targetName = normalizeForMatch(rawName);
  const targetJudet = normalizeForMatch(judet);
  if (!targetName || targetName.length < 3 || !targetJudet) return [];

  const exact: AnreFirm[] = [];
  const partial: AnreFirm[] = [];
  for (const f of anreFirms) {
    if (normalizeForMatch(f.judet) !== targetJudet) continue;
    const firmNorm = normalizeForMatch(f.societate);
    if (!firmNorm) continue;
    if (firmNorm === targetName) {
      exact.push(f);
    } else if (firmNorm.includes(targetName) || targetName.includes(firmNorm)) {
      partial.push(f);
    }
  }
  return [...exact, ...partial];
}

/**
 * Convenience for the listing flow: returns the best match (if any) and
 * its currently active PV-relevant certs. Picks the firm with the most
 * active PV certs when multiple candidates match.
 */
export function lookupAnreForListing(rawName: string, judet: string): {
  firm: AnreFirm | null;
  certs: ResolvedCert[];
} {
  const candidates = findAnreFirmsByName(rawName, judet);
  if (candidates.length === 0) return { firm: null, certs: [] };

  let best: { firm: AnreFirm; certs: ResolvedCert[] } | null = null;
  for (const firm of candidates) {
    const match: AnreMatch = { societate: firm.societate, judet: firm.judet };
    const certs = getCompanyAnreCerts(match);
    if (!best || certs.length > best.certs.length) {
      best = { firm, certs };
    }
  }
  return best ?? { firm: candidates[0], certs: [] };
}

/**
 * Returns PV-relevant active certs for a company's anreMatch, ordered by relevance.
 * Only includes certs with state === "Atestat" (currently valid).
 */
export function getCompanyAnreCerts(match: AnreMatch | null | undefined): ResolvedCert[] {
  const firm = findAnreFirm(match);
  if (!firm) return [];

  const resolved: ResolvedCert[] = [];
  const seen = new Set<string>(); // dedupe by code — keep only the most recent/valid per code

  // Sort all certs: active first, then by dataEmitere desc (most recent)
  const sorted = [...(firm.certificates || [])].sort((a, b) => {
    if ((a.stare === 'Atestat') !== (b.stare === 'Atestat')) return a.stare === 'Atestat' ? -1 : 1;
    return (b.dataEmitere || '').localeCompare(a.dataEmitere || '');
  });

  for (const c of sorted) {
    const parsed = parseTipTarif(c.tipTarif);
    if (!parsed) continue;
    if (!(PV_RELEVANT_CODES as readonly string[]).includes(parsed.code)) continue;
    if (c.stare !== 'Atestat') continue; // only show active
    if (seen.has(parsed.code)) continue;
    seen.add(parsed.code);
    resolved.push({
      code: parsed.code,
      variant: parsed.variant,
      nrAtestat: c.nrAtestat,
      dataEmitere: c.dataEmitere,
      dataExpirare: c.dataExpirare,
      stare: c.stare,
      isActive: true,
      tipTarifRaw: c.tipTarif,
    });
  }

  resolved.sort((a, b) => (CODE_ORDER[a.code] || 99) - (CODE_ORDER[b.code] || 99));
  return resolved;
}

/**
 * True if the company has at least one active PV-relevant ANRE cert.
 * Used by filter/search to replace the old `certifications.includes('ANRE-C2A')` check.
 */
export function hasActiveAnreCert(match: AnreMatch | null | undefined, code?: string): boolean {
  const certs = getCompanyAnreCerts(match);
  if (!code) return certs.length > 0;
  return certs.some((c) => c.code === code.toUpperCase());
}

// Friendly labels for cert codes (used on cards / tooltips)
const CODE_LABEL: Record<string, string> = {
  C2A: 'ANRE C2A',
  C1A: 'ANRE C1A',
  B: 'ANRE B',
  BP: 'ANRE Bp',
  BE: 'ANRE Be',
};

const CODE_DESCRIPTION: Record<string, string> = {
  C2A: 'Proiectare și executare instalații electrice exterioare (medie/înaltă tensiune). Necesar pentru proiecte comerciale și industriale peste 50 kWp.',
  C1A: 'Proiectare instalații electrice exterioare (medie/înaltă tensiune). Relevant pentru faza de proiectare a proiectelor comerciale.',
  B: 'Executare instalații electrice de joasă tensiune. Acoperă proiecte rezidențiale și comerciale mici (sub 50 kWp).',
  BP: 'Executare parțială instalații electrice joasă tensiune. Variantă restrânsă a atestatului B.',
  BE: 'Executare instalații electrice joasă tensiune (extinsă). Variantă a atestatului B.',
};

export function getAnreCodeLabel(code: string): string {
  return CODE_LABEL[code.toUpperCase()] || `ANRE ${code}`;
}

export function getAnreCodeDescription(code: string): string {
  return CODE_DESCRIPTION[code.toUpperCase()] || '';
}

/**
 * Format ANRE date (DD/MM/YYYY) → readable Romanian (DD MMM YYYY).
 */
export function formatAnreDate(date: string): string {
  if (!date) return '';
  const m = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return date;
  const [, d, mo, y] = m;
  const months = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return `${parseInt(d, 10)} ${months[parseInt(mo, 10) - 1]} ${y}`;
}
