// „Ați găsit o ofertă bună?" pe WhatsApp, trimis de mână din /admin/cereri
// (12 nov 2026, cerut de Radu). Pe email, întrebarea a avut 0 „am semnat” din
// 39 până pe 28 oct, iar clientul e singura confirmare independentă că a
// semnat (comisionul se plătește doar pe lucrarea concretizată).
//
// De ce de mână și nu prin API: Cloud API cere șablon aprobat de Meta și acordul
// explicit al omului pentru WhatsApp, pe care formularul nu-l cere. Butonul din
// admin deschide WhatsApp cu numărul clientului și textul completat; Radu apasă
// „Trimite” din aplicația lui.
//
// Mesajul are un singur link semnat, spre /cerere/verificare, unde sunt aceleași
// butoane ca în email. Așa răspunsul intră în sistem (cererea trece pe
// câștigată, nota, emailul pe contact@); un „am semnat” scris doar pe WhatsApp
// nu schimbă nimic și trebuie trecut de mână.
//
// Cine apare (Radu, 12 nov: „toate cererile care au primit ofertă”): cererile
// deschise, nu „mă informez”, unde cel puțin o firmă care n-a renunțat a trimis
// ofertă, adică e pe „Ofertă trimisă” sau „Concretizat” ori are data ofertei.
// Fără pragul de 14 zile al emailului și indiferent dacă emailul a plecat deja:
// WhatsApp e tocmai a doua încercare. „În discuții” fără ofertă nu intră.
//
// Marcajul: evenimentul `whatsapp_deschis` din client_events, scris la click.
// Înseamnă că Radu a deschis mesajul, nu că l-a și trimis.
//
// 13 nov 2026 (Radu: „unii au închis cererile și au ales altundeva”), al doilea
// mesaj, „Cu ce firmă ați lucrat?”, pe cererile închise pe `altundeva` pe care
// le-a revendicat cel puțin o firmă, inclusiv una care a renunțat între timp:
// o firmă care marchează „pierdut” și apoi semnează pe sub mână e tocmai cazul
// căutat. Linkul duce la /cerere/raspuns/firmaaleasa, cu firmele care au
// revendicat cererea ca butoane și un câmp pentru altă firmă. Răspunsul nu
// schimbă statusul, doar notează și te anunță pe contact@ dacă e o firmă de la
// noi. Marcajul lui e separat, `whatsapp_firma_deschis`, ca o cerere întrebată
// cândva „ofertă bună?” să poată fi întrebată și asta.
//
// 18 nov 2026 (Radu, la comercialele revendicate de Axionet și rămase fără
// veste: „să vedem ce zic ei”), al treilea mesaj, „Mai căutați?”, pe cererile
// deschise unde „ofertă bună?” nu se potrivește (nicio ofertă trimisă, sau
// „mă informez”), dar cel puțin o firmă ține cererea și nimic nu s-a mișcat de
// STATUS_LINISTE_ZILE zile (nici firma, nici clientul, nici noi). Statusul pus
// de firmă („În discuții”, „De sunat”) rămâne des neatins după ce clientul a
// ales: pe 17 nov, mai mulți cu „Ofertă trimisă” alegeseră deja altundeva. Fără
// link și fără numele firmelor: întrebăm doar unde e clientul. O singură dată pe
// cerere, fără revenire. Marcajul: `whatsapp_status_deschis`.

import 'server-only';
import { parsePhoneNumberFromString } from 'libphonenumber-js/min';
import { db } from './db';
import { clientLinkUrl } from './lead-client-token';
import { isLeadClosed, isLeadHidden, isLeadInformez, type LeadClaim, type NewLead } from './sheets';
import { firmDisplayName, type NamedFirm } from './verificare-status';

/** Firmele care au trimis ofertă pe cerere și n-au renunțat, câte o dată pe firmă. */
export function offerFirms(leadId: string, claims: LeadClaim[]): NamedFirm[] {
  const seen = new Set<string>();
  return claims
    .filter(
      (c) =>
        c.leadId === leadId &&
        !c.releasedAt &&
        (c.firmStatus === 'ofertat' || c.firmStatus === 'castigat' || Boolean(c.offeredAt)),
    )
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((c) => ({ name: firmDisplayName(c), claimTs: c.timestamp, status: c.firmStatus }))
    .filter((f) => !seen.has(f.name) && seen.add(f.name));
}

