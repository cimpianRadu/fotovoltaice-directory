#!/usr/bin/env node
/**
 * Trimite emailul „mai căutați oferte?" prin /api/admin/confirmare-activa de pe
 * prod (21 sept 2026). Prin prod, nu local: linkurile din email se semnează cu
 * PORTAL_SECRET-ul de acolo. Implicit e dry-run: arată cui ar pleca.
 *
 *   node scripts/confirmare-activa-send.mjs [--limit 10] [--send]
 *
 * Cere ADMIN_PASSWORD-ul de pe prod în .env.local. Loturile programate pleacă
 * singure prin /api/cron/confirmare-activa (vezi ACTIVE_CHECK_BATCHES).
 * Loturi mici (10), ca să nu ajungem în spam. Fiecare cerere primește emailul
 * o singură dată (coloana AZ), deci rulările repetate iau următoarele la rând.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const send = args.includes('--send');
const limit = Number(args[args.indexOf('--limit') + 1]) || 10;

const env = Object.fromEntries(
  readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);
// Același token ca sessionToken din lib/admin-auth.
const cookie = createHash('sha256').update(`admin:${env.ADMIN_PASSWORD}`).digest('hex');

const res = await fetch('https://instalatori-fotovoltaice.ro/api/admin/confirmare-activa', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: `admin_session=${cookie}` },
  body: JSON.stringify({ limit, dry: !send }),
  signal: AbortSignal.timeout(90_000),
});
const json = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`Eroare ${res.status}:`, json.error || json);
  process.exit(1);
}
console.log(`${send ? 'TRIMISE' : 'DRY-RUN, ar pleca'}: ${json.sent.length} (eligibile înainte: ${json.eligible})`);
for (const s of json.sent) console.log('  ' + s);
if (json.failed.length) {
  console.log(`EȘUATE: ${json.failed.length}`);
  for (const s of json.failed) console.log('  ' + s);
  process.exit(1);
}
