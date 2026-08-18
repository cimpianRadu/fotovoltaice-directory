import {
  LEAD_STATUSES,
  CONTACT_STATES,
  CLAIM_SOURCES,
  FIRM_STATUSES,
  clearsOfferMark,
  deriveClaimStatus,
  isLeadClosed,
  isSameFirm,
  type LeadStatus,
  type ContactState,
  type LeadNote,
  type ClaimSource,
  type ClaimStatus,
  type FirmStatus,
} from './sheets-shared';
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

/**
 * Sheets limitează cererile la 60 de citiri pe minut per utilizator, iar noi
 * consumăm 3 la fiecare încărcare de /admin/crm (care e force-dynamic, deci
 * fiecare click pe un filtru e o încărcare nouă). Peste limită, API-ul răspunde
 * 429 și pagina rămânea cu o bandă roșie în loc de date. Un 429 nu e o eroare
 * de aplicație, e „mai încearcă", deci îl tratăm ca atare în loc să-l arătăm.
 */
async function withRetry<T>(op: () => Promise<T>, label: string): Promise<T> {
  const DELAYS_MS = [400, 1200, 3000];
  for (let attempt = 0; ; attempt++) {
    try {
      return await op();
    } catch (err) {
      const status = (err as { code?: number; status?: number }).code
        ?? (err as { status?: number }).status;
      const retriable = status === 429 || status === 503;
      if (!retriable || attempt >= DELAYS_MS.length) throw err;
      console.warn(`[sheets] ${label}: ${status}, reîncerc în ${DELAYS_MS[attempt]}ms`);
      await new Promise((r) => setTimeout(r, DELAYS_MS[attempt]));
    }
  }
}

async function appendRow(sheetName: string, values: string[]) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  await withRetry(() => sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
    // RAW (not USER_ENTERED): keep submitted text verbatim — phone numbers keep
    // their leading 0, and values starting with '=' can't become spreadsheet formulas.
    valueInputOption: 'RAW',
    requestBody: {
      values: [values],
    },
  }), `append ${sheetName}`);
}

async function readRows(sheetName: string): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const res = await withRetry(
    () =>
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        // A:AF, nu A:Z — coloanele de lead au trecut de Z în aug 2026 (Z–AD:
        // localitate, stocare, wallbox, termen, poze; AE–AF: fereastra de
        // prioritate și marcajul de alerte). Celelalte taburi au mai puține
        // coloane, range-ul mai lat nu le afectează.
        range: `${sheetName}!A:AF`,
      }),
    `read ${sheetName}`,
  );

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
  gdprConsent?: string;
  tipAcoperis?: string;
  fazare?: string;
  consumLunar?: string;
  finantare?: string;
  localitate?: string;
  stocare?: string;
  wallbox?: string;
  termen?: string;
}): Promise<string> {
  const timestamp = new Date().toISOString();
  await appendRow('Leads', [
    timestamp,
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
    lead.segment || 'comercial', // N — Segment (trailing — nu mută coloanele existente)
    '', // O — „Email trimis", marcaj rezervat scripts/outreach.mjs. NU scrie aici:
    //     orice text non-gol face scriptul să creadă că leadul e deja procesat.
    '', // P — Mesaj ascuns (completat separat, vezi getLeadsSince)
    '', // Q — liber
    lead.gdprConsent || '', // R — Consimțământ GDPR
    lead.tipAcoperis || '',  // S — Tip acoperiș
    lead.fazare || '',       // T — Alimentare (mono/trifazat)
    lead.consumLunar || '',  // U — Consum lunar declarat
    '', // V — Status CRM: gol = „Nouă" (vezi readCrmFields). Se scrie din /admin/crm.
    '', // W — Note CRM
    '', // X — Contactat de o firmă
    lead.finantare || '',    // Y — Ruta de finanțare declarată de client
    lead.localitate || '',   // Z — Localitatea (aug 2026). NU apare în feedul public.
    lead.stocare || '',      // AA — Baterie de stocare (da/nu/nu-stiu)
    lead.wallbox || '',      // AB — Stație de încărcare auto (da/nu/nu-stiu)
    lead.termen || '',       // AC — Termen dorit de instalare
    // AD — Poze: link Drive lipit manual (pozele vin pe email, după ref din
    // subiect). Coloana nu se scrie de aici niciodată.
  ]);
  return timestamp;
}

// Detaliile pe care nu le mai cerem înainte de trimitere (vezi app/api/leads),
// completate ulterior de pe ecranul de confirmare. Cheia = numele câmpului din
// formular, valoarea = coloana din tabul Leads. Aceleași coloane pe care le-ar
// fi scris saveLeadToSheet, ca să nu existe două adevăruri.
const LEAD_ENRICH_COLUMNS = {
  suprafata: 'H',
  putere: 'I',
  tipAcoperis: 'S',
  fazare: 'T',
  consumLunar: 'U',
  finantare: 'Y',
  localitate: 'Z',
  stocare: 'AA',
  wallbox: 'AB',
  termen: 'AC',
} as const;

export type LeadEnrichField = keyof typeof LEAD_ENRICH_COLUMNS;

export const LEAD_ENRICH_FIELDS = Object.keys(LEAD_ENRICH_COLUMNS) as LeadEnrichField[];

/**
 * Completează detaliile opționale pe o cerere deja salvată, identificată prin
 * timestamp. Scrie doar câmpurile primite cu valoare: nimic din ce trimite
 * clientul nu poate goli o celulă completată, ca un al doilea submit parțial
 * (revenire pe pagină, dublu click) să nu șteargă ce s-a strâns înainte.
 * Întoarce lista câmpurilor chiar scrise.
 */
export async function enrichLeadInSheet(
  timestamp: string,
  fields: Partial<Record<LeadEnrichField, string>>,
): Promise<LeadEnrichField[]> {
  const { sheetRow } = await findLeadRow(timestamp);

  const data: { range: string; values: string[][] }[] = [];
  const written: LeadEnrichField[] = [];

  for (const field of LEAD_ENRICH_FIELDS) {
    const value = (fields[field] || '').trim();
    if (!value) continue;
    data.push({ range: `Leads!${LEAD_ENRICH_COLUMNS[field]}${sheetRow}`, values: [[value]] });
    written.push(field);
  }

  if (!data.length) return [];

  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  await withRetry(
    () =>
      sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { valueInputOption: 'RAW', data },
      }),
    'enrich lead',
  );

  return written;
}

/** Coloanele scrise de fluxul de alerte, pe cerere deja salvată. */
async function setLeadCell(timestamp: string, column: 'AE' | 'AF', value: string) {
  const { sheetRow } = await findLeadRow(timestamp);
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  await withRetry(
    () =>
      sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Leads!${column}${sheetRow}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[value]] },
      }),
    `update lead ${column}`,
  );
}

/** Rezervă cererea pentru abonatul pe județ, până la ISO-ul dat. */
export async function markLeadPriorityUntil(timestamp: string, until: string) {
  await setLeadCell(timestamp, 'AE', until);
}

