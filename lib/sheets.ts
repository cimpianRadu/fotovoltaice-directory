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
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values],
    },
  });
}

export async function saveLeadToSheet(lead: {
  numeCompanie: string;
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
}) {
  await appendRow('Leads', [
    new Date().toISOString(),
    lead.numeCompanie,
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
  descriere?: string;
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
  ]);
}

export async function saveWaitlistToSheet(email: string) {
  await appendRow('Waitlist', [
    new Date().toISOString(),
    email,
  ]);
}
