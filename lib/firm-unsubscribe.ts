// Registrul de dezabonări al firmelor (17 oct 2026), tabul „Dezabonări Firme".
// Cine se dezabonează nu mai primește nici rezumatul de luni, nici alertele pe
// județ. Dacă bifează din nou județe în portal, a cerut emailurile înapoi: se
// scrie un rând `reabonat`. Ultimul rând al adresei decide.
//
// Acces propriu la Sheets, nu prin lib/sheets: e un tab mic, citit și din
// lib/email.ts la fiecare alertă, iar lib/sheets trage tot registrul de cereri
// după el.

import { google } from 'googleapis';

const SHEET = 'Dezabonări Firme';
const HEADER = ['Data', 'Email', 'Stare', 'Sursă'];
const CACHE_MS = 60_000;

let cache: { at: number; emails: Set<string> } | null = null;

function client() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

const SPREADSHEET_ID = () => process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

async function readRows(): Promise<string[][] | null> {
  try {
    const res = await client().spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID(), range: `'${SHEET}'!A:D` });
    return (res.data.values as string[][] | undefined) ?? [];
  } catch (err) {
    // Tabul nu există încă: nimeni nu s-a dezabonat.
    if ((err as { code?: number }).code === 400) return null;
    throw err;
  }
}

/**
 * Adresele dezabonate acum. La o eroare de citire întoarce lista din cache sau
 * goală: un Sheets picat nu oprește alertele tuturor firmelor. Se vede în loguri.
 */
export async function getUnsubscribedEmails(): Promise<Set<string>> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.emails;
  try {
    const rows = (await readRows()) ?? [];
    const last = new Map<string, string>();
    for (const r of rows.slice(1)) {
      const email = (r[1] || '').trim().toLowerCase();
      if (email) last.set(email, (r[2] || '').trim());
    }
    const emails = new Set([...last].filter(([, stare]) => stare === 'dezabonat').map(([e]) => e));
    cache = { at: Date.now(), emails };
    return emails;
  } catch (err) {
    console.error('[dezabonare] citire registru:', err);
    return cache?.emails ?? new Set();
  }
}

export async function isUnsubscribed(email: string): Promise<boolean> {
  return (await getUnsubscribedEmails()).has(email.trim().toLowerCase());
}

async function append(values: string[]) {
  const sheets = client();
  if ((await readRows()) === null) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID(),
      requestBody: { requests: [{ addSheet: { properties: { title: SHEET } } }] },
    });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID(),
      range: `'${SHEET}'!A:A`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER] },
    });
  }
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID(),
    range: `'${SHEET}'!A:A`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  });
  cache = null;
}

/** `sursa`: „pagina" (butonul de pe /dezabonare) sau „one-click" (butonul clientului de email). */
export async function recordUnsubscribe(email: string, sursa: string) {
  await append([new Date().toISOString(), email.trim().toLowerCase(), 'dezabonat', sursa]);
}

/** Firma a bifat din nou județe în portal. Scrie doar dacă era dezabonată. */
export async function recordResubscribeIfNeeded(email: string) {
  if (!(await isUnsubscribed(email))) return;
  await append([new Date().toISOString(), email.trim().toLowerCase(), 'reabonat', 'portal']);
}
