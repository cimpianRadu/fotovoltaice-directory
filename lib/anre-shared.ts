// Data-free ANRE helpers, safe to import from client components.
// IMPORTANT: nu importa aici anre-atestate.json (5,7 MB) — tot ce depinde de
// registru stă în lib/anre.ts și rulează doar pe server / API routes.

// PV-relevant ANRE cert codes (others like A3/E1/E2/D1/D2 are for grids/verification,
// not directly meaningful for end users choosing a PV installer).
export const PV_RELEVANT_CODES = ['C2A', 'C1A', 'B', 'BP', 'BE'] as const;
export type PvRelevantCode = (typeof PV_RELEVANT_CODES)[number];

export const CODE_ORDER: Record<string, number> = {
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

export interface AnreFirm {
  societate: string;
  sediu: string;
  localitate: string;
  judet: string;
  telefon: string;
  certificates: AnreCertificate[];
}

export function parseTipTarif(tipTarif: string): { code: string; variant: string | null } | null {
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