/** Marchează că alertele către firmele cu județul bifat au plecat. */
export async function markLeadAlertsSent(timestamp: string, at = new Date().toISOString()) {
  await setLeadCell(timestamp, 'AF', at);
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
  // Coloana P din sheet: orice valoare non-goală scoate mesajul din feedul
  // public /cereri (fără să ascundă cererea) — override manual pentru mesaje
  // cu date personale pe care redactarea automată nu le prinde.
  mesajAscuns: string;
  // S/T/U — detalii de ofertare cerute de instalatori (iulie 2026). Goale pe
  // toate cererile de dinainte de adăugarea câmpurilor în formular.
  tipAcoperis: string;
  fazare: string;
  consumLunar: string;
  // V/W/X — pipeline-ul de CRM, scrise doar din /admin/crm. Vezi updateLeadCrm.
  crmStatus: LeadStatus;
  notes: LeadNote[];
  contactedByFirm: ContactState;
  // Y — ruta de finanțare, adăugată în formular pe 29 iulie 2026. Goală pe
  // cererile anterioare. Vezi FINANCING_* din lib/utils-shared.
  finantare: string;
  // Z–AC — câmpurile de ofertare din aug 2026 (localitate, baterie, wallbox,
  // termen). Goale pe cererile anterioare. Localitatea NU se publică pe /cereri.
  localitate: string;
  stocare: string;
  wallbox: string;
  termen: string;
  // AD — link Drive cu pozele trimise de client pe email (legate după ref din
  // subiect). Se lipește manual în Sheet; gol = fără poze.
  poze: string;
  // AE — ISO până când cererea e rezervată abonatului pe județ: nu apare pe
  // /cereri și nu poate fi revendicată de altcineva. Gol = fără rezervare.
  // Golirea celulei eliberează cererea imediat, e pârghia manuală.
  prioritarPanaLa: string;
  // AF — ISO când au plecat alertele către firmele cu județul bifat. Marcajul
  // ține alertele idempotente: cererile rezervate îl primesc abia după ce
  // expiră fereastra, prin cronul zilnic.
  alerteTrimise: string;
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
    // r[14] = marcaj „Email trimis" (scripts/outreach.mjs), r[17] = consimțământ GDPR
    mesajAscuns: r[15] || '',
    tipAcoperis: r[18] || '',
    fazare: r[19] || '',
    consumLunar: r[20] || '',
    finantare: r[24] || '',
    localitate: r[25] || '',
    stocare: r[26] || '',
    wallbox: r[27] || '',
    termen: r[28] || '',
    poze: r[29] || '',
    prioritarPanaLa: r[30] || '',
    alerteTrimise: r[31] || '',
    ...readCrmFields(r),
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

// --- Cereri publice (/cereri) + revendicări ---

export const MAX_CLAIMS_PER_LEAD = 3;

// Anonimizat prin construcție: tipul nu conține nume, email, telefon sau
// companie. Mesajul apare DOAR trecut prin sanitizeMesajPublic (redactare +
// trunchiere) și poate fi retras per lead prin coloana MesajAscuns.
export interface PublicLead {
  id: string; // ISO timestamp al rândului — unic, folosit ca referință la revendicare
  tipProiect: string;
  judet: string;
  suprafata: string;
  putere: string;
  segment: string;
  mesaj: string;
  // Detalii de ofertare. Publice intenționat: nu identifică persoana, dar sunt
  // exact ce decide o firmă dacă merită să revendice. Contactul rămâne privat.
  tipAcoperis: string;
  fazare: string;
  consumLunar: string;
  // Public intenționat: e câmpul care decide dacă o firmă sună azi sau nu.
  finantare: string;
  // Aug 2026, tot detalii de ofertare. Localitatea lipsește INTENȚIONAT:
  // localitate mică + detalii de proiect pot identifica persoana; județul e
  // destul pentru decizia de revendicare, localitatea vine cu contactul.
  stocare: string;
  wallbox: string;
  termen: string;
  // Doar semnal (există/nu există) — pozele în sine se trimit firmei, nu public.
  arePoze: boolean;
}

// Redactare pentru afișarea publică a mesajului: emailuri, URL-uri și șiruri
// de 8+ cifre (telefoane, CNP) sunt eliminate; numele/adresele scrise în text
// liber NU pot fi prinse aici — pentru ele există coloana MesajAscuns.
const REDACT_PATTERNS: RegExp[] = [
  /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,
  /(?:https?:\/\/|www\.)\S+/gi,
  /\+?\d(?:[\s.\-()]*\d){7,}/g,
];
const MESAJ_PUBLIC_MAX = 200;

export function sanitizeMesajPublic(mesaj: string): string {
  let out = mesaj;
  for (const p of REDACT_PATTERNS) out = out.replace(p, '[eliminat]');
  out = out.replace(/\s+/g, ' ').trim();
  if (out.length > MESAJ_PUBLIC_MAX) {
    out = `${out.slice(0, MESAJ_PUBLIC_MAX).replace(/\s+\S*$/, '')}…`;
  }
  return out;
}

function isPubliclyVisible(l: NewLead): boolean {
  // Status „Ascuns" în sheet = scos manual din feedul public (lead vândut
  // exclusiv, spam, test). Orice alt status rămâne vizibil.
  return l.status !== 'Ascuns';
}

// Vizibil ȘI încă de dat: statusul de CRM (coloana V) scoate din feed cererile
// pe care clientul nu le mai are — vezi LEAD_CLOSED_STATUSES.
function isOpenForClaims(l: NewLead): boolean {
  return isPubliclyVisible(l) && !isLeadClosed(l.crmStatus);
}

/**
 * Ce vede feedul public: cererile deschise, MINUS cele aflate în fereastra de
 * prioritate a unui abonat. Obligație contractuală, nu preferință de produs —
 * în fereastra aia cererea nu se publică și nu se dă nimănui altcuiva.
 */
function isPubliclyClaimable(l: NewLead): boolean {
  return isOpenForClaims(l) && !isPriorityHeld(l);
}

// Toate cererile, indiferent de vechime — la volumul actual feedul afișează
// istoricul complet, cu filtru de vechime în UI. De restrâns când crește volumul.
export async function getPublicLeads(): Promise<PublicLead[]> {
  const leads = await getLeadsSince(new Date(0));
  return leads
    .filter(isPubliclyClaimable)
    .map((l) => ({
      id: l.timestamp,
      tipProiect: l.tipProiect,
      judet: l.judet,
      suprafata: l.suprafata,
      putere: l.putere,
      segment: l.segment,
      mesaj: l.mesajAscuns ? '' : sanitizeMesajPublic(l.mesaj),
      tipAcoperis: l.tipAcoperis,
      fazare: l.fazare,
      consumLunar: l.consumLunar,
      finantare: l.finantare,
      stocare: l.stocare,
      wallbox: l.wallbox,
      termen: l.termen,
      arePoze: Boolean(l.poze.trim()),
    }))
    .reverse(); // cele mai noi primele
}

// Lead-ul complet (cu date de contact) pentru un id din feedul public — folosit
// DOAR server-side, pentru notificarea de revendicare. Nu ajunge în client.
export async function getFullLeadById(id: string): Promise<NewLead | undefined> {
  const leads = await getLeadsSince(new Date(0));
  return leads.find((l) => l.timestamp === id && isPubliclyVisible(l));
}

const CLAIMS_SHEET = 'Revendicări';

export interface LeadClaim {
  timestamp: string;
  leadId: string;
  numeFirma: string;
  numeContact: string;
  telefon: string;
  /** Coloana G: data la care s-a confirmat că firma a sunat clientul. Gol = slot ocupat. */
  contactedAt: string;
  /**
   * Coloana H (adăugată 30 iul 2026): cum a intrat revendicarea.
   * `self` = firma a apăsat pe /cereri, `manual` = am marcat noi în /admin/crm
   * după apel telefonic. Rândurile vechi (fără valoare) sunt tratate ca `self`.
   */
  source: ClaimSource;
  /**
   * Coloana I (portal, aug 2026): emailul firmei = identitatea ei în /portal.
   * Rândurile de dinainte n-au email — apar în portal abia după ce completăm
   * manual celula cu emailul firmei.
   */
  email: string;
  /** Coloana J: ISO — firma a renunțat din portal. Eliberează și slotul firmei, și locul cererii. */
  releasedAt: string;
  /** Coloana K: motivul renunțării, obligatoriu la renunț — ne spune de ce mor lead-urile. */
  releaseReason: string;
  /** Coloana L: jurnalul firmei din portal (format parseNotes), vizibil și în /admin/crm. */
  firmNotes: LeadNote[];
  /**
   * Coloana M: ISO — revendicarea a fost aprobată (după apelul nostru de
   * confirmare) și datele clientului sunt vizibile firmei în portal. Gate-ul
   * telefonic rămâne: fără aprobarea din /admin/crm, portalul arată doar
   * detaliile de proiect, nu contactul clientului.
   */
  approvedAt: string;
  /** Coloana N: ISO — firma a marcat din /portal că a trimis oferta clientului. */
  offeredAt: string;
  /**
   * Coloana O: ISO — când i-a plecat firmei ultimul email „mai ești interesat?"
   * pentru cererea asta. Cronul rulează zilnic, iar o cerere neatinsă rămâne
   * neatinsă, deci fără marcaj ar pleca același email în fiecare dimineață.
   * Împreună cu `reminderCount` dă cadența din `claimReminderDue`.
   */
  remindedAt: string;
  /** Coloana P: câte remindere au plecat. Plafonat la CLAIM_REMINDER_MAX. */
  reminderCount: number;
  /**
   * Coloana F: unde e FIRMA cu cererea asta, după propria ei declarație din
   * /portal. Coloana exista de la început cu 'Nou' scris la creare, dar nimeni
   * nu o citea; din aug 2026 ține statusul real. Rândurile vechi îl primesc
   * dedus (vezi deriveClaimStatus) — auto-raportat, deci semnal, nu adevăr:
   * apelul nostru de verificare rămâne sursa.
   */
  firmStatus: ClaimStatus;
}

function readClaimRow(r: string[]): LeadClaim {
  const raw = (r[7] || '').trim().toLowerCase();
  // Rândurile de dinainte de coloana H sunt goale — le tratăm ca `self`,
  // singurul flux existent atunci.
  const source: ClaimSource = (CLAIM_SOURCES as readonly string[]).includes(raw)
    ? (raw as ClaimSource)
    : 'self';
  const releasedAt = r[9] || '';
  const offeredAt = r[13] || '';
  return {
    timestamp: r[0] || '',
    leadId: r[1] || '',
    numeFirma: r[2] || '',
    numeContact: r[3] || '',
    telefon: r[4] || '',
    contactedAt: r[6] || '',
    source,
    email: (r[8] || '').trim().toLowerCase(),
    releasedAt,
    releaseReason: r[10] || '',
    firmNotes: parseNotes(r[11] || ''),
    approvedAt: r[12] || '',
    offeredAt,
    remindedAt: r[14] || '',
    // Rândurile de dinainte de coloana P au marcajul din O dar nu și contorul —
    // un reminder plecat înseamnă cel puțin unul trimis, altfel cadența ar
    // reporni de la zero pentru ele.
    reminderCount: Number(r[15]) || (r[14] ? 1 : 0),
    firmStatus: deriveClaimStatus(r[5] || '', { offeredAt, releasedAt }),
  };
}

export async function getClaims(): Promise<LeadClaim[]> {
  let rows: string[][];
  try {
    rows = await readRows(CLAIMS_SHEET);
  } catch {
    // Tabul nu există încă (prima revendicare îl creează) — nicio revendicare.
    return [];
  }
  return rows
    .filter((r) => Number.isFinite(Date.parse(r[0] || '')))
    .map(readClaimRow);
}

async function createSheetTab(title: string) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests: [{ addSheet: { properties: { title } } }] },
  });
}

