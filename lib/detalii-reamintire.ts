// A doua zi după cerere, emailul „adăugați pozele / adresa” (16 nov 2026).
//
// De ce: pe formularul din 12 nov, 37 din 39 de cereri au plecat fără poze, iar
// cererile cu poze sunt preluate de mai multe firme (calculul din 6 nov). Lista
// din contul clientului există deja; emailul îl aduce pe om la ea o singură
// dată, din cronul de dimineață (claim-nudge, zilele lucrătoare, în fereastra
// de lucru). Nu pleacă de două ori: tabelul client_emails, felul „detalii”.
//
// Cine îl primește: cererile deschise, trimise într-o zi dinainte (ora
// României) și de cel mult 4 zile, cu email valid, cărora le lipsesc pozele
// sau adresa. Cererile de dinainte de DETAILS_REMINDER_SINCE nu-l primesc
// retroactiv la prima rulare.

import 'server-only';
import { getLeadsSince, isLeadHidden, isTestLead, type NewLead } from './sheets';
import { isLeadClosed } from './sheets-shared';
import { isValidEmail } from './portal-auth';
import { getLeadLocations } from './lead-location';
import { clientEmailsLive } from './client-account';
import { sendDetailsReminderEmail, type MissingDetails } from './email-cont';

export const DETAILS_REMINDER_SINCE = '2026-11-16T00:00:00+02:00';
const MAX_AGE_DAYS = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

const bucharestDay = (ms: number) => new Date(ms).toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });

export function isReminderCandidate(lead: NewLead, now: number): boolean {
  const at = Date.parse(lead.timestamp);
  if (!Number.isFinite(at) || at < Date.parse(DETAILS_REMINDER_SINCE)) return false;
  if (now - at > MAX_AGE_DAYS * DAY_MS) return false;
  // „A doua zi”: nu în ziua în care a trimis cererea, oricât de devreme.
  if (bucharestDay(at) >= bucharestDay(now)) return false;
  if (isLeadHidden(lead) || isLeadClosed(lead.crmStatus) || isTestLead(lead)) return false;
  return isValidEmail(lead.email);
}

export async function sendDetailsReminders(opts: {
  dry: boolean;
  now?: Date;
}): Promise<{ sent: string[]; skipped: string[]; failed: string[] }> {
  const now = (opts.now ?? new Date()).getTime();
  const leads = (await getLeadsSince(new Date(now - (MAX_AGE_DAYS + 1) * DAY_MS))).filter((l) =>
    isReminderCandidate(l, now),
  );
  const sent: string[] = [];
  const skipped: string[] = [];
  const failed: string[] = [];
  if (leads.length === 0) return { sent, skipped, failed };
  if (!clientEmailsLive() && !opts.dry) return { sent, skipped: ['CLIENT_EMAILS oprit'], failed };

  const locations = await getLeadLocations(leads.map((l) => l.timestamp));
  for (const lead of leads) {
    const loc = locations.get(lead.timestamp);
    const missing: MissingDetails = {
      poze: !(Number(lead.poze.match(/\d+/)?.[0]) > 0),
      adresa: !(loc?.adresa || loc?.coordonate),
    };
    const label = `${lead.judet} · ${lead.timestamp} · lipsă: ${[missing.poze && 'poze', missing.adresa && 'adresă']
      .filter(Boolean)
      .join(', ')}`;
    if (!missing.poze && !missing.adresa) continue;
    if (opts.dry) {
      sent.push(label);
      continue;
    }
    const res = await sendDetailsReminderEmail(lead, missing);
    if (res.ok) sent.push(label);
    else if (res.reason === 'deja trimis' || res.reason === 'oprit' || res.reason === 'în afara ferestrei')
      skipped.push(`${label} (${res.reason})`);
    else failed.push(`${label} (${res.reason || 'eroare'})`);
  }
  return { sent, skipped, failed };
}
