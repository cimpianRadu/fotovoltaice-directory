// Tipuri și constante din pipeline-ul de CRM, importabile din componente
// client. `lib/sheets` trage googleapis după el, deci NU se importă din client.
// Vezi disciplina de bundle din CLAUDE.md.

// Starea cererii = ce mai poți face cu ea. Valorile se stochează fără
// diacritice, ca să treacă curat prin query string; eticheta afișată e separată.
export const LEAD_STATUSES = [
  'noua',
  'valida',
  'ofertare',
  'castigata',
  'altundeva',
  'renuntat',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  noua: 'Nouă',
  valida: 'Validă',
  ofertare: 'În ofertare',
  castigata: 'Câștigată',
  altundeva: 'Altundeva',
  renuntat: 'Renunțat',
};

export const LEAD_STATUS_HINTS: Record<LeadStatus, string> = {
  noua: 'intrată, neverificată cu clientul',
  valida: 'am vorbit cu el, încă vrea ofertă',
  ofertare: 'o firmă discută deja cu el',
  castigata: 'a semnat, printr-o firmă de la noi',
  altundeva: 'și-a rezolvat în afara platformei',
  renuntat: 'nu mai face investiția',
};

/**
 * Stările în care clientul nu mai are nevoie de nicio ofertă: a semnat, și-a
 * rezolvat în altă parte sau a renunțat. Cererile astea dispar din feedul
 * public /cereri și nu mai pot fi revendicate — o firmă care sună un client
 * închis pierde un apel și pare neserioasă, iar noi pierdem credibilitatea
 * feedului. „În ofertare" NU intră aici: acolo clientul încă vrea oferte, doar
 * că are deja una, iar plafonul de 3 revendicări face restul.
 */
export const LEAD_CLOSED_STATUSES = ['castigata', 'altundeva', 'renuntat'] as const;

export function isLeadClosed(status: LeadStatus): boolean {
  return (LEAD_CLOSED_STATUSES as readonly string[]).includes(status);
}

// Ortogonal față de stare: o cerere poate fi „altundeva" ȘI necontactată, iar
// combinația aia e alarma, nu concurență pierdută. Gol = încă neverificat.
export const CONTACT_STATES = ['da', 'nu'] as const;
export type ContactState = (typeof CONTACT_STATES)[number] | '';

export interface LeadNote {
  date: string; // YYYY-MM-DD
  /** HH:MM, ora României. Notele scrise înainte de introducerea orei n-o au. */
  time?: string;
  text: string;
}

// ── Statusul firmei pe o revendicare ───────────────────────────────────────
// Ortogonal pe LEAD_STATUSES: acolo e starea CERERII, văzută de noi; aici e
// starea FIRMEI pe cererea aia, scrisă de ea din /portal. Cele două se pot
// contrazice, iar contrazicerea e informație („ofertat" la firmă, „noua" la
// noi = n-am apucat să verificăm). Fără diacritice în valori, ca la restul.
export const CLAIM_STATUSES = [
  'de_sunat',
  'nu_raspunde',
  'discutii',
  'ofertat',
  'castigat',
  'pierdut',
] as const;
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  de_sunat: 'De sunat',
  nu_raspunde: 'Nu răspunde',
  discutii: 'În discuții',
  ofertat: 'Ofertă trimisă',
  // Perechea de final. „Pierdut" a fost respins ca etichetă: sună a înfrângere
  // a firmei, deși jumătate din cazuri n-au nicio vinovăție. „Neinteresat" a
  // fost respins pentru că ar minți în raport: un client care a semnat cu
  // altcineva a fost foarte interesat, iar confuzia asta duce la concluzia
  // greșită („lead prost") în loc de cea reală („am fost înceți").
  castigat: 'Concretizat',
  pierdut: 'Neconcretizat',
};

export const CLAIM_STATUS_HINTS: Record<ClaimStatus, string> = {
  de_sunat: 'ai datele, încă nu ai sunat clientul',
  nu_raspunde: 'ai încercat, clientul nu răspunde',
  discutii: 'ai vorbit cu el, discuția e deschisă',
  ofertat: 'i-ai trimis oferta, aștepți răspuns',
  castigat: 'a semnat cu tine',
  pierdut: 'a ales altă firmă, a amânat sau nu mai face',
};