/** Întoarce timestampul rândului scris — cheia lui, alături de leadId. */
export async function saveClaimToSheet(claim: {
  leadId: string;
  numeFirma: string;
  numeContact: string;
  telefon: string;
  source: ClaimSource;
  email?: string;
}): Promise<string> {
  const timestamp = new Date().toISOString();
  const values = [
    timestamp,
    claim.leadId,
    claim.numeFirma,
    claim.numeContact,
    claim.telefon,
    'de_sunat', // F — Statusul firmei pe cerere, scris apoi din /portal
    '',    // G — Contactat la: se completează din /admin/crm, eliberează slotul firmei
    claim.source, // H — Sursă: `self` (public /cereri) sau `manual` (marcat din CRM)
    (claim.email || '').trim().toLowerCase(), // I — Email: identitatea firmei în /portal
    '', // J — Renunțat la: ISO, scris din /portal la renunț
    '', // K — Motiv renunțare: obligatoriu la renunț, scris din /portal
    '', // L — Note firmă: jurnalul firmei din /portal (format parseNotes)
    '', // M — Aprobat la: scris din /admin/crm; deblochează datele clientului în portal
    '', // N — Ofertat la: firma marchează din /portal că a trimis oferta
    '', // O — Ultimul reminder la: emailul „mai ești interesat?"
    '', // P — Remindere trimise: contorul de cadență (max CLAIM_REMINDER_MAX)
  ];
  try {
    await appendRow(CLAIMS_SHEET, values);
  } catch {
    // Tabul „Revendicări" nu există încă — îl creăm cu header și reîncercăm o dată.
    await createSheetTab(CLAIMS_SHEET);
    await appendRow(CLAIMS_SHEET, CLAIMS_HEADER);
    await appendRow(CLAIMS_SHEET, values);
  }
  return timestamp;
}

