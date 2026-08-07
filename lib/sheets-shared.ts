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

/**
 * Cum a ajuns o revendicare în Sheet. `self` = firma a apăsat singură pe
 * /cereri (fluxul public), `manual` = am marcat noi în /admin/crm după ce am
 * sunat firma. Distincția contează pentru a nu confunda tracțiunea organică a
 * platformei cu ce împingem noi telefonic. Rândurile scrise înainte de
 * introducerea coloanei rămân goale — le tratăm ca `self` (fluxul singur
 * disponibil atunci).
 */
export const CLAIM_SOURCES = ['self', 'manual'] as const;
export type ClaimSource = (typeof CLAIM_SOURCES)[number];

/**
 * Câte cereri poate ține o firmă în același timp fără să confirme că a sunat
 * clientul. Plafonul per cerere (MAX_CLAIMS_PER_LEAD) nu rezolvă nimic singur:
 * pe 24 iulie 2026 o singură firmă avea 22 din cele 25 de revendicări, iar
 * niciunul dintre cei 4 clienți verificați telefonic nu fusese sunat. O
 * revendicare fără apel e mai rea decât nicio revendicare, pentru că îi spune
 * clientului că se ocupă cineva. Slotul se eliberează când apelul e confirmat.
 */
export const MAX_ACTIVE_CLAIMS_PER_FIRM = 3;

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
 * Revendicările fără apel confirmat — alea ocupă sloturile firmei. O
 * revendicare la care firma a renunțat din portal (releasedAt) nu mai ocupă
 * nimic: renunțarea există exact ca să elibereze locul.
 */
export function countActiveClaimsForFirm<
  T extends { numeFirma: string; telefon: string; contactedAt: string; releasedAt: string },
>(claims: T[], firm: { numeFirma: string; telefon: string }): number {
  return claims.filter((c) => !c.contactedAt && !c.releasedAt && isSameFirm(c, firm)).length;
}

/**
 * Revendicările care ocupă locurile unei cereri (plafonul MAX_CLAIMS_PER_LEAD).
 * Renunțările nu se numără: dacă o firmă se retrage, locul se întoarce în feed
 * pentru alta. Apelul confirmat NU eliberează locul cererii — clientul e deja
 * în discuții cu firma aia, doar slotul firmei se eliberează.
 */
export function claimsHeldForLead<T extends { leadId: string; releasedAt: string }>(
  claims: T[],
  leadId: string,
): T[] {
  return claims.filter((c) => c.leadId === leadId && !c.releasedAt);
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
