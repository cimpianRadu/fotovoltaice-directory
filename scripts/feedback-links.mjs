#!/usr/bin/env node
/**
 * Scoate linkurile de feedback pentru o cerere concretizată: unul pentru client,
 * unul pentru fiecare firmă care a semnat. Linkurile NU apar pe site; le trimiți
 * tu, pe email sau WhatsApp. Răspunsurile intră în taburile „Feedback clienți”
 * și „Feedback firme”.
 *
 * Semnătura e aceeași ca în lib/feedback-token.ts (PORTAL_SECRET din
 * .env.local, care trebuie să fie identic cu cel de pe Vercel). Linkul expiră
 * după 90 de zile.
 *
 * Usage:
 *   node scripts/feedback-links.mjs --cerere 2026-08-12T16:15:01.284Z
 *   node scripts/feedback-links.mjs --cerere <ref> --firma "Electro Prahova"
 *   node scripts/feedback-links.mjs --cerere <ref> --base http://localhost:3000
 *
 * Fără --firma, ia firmele cu status „castigat” din tabul Revendicări.
 */

import { readFileSync } from 'node:fs';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const env = Object.fromEntries(
  readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : '';
};
const leadId = arg('--cerere');
const firmaArg = arg('--firma');
const base = (arg('--base') || 'https://instalatori-fotovoltaice.ro').replace(/\/$/, '');

if (!leadId) {
  console.error('Usage: node scripts/feedback-links.mjs --cerere <ref ISO> [--firma "Nume"] [--base URL]');
  process.exit(1);
}
if (!env.PORTAL_SECRET) {
  console.error('PORTAL_SECRET lipsește din .env.local.');
  process.exit(1);
}

function token(role, firma = '') {
  const exp = Date.now() + TOKEN_TTL_MS;
  const sig = createHmac('sha256', env.PORTAL_SECRET)
    .update(`feedback:${role}:${leadId}:${firma}:${exp}`)
    .digest('hex');
  return `${exp}.${sig}`;
}

const auth = new google.auth.JWT({
  email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;

const leads = (await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Leads'!A:Y" })).data.values || [];
const lead = leads.find((r) => (r[0] || '').trim() === leadId);
if (!lead) {
  console.error(`Cererea ${leadId} nu există în tabul Leads.`);
  process.exit(1);
}

let firme = firmaArg ? [firmaArg] : [];
if (!firmaArg) {
  let claims = [];
  try {
    claims = (await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Revendicări'!A:I" })).data.values || [];
  } catch {
    // tabul lipsește: nicio revendicare
  }
  firme = [
    ...new Set(
      claims.filter((r) => r[1] === leadId && (r[5] || '').trim() === 'castigat').map((r) => (r[2] || '').trim()),
    ),
  ].filter(Boolean);
}

const [, companie, contact, email, telefon, , judet] = lead.map((c) => (c || '').trim());
const statusCrm = lead[21] || '';

console.log(`\nCerere ${leadId} · ${judet} · status CRM: ${statusCrm || '(gol)'}`);
if (statusCrm !== 'castigata') {
  console.log('  Atenție: cererea nu e marcată „castigata” în Leads (coloana V).');
}

console.log(`\nCLIENT: ${contact || companie}${companie && contact ? ` (${companie})` : ''}`);
console.log(`  ${email || 'fără email'} · ${telefon || 'fără telefon'}`);
console.log(`  ${base}/feedback/client?${new URLSearchParams({ id: leadId, t: token('client') })}`);

if (!firme.length) {
  console.log('\nFIRMĂ: nicio revendicare „castigat” pe cerere. Dă numele cu --firma "Nume".');
}
for (const firma of firme) {
  console.log(`\nFIRMĂ: ${firma}`);
  console.log(`  ${base}/feedback/firma?${new URLSearchParams({ id: leadId, f: firma, t: token('firma', firma) })}`);
}
console.log('');