/**
 * Statusurile de dinaintea ofertei. Trecerea înapoi la ele înseamnă că marcajul
 * de ofertă a fost o greșeală, deci coloana N se golește; „câștigat"/„pierdut"
 * vin DUPĂ ofertă, deci acolo data ofertei rămâne cum era.
 */
const PRE_OFFER_STATUSES: readonly ClaimStatus[] = ['de_sunat', 'nu_raspunde', 'discutii'];

export function clearsOfferMark(status: ClaimStatus): boolean {
  return PRE_OFFER_STATUSES.includes(status);
}

/**
 * Statusul scris în coloana F. Rândurile de dinainte de status (sau cu 'Nou',
 * valoarea pusă la creare înainte ca cineva să citească coloana) îl primesc
 * dedus din ce știm deja: renunțarea e „pierdut", marcajul de ofertă e
 * „ofertat", restul pleacă de la „de sunat".
 */
export function deriveClaimStatus(
  raw: string,
  claim: { offeredAt: string; releasedAt: string },
): ClaimStatus {
  const v = raw.trim().toLowerCase();
  if ((CLAIM_STATUSES as readonly string[]).includes(v)) return v as ClaimStatus;
  if (claim.releasedAt) return 'pierdut';
  if (claim.offeredAt) return 'ofertat';
  return 'de_sunat';
}

/**
 * Cum a ajuns o revendicare în Sheet. `self` = firma a apăsat singură pe
 * /cereri (fluxul public), `manual` = am marcat noi în /admin/crm după ce am
 * sunat firma. Distincția contează pentru a nu confunda tracțiunea organică a
 * platformei cu ce împingem noi telefonic. Rândurile scrise înainte de
 * introducerea coloanei rămân goale — le tratăm ca `self` (fluxul singur
 * disponibil atunci).
 */
// `self` = revendicat din feedul public, `manual` = dat de noi telefonic,
// `abonament` = preluat din portal, dintr-o cerere rezervată pe abonament.
export const CLAIM_SOURCES = ['self', 'manual', 'abonament'] as const;
export type ClaimSource = (typeof CLAIM_SOURCES)[number];

/**
 * Câte cereri poate ține o firmă în același timp fără să confirme că a sunat
 * clientul. Plafonul per cerere (MAX_CLAIMS_PER_LEAD) nu rezolvă nimic singur:
 * pe 24 iulie 2026 o singură firmă avea 22 din cele 25 de revendicări, iar
 * niciunul dintre cei 4 clienți verificați telefonic nu fusese sunat. O
 * revendicare fără apel e mai rea decât nicio revendicare, pentru că îi spune
 * clientului că se ocupă cineva. Slotul se eliberează când apelul e confirmat.
 *
 * Ridicat de la 3 la 5 pe 14 august 2026: ciclul real de la revendicare la apel
 * confirmat e mai lung decât presupuneam, iar firmele care lucrează serios
 * ajungeau la plafon cu cereri încă în lucru, nu abandonate.
 */
export const MAX_ACTIVE_CLAIMS_PER_FIRM = 5;

/**
 * Aceleași cifre, scrise diferit, sunt același telefon: „+40 771 504 694",
 * „0040771504694" și „0771504694" ajung toate la aceeași formă. Fără pasul cu
 * prefixul, o firmă trece de plafon doar schimbând formatul în care își scrie
 * numărul, ceea ce ar face regula decorativă.
 */
export function normalizePhone(s: string): string {
  const digits = s.replace(/[\s.\-()]/g, '');
  return digits.replace(/^(?:\+40|0040)/, '0');
}

/**
 * Numele firmei, redus la ce rămâne constant între două completări de formular.
 * În registrul real aceeași firmă apare și ca „JTS Instal Construct", și ca
 * „JTS Instal Construct SRL" — forma juridică și punctuația nu identifică pe
 * nimeni, deci pică.
 */
