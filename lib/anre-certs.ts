// Certificate ANRE active pentru firmele din director — citite din fișierul derivat
// data/company-anre-certs.json (~60 KB), generat de scripts/generate-company-anre-certs.js
// (rulează automat la prebuild). Safe de importat din componente client.
//
// Pentru lookup-uri pe firme ARBITRARE din registrul complet (formularul de listare,
// /verificare-anre) folosește lib/anre.ts — acela importă registrul de 8,3 MB și
// trebuie să rămână server-only.
import certsMapRaw from '@/data/company-anre-certs.json';
import type { AnreMatch, ResolvedCert } from '@/lib/anre-shared';

const certsMap = certsMapRaw as Record<string, ResolvedCert[]>;

/**
 * Returns PV-relevant active certs for a company's anreMatch, ordered by relevance.
 * Only includes certs with state === "Atestat" (currently valid).
 */
export function getCompanyAnreCerts(match: AnreMatch | null | undefined): ResolvedCert[] {
  if (!match) return [];
  return certsMap[`${match.societate}|${match.judet}`] || [];
}

/**
 * True if the company has at least one active PV-relevant ANRE cert.
 */
export function hasActiveAnreCert(match: AnreMatch | null | undefined, code?: string): boolean {
  const certs = getCompanyAnreCerts(match);
  if (!code) return certs.length > 0;
  return certs.some((c) => c.code === code.toUpperCase());
}