const CLAIMS_HEADER = [
  'Timestamp',
  'Lead ID',
  'Firmă',
  'Contact',
  'Telefon',
  'Status firmă', // F — unde e firma cu cererea, după declarația ei din /portal
  'Contactat la',
  'Sursă',
  'Email', // I — identitatea firmei în /portal
  'Renunțat la', // J — scris din /portal; eliberează slotul firmei + locul cererii
  'Motiv renunțare', // K — obligatoriu la renunț
  'Note firmă', // L — jurnal datat, scris de firmă din /portal
  'Aprobat la', // M — scris din /admin/crm; deblochează datele clientului în portal
  'Ofertat la', // N — firma marchează din /portal că a trimis oferta clientului
  'Ultimul reminder la', // O — emailul „mai ești interesat?", ultima trimitere
  'Remindere trimise', // P — contorul de cadență (2 zile lucrătoare, apoi la 4)
];

/**
 * Marchează (sau demarchează) apelul confirmat pe o revendicare. Cheia e perechea
 * timestamp + lead: un timestamp singur nu e unic, cele 20 de revendicări din
 * 24 iulie 2026 au fost scrise direct în sheet și au toate aceeași valoare.
 */
export async function markClaimContacted(
  claimTimestamp: string,
  leadId: string,
  contactedAt: string,
): Promise<LeadClaim> {
  const { row, sheetRow } = await findClaimRow(claimTimestamp, leadId);
  await updateClaimCells(`${CLAIMS_SHEET}!G${sheetRow}`, [[contactedAt]]);
  row[6] = contactedAt;
  return readClaimRow(row);
}

async function findClaimRow(
  claimTimestamp: string,
  leadId: string,
): Promise<{ row: string[]; sheetRow: number }> {
  const rows = await readRows(CLAIMS_SHEET);
  const index = rows.findIndex((r) => r[0] === claimTimestamp && r[1] === leadId);
  if (index === -1) throw new Error('Revendicarea nu există în tabul Revendicări.');
  return { row: rows[index], sheetRow: index + 1 };
}

async function updateClaimCells(range: string, values: string[][]) {
  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  await withRetry(
    () =>
      sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueInputOption: 'RAW',
        requestBody: { values },
      }),
    'update revendicare',
  );
}

/**
 * Renunțarea firmei, din /portal. Scrie J (data) + K (motivul) dintr-un singur
 * update — o renunțare fără motiv n-are voie să existe, regula e a userului:
 * „renunț doar după ce a discutat și a lăsat notițe cu motivul".
 */
export async function releaseClaim(
  claimTimestamp: string,
  leadId: string,
  reason: string,
): Promise<LeadClaim> {
  const { row, sheetRow } = await findClaimRow(claimTimestamp, leadId);
  const releasedAt = new Date().toISOString();
  await updateClaimCells(`${CLAIMS_SHEET}!J${sheetRow}:K${sheetRow}`, [[releasedAt, reason]]);
  // Renunțarea E statusul „pierdut" — dacă F ar rămâne pe altceva, aceeași
  // revendicare ar spune două lucruri diferite în portal și în CRM.
  await updateClaimCells(`${CLAIMS_SHEET}!F${sheetRow}`, [['pierdut']]);
  row[5] = 'pierdut';
  row[9] = releasedAt;
  row[10] = reason;
  return readClaimRow(row);
}

/**
 * Statusul firmei pe revendicare (coloana F), scris din /portal. Coloana N o
 * urmează: „ofertă trimisă" o setează, întoarcerea la un status de dinaintea
 * ofertei o golește, iar `castigat`/`pierdut` o lasă cum era (oferta chiar a
 * plecat). `pierdut` NU se scrie de aici — renunțarea trece prin releaseClaim,
 * care eliberează și locul, și cere motivul.
 */
export async function setClaimFirmStatus(
  claimTimestamp: string,
  leadId: string,
  status: ClaimStatus,
): Promise<LeadClaim> {
  const { row, sheetRow } = await findClaimRow(claimTimestamp, leadId);
  await updateClaimCells(`${CLAIMS_SHEET}!F${sheetRow}`, [[status]]);
  row[5] = status;

  const currentOffer = row[13] || '';
  const nextOffer = clearsOfferMark(status)
    ? ''
    : status === 'ofertat'
      ? currentOffer || new Date().toISOString()
      : currentOffer;
  if (nextOffer !== currentOffer) {
    await updateClaimCells(`${CLAIMS_SHEET}!N${sheetRow}`, [[nextOffer]]);
    row[13] = nextOffer;
  }

  return readClaimRow(row);
}

/** Adaugă o notă datată în jurnalul firmei (coloana L), cele noi primele — ca la updateLeadCrm. */
export async function addClaimNote(
  claimTimestamp: string,
  leadId: string,
  text: string,
  today: string,
  time?: string,
): Promise<LeadClaim> {
  const { row, sheetRow } = await findClaimRow(claimTimestamp, leadId);
  const existing = parseNotes(row[11] || '');
  const next: LeadNote[] = [
    { date: today, ...(time ? { time } : {}), text: text.trim() },
    ...existing,
  ];
  const serialized = serializeNotes(next);
  await updateClaimCells(`${CLAIMS_SHEET}!L${sheetRow}`, [[serialized]]);
  row[11] = serialized;
  return readClaimRow(row);
}

/**
 * Aprobarea din /admin/crm, după apelul de confirmare cu firma: deblochează
 * datele clientului în portal. `approvedAt` gol retrage aprobarea.
 */
export async function setClaimApproved(
  claimTimestamp: string,
  leadId: string,
  approvedAt: string,
): Promise<LeadClaim> {
  const { row, sheetRow } = await findClaimRow(claimTimestamp, leadId);
  await updateClaimCells(`${CLAIMS_SHEET}!M${sheetRow}`, [[approvedAt]]);
  row[12] = approvedAt;
  return readClaimRow(row);
}

/**
 * Marchează că firmei i-a plecat un reminder pe revendicarea asta: data ultimei
 * trimiteri (O) și al câtelea a fost (P). Se scrie DUPĂ trimitere: dacă emailul
 * pică, marcajul lipsește și cronul de mâine reîncearcă — mai bine o reîncercare
 * decât o tăcere definitivă. Contorul e cel care oprește seria la
 * CLAIM_REMINDER_MAX.
 */
export async function markClaimReminded(
  claimTimestamp: string,
  leadId: string,
  remindedAt: string,
  reminderCount: number,
): Promise<void> {
  const { sheetRow } = await findClaimRow(claimTimestamp, leadId);
  await updateClaimCells(`${CLAIMS_SHEET}!O${sheetRow}:P${sheetRow}`, [
    [remindedAt, String(reminderCount)],
  ]);
}

// ── Portal: cine cere acces și cine chiar intră ─────────────────────────────
// Jurnal append-only, o linie per eveniment:
//   `cerut`  — pasul 1, emailul cu link + cod a plecat;
//   `intrat` — pasul 2, link sau cod acceptat;
//   `vazut`  — firma a deschis portalul cu o sesiune deja validă.
// Al treilea e cel care face jurnalul să răspundă la „intră lumea pe portal?".
// Sesiunea ține 30 de zile, deci loginurile sunt rare prin construcție: o firmă
// care intră zilnic produce un singur `intrat` pe lună. Fără `vazut`, jurnalul
// măsura autentificările, nu folosirea.
const PORTAL_SHEET = 'Portal Acces';

