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

export interface WhatsappCheck {
  /** Linkul wa.me cu numărul clientului și textul completat. */
  href: string;
  text: string;
  firms: NamedFirm[];
}

/**
 * Mesajul pentru cererea dată, sau null dacă nu are rost (închisă, fără nicio
 * ofertă de la o firmă, fără mobil). Semnează linkul, deci
 * cere PORTAL_SECRET; fără el întoarce null, nu un link care n-ar merge.
 */
export function whatsappCheckFor(lead: NewLead, claims: LeadClaim[]): WhatsappCheck | null {
  if (isLeadHidden(lead) || isLeadClosed(lead.crmStatus) || isLeadInformez(lead)) return null;
  const firms = offerFirms(lead.timestamp, claims);
  if (firms.length === 0) return null;
  const number = whatsappNumber(lead.telefon);
  if (!number) return null;
  let link: string;
  try {
    link = `${clientLinkUrl(lead.timestamp, 'verificare')}&via=wa`;
  } catch {
    return null;
  }
  const text = whatsappText(lead, firms, link);
  return { href: `https://wa.me/${number}?text=${encodeURIComponent(text)}`, text, firms };
}

/** Când a deschis Radu ultima dată mesajul, pe cerere. */
export async function getWhatsappOpened(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await db()`
    SELECT lead_id, max(at) AS at FROM client_events
    WHERE event = 'whatsapp_deschis' AND lead_id = ANY(${ids}) GROUP BY lead_id
  `;
  return new Map(rows.map((r) => [String(r.lead_id), new Date(r.at as string).toISOString()]));
}
