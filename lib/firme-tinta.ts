// Firmele de instalații care au nevoie de lucrări: nou înființate sau cu cifra de
// afaceri în scădere. Datele vin din tabelul `tinta_snapshots` din Neon, scris de
// `node scripts/firme-tinta.mjs` din registrul ANRE + ONRC + bilanțurile publice
// de pe data.gov.ro. Până pe 23 oct 2026 stăteau în data/firme-tinta.json, dar
// repo-ul e public, iar lista e munca de prospectare.

import 'server-only';
import { db } from './db';

export type TintaSegment = 'noua' | 'scadere';
/** De unde știm că firma face fotovoltaice. Niciun registru nu spune asta direct. */
export type TintaSignal = 'director' | 'afm' | 'necesit' | 'nume';

export interface TintaYear {
  ca: number;
  /** Profit net minus pierdere netă: negativ = pierdere. */
  profit: number;
  emp: number;
}

export interface TintaFirm {
  cui: string;
  name: string;
  anreName: string;
  judet: string;
  localitate: string;
  phone: string;
  web: string;
  registered: string;
  firstCert: string;
  codes: string[];
  caen: string;
  fin: Record<string, TintaYear>;
  signals: TintaSignal[];
  segments: TintaSegment[];
  reasons: string[];
  warnings: string[];
  directorySlug: string;
  necesitUrl: string;
  score: number;
}

export interface TintaData {
  generatedAt: string;
  sources: { anre: string; onrc: string; bilanturi: string[] };
  rules: { newSince: string; newCertSince: string; drop: number; dropMinPeak: number };
  stats: Record<string, number>;
  firms: TintaFirm[];
}

/** Ultima generare a listei, sau null dacă scriptul n-a rulat încă pe baza asta. */
export async function getTinta(): Promise<TintaData | null> {
  const rows = await db()`
    SELECT generated_at, meta, firms FROM tinta_snapshots ORDER BY generated_at DESC LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  const meta = row.meta as Omit<TintaData, 'generatedAt' | 'firms'>;
  return {
    generatedAt: new Date(row.generated_at as string).toISOString(),
    sources: meta.sources,
    rules: meta.rules,
    stats: meta.stats,
    firms: row.firms as TintaFirm[],
  };
}

export const SIGNAL_LABELS: Record<TintaSignal, string> = {
  director: 'în directorul nostru',
  afm: 'validată AFM Casa Verde',
  necesit: 'fotovoltaice pe necesit',
  nume: 'numele spune fotovoltaice',
};