const PORTAL_HEADER = ['Timestamp', 'Email', 'Eveniment', 'Metodă'];

export const PORTAL_EVENTS = ['cerut', 'intrat', 'vazut'] as const;
export type PortalEventKind = (typeof PORTAL_EVENTS)[number];

export interface PortalAccessEvent {
  /** ISO. */
  timestamp: string;
  email: string;
  event: PortalEventKind;
  /** Doar pe `intrat`: pe unde a intrat. Gol pe restul. */
  method: 'link' | 'cod' | '';
}

/**
 * Cât timp o vizită mai e „aceeași vizită". O firmă care dă refresh de zece ori
 * nu e zece vizite, iar Sheets are 60 de scrieri pe minut — un rând per
 * încărcare de pagină ar arde cota și ar face istoricul ilizibil. Contorul e
 * per instanță de server, deci în cel mai rău caz apar câteva rânduri în plus
 * pe zi; pentru „când a fost ultima dată în portal" e destul.
 */
const VISIT_THROTTLE_MS = 60 * 60_000;
const visitLoggedAt = new Map<string, number>();

/** Jurnalizează o vizită în portal, cel mult una pe oră per email. */
export async function logPortalVisit(email: string) {
  const key = email.trim().toLowerCase();
  if (!key) return;
  const now = Date.now();
  const prev = visitLoggedAt.get(key);
  if (prev && now - prev < VISIT_THROTTLE_MS) return;
  // Marcat înainte de scriere: două cereri paralele n-au voie să scrie două
  // rânduri. La eroare îl scoatem, ca următoarea vizită să reîncerce.
  visitLoggedAt.set(key, now);
  try {
    await savePortalAccessEvent({ email: key, event: 'vazut' });
  } catch (err) {
    visitLoggedAt.delete(key);
    throw err;
  }
}

export async function savePortalAccessEvent(e: {
  email: string;
  event: PortalEventKind;
  method?: 'link' | 'cod';
}) {
  const values = [
    new Date().toISOString(),
    e.email.trim().toLowerCase(),
    e.event,
    e.method ?? '',
  ];
  try {
    await appendRow(PORTAL_SHEET, values);
  } catch {
    // Tabul nu există încă — îl creăm cu header și reîncercăm o dată.
    await createSheetTab(PORTAL_SHEET);
    await appendRow(PORTAL_SHEET, PORTAL_HEADER);
    await appendRow(PORTAL_SHEET, values);
  }
}

export async function getPortalAccessEvents(): Promise<PortalAccessEvent[]> {
  let rows: string[][];
  try {
    rows = await readRows(PORTAL_SHEET);
  } catch {
    // Tabul nu există încă (prima cerere de acces îl creează).
    return [];
  }
  return rows
    .filter((r) => Number.isFinite(Date.parse(r[0] || '')))
    .map((r) => {
      const method = (r[3] || '').trim().toLowerCase();
      const event = (r[2] || '').trim().toLowerCase();
      return {
        timestamp: r[0] || '',
        email: (r[1] || '').trim().toLowerCase(),
        event: (PORTAL_EVENTS as readonly string[]).includes(event)
          ? (event as PortalEventKind)
          : 'cerut',
        method: method === 'link' || method === 'cod' ? method : '',
      } satisfies PortalAccessEvent;
    });
}

// ── Abonamente pe județ (distribuție prioritară) ───────────────────────────
// Firma abonată primește cererile din județele ei înaintea tuturor, iar cererea
// stă rezervată o fereastră de ore: nu se publică pe /cereri și nu poate fi
// revendicată de altcineva. NU e exclusivitate — după fereastră cererea intră
// în feed ca oricare alta și o poate lua orice firmă.
//
// Tab editabil de mână, fără deploy: adaugi un rând, abonamentul e activ de la
// următoarea cerere. Fereastra se scrie în ore ca să poată fi coborâtă (48 → 24)
// fără cod, dacă ține prea mult cererile departe de restul firmelor.

const SUBSCRIPTIONS_SHEET = 'Abonamente';

const SUBSCRIPTIONS_HEADER = [
  'Firmă', // A — cum apare în revendicare
  'Email', // B — contul de portal care primește cererile
  'Contact', // C — persoana, pentru revendicarea creată din portal
  'Telefon', // D — idem; fără el revendicarea n-ar avea pe cine suna
  'Județe', // E — separate prin virgulă
  'Ore fereastră', // F — cât stă cererea rezervată; gol = 48
  'Activ', // G — „nu" oprește abonamentul fără să șteargă rândul
  'De la', // H — YYYY-MM-DD, gol = fără început
  'Până la', // I — YYYY-MM-DD inclusiv, gol = fără sfârșit
  'Note', // J
];

export const DEFAULT_PRIORITY_WINDOW_HOURS = 48;

export interface LeadSubscription {
  firma: string;
  email: string;
  contact: string;
  telefon: string;
  counties: string[];
  windowHours: number;
  active: boolean;
  from: string;
  until: string;
}

