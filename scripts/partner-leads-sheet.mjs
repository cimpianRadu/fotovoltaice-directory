#!/usr/bin/env node
/**
 * Creează și sincronizează registrul de leaduri partajat cu o firmă parteneră.
 *
 * De ce un spreadsheet SEPARAT și nu încă un tab: în Google Sheets accesul se dă
 * pe fișier, nu pe tab. Un tab nou în registrul principal ar însemna că partenerul
 * vede tabul Leads (datele de contact ale TUTUROR clienților, inclusiv cererile pe
 * care nu le-a revendicat), Listări, Publicitate și Revendicări. În plus, tabul
 * Leads e sursa pentru /cereri, digest și outreach.mjs — scrisul manual acolo rupe
 * contractul de coloane (vezi incidentul cu coloana O, iulie 2026).
 *
 * Fișierul rezultat are două zone: coloanele A-N le scriem noi (protejate, se
 * resincronizează la fiecare rulare), coloanele O-U le completează partenerul.
 * Sincronizarea nu suprascrie NICIODATĂ zona lor: rândurile existente se
 * potrivesc după ID-ul cererii, iar cererile noi se adaugă la final.
 *
 * Tabul „Sumar" calculează singur rata de conversie și valoarea comisionului,
 * ca să nu depindă nimeni de un calcul făcut manual de cealaltă parte.
 *
 * Usage:
 *   # întâi: creezi manual un spreadsheet gol în Drive-ul tău, îl partajezi ca
 *   # Editor cu contul de serviciu, apoi îl înregistrezi aici o singură dată:
 *   node scripts/partner-leads-sheet.mjs --partner "JTS Instal Construct" --sheet-id <ID>
 *   # apoi, la fiecare sincronizare:
 *   node scripts/partner-leads-sheet.mjs --partner "JTS Instal Construct"
 *
 * Spreadsheetul e creat de om, nu de script, din două motive: Drive API nu e
 * activat în proiectul GCP, și oricum un fișier deținut de contul de serviciu ar
 * fi fragil (nu apare normal în Drive-ul nimănui și dispare odată cu contul).
 * Așa, proprietatea rămâne la tine.
 *
 * Idempotent: creează taburile lipsă, apoi adaugă doar cererile noi.
 * Maparea partener → spreadsheet se ține în data/partner-sheets.local.json (gitignored).
 *
 * NU partajează fișierul cu partenerul — doar cu proprietarul contului. Trimiterea
 * linkului rămâne o decizie manuală.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MAP_PATH = path.join(ROOT, 'data', 'partner-sheets.local.json');

// ---------- args ----------
const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback;
};
const PARTNER = arg('partner');
const COMMISSION = Number(arg('commission', '5'));
const SHEET_ID_ARG = arg('sheet-id');
const DRY = argv.includes('--dry-run');

if (!PARTNER) {
  console.error('Lipsește --partner "Nume Firmă"');
  process.exit(1);
}

// ---------- env ----------
function loadEnv() {
  const raw = readFileSync(path.join(ROOT, '.env.local'), 'utf8');
  const out = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}
const env = loadEnv();
const SOURCE_ID = env.GOOGLE_SHEETS_SPREADSHEET_ID;

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// ---------- etichete (oglindesc lib/utils-shared.ts) ----------
const PROJECT_LABELS = {
  'hala-industriala': 'Hală industrială', 'cladire-birouri': 'Clădire de birouri',
  'parc-logistic': 'Parc logistic', agricol: 'Agricol', retail: 'Retail',
  hotel: 'Hotel / Pensiune', institutie: 'Instituție publică',
  'casa-individuala': 'Casă individuală', vila: 'Vilă',
  'casa-vacanta': 'Casă de vacanță', apartament: 'Apartament / bloc', altele: 'Alt tip',
};
const ROOF_LABELS = {
  'tigla-ceramica': 'Țiglă ceramică/beton', tabla: 'Tablă', 'tabla-cutata': 'Tablă cutată',
  'panouri-sandwich': 'Panouri sandwich', terasa: 'Terasă cu membrană', beton: 'Planșeu beton',
  sindrila: 'Șindrilă bituminoasă', azbociment: 'Azbociment', 'la-sol': 'La sol',
  carport: 'Carport', 'nu-stiu': 'Nespecificat',
};
const PHASE_LABELS = { monofazat: 'Monofazat', trifazat: 'Trifazat', 'nu-stiu': 'Nu știe' };

const STATUS_OPTIONS = [
  'Nou', 'Contactat', 'Ofertat', 'Acceptat', 'Montat', 'Refuzat', 'Fără răspuns',
];

// Coloanele noastre (A-N) — resincronizate la fiecare rulare.
const OURS = [
  'ID cerere', 'Data cererii', 'Segment', 'Județ', 'Tip proiect', 'Putere (kW)',
  'Suprafață (mp)', 'Tip acoperiș', 'Alimentare', 'Consum lunar', 'Client',
  'Telefon', 'Email', 'Mesaj client',
];
// Coloanele partenerului (O-U) — noi nu scriem niciodată aici.
const THEIRS = [
  'Status', 'Data ofertă', 'Sumă ofertă (lei)', 'Data montaj',
  'Sumă montaj final (lei)', 'Motiv (dacă nu s-a închis)', 'Observații',
];
const HEADER = [...OURS, ...THEIRS];
const FIRST_THEIR_COL = OURS.length; // index 0-based al coloanei O

function fmtDate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('ro-RO', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Bucharest',
  });
}

function leadToRow(r) {
  return [
    r[0] || '',                                   // A  ID (timestamp = cheia de join)
    fmtDate(r[0] || ''),                          // B
    r[13] || 'comercial',                         // C
    r[6] || '',                                   // D
    PROJECT_LABELS[r[5]] || r[5] || '',           // E
    r[8] || '',                                   // F
    r[7] || '',                                   // G
    ROOF_LABELS[r[18]] || r[18] || '',            // H
    PHASE_LABELS[r[19]] || r[19] || '',           // I
    r[20] || '',                                  // J
    [r[2], r[1]].filter(Boolean).join(' · '),     // K  contact · companie
    r[4] || '',                                   // L
    r[3] || '',                                   // M
    r[9] || '',                                   // N
  ];
}

// ---------- citește cererile din registrul principal ----------
const srcRows = (await sheets.spreadsheets.values.get({
  spreadsheetId: SOURCE_ID, range: 'Leads!A:Z',
})).data.values || [];
const leads = srcRows.filter((r) => /^\d{4}-\d{2}-\d{2}T/.test(r[0] || ''));
console.log(`Registru sursă: ${leads.length} cereri.`);

// ---------- mapare partener → spreadsheet ----------
const map = existsSync(MAP_PATH) ? JSON.parse(readFileSync(MAP_PATH, 'utf8')) : {};
let sheetId = SHEET_ID_ARG || map[PARTNER]?.spreadsheetId || null;

if (DRY) {
  console.log(`[dry-run] partener="${PARTNER}", comision=${COMMISSION}%`);
  console.log(`[dry-run] spreadsheet: ${sheetId || '(neînregistrat — rulează întâi cu --sheet-id)'}`);
  console.log(`[dry-run] coloane: ${OURS.length} ale noastre + ${THEIRS.length} ale lor`);
  console.log(`[dry-run] s-ar scrie ${leads.length} rânduri`);
  process.exit(0);
}

if (!sheetId) {
  console.error(`
Niciun spreadsheet înregistrat pentru „${PARTNER}".

Creează-l tu (rămâne al tău, nu al contului de serviciu):
  1. Drive → spreadsheet nou, numește-l „Leaduri ${PARTNER}"
  2. Share → adaugă ca Editor: ${env.GOOGLE_SERVICE_ACCOUNT_EMAIL}
  3. Copiază ID-ul din URL: docs.google.com/spreadsheets/d/<ID>/edit
  4. node scripts/partner-leads-sheet.mjs --partner "${PARTNER}" --sheet-id <ID>
`);
  process.exit(1);
}

let meta;
try {
  meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
} catch (err) {
  const code = err.code || err.status;
  console.error(`\nNu pot deschide spreadsheetul ${sheetId} (${code}).`);
  if (code === 403) console.error(`Partajează-l ca Editor cu: ${env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`);
  if (code === 404) console.error('ID greșit sau fișier șters.');
  process.exit(1);
}
console.log(`Spreadsheet: „${meta.data.properties.title}"`);

// Un spreadsheet creat manual are un singur tab („Sheet1"/„Foaie1"). Creăm ce lipsește.
const findTab = (t) => meta.data.sheets.find((s) => s.properties.title === t)?.properties.sheetId;
const missing = ['Cereri', 'Sumar'].filter((t) => findTab(t) === undefined);
const isNew = missing.includes('Cereri');

if (missing.length) {
  console.log(`+ Creez taburile lipsă: ${missing.join(', ')}…`);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        // Locale-ul decide separatorul de argumente din formule (ro_RO → „;").
        // Fișierul fiind creat manual, ar putea veni pe en_US și formulele din
        // tabul Sumar ar fi respinse. Îl fixăm ca să nu depindem de setarea lui.
        {
          updateSpreadsheetProperties: {
            properties: { locale: 'ro_RO', timeZone: 'Europe/Bucharest' },
            fields: 'locale,timeZone',
          },
        },
        ...missing.map((title) => ({
          addSheet: {
            properties: title === 'Cereri'
              ? { title, gridProperties: { rowCount: 2000, columnCount: HEADER.length, frozenRowCount: 1, frozenColumnCount: 1 } }
              : { title, gridProperties: { rowCount: 40, columnCount: 4 } },
          },
        })),
      ],
    },
  });
  meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
}

const CERERI_ID = findTab('Cereri');
const SUMAR_ID = findTab('Sumar');

if (map[PARTNER]?.spreadsheetId !== sheetId) {
  map[PARTNER] = { spreadsheetId: sheetId, commissionPct: COMMISSION, registeredAt: new Date().toISOString() };
  writeFileSync(MAP_PATH, JSON.stringify(map, null, 2) + '\n');
  console.log(`  înregistrat în ${path.relative(ROOT, MAP_PATH)}`);
}

// ---------- sincronizare fără să atingem zona partenerului ----------
const existing = (await sheets.spreadsheets.values.get({
  spreadsheetId: sheetId, range: 'Cereri!A:A',
})).data.values || [];
const seen = new Set(existing.slice(1).map((r) => r[0]).filter(Boolean));

const fresh = leads.filter((r) => !seen.has(r[0]));
const stale = leads.filter((r) => seen.has(r[0]));

if (isNew) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId, range: 'Cereri!A1',
    valueInputOption: 'RAW', requestBody: { values: [HEADER] },
  });
}

// Rândurile deja prezente: reîmprospătăm DOAR A-N, ca să nu ștergem ce au completat.
if (stale.length) {
  const rowIndexById = new Map(existing.slice(1).map((r, i) => [r[0], i + 2]));
  const data = stale.map((r) => ({
    range: `Cereri!A${rowIndexById.get(r[0])}:N${rowIndexById.get(r[0])}`,
    values: [leadToRow(r)],
  }));
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: { valueInputOption: 'RAW', data },
  });
  console.log(`↻ ${stale.length} rânduri existente resincronizate (doar A-N).`);
}

if (fresh.length) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId, range: 'Cereri!A:A',
    valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS',
    requestBody: { values: fresh.map(leadToRow) },
  });
  console.log(`+ ${fresh.length} cereri noi adăugate.`);
} else {
  console.log('Nicio cerere nouă.');
}

const lastRow = 1 + leads.length;

// ---------- formatare, validare, protecție (doar la creare) ----------
if (isNew) {
  console.log('+ Formatare, dropdown de status, protecția coloanelor noastre…');
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        // Header
        {
          repeatCell: {
            range: { sheetId: CERERI_ID, startRowIndex: 0, endRowIndex: 1 },
            cell: { userEnteredFormat: { backgroundColor: { red: 0.12, green: 0.23, blue: 0.37 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        },
        // Zona partenerului: fundal ambru deschis, ca să se vadă unde scrie
        {
          repeatCell: {
            range: { sheetId: CERERI_ID, startRowIndex: 0, endRowIndex: 1, startColumnIndex: FIRST_THEIR_COL, endColumnIndex: HEADER.length },
            cell: { userEnteredFormat: { backgroundColor: { red: 0.96, green: 0.62, blue: 0.04 }, textFormat: { bold: true, foregroundColor: { red: 0.1, green: 0.1, blue: 0.1 } } } },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        },
        {
          repeatCell: {
            range: { sheetId: CERERI_ID, startRowIndex: 1, startColumnIndex: FIRST_THEIR_COL, endColumnIndex: HEADER.length },
            cell: { userEnteredFormat: { backgroundColor: { red: 1, green: 0.98, blue: 0.92 } } },
            fields: 'userEnteredFormat(backgroundColor)',
          },
        },
        // Dropdown pe Status (coloana O)
        {
          setDataValidation: {
            range: { sheetId: CERERI_ID, startRowIndex: 1, startColumnIndex: FIRST_THEIR_COL, endColumnIndex: FIRST_THEIR_COL + 1 },
            rule: {
              condition: { type: 'ONE_OF_LIST', values: STATUS_OPTIONS.map((v) => ({ userEnteredValue: v })) },
              showCustomUi: true, strict: false,
            },
          },
        },
        // Sume: format monetar
        {
          repeatCell: {
            range: { sheetId: CERERI_ID, startRowIndex: 1, startColumnIndex: FIRST_THEIR_COL + 2, endColumnIndex: FIRST_THEIR_COL + 3 },
            cell: { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern: '#,##0 "lei"' } } },
            fields: 'userEnteredFormat.numberFormat',
          },
        },
        {
          repeatCell: {
            range: { sheetId: CERERI_ID, startRowIndex: 1, startColumnIndex: FIRST_THEIR_COL + 4, endColumnIndex: FIRST_THEIR_COL + 5 },
            cell: { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern: '#,##0 "lei"' } } },
            fields: 'userEnteredFormat.numberFormat',
          },
        },
        // Protejăm A-N: partenerul poate citi, dar nu poate rupe cheia de join.
        {
          addProtectedRange: {
            protectedRange: {
              range: { sheetId: CERERI_ID, startColumnIndex: 0, endColumnIndex: OURS.length },
              description: 'Date sincronizate automat din instalatori-fotovoltaice.ro',
              warningOnly: true,
            },
          },
        },
        { autoResizeDimensions: { dimensions: { sheetId: CERERI_ID, dimension: 'COLUMNS', startIndex: 0, endIndex: HEADER.length } } },
      ],
    },
  });

  // ---------- tabul Sumar ----------
  const R = `Cereri!$O$2:$O`;
  const sumar = [
    ['Sumar', ''],
    ['', ''],
    ['Cereri primite', `=COUNTA(Cereri!$A$2:$A)`],
    ['Ofertate', `=COUNTIF(${R};"Ofertat")+COUNTIF(${R};"Acceptat")+COUNTIF(${R};"Montat")`],
    ['Acceptate', `=COUNTIF(${R};"Acceptat")+COUNTIF(${R};"Montat")`],
    ['Montate', `=COUNTIF(${R};"Montat")`],
    ['', ''],
    ['Rata de conversie (montaje / cereri)', `=IFERROR(B6/B3;0)`],
    ['', ''],
    ['Valoare totală montaje', `=SUM(Cereri!$S$2:$S)`],
    // Scris ca „*5/100", nu „*0.05": pe locale ro_RO separatorul zecimal e
    // virgula, iar un punct în formulă dă Formula parse error.
    [`Comision ${COMMISSION}%`, `=B10*${COMMISSION}/100`],
    ['', ''],
    ['Actualizat', new Date().toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' })],
  ];
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId, range: 'Sumar!A1',
    valueInputOption: 'USER_ENTERED', requestBody: { values: sumar },
  });
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        { repeatCell: { range: { sheetId: SUMAR_ID, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } }, fields: 'userEnteredFormat.textFormat' } },
        { repeatCell: { range: { sheetId: SUMAR_ID, startRowIndex: 7, endRowIndex: 8, startColumnIndex: 1, endColumnIndex: 2 }, cell: { userEnteredFormat: { numberFormat: { type: 'PERCENT', pattern: '0.0%' }, textFormat: { bold: true } } }, fields: 'userEnteredFormat(numberFormat,textFormat)' } },
        { repeatCell: { range: { sheetId: SUMAR_ID, startRowIndex: 9, endRowIndex: 11, startColumnIndex: 1, endColumnIndex: 2 }, cell: { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern: '#,##0 "lei"' }, textFormat: { bold: true } } }, fields: 'userEnteredFormat(numberFormat,textFormat)' } },
        { autoResizeDimensions: { dimensions: { sheetId: SUMAR_ID, dimension: 'COLUMNS', startIndex: 0, endIndex: 2 } } },
      ],
    },
  });
} else {
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId, range: 'Sumar!B13',
    valueInputOption: 'RAW',
    requestBody: { values: [[new Date().toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' })]] },
  });
}

console.log(`\n✓ Gata. ${lastRow - 1} cereri în registru.`);
console.log(`  https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
console.log(`  Scriptul NU partajează fișierul cu partenerul — dă-i acces manual când vrei.`);