/** Toate firmele care au revendicat cererea, și cele care au renunțat, câte o dată pe firmă. */
export function claimFirms(leadId: string, claims: LeadClaim[]): NamedFirm[] {
  const seen = new Set<string>();
  return claims
    .filter((c) => c.leadId === leadId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((c) => ({ name: firmDisplayName(c), claimTs: c.timestamp, status: c.firmStatus }))
    .filter((f) => !seen.has(f.name) && seen.add(f.name));
}

/**
 * Numărul pentru wa.me: doar cifre, cu prefixul țării. Null dacă numărul nu e
 * valid sau e un fix românesc (WhatsApp merge pe mobil).
 */
export function whatsappNumber(telefon: string): string | null {
  const phone = parsePhoneNumberFromString(telefon || '', 'RO');
  if (!phone?.isValid()) return null;
  if (phone.country === 'RO' && !String(phone.nationalNumber).startsWith('7')) return null;
  return phone.number.replace(/^\+/, '');
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'long' });
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} și ${names.at(-1)}`;
}

/** Textul mesajului. Orice schimbare trece întâi pe la Radu. */
export function whatsappText(lead: NewLead, firms: NamedFirm[], link: string): string {
  const putere = lead.putere ? ` de ${lead.putere} kW` : '';
  const unde = !lead.judet ? '' : lead.judet === 'București' ? ' în București' : ` în județul ${lead.judet}`;
  const names = joinNames(firms.map((f) => f.name));
  const contact =
    firms.length === 1
      ? `iar ${names} ne-a transmis că v-a trimis o ofertă`
      : `iar ${names} ne-au transmis că v-au trimis oferte`;
  return [
    `Bună ziua! Sunt Radu, de la instalatori-fotovoltaice.ro. Pe ${fmtDay(lead.timestamp)} ați trimis la noi o cerere pentru un sistem fotovoltaic${putere}${unde}, ${contact}.`,
    `Ați găsit o ofertă bună? Puteți răspunde dintr-un click aici:\n${link}`,
    'Ne ajută să știm care firme își fac treaba. Dacă aveți întrebări, îmi puteți scrie aici.',
  ].join('\n\n');
}

/** Textul „Cu ce firmă ați lucrat?”. Fără numele firmelor: sunt pe pagină, iar în mesaj ar suna a acuzație. */
export function whatsappFirmaText(lead: NewLead, link: string): string {
  const putere = lead.putere ? ` de ${lead.putere} kW` : '';
  const unde = !lead.judet ? '' : lead.judet === 'București' ? ' în București' : ` în județul ${lead.judet}`;
  return [
    `Bună ziua! Sunt Radu, de la instalatori-fotovoltaice.ro. Pe ${fmtDay(lead.timestamp)} ați trimis la noi o cerere pentru un sistem fotovoltaic${putere}${unde}. Am înțeles că între timp ați ales o firmă, mulțumim că ne-ați anunțat!`,
    `Ca să ne ținem evidența corectă: cu ce firmă ați lucrat până la urmă? Puteți răspunde dintr-un click aici:\n${link}`,
    'Sau îmi scrieți direct numele firmei aici.',
  ].join('\n\n');
}

/** Textul „Mai căutați?”. Scris de Radu pe 18 nov 2026; orice schimbare trece întâi pe la el. */
export function whatsappStatusText(lead: NewLead): string {
  // Puterea doar dacă e un număr pozitiv (există cereri cu „-5” scris în formular).
  const putere = Number.parseFloat(String(lead.putere).replace(',', '.')) > 0 ? ` de ${lead.putere} kW` : '';
  const unde = !lead.judet ? '' : lead.judet === 'București' ? ' în București' : ` în județul ${lead.judet}`;
  return [
    `Bună ziua! Sunt Radu, de la instalatori-fotovoltaice.ro. Pe ${fmtDay(lead.timestamp)} ați trimis la noi o cerere pentru un sistem fotovoltaic${putere}${unde}.`,
    'Voiam doar să văd dacă ați găsit o ofertă satisfăcătoare sau încă sunteți în căutare de oferte.',
  ].join('\n\n');
}

/** După câte zile fără nicio mișcare pe cerere apare „Mai căutați?”. */
export const STATUS_LINISTE_ZILE = 7;

export type WhatsappKind = 'oferta' | 'firma' | 'status';

export interface WhatsappCheck {
  /**
   * `oferta` = „Ați găsit o ofertă bună?” (deschise, cu ofertă), `firma` = „Cu ce firmă ați lucrat?” (închise pe
   * altundeva), `status` = „Mai căutați?” (deschise, fără ofertă sau „mă informez”, liniștite de 7+ zile).
   */
  kind: WhatsappKind;
  /** Linkul wa.me cu numărul clientului și textul completat. */
  href: string;
  text: string;
  firms: NamedFirm[];
}

/**
 * Mesajul pentru cererea dată, sau null dacă nu are rost (închisă, fără nicio
 * firmă pe ea, fără mobil). Semnează linkul, deci
 * cere PORTAL_SECRET; fără el întoarce null, nu un link care n-ar merge.
 * `lastMoveAt` = ultima mișcare pe cerere (firmă, client, noi), pentru „Mai
 * căutați?”; fără ea mesajul ăsta nu apare.
 */
export function whatsappCheckFor(
  lead: NewLead,
  claims: LeadClaim[],
  lastMoveAt?: string | null,
  now = Date.now(),
): WhatsappCheck | null {
  if (isLeadHidden(lead)) return null;
  if (lead.crmStatus === 'altundeva') return whatsappFirmaFor(lead, claims);
  if (isLeadClosed(lead.crmStatus)) return null;
  const firms = isLeadInformez(lead) ? [] : offerFirms(lead.timestamp, claims);
  if (firms.length === 0) return whatsappStatusFor(lead, claims, lastMoveAt, now);
  const number = whatsappNumber(lead.telefon);
  if (!number) return null;
  let link: string;
  try {
    link = `${clientLinkUrl(lead.timestamp, 'verificare')}&via=wa`;
  } catch {
    return null;
  }
  const text = whatsappText(lead, firms, link);
  return { kind: 'oferta', href: `https://wa.me/${number}?text=${encodeURIComponent(text)}`, text, firms };
}