export async function getLeadSubscriptions(): Promise<LeadSubscription[]> {
  let rows: string[][];
  try {
    rows = await readRows(SUBSCRIPTIONS_SHEET);
  } catch {
    // Tabul nu există încă — niciun abonament, deci nicio rezervare.
    return [];
  }
  return rows
    .filter((r) => (r[1] || '').includes('@'))
    .map((r) => ({
      firma: (r[0] || '').trim(),
      email: (r[1] || '').trim().toLowerCase(),
      contact: (r[2] || '').trim(),
      telefon: (r[3] || '').trim(),
      counties: (r[4] || '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      windowHours: Number((r[5] || '').trim()) || DEFAULT_PRIORITY_WINDOW_HOURS,
      active: (r[6] || '').trim().toLowerCase() !== 'nu',
      from: (r[7] || '').trim(),
      until: (r[8] || '').trim(),
    }));
}

/**
 * Abonamentul care acoperă județul cererii, dacă există. Perioada se compară pe
 * zi calendaristică: „Până la" e inclusiv, ca într-un contract, nu ca într-un
 * interval de cod.
 */
export function findSubscriptionForCounty(
  subs: LeadSubscription[],
  judet: string,
  today = new Date().toISOString().slice(0, 10),
): LeadSubscription | null {
  const key = countyKey(judet || '');
  if (!key) return null;
  return (
    subs.find(
      (s) =>
        s.active &&
        (!s.from || s.from <= today) &&
        (!s.until || s.until >= today) &&
        s.counties.some((c) => countyKey(c) === key),
    ) ?? null
  );
}

/** Cererea e încă rezervată abonatului? Gol sau dată trecută = liberă. */
export function isPriorityHeld(lead: { prioritarPanaLa: string }, now = Date.now()): boolean {
  const until = Date.parse(lead.prioritarPanaLa || '');
  return Number.isFinite(until) && until > now;
}

// ── Alerte pe județ ────────────────────────────────────────────────────────
// Firma bifează în /portal județele în care lucrează, iar la fiecare cerere
// nouă de acolo primește email cu detaliile ei. Filtrul e DOAR pe județ,
// deliberat: din 19 cereri intrate după 4 august, 10 aveau termenul „mă
// informez", deci un filtru pe urgență ar fi stins mai mult de jumătate din
// alerte. Termenul, puterea și finanțarea se văd în email, nu decid cine
// primește emailul.
//
// Un rând per email (upsert, nu jurnal): preferințele sunt starea curentă, iar
// un istoric de bifări n-ar folosi nimănui.

const ALERTS_SHEET = 'Alerte Județe';

const ALERTS_HEADER = [
  'Actualizat', // A — ISO
  'Email', // B — identitatea firmei în portal
  'Județe', // C — separate prin virgulă, scrise ca în data/counties.json
  'Activ', // D — „nu" = oprit fără să piardă lista bifată
];

export interface CountyAlertPref {
  email: string;
  counties: string[];
  active: boolean;
  /** ISO. */
  updatedAt: string;
}

/** Comparație de județe tolerantă la diacritice și spații, ca în lib/lead-match. */
function countyKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export async function getCountyAlertPrefs(): Promise<CountyAlertPref[]> {
  let rows: string[][];
  try {
    rows = await readRows(ALERTS_SHEET);
  } catch {
    // Tabul nu există încă — prima salvare din portal îl creează.
    return [];
  }
  return rows
    .filter((r) => Number.isFinite(Date.parse(r[0] || '')) && (r[1] || '').trim())
    .map((r) => ({
      updatedAt: r[0] || '',
      email: (r[1] || '').trim().toLowerCase(),
      counties: (r[2] || '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      // Gol = activ: un rând scris de mână, fără coloana D, tot trebuie să meargă.
      active: (r[3] || '').trim().toLowerCase() !== 'nu',
    }));
}

export async function getCountyAlertPref(email: string): Promise<CountyAlertPref | null> {
  const key = email.trim().toLowerCase();
  const prefs = await getCountyAlertPrefs();
  return prefs.find((p) => p.email === key) ?? null;
}

/** Upsert pe email. Lista goală = alerte oprite, dar rândul rămâne. */
export async function saveCountyAlertPrefs(email: string, counties: string[]): Promise<void> {
  const key = email.trim().toLowerCase();
  if (!key) return;
  const values = [
    new Date().toISOString(),
    key,
    counties.join(', '),
    counties.length ? 'da' : 'nu',
  ];

  let rows: string[][];
  try {
    rows = await readRows(ALERTS_SHEET);
  } catch {
    await createSheetTab(ALERTS_SHEET);
    await appendRow(ALERTS_SHEET, ALERTS_HEADER);
    await appendRow(ALERTS_SHEET, values);
    return;
  }

  const index = rows.findIndex((r) => (r[1] || '').trim().toLowerCase() === key);
  if (index === -1) {
    await appendRow(ALERTS_SHEET, values);
    return;
  }

  const sheets = google.sheets({ version: 'v4', auth: getAuth() });
  await withRetry(
    () =>
      sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${ALERTS_SHEET}!A${index + 1}:D${index + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: [values] },
      }),
    'update alerte judet',
  );
}

/** Emailurile care au bifat județul, dintr-o listă deja citită (pentru cron). */
export function filterCountyAlertRecipients(
  prefs: CountyAlertPref[],
  judet: string,
): string[] {
  const key = countyKey(judet || '');
  if (!key) return [];
  return prefs
    .filter((p) => p.active && p.counties.some((c) => countyKey(c) === key))
    .map((p) => p.email);
}