export function normalizeFirmName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\b(s\s*r\s*l\s*-?\s*d|s\s*r\s*l|s\s*a|p\s*f\s*a|s\s*c)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Firmele se re-identifică între revendicări după telefon SAU după nume: unele
 * lasă alt telefon de la o cerere la alta, altele scriu numele altfel. Oricare
 * dintre cele două potriviri e destul — plafonul trebuie să fie greu de ocolit
 * din neatenție. Cine vrea neapărat să-l ocolească schimbă și numele, și
 * telefonul, dar atunci apare ca firmă nouă la apelul de confirmare.
 */
export function isSameFirm(
  a: { numeFirma: string; telefon: string },
  b: { numeFirma: string; telefon: string },
): boolean {
  const phoneA = normalizePhone(a.telefon);
  const phoneB = normalizePhone(b.telefon);
  if (phoneA && phoneA === phoneB) return true;
  const nameA = normalizeFirmName(a.numeFirma);
  return nameA !== '' && nameA === normalizeFirmName(b.numeFirma);
}

/**
 * Revendicările care ocupă un slot al firmei. Renunțarea și apelul confirmat cu
 * clientul l-au eliberat dintotdeauna; din 17 aug 2026 îl eliberează și statusul
 * mutat din portal, pentru că altfel o firmă care lucrează serios rămâne blocată
 * până apucăm noi să confirmăm telefonic, iar plafonul pedepsește exact firmele
 * bune (feedback DND Galați).
 *
 * `nu_raspunde` e singura excepție: e singurul status pe care clientul nu-l poate
 * confirma (n-a răspuns, prin definiție), deci acolo cerem o notă. O linie scrisă
 * costă destul cât să nu se mute pastila mecanic și ne lasă ceva de verificat.
 * Restul statusurilor rămân auto-raportate — `isClaimStatusUnproven` e plasa
 * pentru cele mutate în gol.
 */
export function claimHoldsFirmSlot(claim: {
  contactedAt: string;
  releasedAt: string;
  firmStatus: ClaimStatus;
  noteCount: number;
}): boolean {
  if (claim.contactedAt || claim.releasedAt) return false;
  if (claim.firmStatus === 'de_sunat') return true;
  return claim.firmStatus === 'nu_raspunde' && claim.noteCount === 0;
}

export function countActiveClaimsForFirm<
  T extends {
    numeFirma: string;
    telefon: string;
    contactedAt: string;
    releasedAt: string;
    firmStatus: ClaimStatus;
    firmNotes: unknown[];
  },
>(claims: T[], firm: { numeFirma: string; telefon: string }): number {
  return claims.filter(
    (c) => isSameFirm(c, firm) && claimHoldsFirmSlot({ ...c, noteCount: c.firmNotes.length }),
  ).length;
}

/**
 * Revendicarea ține unul din cele MAX_CLAIMS_PER_LEAD locuri ale cererii.
 * Renunțarea îl eliberează, la fel și `pierdut`: o firmă care a marcat că
 * clientul a ales pe altcineva sau a amânat n-are ce discuta cu el, iar locul
 * ținut de ea arăta cererea ca plină în feed degeaba. Apelul confirmat NU
 * eliberează locul cererii — clientul e chiar atunci în discuții cu firma aia.
 */
export function claimOccupiesLeadSlot(claim: {
  releasedAt: string;
  firmStatus: ClaimStatus;
}): boolean {
  return !claim.releasedAt && claim.firmStatus !== 'pierdut';
}

export function claimsHeldForLead<
  T extends { leadId: string; releasedAt: string; firmStatus: ClaimStatus },
>(claims: T[], leadId: string): T[] {
  return claims.filter((c) => c.leadId === leadId && claimOccupiesLeadSlot(c));
}

