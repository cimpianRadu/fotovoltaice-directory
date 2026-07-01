import { google } from 'googleapis';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

async function appendRow(sheetName: string, values: string[]) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
    // RAW (not USER_ENTERED): keep submitted text verbatim — phone numbers keep
    // their leading 0, and values starting with '=' can't become spreadsheet formulas.
    valueInputOption: 'RAW',
    requestBody: {
      values: [values],
    },
  });
}

async function readRows(sheetName: string): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  });

  return (res.data.values as string[][] | undefined) ?? [];
}

export async function saveLeadToSheet(lead: {
  numeCompanie?: string;
  numeContact: string;
  email: string;
  telefon: string;
  tipProiect: string;
  judet: string;
  suprafata?: string;
  putere?: string;
  mesaj?: string;
  sourcePage?: string;
  preselectedCompany?: string;
  segment?: string;
}) {
  await appendRow('Leads', [
    new Date().toISOString(),
    lead.numeCompanie || '',
    lead.numeContact,
    lead.email,
    lead.telefon,
    lead.tipProiect,
    lead.judet,
    lead.suprafata || '',
    lead.putere || '',
    lead.mesaj || '',
    lead.sourcePage || 'cere-oferta',
    lead.preselectedCompany || '',
    'Nou', // coloana Status
    lead.segment || 'comercial', // coloana Segment (trailing — nu mută coloanele existente)
  ]);
}

export async function saveListingToSheet(listing: {
  numeFirma: string;
  cui: string;
  numeContact: string;
  email: string;
  telefon: string;
  judet: string;
  functie?: string;
  website?: string;
  specializare?: string;
  segment?: string;
  descriere?: string;
  anreFirmName?: string;
  anreCerts?: string;
  anreStatus?: string;
}) {
  await appendRow('Listări', [
    new Date().toISOString(),
    listing.numeFirma,
    listing.cui,
    listing.numeContact,
    listing.functie || '',
    listing.email,
    listing.telefon,
    listing.judet,
    listing.website || '',
    listing.specializare || '',
    listing.descriere || '',
    'Nou', // coloana Status
    listing.anreStatus || '',
    listing.anreFirmName || '',
    listing.anreCerts || '',
    listing.segment || 'comercial', // coloana Segment (trailing)
  ]);
}

export interface NewLead {
  timestamp: string;
  numeCompanie: string;
  numeContact: string;
  email: string;
  telefon: string;
  tipProiect: string;
  judet: string;
  suprafata: string;
  putere: string;
  mesaj: string;
  sourcePage: string;
  preselectedCompany: string;
  status: string;
  segment: string;
}

export interface NewListing {
  timestamp: string;
  numeFirma: string;
  cui: string;
  numeContact: string;
  functie: string;
  email: string;
  telefon: string;
  judet: string;
  website: string;
  specializare: string;
  descriere: string;
  status: string;
  anreStatus: string;
  anreFirmName: string;
  anreCerts: string;
  segment: string;
}

// A row's first cell holds an ISO timestamp. Header rows / blanks won't parse —
// that doubles as the "skip the header" filter.
function isAfter(row: string[], cutoff: Date): boolean {
  const t = Date.parse(row[0] || '');
  return Number.isFinite(t) && t >= cutoff.getTime();
}

export async function getLeadsSince(cutoff: Date): Promise<NewLead[]> {
  const rows = await readRows('Leads');
  return rows.filter((r) => isAfter(r, cutoff)).map((r) => ({
    timestamp: r[0] || '',
    numeCompanie: r[1] || '',
    numeContact: r[2] || '',
    email: r[3] || '',
    telefon: r[4] || '',
    tipProiect: r[5] || '',
    judet: r[6] || '',
    suprafata: r[7] || '',
    putere: r[8] || '',
    mesaj: r[9] || '',
    sourcePage: r[10] || '',
    preselectedCompany: r[11] || '',
    status: r[12] || '',
    segment: r[13] || 'comercial',
  }));
}

export async function getListingsSince(cutoff: Date): Promise<NewListing[]> {
  const rows = await readRows('Listări');
  return rows.filter((r) => isAfter(r, cutoff)).map((r) => ({
    timestamp: r[0] || '',
    numeFirma: r[1] || '',
    cui: r[2] || '',
    numeContact: r[3] || '',
    functie: r[4] || '',
    email: r[5] || '',
    telefon: r[6] || '',
    judet: r[7] || '',
    website: r[8] || '',
    specializare: r[9] || '',
    descriere: r[10] || '',
    status: r[11] || '',
    anreStatus: r[12] || '',
    anreFirmName: r[13] || '',
    anreCerts: r[14] || '',
    segment: r[15] || 'comercial',
  }));
}

export async function saveWaitlistToSheet(email: string) {
  await appendRow('Waitlist', [
    new Date().toISOString(),
    email,
  ]);
}

