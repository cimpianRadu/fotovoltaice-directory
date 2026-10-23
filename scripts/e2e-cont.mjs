// Health check pentru contul clientului (23 oct 2026): paginile se încarcă, un
// link de intrare greșit nu deschide nimic, ofertele nu ies fără acces, iar
// click-urile pe cereri ajung în Neon. Sigur pe producție: nu trimite emailuri și
// șterge rândul de click pe care îl scrie.
//
// Usage: node scripts/e2e-cont.mjs           (testează https://instalatori-fotovoltaice.ro)
//        TARGET_URL=http://localhost:3000 node scripts/e2e-cont.mjs
// Scrie un JSON la final și iese cu 1 dacă pică ceva. Îl rulează și scripts/e2e.mjs.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = (process.env.TARGET_URL || 'https://instalatori-fotovoltaice.ro').replace(/\/$/, '');

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const line = readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n').find((l) => l.startsWith('DATABASE_URL='));
  return line?.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
}

const tests = [];
async function check(id, name, fn) {
  const start = Date.now();
  try {
    const error = (await fn()) || null;
    tests.push({ id, name, ms: Date.now() - start, error, pass: !error });
  } catch (err) {
    tests.push({ id, name, ms: Date.now() - start, error: String(err?.message || err), pass: false });
  }
}

await check('cont', 'Pagina „Contul meu” (/cont)', async () => {
  const res = await fetch(`${TARGET}/cont`);
  const body = await res.text();
  if (res.status !== 200) return `HTTP ${res.status}`;
  return body.includes('Contul meu') ? null : 'nu apare „Contul meu”';
});

await check('cerere-fara-acces', 'Cererea fără acces cere intrarea, nu arată date', async () => {
  const res = await fetch(`${TARGET}/cont/cerere/2020-01-01T00:00:00.000Z`);
  const body = await res.text();
  if (res.status !== 200) return `HTTP ${res.status}`;
  return body.includes('Intrați în cont') ? null : 'nu cere intrarea';
});

await check('link-gresit', 'Un link de intrare falsificat nu deschide contul', async () => {
  const res = await fetch(`${TARGET}/cont/intrare?t=e2e-falsificat`, { redirect: 'manual' });
  const loc = res.headers.get('location') || '';
  if (res.status < 300 || res.status >= 400) return `HTTP ${res.status}`;
  if (res.headers.get('set-cookie')?.includes('cont_session')) return 'a pus sesiune';
  return loc.includes('/cont?eroare=link') ? null : `redirect spre ${loc}`;
});

await check('cod-email-invalid', 'Codul nu pleacă spre o adresă invalidă', async () => {
  const res = await fetch(`${TARGET}/api/cont/cod`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nu-e-email' }),
  });
  return res.status === 400 ? null : `HTTP ${res.status}`;
});

await check('oferta-fara-acces', 'Un fișier de ofertă nu iese fără acces', async () => {
  const res = await fetch(`${TARGET}/api/cont/oferta?id=999999999&f=0`);
  return res.status === 404 ? null : `HTTP ${res.status}`;
});

await check('click', 'Click-ul pe o cerere ajunge în Neon (o dată pe zi)', async () => {
  // O cerere care nu există, folosită doar de test; rândurile ei se șterg la final.
  const leadId = '2020-01-01T00:00:00.000Z';
  const send = () =>
    fetch(`${TARGET}/api/cereri/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'e2e-cont' },
      body: JSON.stringify({ leadId, kind: 'vreau' }),
    });
  const [a, b] = [await send(), await send()];
  if (a.status !== 204 || b.status !== 204) return `HTTP ${a.status}/${b.status}`;
  const sql = neon(databaseUrl());
  const rows = await sql`SELECT count(*)::int AS n FROM lead_clicks WHERE lead_id = ${leadId}`;
  await sql`DELETE FROM lead_clicks WHERE lead_id = ${leadId}`;
  const n = rows[0].n;
  return n === 1 ? null : `${n} rânduri în loc de 1`;
});

const allPass = tests.every((t) => t.pass);
console.log(JSON.stringify({ target: TARGET, allPass, tests }, null, 2));
process.exit(allPass ? 0 : 1);