// ── Ceasul revendicărilor: zile lucrătoare ─────────────────────────────────
// Firmele nu lucrează sâmbăta, duminica și de sărbătorile legale. Un email de
// luni dimineața care spune „au trecut 2 zile" peste un weekend e o nedreptate
// pe care o simt imediat, iar dreptatea aia costă credibilitatea tuturor
// celorlalte mesaje (feedback DND Galați, 17 aug 2026). Tot ce pune presiune pe
// firmă numără în zile lucrătoare. Vechimea CERERII rămâne calendaristică
// (calendarAgeDays): clientul care a scris vineri așteaptă și sâmbătă.

/** Zilele libere cu dată fixă, MM-DD (Codul Muncii, art. 139). */
const RO_FIXED_HOLIDAYS = new Set([
  '01-01', '01-02', // Anul Nou
  '01-06', '01-07', // Boboteaza, Sfântul Ioan
  '01-24', // Unirea Principatelor
  '05-01', // Ziua Muncii
  '06-01', // Ziua Copilului
  '08-15', // Adormirea Maicii Domnului
  '11-30', '12-01', // Sfântul Andrei, Ziua Națională
  '12-25', '12-26', // Crăciunul
]);

/**
 * Paștele ortodox — algoritmul Meeus pe calendarul iulian, plus 13 zile pentru
 * gregorian (valabil 1900–2099). Calculat, nu listat: o listă hardcodată expiră
 * tăcut la schimbarea anului, iar expirarea ei ar însemna exact bug-ul pe care
 * codul ăsta îl repară. Control: 2026 → 12 aprilie, 2027 → 2 mai.
 */
function orthodoxEasterUtc(year: number): number {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31); // 3 = martie, 4 = aprilie
  const day = ((d + e + 114) % 31) + 1;
  return Date.UTC(year, month - 1, day + 13);
}

/** Sărbătorile mobile: Vinerea Mare, cele două zile de Paște, cele două de Rusalii. */
function movableHolidays(year: number): Set<string> {
  const easter = orthodoxEasterUtc(year);
  const keys = new Set<string>();
  for (const offset of [-2, 0, 1, 49, 50]) {
    keys.add(new Date(easter + offset * 86_400_000).toISOString().slice(0, 10));
  }
  return keys;
}

const movableHolidayCache = new Map<number, Set<string>>();

/** `true` dacă ziua dată (YYYY-MM-DD, ora României) e zi lucrătoare. */
export function isBusinessDay(ymd: string): boolean {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return true;
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  if (dow === 0 || dow === 6) return false;
  if (RO_FIXED_HOLIDAYS.has(ymd.slice(5))) return false;
  let movable = movableHolidayCache.get(y);
  if (!movable) {
    movable = movableHolidays(y);
    movableHolidayCache.set(y, movable);
  }
  return !movable.has(ymd);
}

/** Ziua calendaristică (YYYY-MM-DD) în care cade un moment, ora României. */
export function bucharestDay(ms: number): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Bucharest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms));
}

/**
 * Zile lucrătoare întregi scurse între două momente. O zi se numără abia după ce
 * s-au împlinit 24 de ore de la reper ȘI ziua în care cad orele alea e
 * lucrătoare: aprobat vineri la 10:00 înseamnă 0 sâmbătă, 0 duminică, 1 luni, 2
 * marți. Pasul e de 24h fix, deci de două ori pe an ora de perete alunecă cu una
 * din cauza orei de vară — irelevant la granularitate de zi.
 */
export function businessDaysBetween(fromMs: number, toMs: number = Date.now()): number {
  if (!Number.isFinite(fromMs) || !(toMs > fromMs)) return 0;
  // Plasă pentru date corupte din Sheet (un timestamp din 1970 ar da zeci de mii
  // de pași la fiecare rând citit).
  const elapsed = Math.min(Math.floor((toMs - fromMs) / 86_400_000), 3650);
  let count = 0;
  for (let k = 1; k <= elapsed; k++) {
    if (isBusinessDay(bucharestDay(fromMs + k * 86_400_000))) count++;
  }
  return count;
}

/** Pragul, în ZILE LUCRĂTOARE, de la care o revendicare fără mișcare cere follow-up. */
export const CLAIM_STALE_DAYS = 2;

