#!/usr/bin/env node
/**
 * Comasează retrimiterile aceleiași cereri într-un singur rând din tabul „Leads".
 *
 * De ce există: pe 21 aug 2026 un client din Sibiu a trimis trei cereri
 * identice în 10 minute, câte una de pe pagina fiecărei firme pe care o voia,
 * pentru că formularul primea o singură firmă. Trei carduri în /admin/crm, trei
 * rânduri de alerte, o singură cerere reală. Formularul lasă acum să se ceară
 * până la 4 firme deodată; scriptul ăsta repară ce a intrat deja, și orice caz
 * viitor de același fel (același om, alt buton, altă pagină).
 *
 * Ce face la comasare (rândul canonic = cel păstrat, restul = retrimiteri):
 *   - L (firme solicitate): reuniunea firmelor din toate rândurile, „; " între ele
 *   - celulele goale din canonic se completează din retrimiteri (putere, mesaj,
 *     acoperiș, finanțare etc.); nimic completat nu se suprascrie
 *   - W (note CRM): o notă datată pe canonic, cu ce s-a comasat
 *   - retrimiterile primesc M = „Ascuns" (le ignoră tot ce citește Sheet-ul azi)
 *     și Q = timestamp-ul canonicului (isLeadHidden + „+N retrimiteri" pe card)
 * Nu șterge niciun rând. Reversibil de mână: golește Q și pune M înapoi pe „Nou".
 *
 * Usage:
 *   node scripts/merge-leads.mjs
 *       listează grupurile de cereri deschise cu același telefon sau email
 *   node scripts/merge-leads.mjs --into <ts-canonic> <ts-retrimitere> [<ts>...]
 *       dry run: arată exact ce s-ar scrie
 *   node scripts/merge-leads.mjs --into <ts> <ts2> --apply
 *       scrie
 *   --force  trece peste verificarea „același telefon/email" și peste revendicări
 *            existente pe retrimiteri (rămân legate de rândul ascuns; mută-le de mână)
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FORCE = args.includes('--force');
const intoIdx = args.indexOf('--into');
const targets = intoIdx === -1 ? [] : args.slice(intoIdx + 1).filter((a) => !a.startsWith('--'));

const env = Object.fromEntries(
  readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const auth = new google.auth.JWT({
  email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = env.GOOGLE_SHEETS_SPREADSHEET_ID;

// Indici de coloană, același contract ca lib/sheets.ts (saveLeadToSheet / getLeadsSince).
const COL = {
  ts: 0, nume: 2, email: 3, telefon: 4, tip: 5, judet: 6,
  firme: 11, status: 12, duplicatAl: 16, crmStatus: 21, note: 22,
};
// Celulele care se completează din retrimiteri când canonicul le are goale:
// exact ce strânge formularul + enrich, nimic din ce scrie CRM-ul sau cronurile.
const FILL_COLS = {
  7: 'Suprafață', 8: 'Putere', 9: 'Mesaj', 18: 'Tip acoperiș', 19: 'Alimentare',
  20: 'Consum lunar', 24: 'Finanțare', 25: 'Localitate', 26: 'Baterie', 27: 'Stație încărcare',
  28: 'Termen', 32: 'Branșament', 36: 'Interval apel',
};
const CLOSED = ['castigata', 'altundeva', 'renuntat'];

const colLetter = (i) => (i < 26 ? '' : String.fromCharCode(64 + Math.floor(i / 26))) + String.fromCharCode(65 + (i % 26));
const normPhone = (s) => (s || '').replace(/[\s.\-()]/g, '').replace(/^(?:\+40|0040)/, '0');
const normEmail = (s) => (s || '').trim().toLowerCase();
const normFirm = (s) => s.toLowerCase().replace(/[.,]/g, ' ').replace(/\b(s\s*r\s*l\s*-?\s*d|s\s*r\s*l|s\s*a|p\s*f\s*a|s\s*c)\b/g, ' ').replace(/\s+/g, ' ').trim();
const parseFirms = (cell) => (cell || '').split(';').map((s) => s.trim()).filter(Boolean);
function joinFirms(names) {
  const seen = new Set();
  const out = [];
  for (const n of names) {
    const k = normFirm(n);
    if (!n || !k || seen.has(k)) continue;
    seen.add(k);
    out.push(n);
  }
  return out.join('; ');
}
const sameClient = (a, b) =>
  (normPhone(a[COL.telefon]) && normPhone(a[COL.telefon]) === normPhone(b[COL.telefon])) ||
  (normEmail(a[COL.email]) && normEmail(a[COL.email]) === normEmail(b[COL.email]));
const isHidden = (r) => (r[COL.status] || '').trim() === 'Ascuns' || (r[COL.duplicatAl] || '').trim() !== '';
const isClosed = (r) => CLOSED.includes((r[COL.crmStatus] || '').trim().toLowerCase());
const roTime = (iso) =>
  new Date(iso).toLocaleString('ro-RO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bucharest' });
// Formatul jurnalului din lib/sheets.ts (parseNotes): `[YYYY-MM-DD HH:MM] text`, cele noi primele.
function stampNow() {
  const now = new Date();
  const day = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
  const time = now.toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit', hour12: false });
  return `[${day} ${time}]`;
}
const prependNote = (existing, text) => [`${stampNow()} ${text}`, (existing || '').trim()].filter(Boolean).join('\n');

const rows = (await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Leads!A:AR' })).data.values || [];
const byTs = new Map();
rows.forEach((r, i) => {
  if (i > 0 && Number.isFinite(Date.parse(r[0] || ''))) byTs.set(r[0], { row: r, sheetRow: i + 1 });
});

// ── Fără --into: listează candidații ──────────────────────────────────────
if (!targets.length) {
  const open = [...byTs.values()].filter(({ row }) => !isHidden(row) && !isClosed(row));
  const seen = new Set();
  const groups = [];
  for (const a of open) {
    if (seen.has(a.row[COL.ts])) continue;
    const g = open.filter((b) => b !== a && sameClient(a.row, b.row));
    if (!g.length) continue;
    const all = [a, ...g].sort((x, y) => x.row[COL.ts].localeCompare(y.row[COL.ts]));
    all.forEach((x) => seen.add(x.row[COL.ts]));
    groups.push(all);
  }
  if (!groups.length) {
    console.log('Nicio cerere deschisă cu același telefon/email ca alta.');
    process.exit(0);
  }
  console.log(`${groups.length} ${groups.length === 1 ? 'grup' : 'grupuri'} de cereri de la același om:\n`);
  for (const g of groups) {
    for (const { row } of g) {
      console.log(`  ${row[COL.ts]}  ${roTime(row[COL.ts]).padEnd(14)} ${(row[COL.judet] || '').padEnd(12)} ${(row[COL.nume] || '').trim().padEnd(22)} firme: ${row[COL.firme] || '—'}`);
    }
    console.log(`  → node scripts/merge-leads.mjs --into ${g.map((x) => x.row[COL.ts]).join(' ')}`);
    console.log('    (primul = cel păstrat; schimbă ordinea dacă vrei altul canonic)\n');
  }
  process.exit(0);
}

// ── Cu --into: comasează ──────────────────────────────────────────────────
if (targets.length < 2) {
  console.error('Trebuie un timestamp canonic și cel puțin o retrimitere: --into <ts> <ts2> [...]');
  process.exit(1);
}
const [canonTs, ...dupTs] = targets;
const canon = byTs.get(canonTs);
if (!canon) { console.error(`Nu există cererea ${canonTs}`); process.exit(1); }
if (canon.row[COL.duplicatAl]) { console.error(`${canonTs} e ea însăși o retrimitere comasată în ${canon.row[COL.duplicatAl]}.`); process.exit(1); }
const dups = dupTs.map((ts) => {
  const d = byTs.get(ts);
  if (!d) { console.error(`Nu există cererea ${ts}`); process.exit(1); }
  if (ts === canonTs) { console.error('Canonicul nu poate fi și retrimitere.'); process.exit(1); }
  if (d.row[COL.duplicatAl]) { console.error(`${ts} e deja comasată în ${d.row[COL.duplicatAl]}.`); process.exit(1); }
  if (!sameClient(canon.row, d.row) && !FORCE) {
    console.error(`${ts} n-are același telefon/email cu ${canonTs}. Dacă e totuși același om, rulează cu --force.`);
    process.exit(1);
  }
  return d;
});

// Revendicările sunt legate de lead prin timestamp: una pe o retrimitere ar
// rămâne agățată de un rând ascuns, iar firma n-ar mai vedea cererea în portal.
const claimRows = (await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Revendicări!A:C' })).data.values || [];
const claimedDups = claimRows.filter((c) => dupTs.includes(c[1]));
if (claimedDups.length && !FORCE) {
  console.error('Retrimiteri cu revendicări existente (mută-le de mână pe canonic, apoi rulează cu --force):');
  for (const c of claimedDups) console.error(`  ${c[1]}  ${c[2]}`);
  process.exit(1);
}

const firms = joinFirms([...parseFirms(canon.row[COL.firme]), ...dups.flatMap((d) => parseFirms(d.row[COL.firme]))]);
const data = [];
const plan = [];
const cell = (sheetRow, idx, value) => data.push({ range: `Leads!${colLetter(idx)}${sheetRow}`, values: [[value]] });

if (firms !== (canon.row[COL.firme] || '')) {
  cell(canon.sheetRow, COL.firme, firms);
  plan.push(`canonic L (firme): „${canon.row[COL.firme] || ''}" → „${firms}"`);
}
for (const [idxStr, label] of Object.entries(FILL_COLS)) {
  const idx = Number(idxStr);
  if ((canon.row[idx] || '').trim()) continue;
  const src = dups.find((d) => (d.row[idx] || '').trim());
  if (!src) continue;
  cell(canon.sheetRow, idx, src.row[idx].trim());
  plan.push(`canonic ${colLetter(idx)} (${label}): gol → „${src.row[idx].trim()}" (din ${src.row[COL.ts]})`);
}
const when = dups.map((d) => roTime(d.row[COL.ts])).join(', ');
const canonNote = `Comasată: ${dups.length === 1 ? 'o retrimitere' : `${dups.length} retrimiteri`} ale aceleiași cereri (${when})${firms ? `; firme cerute, adunate: ${firms}` : ''}`;
cell(canon.sheetRow, COL.note, prependNote(canon.row[COL.note], canonNote));
plan.push(`canonic W (note): + „${canonNote}"`);
for (const d of dups) {
  cell(d.sheetRow, COL.status, 'Ascuns');
  cell(d.sheetRow, COL.duplicatAl, canonTs);
  cell(d.sheetRow, COL.note, prependNote(d.row[COL.note], `Retrimitere comasată în cererea din ${roTime(canonTs)} (${canonTs})`));
  plan.push(`${d.row[COL.ts]}: M → „Ascuns", Q → „${canonTs}", notă`);
}

console.log(`=== Comasare în ${canonTs} (${(canon.row[COL.nume] || '').trim()}, ${canon.row[COL.judet]}) ${APPLY ? '(APPLY)' : '(DRY RUN)'} ===\n`);
for (const p of plan) console.log(`  ${p}`);
if (!APPLY) {
  console.log('\nRulează cu --apply ca să scrii.');
  process.exit(0);
}
await sheets.spreadsheets.values.batchUpdate({
  spreadsheetId: SPREADSHEET_ID,
  requestBody: { valueInputOption: 'RAW', data },
});
console.log(`\n${data.length} celule scrise. Deschide /admin/crm: retrimiterile dispar, canonicul arată „+${dups.length}".`);
