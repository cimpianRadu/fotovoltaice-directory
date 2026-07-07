// ATENȚIE: acest modul importă întregul registru ANRE (anre-atestate.json, 8,3 MB).
// 'server-only' face build-ul să CRAPE dacă e importat dintr-o componentă client —
// exact regresia care a dus la 848 KiB de JS nefolosit pe fiecare pagină (iul 2026).
// Componentele client folosesc lib/anre-shared.ts (etichete, tipuri, formatare) și
// lib/anre-certs.ts (certurile active ale firmelor din director, fișier derivat mic).
import 'server-only';
import anreData from '@/data/anre-atestate.json';
import {
  PV_RELEVANT_CODES,
  CODE_ORDER,
  parseTipTarif,
  type AnreMatch,
  type AnreFirm,
  type ResolvedCert,
} from '@/lib/anre-shared';

export {
  PV_RELEVANT_CODES,
  getAnreCodeLabel,
  getAnreCodeDescription,
  formatAnreDate,
  parseTipTarif,
} from '@/lib/anre-shared';
export type {
  PvRelevantCode,
  AnreMatch,
  AnreCertificate,
  AnreFirm,
  ResolvedCert,
} from '@/lib/anre-shared';

const anreFirms = anreData as AnreFirm[];

// Index by exact societate + judet (tiebreaker for name collisions)
const firmIndex = new Map<string, AnreFirm>();
for (const f of anreFirms) {
  firmIndex.set(`${f.societate}|${f.judet}`, f);
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
