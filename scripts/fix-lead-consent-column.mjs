// One-shot repair for the 20-23 July 2026 column collision.
//
// saveLeadToSheet wrote the GDPR consent string („da (v2-2026-07-20)") into
// Leads column O, which scripts/outreach.mjs uses as its „Email trimis" marker.
// Every lead submitted in that window was therefore born already marked as sent,
// so the daily routine reported „0 neprocesate" and nobody was contacted.
//
// lib/sheets.ts now writes consent to column R. This moves the consent values
// already stranded in O over to R and clears O, so those rows become unprocessed
// again and the outreach run does not overwrite the GDPR proof.
//
// Dry-run by default; pass --apply to write.
//
//   node scripts/fix-lead-consent-column.mjs           # preview
//   node scripts/fix-lead-consent-column.mjs --apply   # write

import { readFileSync } from 'node:fs';
import { google } from 'googleapis';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const APPLY = process.argv.includes('--apply');
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const MARKER_COL = 'O', MARKER_IDX = 14;
const CONSENT_COL = 'R', CONSENT_IDX = 17;
const isConsent = (v) => /^da\s*\(v\d/i.test((v || '').trim());

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Leads!A:Z' });
const rows = res.data.values || [];

const targets = [];
rows.forEach((r, i) => {
  if (!isConsent(r[MARKER_IDX])) return;
  targets.push({ row: i + 1, consent: r[MARKER_IDX].trim(), contact: r[2] || '', judet: r[6] || '', existing: (r[CONSENT_IDX] || '').trim() });
});

console.log(`=== FIX consimțământ Leads!${MARKER_COL} → ${CONSENT_COL} ${APPLY ? '(APPLY)' : '(DRY RUN)'} ===\n`);
if (!targets.length) { console.log('Niciun rând afectat. Nimic de făcut.'); process.exit(0); }

for (const t of targets) {
  console.log(`  rând ${t.row}: ${t.contact} (${t.judet}) — „${t.consent}" ${MARKER_COL} → ${CONSENT_COL}${t.existing ? ` [${CONSENT_COL} avea deja „${t.existing}", nu suprascriu]` : ''}, ${MARKER_COL} golit`);
  if (!APPLY) continue;
  if (!t.existing) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID, range: `Leads!${CONSENT_COL}${t.row}`,
      valueInputOption: 'RAW', requestBody: { values: [[t.consent]] },
    });
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID, range: `Leads!${MARKER_COL}${t.row}`,
    valueInputOption: 'RAW', requestBody: { values: [['']] },
  });
}

if (APPLY) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID, range: `Leads!${CONSENT_COL}1`,
    valueInputOption: 'RAW', requestBody: { values: [['Consimțământ GDPR']] },
  });
  console.log(`\n${targets.length} rânduri reparate. Redevin neprocesate pentru outreach.`);
} else {
  console.log(`\n${targets.length} rânduri ar fi reparate. Rulează cu --apply ca să scrii.`);
}