/** „Mai căutați?”, dacă o firmă încă ține cererea și nimic nu s-a mișcat de STATUS_LINISTE_ZILE zile. */
function whatsappStatusFor(
  lead: NewLead,
  claims: LeadClaim[],
  lastMoveAt: string | null | undefined,
  now: number,
): WhatsappCheck | null {
  const held = claims.filter((c) => c.leadId === lead.timestamp && !c.releasedAt);
  if (held.length === 0) return null;
  const last = Date.parse(lastMoveAt || '');
  if (!Number.isFinite(last) || now - last < STATUS_LINISTE_ZILE * 86_400_000) return null;
  const number = whatsappNumber(lead.telefon);
  if (!number) return null;
  const firms = claimFirms(lead.timestamp, held);
  const text = whatsappStatusText(lead);
  return { kind: 'status', href: `https://wa.me/${number}?text=${encodeURIComponent(text)}`, text, firms };
}

/** „Cu ce firmă ați lucrat?”, doar dacă cel puțin o firmă a revendicat cererea. */
function whatsappFirmaFor(lead: NewLead, claims: LeadClaim[]): WhatsappCheck | null {
  const firms = claimFirms(lead.timestamp, claims);
  if (firms.length === 0) return null;
  const number = whatsappNumber(lead.telefon);
  if (!number) return null;
  let link: string;
  try {
    link = `${clientLinkUrl(lead.timestamp, 'firmaaleasa')}&via=wa`;
  } catch {
    return null;
  }
  const text = whatsappFirmaText(lead, link);
  return { kind: 'firma', href: `https://wa.me/${number}?text=${encodeURIComponent(text)}`, text, firms };
}

// ── Revenirea (18 nov 2026) ─────────────────────────────────────────────────
// Radu, 17 nov: „aș vrea să fac un follow-up la cei care nu au răspuns sau nu
// mi-au dat firma. Nu agresiv, dar nu aș vrea să-i las așa de ușor.” O singură
// revenire pe mesaj, cel mai devreme a doua zi (lib/whatsapp-tracking alege
// cine intră). Trei feluri:
//  - `oferta`: n-a răspuns deloc la „Ofertă bună?”; același link, cu `via=wa2`,
//    ca deschiderea să se vadă venită din revenire;
//  - `firma`: n-a răspuns la „Cu ce firmă ați lucrat?”; același link;
//  - `nume_firma`: a spus că a ales o firmă (pe WhatsApp sau pe link, „din
//    afara platformei”), fără s-o numească. Fără link: vrem doar numele, scris.
//
// 19 nov 2026, a treia și ultima încercare, `ultimul`: doar pe „Ofertă bună?”,
// la cine n-a răspuns nici la revenire, după 5+ zile. Spune că e ultimul mesaj
// și cere o cifră (1 / 2 / 3). Fără link, ca să nu arate a mesaj automat.

