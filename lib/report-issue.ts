/**
 * Rapoartele trimise din butonul cu gândac: un rând în tab-ul „Rapoarte” din
 * Google Sheets-ul proiectului. Rutina `rapoarte-erori` le citește de aici
 * (`scripts/reports.mjs`), le rezolvă și completează Status + Rezolvare.
 *
 * ⚠️ Fișier IDENTIC în gaseste-dentist, instalatori-fotovoltaice și
 * clinici-estetice. Nu importă din `lib/sheets.ts` (diferă între proiecte);
 * folosește aceleași variabile de mediu.
 */
import { google } from 'googleapis';

export const REPORT_SHEET = 'Rapoarte';

/** Ordinea coloanelor; `scripts/reports.mjs` le citește după nume, nu după poziție. */
export const REPORT_HEADER = [
  'ID',
  'Data',
  'Site',
  'Tip',
  'Despre',
  'Pagina',
  'Descriere',
  'Email',
  'Sursa',
  'Commit client',
  'Commit server',
  'Browser',
  'Ecran',
  'Limba / fus',
  'Erori JS',
  'Chat sid',
  'Status',
  'Rezolvare',
];

export interface ReportRow {
  id: string;
  at: string;
  site: string;
  kind: string;
  subject: string;
  path: string;
  description: string;
  email: string;
  source: string;
  clientCommit: string;
  serverCommit: string;
  userAgent: string;
  screen: string;
  locale: string;
  errors: string;
  chatSessionId: string;
}

function sheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

let ensured: Promise<void> | null = null;

async function ensureReportSheet(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      const sheets = sheetsClient();
      const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;
      const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
      const exists = (meta.data.sheets || []).some((s) => s.properties?.title === REPORT_SHEET);
      if (!exists) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests: [{ addSheet: { properties: { title: REPORT_SHEET } } }] },
        });
      } else {
        const head = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${REPORT_SHEET}!1:1` });
        if ((head.data.values?.[0]?.length || 0) >= REPORT_HEADER.length) return;
      }
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${REPORT_SHEET}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [REPORT_HEADER] },
      });
    })().catch((err) => {
      ensured = null; // la următorul raport mai încearcă
      throw err;
    });
  }
  return ensured;
}

export async function saveReportToSheet(r: ReportRow): Promise<void> {
  await ensureReportSheet();
  await sheetsClient().spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,
    range: `${REPORT_SHEET}!A:A`,
    // RAW: un text care începe cu „=” nu devine formulă.
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        r.id, r.at, r.site, r.kind, r.subject, r.path, r.description, r.email, r.source,
        r.clientCommit, r.serverCommit, r.userAgent, r.screen, r.locale, r.errors, r.chatSessionId,
        '', '',
      ]],
    },
  });
}

/** R-251118-K3F9: data + 4 caractere, ușor de citit la telefon. */
export function newReportId(now = new Date()): string {
  const d = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
  return `R-${d}-${rand}`;
}
