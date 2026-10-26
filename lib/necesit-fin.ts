// Cât de mari sunt firmele de pe necesit.ro: CUI din ONRC plus cifra de afaceri,
// profitul și angajații din bilanțurile publice. Datele vin din tabelul
// `necesit_fin_snapshots` din Neon, scris de `node scripts/necesit-fin.mjs`. Nu
// stau lângă data/necesit-firms.json fiindcă repo-ul e public.

import 'server-only';
import { db } from './db';

export interface NecesitFinYear {
  ca: number;
  /** Profit net minus pierdere netă: negativ = pierdere. */
  profit: number;
  emp: number;
}

export interface NecesitFin {
  cui: string;
  name: string;
  judet: string;
  registered: string;
  /** Stările ONRC care înseamnă că firma e pe ducă (radiată, insolvență…). */
  status: string[];
  caen: string;
  fin: Record<string, NecesitFinYear>;
  /** `director`: CUI-ul din companies.json; `nume`: potrivire pe nume + județ în ONRC. */
  via: 'director' | 'nume';
}

export interface NecesitFinData {
  generatedAt: string;
  /** Pe slug-ul de pe necesit. Firmele fără potrivire lipsesc. */
  firms: Record<string, NecesitFin>;
}

/** Ultima generare, sau null dacă scriptul n-a rulat încă pe baza asta. */
export async function getNecesitFin(): Promise<NecesitFinData | null> {
  const rows = await db()`
    SELECT generated_at, firms FROM necesit_fin_snapshots ORDER BY generated_at DESC LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    generatedAt: new Date(row.generated_at as string).toISOString(),
    firms: row.firms as Record<string, NecesitFin>,
  };
}