interface ClaimActivity {
  timestamp: string;
  contactedAt: string;
  approvedAt: string;
  offeredAt: string;
  releasedAt: string;
  firmNotes: LeadNote[];
}

/** Ultima mișcare pe revendicare (revendicat/aprobat/apel/ofertă/notă), în unix ms. */
export function claimLastActivity(claim: ClaimActivity): number {
  const stamps = [claim.timestamp, claim.contactedAt, claim.approvedAt, claim.offeredAt]
    .map((s) => Date.parse(s))
    .filter((n) => Number.isFinite(n));
  for (const n of claim.firmNotes) {
    // Notele au doar dată (+ oră locală RO) — parse-ul aproximativ e suficient
    // pentru un prag de zile întregi.
    const t = Date.parse(n.time ? `${n.date}T${n.time}:00` : `${n.date}T12:00:00`);
    if (Number.isFinite(t)) stamps.push(t);
  }
  return stamps.length ? Math.max(...stamps) : 0;
}

/**
 * Firma a primit datele clientului, n-a marcat oferta și nimic nu s-a mișcat
 * de CLAIM_STALE_DAYS zile: de sunat, aflăm dacă mai e de interes sau
 * realocăm cererea. Revendicările de dinainte de portal (fără aprobare) nu
 * intră — ar aprinde tot istoricul.
 */
export function isClaimStale(claim: ClaimActivity, now: number = Date.now()): boolean {
  if (claim.releasedAt || claim.offeredAt || !claim.approvedAt) return false;
  return businessDaysBetween(claimLastActivity(claim), now) >= CLAIM_STALE_DAYS;
}

/**
 * Cazul mai tare decât `isClaimStale`: firma are datele clientului de
 * CLAIM_STALE_DAYS zile și **n-a atins deloc** revendicarea — statusul e tot
 * `de_sunat` (n-a mutat pastila) și n-a scris nicio notă. Aici nu e vorba de o
 * ofertă care întârzie, ci de o cerere luată și uitată, în care clientul
 * așteaptă un telefon care nu vine. Se calculează identic în portal (bannerul
 * către firmă) și în admin (marcajul de follow-up), de-aia stă aici și ia doar
 * câmpuri simple, ca să meargă și în componentele client.
 */
export function isClaimUntouched(
  claim: {
    approvedAt: string;
    releasedAt: string;
    firmStatus: ClaimStatus;
    noteCount: number;
  },
  now: number = Date.now(),
): boolean {
  if (!claim.approvedAt || claim.releasedAt) return false;
  if (claim.firmStatus !== 'de_sunat' || claim.noteCount > 0) return false;
  return claimIdleBusinessDays(claim.approvedAt, now) >= CLAIM_STALE_DAYS;
}

/**
 * Firma a mutat statusul (deci și-a eliberat slotul), dar n-a scris nicio notă,
 * n-a marcat ofertă și clientul nu ne-a confirmat niciun apel. Nu e o acuzație:
 * de cele mai multe ori a sunat și n-a apucat să scrie. Dar e exact forma pe care
 * ar lua-o și mutarea pastilei doar ca să se elibereze un loc, deci e singurul
 * lucru de verificat înainte să relaxăm și mai mult plafonul.
 */
export function isClaimStatusUnproven(
  claim: {
    approvedAt: string;
    releasedAt: string;
    contactedAt: string;
    offeredAt: string;
    firmStatus: ClaimStatus;
    noteCount: number;
  },
  now: number = Date.now(),
): boolean {
  if (!claim.approvedAt || claim.releasedAt || claim.contactedAt || claim.offeredAt) return false;
  if (claim.firmStatus === 'de_sunat' || claim.noteCount > 0) return false;
  return claimIdleBusinessDays(claim.approvedAt, now) >= CLAIM_STALE_DAYS;
}

/** Zile LUCRĂTOARE de când firma are datele clientului. -1 dacă data nu se parsează. */
export function claimIdleBusinessDays(approvedAt: string, now: number = Date.now()): number {
  const t = Date.parse(approvedAt);
  if (!Number.isFinite(t)) return -1;
  return businessDaysBetween(t, now);
}