export async function saveAdInquiryToSheet(inquiry: {
  tier: string;
  numeFirma: string;
  cui?: string;
  numeContact: string;
  email: string;
  telefon: string;
  judet?: string;
  website?: string;
  mesaj?: string;
}) {
  await appendRow('Publicitate', [
    new Date().toISOString(),
    inquiry.tier,
    inquiry.numeFirma,
    inquiry.cui || '',
    inquiry.numeContact,
    inquiry.email,
    inquiry.telefon,
    inquiry.judet || '',
    inquiry.website || '',
    inquiry.mesaj || '',
    'Nou',
  ]);
}

// ── Outreach routine support ───────────────────────────────────────────────
// A trailing "Email trimis" marker column, added after the existing columns so
// nothing shifts. Leads: column O (index 14). Listări: column Q (index 16).
// The routine writes an ISO timestamp there once a row is processed, and skips
// any row that already has it (idempotent, no duplicate emails).
const LEAD_EMAILED_COL = 'O';
const LEAD_EMAILED_IDX = 14;
const LISTING_EMAILED_COL = 'Q';
const LISTING_EMAILED_IDX = 16;

async function updateCell(sheetName: string, cell: string, value: string) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${cell}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[value]] },
  });
}

// Row index note: readRows returns values starting at the header (sheet row 1),
// so array index i maps to sheet row i + 1.
function isDateRow(row: string[]): boolean {
  return Number.isFinite(Date.parse(row[0] || ''));
}

export async function getUnprocessedLeads(): Promise<{ row: number; lead: NewLead }[]> {
  const rows = await readRows('Leads');
  const out: { row: number; lead: NewLead }[] = [];
  rows.forEach((r, i) => {
    if (!isDateRow(r)) return; // skip header + blanks
    if ((r[LEAD_EMAILED_IDX] || '').trim()) return; // already emailed
    out.push({
      row: i + 1,
      lead: {
        timestamp: r[0] || '', numeCompanie: r[1] || '', numeContact: r[2] || '',
        email: r[3] || '', telefon: r[4] || '', tipProiect: r[5] || '',
        judet: r[6] || '', suprafata: r[7] || '', putere: r[8] || '',
        mesaj: r[9] || '', sourcePage: r[10] || '', preselectedCompany: r[11] || '',
        status: r[12] || '', segment: r[13] || 'comercial',
      },
    });
  });
  return out;
}

export async function getUnprocessedListings(): Promise<{ row: number; listing: NewListing }[]> {
  const rows = await readRows('Listări');
  const out: { row: number; listing: NewListing }[] = [];
  rows.forEach((r, i) => {
    if (!isDateRow(r)) return;
    if ((r[LISTING_EMAILED_IDX] || '').trim()) return;
    out.push({
      row: i + 1,
      listing: {
        timestamp: r[0] || '', numeFirma: r[1] || '', cui: r[2] || '', numeContact: r[3] || '',
        functie: r[4] || '', email: r[5] || '', telefon: r[6] || '', judet: r[7] || '',
        website: r[8] || '', specializare: r[9] || '', descriere: r[10] || '',
        status: r[11] || '', anreStatus: r[12] || '', anreFirmName: r[13] || '',
        anreCerts: r[14] || '', segment: r[15] || 'comercial',
      },
    });
  });
  return out;
}

export async function markLeadEmailed(row: number): Promise<void> {
  await updateCell('Leads', `${LEAD_EMAILED_COL}${row}`, new Date().toISOString());
}

export async function markListingEmailed(row: number): Promise<void> {
  await updateCell('Listări', `${LISTING_EMAILED_COL}${row}`, new Date().toISOString());
}

// Append-only log of which firm received which lead, used to rotate fairly:
// next time we pick the firms contacted longest ago first.
async function ensureSheet(name: string): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = (meta.data.sheets || []).some((s) => s.properties?.title === name);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: name } } }] },
    });
  }
}

export async function logOutreach(
  entries: { leadRow: number; firmId: string; firmEmail: string }[]
): Promise<void> {
  if (entries.length === 0) return;
  await ensureSheet('LogOutreach');
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const now = new Date().toISOString();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'LogOutreach!A:A',
    valueInputOption: 'RAW',
    requestBody: {
      values: entries.map((e) => [now, String(e.leadRow), e.firmId, e.firmEmail]),
    },
  });
}

export async function getFirmLastContacted(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  let rows: string[][] = [];
  try {
    rows = await readRows('LogOutreach');
  } catch {
    return map; // tab not created yet
  }
  rows.forEach((r) => {
    const t = Date.parse(r[0] || '');
    const firmId = r[2] || '';
    if (!firmId || !Number.isFinite(t)) return;
    const prev = map.get(firmId) || 0;
    if (t > prev) map.set(firmId, t);
  });
  return map;
}
