// Baza Postgres (Neon, Frankfurt), din 23 oct 2026. Până atunci totul stătea în
// Google Sheets. Aici intră ce nu se potrivește acolo: date care nu au voie în
// repo-ul public (lista Țintă) și, odată cu contul clientului, scrierile multe și
// mici (sesiuni, click-uri pe cereri), care ar mânca din limita comună de Sheets.
//
// Driverul HTTP de la Neon face o cerere pe interogare, fără conexiuni ținute
// deschise, deci merge în funcțiile Vercel. Tabelele se creează din
// `db/migrations/*.sql` cu `node scripts/db-migrate.mjs`.

import 'server-only';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let client: NeonQueryFunction<false, false> | null = null;

export function db(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL lipsește: baza Neon nu e configurată.');
    client = neon(url);
  }
  return client;
}
