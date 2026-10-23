#!/usr/bin/env node
/**
 * Aplică migrațiile din `db/migrations/*.sql` pe baza Neon, în ordinea numelui,
 * fiecare o singură dată. Evidența stă în tabelul `schema_migrations`.
 *
 * Driverul HTTP nu primește mai multe comenzi într-o cerere, așa că fișierul se
 * taie la „;” de la capăt de rând, iar comenzile unui fișier rulează într-o
 * singură tranzacție. Deci migrațiile rămân DDL simplu, fără blocuri $$ ... $$.
 *
 * O migrație aplicată nu se mai editează: schimbarea vine într-un fișier nou.
 *
 *   node scripts/db-migrate.mjs [--dry]
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'db/migrations');
const DRY = process.argv.includes('--dry');

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const line = readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL lipsește din mediu și din .env.local.');
  return line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
}

const sql = neon(databaseUrl());

await sql`CREATE TABLE IF NOT EXISTS schema_migrations (
  name text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
)`;
const applied = new Set((await sql`SELECT name FROM schema_migrations`).map((r) => r.name));
const files = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
const pending = files.filter((f) => !applied.has(f));

if (!pending.length) {
  console.log(`Nicio migrație nouă (${files.length} aplicate).`);
  process.exit(0);
}

for (const file of pending) {
  // Comentariile ies întâi, ca un „;” la capătul unui comentariu să nu taie comanda.
  const statements = readFileSync(path.join(DIR, file), 'utf8')
    .replace(/^\s*--.*$/gm, '')
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean);
  if (DRY) {
    console.log(`--dry ${file}: ${statements.length} comenzi`);
    continue;
  }
  await sql.transaction([
    ...statements.map((s) => sql.query(s)),
    sql`INSERT INTO schema_migrations (name) VALUES (${file})`,
  ]);
  console.log(`✓ ${file} (${statements.length} comenzi)`);
}