/**
 * Aceeași distanță în zile calendaristice: ceasul CLIENTULUI, care nu are
 * weekend. Se afișează doar în admin, lângă cifra în zile lucrătoare, ca lista
 * mea de apeluri să vadă cât așteaptă omul de fapt.
 */
export function claimIdleCalendarDays(approvedAt: string, now: number = Date.now()): number {
  const t = Date.parse(approvedAt);
  if (!Number.isFinite(t)) return -1;
  return Math.floor((now - t) / 86_400_000);
}

// ── Cadența emailului „mai ești interesat?" ────────────────────────────────
// Primul reminder după CLAIM_REMINDER_FIRST_DAYS zile lucrătoare de la aprobare,
// apoi la fiecare CLAIM_REMINDER_REPEAT_DAYS. Se oprește după
// CLAIM_REMINDER_MAX: un email la care nimeni n-a reacționat de trei ori nu
// devine util a patra oară, doar antrenează firma să ne ignore inclusiv
// mesajele care contează. După ultimul, revendicarea apare în /admin/crm ca „de
// realocat" și se rezolvă la telefon — nu automat, pentru că a lua revendicarea
// unei firme pe baza unui status pe care poate a uitat să-l miște arde
// încrederea mai repede decât recuperează cererea.

export const CLAIM_REMINDER_FIRST_DAYS = CLAIM_STALE_DAYS;
export const CLAIM_REMINDER_REPEAT_DAYS = 4;
export const CLAIM_REMINDER_MAX = 3;

export interface ClaimReminderState {
  approvedAt: string;
  releasedAt: string;
  firmStatus: ClaimStatus;
  noteCount: number;
  /** Coloana O: când a plecat ultimul reminder. Gol = niciunul. */
  remindedAt: string;
  /** Coloana P: câte au plecat până acum. */
  reminderCount: number;
}

export function claimReminderDue(claim: ClaimReminderState, now: number = Date.now()): boolean {
  if (!isClaimUntouched(claim, now)) return false;
  if (claim.reminderCount >= CLAIM_REMINDER_MAX) return false;
  if (!claim.reminderCount || !claim.remindedAt) {
    return claimIdleBusinessDays(claim.approvedAt, now) >= CLAIM_REMINDER_FIRST_DAYS;
  }
  const last = Date.parse(claim.remindedAt);
  // Marcaj corupt: mai bine tace decât să trimită în fiecare dimineață.
  if (!Number.isFinite(last)) return false;
  return businessDaysBetween(last, now) >= CLAIM_REMINDER_REPEAT_DAYS;
}

/** Am trimis tot ce aveam de trimis și tot nimic: rămâne apelul sau realocarea. */
export function claimRemindersExhausted(
  claim: ClaimReminderState,
  now: number = Date.now(),
): boolean {
  return claim.reminderCount >= CLAIM_REMINDER_MAX && isClaimUntouched(claim, now);
}

// ── CRM Firme: pipeline-ul telefonic pe instalatori ─────────────────────────
// Stările urmăresc conversația de vânzare (exclusivitate pe județ, leaduri),
// nu starea firmei în director. Fără diacritice, ca la LEAD_STATUSES.

export const FIRM_STATUSES = [
  'de_sunat',
  'nu_raspunde',
  'discutii',
  'interesat',
  'client',
  'refuzat',
] as const;
export type FirmStatus = (typeof FIRM_STATUSES)[number];

export const FIRM_STATUS_LABELS: Record<FirmStatus, string> = {
  de_sunat: 'De sunat',
  nu_raspunde: 'Nu răspunde',
  discutii: 'În discuții',
  interesat: 'Interesat',
  client: 'Client',
  refuzat: 'Refuzat',
};

export const FIRM_STATUS_HINTS: Record<FirmStatus, string> = {
  de_sunat: 'pe listă, încă n-am vorbit',
  nu_raspunde: 'am încercat, nu răspunde, mai încearcă',
  discutii: 'am vorbit, discuția e deschisă',
  interesat: 'vrea să lucreze cu noi, de închis',
  client: 'are o înțelegere activă cu noi',
  refuzat: 'a zis nu, nu insista',
};

function foldDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Cuvinte care apar și în denumiri de firme, și în limbajul curent al notelor
 * („i-am zis de sistemul solar", „instalație electrică"). Singure nu identifică
 * o firmă, deci nu declanșează o mențiune.
 */
const GENERIC_NAME_WORDS = new Set([
  'solar', 'solare', 'energy', 'energie', 'electric', 'electrica', 'instal',
  'instalatii', 'panouri', 'power', 'green', 'eco', 'smart', 'pro', 'total',
  'construct', 'constructii', 'service', 'servicii', 'grup', 'group', 'tech',
  'system', 'systems', 'sisteme', 'romania', 'expert', 'proiect', 'montaj',
]);

/**
 * O notă de pe o cerere „pomenește" firma? În vorbire firma e rar numele
 * complet din registru — „JTS Instal Construct" e „JTS" — deci după numele
 * complet normalizat încercăm și primul cuvânt singur, dar doar dacă e
 * distinctiv (nu generic, minim 3 caractere). Fals-pozitivele rămase sunt
 * inofensive: secțiunea de mențiuni doar afișează, nu scrie nicăieri.
 */
export function firmMentionedIn(text: string, firmName: string): boolean {
  const clean = (s: string) =>
    foldDiacritics(s.toLowerCase()).replace(/[^a-z0-9]+/g, ' ').trim();
  const name = clean(normalizeFirmName(firmName));
  if (name.length < 3) return false;
  const hay = ` ${clean(text)} `;
  if (hay.includes(` ${name} `)) return true;
  const first = name.split(' ')[0];
  if (first === name || first.length < 3 || GENERIC_NAME_WORDS.has(first)) return false;
  return hay.includes(` ${first} `);
}

// ── Firmele cerute explicit de client ──────────────────────────────────────
// Coloana L din Leads. Până pe 21 aug 2026 ținea o singură firmă (cea de pe
// pagina de unde pornea cererea); acum ține până la MAX_REQUESTED_FIRMS, pentru
// că un client din Sibiu a trimis 3 cereri identice doar ca să ceară 3 firme
// diferite. Separatorul e deliberat „; ": numele firmelor nu conțin punct și
// virgulă, iar celula rămâne lizibilă pentru un om în Sheet.
export const MAX_REQUESTED_FIRMS = 4;
const REQUESTED_FIRMS_SEP = '; ';

export function parseRequestedFirms(cell: string | undefined | null): string[] {
  return (cell || '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinRequestedFirms(names: readonly string[]): string {
  // Deduplicare pe nume normalizat: la comasarea a două cereri aceeași firmă
  // poate veni scrisă de două ori.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of names) {
    const n = raw.trim();
    const key = normalizeFirmName(n);
    if (!n || !key || seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out.join(REQUESTED_FIRMS_SEP);
}

/**
 * Două cereri sunt de la același om dacă au același telefon (normalizat) sau
 * același email. Semnal pentru /admin/crm și pentru scripts/merge-leads.mjs,
 * nu regulă automată: decizia de comasare rămâne la om.
 */
export function isSameClient(
  a: { telefon: string; email: string },
  b: { telefon: string; email: string },
): boolean {
  const phoneA = normalizePhone(a.telefon);
  if (phoneA && phoneA === normalizePhone(b.telefon)) return true;
  const emailA = a.email.trim().toLowerCase();
  return emailA !== '' && emailA === b.email.trim().toLowerCase();
}

/**
 * Coloana AD ține pozele clientului. Firma o primește în portal ca link, deci
 * acolo are voie doar un URL; pe /cereri contează doar că există ceva. Separarea
 * există ca semnalul „are poze" să poată fi aprins imediat ce pozele ajung pe
 * email, fără să aștepte urcarea lor în Drive.
 */
export function isPozeLink(poze: string): boolean {
  return /^https?:\/\//i.test(poze.trim());
}
