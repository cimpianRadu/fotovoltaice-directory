import {
  LEAD_STATUSES,
  CONTACT_STATES,
  CLAIM_SOURCES,
  FIRM_STATUSES,
  isLeadClosed,
  isSameFirm,
  type LeadStatus,
  type ContactState,
  type LeadNote,
  type ClaimSource,
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
        // A:AE, nu A:Z — coloanele de lead au trecut de Z în aug 2026 (Z–AD:
        // localitate, stocare, wallbox, termen, poze). Celelalte taburi au mai
        // puține coloane, range-ul mai lat nu le afectează.
        range: `${sheetName}!A:AE`,
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

// Toate cererile, indiferent de vechime — la volumul actual feedul afișează
// istoricul complet, cu filtru de vechime în UI. De restrâns când crește volumul.
export async function getPublicLeads(): Promise<PublicLead[]> {
  const leads = await getLeadsSince(new Date(0));
  return leads
    .filter(isOpenForClaims)
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
}

function readClaimRow(r: string[]): LeadClaim {
  const raw = (r[7] || '').trim().toLowerCase();
  // Rândurile de dinainte de coloana H sunt goale — le tratăm ca `self`,
  // singurul flux existent atunci.
  const source: ClaimSource = (CLAIM_SOURCES as readonly string[]).includes(raw)
    ? (raw as ClaimSource)
    : 'self';
  return {
    timestamp: r[0] || '',
    leadId: r[1] || '',
    numeFirma: r[2] || '',
    numeContact: r[3] || '',
    telefon: r[4] || '',
    contactedAt: r[6] || '',
    source,
    email: (r[8] || '').trim().toLowerCase(),
    releasedAt: r[9] || '',
    releaseReason: r[10] || '',
    firmNotes: parseNotes(r[11] || ''),
    approvedAt: r[12] || '',
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

export async function saveClaimToSheet(claim: {
  leadId: string;
  numeFirma: string;
  numeContact: string;
  telefon: string;
  source: ClaimSource;
  email?: string;
}) {
  const values = [
    new Date().toISOString(),
    claim.leadId,
    claim.numeFirma,
    claim.numeContact,
    claim.telefon,
    'Nou', // coloana Status
    '',    // G — Contactat la: se completează din /admin/crm, eliberează slotul firmei
    claim.source, // H — Sursă: `self` (public /cereri) sau `manual` (marcat din CRM)
    (claim.email || '').trim().toLowerCase(), // I — Email: identitatea firmei în /portal
    '', // J — Renunțat la: ISO, scris din /portal la renunț
    '', // K — Motiv renunțare: obligatoriu la renunț, scris din /portal
    '', // L — Note firmă: jurnalul firmei din /portal (format parseNotes)
    '', // M — Aprobat la: scris din /admin/crm; deblochează datele clientului în portal
  ];
  try {
    await appendRow(CLAIMS_SHEET, values);
  } catch {
    // Tabul „Revendicări" nu există încă — îl creăm cu header și reîncercăm o dată.
    await createSheetTab(CLAIMS_SHEET);
    await appendRow(CLAIMS_SHEET, CLAIMS_HEADER);
    await appendRow(CLAIMS_SHEET, values);
  }
}

const CLAIMS_HEADER = [
  'Timestamp',
  'Lead ID',
  'Firmă',
  'Contact',
  'Telefon',
  'Status',
  'Contactat la',
  'Sursă',
  'Email', // I — identitatea firmei în /portal
  'Renunțat la', // J — scris din /portal; eliberează slotul firmei + locul cererii
  'Motiv renunțare', // K — obligatoriu la renunț
  'Note firmă', // L — jurnal datat, scris de firmă din /portal
  'Aprobat la', // M — scris din /admin/crm; deblochează datele clientului în portal
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
  row[9] = releasedAt;
  row[10] = reason;
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
  FIRM_STATUSES,
  FIRM_STATUS_LABELS,
  FIRM_STATUS_HINTS,
  claimsHeldForLead,
  countActiveClaimsForFirm,
  firmMentionedIn,
  isLeadClosed,
  isSameFirm,
  normalizePhone,
  type LeadStatus,
  type ContactState,
  type LeadNote,
  type ClaimSource,
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