/** Emailurile care au bifat județul cererii. Lista e mică, se citește la fiecare cerere. */
export async function getCountyAlertRecipients(judet: string): Promise<string[]> {
  if (!judet.trim()) return [];
  return filterCountyAlertRecipients(await getCountyAlertPrefs(), judet);
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

// ── Social: pipeline de postări ────────────────────────────────────────────
// Sursa a fost `data/social-schedule.json`, mutată în Sheets pe 2026-07-28 ca
// să poată fi editată fără deploy (fișierele din repo sunt read-only pe Vercel).

const SOCIAL_SHEET = 'Social';

/** Ordinea coloanelor din tab. Indexul = poziția în rând. */
const SOCIAL_COLS = [
  'id', 'tema', 'folder', 'format', 'status', 'programat', 'postat', 'cta', 'nota',
  'facebook', 'instagram', 'youtube', 'tiktok',
] as const;

export const SOCIAL_PLATFORMS = ['facebook', 'instagram', 'youtube', 'tiktok'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface SocialPost {
  id: number;
  tema: string;
  folder?: string;
  format?: string;
  status?: string;
  programat?: string;
  postat?: string;
  cta?: string;
  nota?: string;
  /** Valoare = dată ISO (postat) / 'programat' / 'sarit'. Absent = nedistribuit. */
  platforme: Partial<Record<SocialPlatform, string>>;
}

function colLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export async function getSocialPosts(): Promise<SocialPost[]> {
  const rows = await readRows(SOCIAL_SHEET);
  return rows
    .slice(1)
    .filter((r) => Number.isFinite(Number(r[0])))
    .map((r) => {
      const get = (name: (typeof SOCIAL_COLS)[number]) => r[SOCIAL_COLS.indexOf(name)]?.trim() || '';
      const platforme: SocialPost['platforme'] = {};
      for (const p of SOCIAL_PLATFORMS) {
        const v = get(p);
        if (v) platforme[p] = v;
      }
      return {
        id: Number(r[0]),
        tema: get('tema'),
        folder: get('folder'),
        format: get('format'),
        status: get('status'),
        programat: get('programat'),
        postat: get('postat'),
        cta: get('cta'),
        nota: get('nota'),
        platforme,
      };
    });
}

/** O valoare de platformă e „postat" doar dacă e o dată, nu 'programat'/'sarit'. */
function isPostedValue(v: string | undefined): boolean {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

/**
 * Comută o platformă între „postat azi" și „nedistribuit".
 * `postat` la nivel de postare urmează platformele: se setează la prima
 * platformă marcată și se golește când nu mai rămâne niciuna.
 */
export async function toggleSocialPlatform(
  id: number,
  platform: SocialPlatform,
  today: string,
): Promise<SocialPost[]> {
  const rows = await readRows(SOCIAL_SHEET);
  const rowIndex = rows.findIndex((r, i) => i > 0 && Number(r[0]) === id);
  if (rowIndex === -1) throw new Error(`Postarea #${id} nu există în tabul ${SOCIAL_SHEET}.`);

  const row = rows[rowIndex];
  const platformIdx = SOCIAL_COLS.indexOf(platform);
  const nextValue = isPostedValue(row[platformIdx]) ? '' : today;

  const remaining = SOCIAL_PLATFORMS.some((p) =>
    p === platform ? !!nextValue : isPostedValue(row[SOCIAL_COLS.indexOf(p)]),
  );

  const sheetRow = rowIndex + 1; // A1 e 1-indexat
  const updates = [
    { range: `${SOCIAL_SHEET}!${colLetter(platformIdx)}${sheetRow}`, values: [[nextValue]] },
    {
      range: `${SOCIAL_SHEET}!${colLetter(SOCIAL_COLS.indexOf('postat'))}${sheetRow}`,
      values: [[remaining ? row[SOCIAL_COLS.indexOf('postat')] || today : '']],
    },
  ];

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  await withRetry(
    () =>
      sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { valueInputOption: 'RAW', data: updates },
      }),
    'update social',
  );

  return getSocialPosts();
}

// ── CRM: status de pipeline + jurnal de note pe cerere ─────────────────────
// Coloana M („Status") NU se atinge: ține vizibilitatea în feedul public
// ('Ascuns') și text liber scris manual de-a lungul timpului. Statusul de
// pipeline și notele primesc coloane proprii, la finalul rândului.
// Vezi contractul de coloane din memorie înainte să muți ceva aici.

const LEAD_CRM_STATUS_COL = 21; // V
const LEAD_NOTES_COL = 22; // W
const LEAD_CONTACTED_COL = 23; // X

export {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUS_HINTS,
  LEAD_CLOSED_STATUSES,
  CONTACT_STATES,
  MAX_ACTIVE_CLAIMS_PER_FIRM,
  CLAIM_SOURCES,
  CLAIM_STATUSES,
  CLAIM_STATUS_LABELS,
  CLAIM_STATUS_HINTS,
  FIRM_STATUSES,
  FIRM_STATUS_LABELS,
  FIRM_STATUS_HINTS,
  CLAIM_REMINDER_FIRST_DAYS,
  CLAIM_REMINDER_REPEAT_DAYS,
  CLAIM_REMINDER_MAX,
  businessDaysBetween,
  bucharestDay,
  isBusinessDay,
  claimIdleBusinessDays,
  claimIdleCalendarDays,
  claimLastActivity,
  claimHoldsFirmSlot,
  claimOccupiesLeadSlot,
  claimReminderDue,
  claimRemindersExhausted,
  claimsHeldForLead,
  countActiveClaimsForFirm,
  isClaimStale,
  isClaimStatusUnproven,
  isClaimUntouched,
  firmMentionedIn,
  isLeadClosed,
  isSameFirm,
  normalizePhone,
  type LeadStatus,
  type ContactState,
  type LeadNote,
  type ClaimSource,
  type ClaimStatus,
  type FirmStatus,
} from './sheets-shared';

/**
 * Jurnalul e text simplu în celulă: fiecare intrare începe cu `[YYYY-MM-DD] `
 * sau, de la introducerea orei, cu `[YYYY-MM-DD HH:MM] ` (ora României).
 */
export function parseNotes(raw: string): LeadNote[] {
  if (!raw.trim()) return [];
  const notes: LeadNote[] = [];
  for (const line of raw.split('\n')) {
    const m = line.match(/^\[(\d{4}-\d{2}-\d{2})(?: (\d{2}:\d{2}))?\]\s?(.*)$/);
    if (m) notes.push({ date: m[1], ...(m[2] ? { time: m[2] } : {}), text: m[3] });
    else if (notes.length) notes[notes.length - 1].text += `\n${line}`;
    else if (line.trim()) notes.push({ date: '', text: line });
  }
  return notes.map((n) => ({ ...n, text: n.text.trim() }));
}

function serializeNotes(notes: LeadNote[]): string {
  // Notele vechi, dinainte de jurnal, n-au dată. `[] text` nu s-ar mai citi
  // înapoi ca notă separată, deci le scriem fără prefix, cum au venit.
  return notes
    .map((n) => (n.date ? `[${n.date}${n.time ? ` ${n.time}` : ''}] ${n.text}` : n.text))
    .join('\n');
}

async function findLeadRow(timestamp: string): Promise<{ row: string[]; sheetRow: number }> {
  const rows = await readRows('Leads');
  const index = rows.findIndex((r, i) => i > 0 && r[0] === timestamp);
  if (index === -1) throw new Error('Cererea nu există în tabul Leads.');
  return { row: rows[index], sheetRow: index + 1 };
}

export interface LeadCrmFields {
  crmStatus: LeadStatus;
  notes: LeadNote[];
  /** A contactat-o vreo firmă? Gol = încă neverificat cu clientul. */
  contactedByFirm: ContactState;
}

export function readCrmFields(row: string[]): LeadCrmFields {
  const status = (row[LEAD_CRM_STATUS_COL] || '').trim().toLowerCase();
  const contacted = (row[LEAD_CONTACTED_COL] || '').trim().toLowerCase();
  return {
    crmStatus: (LEAD_STATUSES as readonly string[]).includes(status)
      ? (status as LeadStatus)
      : 'noua',
    notes: parseNotes(row[LEAD_NOTES_COL] || ''),
    contactedByFirm: (CONTACT_STATES as readonly string[]).includes(contacted)
      ? (contacted as ContactState)
      : '',
  };
}

/** O notă existentă, identificată prin poziție + textul pe care îl avea clientul. */
export interface NoteRef {
  index: number;
  /** Textul văzut de client. Dacă nu mai e ăsta, altcineva a scris între timp. */
  expected: string;
}

/**
 * Setează statusul, marcajul de contactare și/sau operează pe jurnalul de note:
 * adaugă o notă datată (cele noi primele, ca să se citească fără scroll în
 * celulă), editează sau șterge una existentă.
 */
export async function updateLeadCrm(
  timestamp: string,
  changes: {
    status?: LeadStatus;
    contacted?: ContactState;
    note?: string;
    editNote?: NoteRef & { text: string };
    deleteNote?: NoteRef;
    today?: string;
    /** HH:MM, ora României — se scrie doar pe notele nou adăugate. */
    time?: string;
  },
): Promise<LeadCrmFields> {
  const { row, sheetRow } = await findLeadRow(timestamp);
  const data: { range: string; values: string[][] }[] = [];

  if (changes.status) {
    data.push({ range: `Leads!V${sheetRow}`, values: [[changes.status]] });
    row[LEAD_CRM_STATUS_COL] = changes.status;
  }

  if (changes.contacted !== undefined) {
    data.push({ range: `Leads!X${sheetRow}`, values: [[changes.contacted]] });
    row[LEAD_CONTACTED_COL] = changes.contacted;
  }

  const note = changes.note?.trim();
  const { editNote, deleteNote } = changes;

  if (note || editNote || deleteNote) {
    const existing = parseNotes(row[LEAD_NOTES_COL] || '');
    let next: LeadNote[];

    if (note) {
      const date = changes.today || new Date().toISOString().slice(0, 10);
      next = [{ date, ...(changes.time ? { time: changes.time } : {}), text: note }, ...existing];
    } else {
      // Editarea și ștergerea merg pe poziție, dar poziția singură minte dacă
      // altcineva a adăugat o notă între citire și click. Textul e martorul.
      const ref = (editNote || deleteNote) as NoteRef;
      const target = existing[ref.index];
      if (!target || target.text !== ref.expected) {
        throw new Error('Nota s-a schimbat între timp. Reîmprospătează pagina și încearcă din nou.');
      }
      const text = editNote?.text.trim();
      next = [...existing];
      // Editare care golește nota = ștergere. Altfel ar rămâne o dată fără text.
      if (editNote && text) next[ref.index] = { ...target, text };
      else next.splice(ref.index, 1);
    }

    const serialized = serializeNotes(next);
    data.push({ range: `Leads!W${sheetRow}`, values: [[serialized]] });
    row[LEAD_NOTES_COL] = serialized;
  }

  if (data.length) {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() });
    await withRetry(
      () =>
        sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: { valueInputOption: 'RAW', data },
        }),
      'update CRM',
    );
  }

  return readCrmFields(row);
}

