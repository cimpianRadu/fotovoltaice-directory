#!/usr/bin/env node
/**
 * Pune pe site pozele unei cereri primite pe EMAIL.
 *
 * Fluxul normal e clientul care își urcă singur pozele din ecranul de
 * confirmare (`/api/leads/poze` + `/salveaza`). Unii răspund însă direct la
 * emailul de confirmare, cu pozele atașate, iar acelea trebuie să ajungă în
 * același loc: fișierul în Blob privat, un rând în tabul „Poze", rezumatul în
 * coloana AD a cererii. Altfel firma care revendică nu le vede în portal.
 *
 * Scrie exact ca `addLeadPhoto` din lib/sheets.ts: aceleași coloane, același
 * format al rezumatului („3 poze"), aceeași cale `cereri/<lead-id>/`.
 *
 * Usage:
 *   node scripts/adauga-poze-cerere.mjs --cerere 2026-09-06T13:37:53.543Z poza1.jpg poza2.jpg
 *   node scripts/adauga-poze-cerere.mjs --cerere <ref> --dry-run poze/*.jpg
 */

import { readFileSync, statSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';
import { put } from '@vercel/blob';

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

// Aceleași limite ca în lib/lead-photos-shared.ts.
const MAX_PHOTOS = 8;
const MAX_BYTES = 12 * 1024 * 1024;
const TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const ci = args.indexOf('--cerere');
const leadId = ci !== -1 ? args[ci + 1] : '';
const files = args.filter((a, i) => !a.startsWith('--') && i !== ci + 1);

if (!leadId || files.length === 0) {
  console.error('Usage: node scripts/adauga-poze-cerere.mjs --cerere <ref ISO> <fișier...> [--dry-run]');
  process.exit(1);
}

const auth = new google.auth.JWT({
  email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;

/** `cereri/<lead-id-cu-liniuțe>/` — identic cu leadPhotoPrefix din lib. */
const prefix = `cereri/${leadId.replace(/[:.]/g, '-')}/`;

function safeName(name) {
  const clean = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-60);
  return clean || 'poza.jpg';
}

// ── Verificări înainte de orice scriere ────────────────────────────────────

const leads = (await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Leads'!A:A" })).data.values || [];
const leadRow = leads.findIndex((r) => (r[0] || '').trim() === leadId) + 1;
if (leadRow === 0) {
  console.error(`Cererea ${leadId} nu există în tabul Leads. Verifică ref-ul din email.`);
  process.exit(1);
}

let pozeRows = [];
let pozeTabExists = true;
try {
  pozeRows = (await sheets.spreadsheets.values.get({ spreadsheetId, range: "'Poze'!A:F" })).data.values || [];
} catch {
  pozeTabExists = false;
}
const existing = pozeRows.filter((r) => (r[1] || '').trim() === leadId);

if (existing.length + files.length > MAX_PHOTOS) {
  console.error(`Cererea are deja ${existing.length} poze; ${files.length} în plus trec de plafonul de ${MAX_PHOTOS}.`);
  process.exit(1);
}

const planned = files.map((f) => {
  const ext = extname(f).toLowerCase();
  const contentType = TYPES[ext];
  if (!contentType) {
    console.error(`${f}: extensie neacceptată (${ext || 'fără'}). Acceptate: ${Object.keys(TYPES).join(', ')}`);
    process.exit(1);
  }
  const size = statSync(f).size;
  if (size > MAX_BYTES) {
    console.error(`${f}: ${(size / 1024 / 1024).toFixed(1)} MB, peste plafonul de 12 MB.`);
    process.exit(1);
  }
  return { file: f, contentType, size, name: safeName(basename(f)) };
});

console.log(`Cerere ${leadId} (rând ${leadRow} în Leads), ${existing.length} poze existente.`);
for (const p of planned) {
  console.log(`  ${p.file} → ${prefix}${p.name} (${p.contentType}, ${(p.size / 1024).toFixed(0)} KB)`);
}
if (dryRun) {
  console.log('\n--dry-run: nu s-a scris nimic.');
  process.exit(0);
}

// ── Încărcare + evidență ───────────────────────────────────────────────────

const HEADER = ['Încărcat', 'Lead ID', 'Cale', 'Nume fișier', 'Tip', 'Mărime'];
if (!pozeTabExists) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: 'Poze' } } }] },
  });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "'Poze'!A:A",
    valueInputOption: 'RAW',
    requestBody: { values: [HEADER] },
  });
  console.log('Tabul „Poze" a fost creat.');
}

let added = 0;
for (const p of planned) {
  const blob = await put(`${prefix}${p.name}`, readFileSync(p.file), {
    access: 'private',
    addRandomSuffix: true,
    contentType: p.contentType,
    token: env.BLOB_READ_WRITE_TOKEN,
  });
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "'Poze'!A:A",
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        new Date().toISOString(),
        leadId,
        blob.pathname,
        blob.pathname.split('/').pop() || p.name,
        p.contentType,
        String(p.size),
      ]],
    },
  });
  added++;
  console.log(`  ✓ ${blob.pathname}`);
}

const count = existing.length + added;
await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: `Leads!AD${leadRow}`,
  valueInputOption: 'RAW',
  requestBody: { values: [[`${count} ${count === 1 ? 'poză' : 'poze'}`]] },
});

console.log(`\n${added} ${added === 1 ? 'poză urcată' : 'poze urcate'}. Coloana AD a cererii: „${count} ${count === 1 ? 'poză' : 'poze'}".`);