export type RevenireMotiv = 'oferta' | 'firma' | 'nume_firma' | 'ultimul';

function bucharestDay(ms: number): string {
  return new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Bucharest' });
}

/** „de ieri” sau „de pe 12 noiembrie”, după ziua primului mesaj. */
function sinceFirst(firstSentAt: string, now = Date.now()): string {
  const days = Math.round((Date.parse(bucharestDay(now)) - Date.parse(bucharestDay(Date.parse(firstSentAt)))) / 86_400_000);
  return days === 1 ? 'de ieri' : `de pe ${fmtDay(firstSentAt)}`;
}

/** Textul revenirii. Orice schimbare trece întâi pe la Radu. */
export function whatsappRevenireText(
  lead: NewLead,
  motiv: RevenireMotiv,
  firstSentAt: string,
  link: string | null,
): string {
  const unde = !lead.judet ? '' : lead.judet === 'București' ? ' din București' : ` din județul ${lead.judet}`;
  if (motiv === 'nume_firma') {
    return [
      'Bună ziua! Mulțumesc pentru răspuns. O singură întrebare: cu ce firmă ați ales să montați sistemul? E de ajuns numele.',
      'Ne ajută să știm care firme își fac treaba bine.',
    ].join('\n\n');
  }
  if (motiv === 'ultimul') {
    return [
      `Bună ziua! Ultimul mesaj de la mine despre cererea pentru sistemul fotovoltaic${unde}, nu vă mai deranjez după asta.`,
      'Mi-ar fi de mare ajutor un singur răspuns, chiar și o cifră:\n1 = am ales o firmă\n2 = încă mă uit\n3 = am renunțat',
      'Mulțumesc frumos!',
    ].join('\n\n');
  }
  const intro = `Bună ziua! Revin la mesajul meu ${sinceFirst(firstSentAt)}, despre cererea pentru sistemul fotovoltaic${unde}.`;
  if (motiv === 'firma') {
    return [
      `${intro} Cu ce firmă ați lucrat până la urmă?`,
      `E de ajuns numele firmei, aici sau dintr-un click:\n${link}`,
      'Vă întreb pentru că vrem să îmbunătățim platforma și să colaborăm cu firme serioase. Mulțumesc!',
    ].join('\n\n');
  }
  return [
    `${intro} Ați găsit o ofertă bună?`,
    `Un răspuns scurt aici e de ajuns, sau un click:\n${link}`,
    'Dacă încă n-ați găsit ce căutați, vă pot recomanda și alte firme din zonă.',
  ].join('\n\n');
}

export interface WhatsappRevenire {
  motiv: RevenireMotiv;
  /** Mesajul la care revine. */
  kind: WhatsappKind;
  href: string;
  text: string;
}

/** Revenirea gata de trimis, sau null dacă numărul nu e de WhatsApp ori linkul nu se poate semna. */
export function whatsappRevenireFor(
  lead: NewLead,
  kind: WhatsappKind,
  motiv: RevenireMotiv,
  firstSentAt: string,
): WhatsappRevenire | null {
  const number = whatsappNumber(lead.telefon);
  if (!number) return null;
  let link: string | null = null;
  if (motiv !== 'nume_firma' && motiv !== 'ultimul') {
    try {
      link = `${clientLinkUrl(lead.timestamp, motiv === 'firma' ? 'firmaaleasa' : 'verificare')}&via=wa2`;
    } catch {
      return null;
    }
  }
  const text = whatsappRevenireText(lead, motiv, firstSentAt, link);
  return { motiv, kind, href: `https://wa.me/${number}?text=${encodeURIComponent(text)}`, text };
}

/** Evenimentul care marchează deschiderea, pe fiecare fel de mesaj. */
export const WHATSAPP_OPENED_EVENT = {
  oferta: 'whatsapp_deschis',
  firma: 'whatsapp_firma_deschis',
  status: 'whatsapp_status_deschis',
} as const satisfies Record<WhatsappKind, string>;

/** Când a deschis Radu ultima dată mesajul de felul dat, pe cerere. */
export async function getWhatsappOpened(ids: string[], kind: WhatsappKind = 'oferta'): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await db()`
    SELECT lead_id, max(at) AS at FROM client_events
    WHERE event = ${WHATSAPP_OPENED_EVENT[kind]} AND lead_id = ANY(${ids}) GROUP BY lead_id
  `;
  return new Map(rows.map((r) => [String(r.lead_id), new Date(r.at as string).toISOString()]));
}