// ── CRM Firme: pipeline-ul telefonic pe instalatori ────────────────────────
// O fișă per firmă, într-un tab separat: cu cine am vorbit, unde am rămas,
// când revin. Notele folosesc același format de jurnal ca pe cereri
// (parseNotes/serializeNotes). Ce NU se stochează aici: revendicările și
// notele de pe cereri care pomenesc firma — alea se derivă la afișare din
// taburile lor, ca să nu existe două copii care să divergă.

const FIRMS_SHEET = 'CRM Firme';

const FIRMS_HEADER = [
  'Timestamp',
  'Firm ID',
  'Firmă',
  'Telefon',
  'Status',
  'Follow-up',
  'Note',
];

const FIRM_STATUS_COL = 4; // E
const FIRM_FOLLOWUP_COL = 5; // F
const FIRM_NOTES_COL = 6; // G

export interface CrmFirm {
  /** ISO — rândul e identificat prin timestampul creării, ca la Leads. */
  timestamp: string;
  /** id-ul din companies.json, dacă firma e în director. Gol pentru restul. */
  firmId: string;
  numeFirma: string;
  telefon: string;
  status: FirmStatus;
  /** YYYY-MM-DD — când trebuie sunată din nou. Gol = fără termen. */
  followUp: string;
  notes: LeadNote[];
}

function readFirmRow(r: string[]): CrmFirm {
  const status = (r[FIRM_STATUS_COL] || '').trim().toLowerCase();
  return {
    timestamp: r[0] || '',
    firmId: r[1] || '',
    numeFirma: r[2] || '',
    telefon: r[3] || '',
    status: (FIRM_STATUSES as readonly string[]).includes(status)
      ? (status as FirmStatus)
      : 'de_sunat',
    followUp: r[FIRM_FOLLOWUP_COL] || '',
    notes: parseNotes(r[FIRM_NOTES_COL] || ''),
  };
}

export async function getCrmFirms(): Promise<CrmFirm[]> {
  let rows: string[][];
  try {
    rows = await readRows(FIRMS_SHEET);
  } catch {
    // Tabul nu există încă (prima fișă îl creează) — nicio firmă în pipeline.
    return [];
  }
  return rows
    .filter((r) => Number.isFinite(Date.parse(r[0] || '')))
    .map(readFirmRow);
}

export async function addCrmFirm(firm: {
  firmId?: string;
  numeFirma: string;
  telefon: string;
}): Promise<CrmFirm> {
  // Aceeași identitate ca la plafonul de revendicări: telefon SAU nume. Fără
  // verificare, aceeași firmă ar primi două fișe cu istoricul rupt în două.
  const existing = await getCrmFirms();
  if (existing.some((f) => isSameFirm(f, firm))) {
    throw new Error('Firma are deja o fișă în CRM.');
  }

  const timestamp = new Date().toISOString();
  const values = [timestamp, firm.firmId || '', firm.numeFirma, firm.telefon, 'de_sunat', '', ''];
  try {
    await appendRow(FIRMS_SHEET, values);
  } catch {
    // Tabul „CRM Firme" nu există încă — îl creăm cu header și reîncercăm o dată.
    await createSheetTab(FIRMS_SHEET);
    await appendRow(FIRMS_SHEET, FIRMS_HEADER);
    await appendRow(FIRMS_SHEET, values);
  }
  return readFirmRow(values);
}

/**
 * Setează statusul, termenul de follow-up și/sau operează pe jurnalul de note
 * al unei fișe de firmă. Oglinda lui updateLeadCrm, pe tabul „CRM Firme".
 */
export async function updateCrmFirm(
  timestamp: string,
  changes: {
    status?: FirmStatus;
    /** Șirul gol șterge termenul. */
    followUp?: string;
    note?: string;
    editNote?: NoteRef & { text: string };
    deleteNote?: NoteRef;
    today?: string;
    /** HH:MM, ora României — se scrie doar pe notele nou adăugate. */
    time?: string;
  },
): Promise<CrmFirm> {
  const rows = await readRows(FIRMS_SHEET);
  const index = rows.findIndex((r, i) => i > 0 && r[0] === timestamp);
  if (index === -1) throw new Error('Firma nu există în tabul CRM Firme.');
  const row = rows[index];
  const sheetRow = index + 1;

  const data: { range: string; values: string[][] }[] = [];

  if (changes.status) {
    data.push({ range: `${FIRMS_SHEET}!E${sheetRow}`, values: [[changes.status]] });
    row[FIRM_STATUS_COL] = changes.status;
  }

  if (changes.followUp !== undefined) {
    data.push({ range: `${FIRMS_SHEET}!F${sheetRow}`, values: [[changes.followUp]] });
    row[FIRM_FOLLOWUP_COL] = changes.followUp;
  }

  const note = changes.note?.trim();
  const { editNote, deleteNote } = changes;

  if (note || editNote || deleteNote) {
    const existing = parseNotes(row[FIRM_NOTES_COL] || '');
    let next: LeadNote[];

    if (note) {
      const date = changes.today || new Date().toISOString().slice(0, 10);
      next = [{ date, ...(changes.time ? { time: changes.time } : {}), text: note }, ...existing];
    } else {
      // Editarea și ștergerea merg pe poziție, dar poziția singură minte dacă
      // altcineva a adăugat o notă între citire și click. Textul e martorul.
      const ref = (editNote || deleteNote) as NoteRef;
      const target = existing[ref.index];
      if (!target || target.text !== ref.expected) {
        throw new Error('Nota s-a schimbat între timp. Reîmprospătează pagina și încearcă din nou.');
      }
      const text = editNote?.text.trim();
      next = [...existing];
      // Editare care golește nota = ștergere. Altfel ar rămâne o dată fără text.
      if (editNote && text) next[ref.index] = { ...target, text };
      else next.splice(ref.index, 1);
    }

    const serialized = serializeNotes(next);
    data.push({ range: `${FIRMS_SHEET}!G${sheetRow}`, values: [[serialized]] });
    row[FIRM_NOTES_COL] = serialized;
  }

  if (data.length) {
    const sheets = google.sheets({ version: 'v4', auth: getAuth() });
    await withRetry(
      () =>
        sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: { valueInputOption: 'RAW', data },
        }),
      'update CRM firmă',
    );
  }

  return readFirmRow(row);
}
