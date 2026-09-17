// Orchestrarea fluxului „mă informez" (14 sept 2026). Tot ce decide CINE
// primește CE și CÂND stă aici; scrierea în Sheet e în lib/sheets, textele în
// lib/email-client (client) și lib/email (firme).
//
// Regulile, pe scurt:
//   - întâmpinarea pleacă la răspunsul de la pasul 5 sau, dacă omul a închis
//     pagina, prin cron, la cel puțin două ore după cerere;
//   - check-in la 30 de zile de la întâmpinare, al doilea la 30 de zile după
//     primul, apoi, după încă 30 de zile fără răspuns, cererea se închide ca
//     „inactivă". „Încă mă informez" repornește ceasul;
//   - la „sunt gata" firmele care urmăresc află imediat, restul județului a
//     doua zi dimineață, prin cron. Abonamentul pe județ își păstrează fereastra.

import { revalidatePath } from 'next/cache';
import {
  filterCountyAlertRecipients,
  findSubscriptionForCounty,
  getCountyAlertPrefs,
  getFirmEmailLinksForAlerts,
  getLeadSubscriptions,
  getLeadsSince,
  getWatches,
  isLeadClosed,
  isLeadHidden,
  isLeadInformez,
  isPriorityHeld,
  markInformezCheckin,
  markInformezWelcomeSent,
  markLeadPriorityUntil,
  markProgramAnnounced,
  markReactivationAlertsSent,
  markWatchersNotified,
  reactivateLeadFromClient,
  recordClientResponse,
  updateLeadCrm,
  type FirmEmailLink,
  type LeadWatch,
  type NewLead,
} from './sheets';
import { isValidEmail } from './portal-auth';
import { sendCountyLeadAlert, sendWatchActivatedEmail } from './email';
import {
  sendInformezCheckinEmail,
  sendInformezWelcomeEmail,
  sendProgramOpenedEmail,
} from './email-client';
import { countyAlertPayloadFromLead, leadSummary } from './lead-alerts';
import { getProgramName } from './utils-shared';

const DAY_MS = 86_400_000;
/** Cererile rutinei de sănătate (scripts/e2e-forms.mjs) nu primesc emailuri. */
const TEST_PREFIX = 'routine-test-';
/** Întâmpinarea prin cron așteaptă atât: omul poate fi încă pe pasul 5. */
const WELCOME_MIN_AGE_MS = 2 * 60 * 60 * 1000;
/**
 * Întâmpinarea pleacă doar cererilor de după lansare: „am primit cererea" la o
 * lună după trimitere ar suna a greșeală. Check-in-urile n-au restricția asta,
 * „s-a schimbat ceva?" e o întrebare bună și pe cererile din august.
 */
export const INFORMEZ_SINCE = '2026-09-14T00:00:00.000Z';
export const CHECKIN_INTERVAL_DAYS = 30;
export const CHECKIN_MAX = 2;
/** Plase pentru prima rulare: nu trimitem un val într-o dimineață. */
const MAX_WELCOMES_PER_RUN = 20;
const MAX_CHECKINS_PER_RUN = 20;
const MAX_REACTIVATED_PER_RUN = 20;

function isTestLead(lead: Pick<NewLead, 'email'>): boolean {
  return lead.email.trim().toLowerCase().startsWith(TEST_PREFIX);
}

/** Cerere pe care omul se informează și pe care avem cui scrie. */
export function isInformezClient(lead: NewLead): boolean {
  return (
    isLeadInformez(lead) &&
    !isLeadHidden(lead) &&
    !isLeadClosed(lead.crmStatus) &&
    isValidEmail(lead.email) &&
    !isTestLead(lead)
  );
}

function nowBucharest(now = new Date()): { today: string; time: string } {
  return {
    today: now.toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' }),
    time: now.toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

// ── 1. Întâmpinarea ─────────────────────────────────────────────────────────

export type SendOutcome = 'sent' | 'skipped' | 'failed';

/** Trimite întâmpinarea dacă n-a plecat deja. Idempotentă prin coloana AP. */
export async function sendWelcomeIfDue(lead: NewLead): Promise<SendOutcome> {
  if (!isInformezClient(lead) || lead.emailClientLa) return 'skipped';
  if (lead.timestamp < INFORMEZ_SINCE) return 'skipped';
  const res = await sendInformezWelcomeEmail(lead);
  if (!res.ok) return 'failed';
  await markInformezWelcomeSent(lead.timestamp);
  return 'sent';
}

/** Cererile cu pasul 5 sărit: întâmpinarea cu blocul generic, a doua zi. */
function welcomeDueByCron(lead: NewLead, now: number): boolean {
  return (
    isInformezClient(lead) &&
    !lead.emailClientLa &&
    lead.timestamp >= INFORMEZ_SINCE &&
    now - Date.parse(lead.timestamp) >= WELCOME_MIN_AGE_MS
  );
}

// ── 2. Check-in-urile ───────────────────────────────────────────────────────

/** Al câtelea check-in e scadent acum, sau null. */
export function checkinDue(lead: NewLead, now: number): number | null {
  if (!isInformezClient(lead)) return null;
  if (lead.checkinTrimise >= CHECKIN_MAX) return null;
  // Ancora: ultimul check-in (sau „încă mă informez"), altfel întâmpinarea,
  // altfel cererea însăși (cele de dinainte de lansare n-au întâmpinare).
  const anchor = Date.parse(lead.checkinLa || lead.emailClientLa || lead.timestamp);
  if (!Number.isFinite(anchor)) return null;
  if (now - anchor < CHECKIN_INTERVAL_DAYS * DAY_MS) return null;
  return lead.checkinTrimise + 1;
}

/** Două check-in-uri fără răspuns și încă 30 de zile: se închide singură. */
export function inactiveClosureDue(lead: NewLead, now: number): boolean {
  if (!isInformezClient(lead)) return false;
  if (lead.checkinTrimise < CHECKIN_MAX) return false;
  const last = Date.parse(lead.checkinLa);
  return Number.isFinite(last) && now - last >= CHECKIN_INTERVAL_DAYS * DAY_MS;
}

export async function closeLeadAsInactive(lead: NewLead, now = new Date()) {
  await updateLeadCrm(lead.timestamp, {
    status: 'inactiva',
    note: `Închisă automat: se informa, fără răspuns la ${CHECKIN_MAX} check-in-uri pe email.`,
    ...nowBucharest(now),
  });
}

// ── 3. Răspunsurile clientului ──────────────────────────────────────────────

export async function recordStillWaiting(lead: NewLead) {
  await recordClientResponse(lead.timestamp, 'astept');
}

export async function closeLeadByClient(lead: NewLead, now = new Date()) {
  await recordClientResponse(lead.timestamp, 'renunt');
  await updateLeadCrm(lead.timestamp, {
    status: 'renuntat',
    note: 'Clientul a apăsat „nu mai vreau" în emailul platformei.',
    ...nowBucharest(now),
  });
  revalidatePath('/cereri');
}

/**
 * „Sunt gata": scrie ce a actualizat, datează cererea de acum, anunță imediat
 * firmele care o urmăreau. Restul județului o află prin cronul de a doua zi
 * (announceReactivatedLeads), iar dacă județul are abonat, el o ia primul, în
 * fereastra lui, ca la o cerere nouă.
 */
export async function reactivateLead(
  lead: NewLead,
  fields: { termen: string; finantare?: string; putere?: string; mesaj?: string },
): Promise<{ watchersNotified: number; reservedFor: string | null }> {
  const at = new Date().toISOString();
  await reactivateLeadFromClient(lead.timestamp, fields, at);
  revalidatePath('/cereri');

  const updated: NewLead = {
    ...lead,
    termen: fields.termen,
    finantare: fields.finantare || lead.finantare,
    putere: fields.putere || lead.putere,
    mesaj: fields.mesaj || lead.mesaj,
    reactivataLa: at,
  };

  const watches = (await getWatches()).filter((w) => w.leadId === lead.timestamp && !w.notifiedAt);
  const uniqueEmails = [...new Set(watches.map((w) => w.email).filter(isValidEmail))];
  if (uniqueEmails.length) {
    await Promise.allSettled(
      uniqueEmails.map((to) =>
        sendWatchActivatedEmail({ to, judet: lead.judet, leadSummary: leadSummary(updated), leadId: lead.timestamp }),
      ),
    );
    await markWatchersNotified(lead.timestamp, at);
  }

  let reservedFor: string | null = null;
  const sub = findSubscriptionForCounty(await getLeadSubscriptions(), lead.judet);
  if (sub) {
    const until = new Date(Date.now() + sub.windowHours * 60 * 60 * 1000).toISOString();
    await markLeadPriorityUntil(lead.timestamp, until);
    revalidatePath('/cereri');
    await sendCountyLeadAlert({
      to: sub.email,
      ...countyAlertPayloadFromLead(updated),
      reservedUntil: until,
      reactivated: true,
    });
    reservedFor = sub.firma;
  }

  return { watchersNotified: uniqueEmails.length, reservedFor };
}

// ── 4. Cronul zilnic ────────────────────────────────────────────────────────

export interface InformezDailyResult {
  welcomes: string[];
  checkins: string[];
  closed: string[];
  reactivated: string[];
  failed: string[];
}

/**
 * Pasul „mă informez" din cronul zilnic. Cu `dry` arată ce ar face, fără să
 * trimită și fără să scrie. `businessDay` false = doar ce nu deranjează
 * (alertele de reactivare); check-in-urile și întâmpinările așteaptă luni.
 */
export async function runInformezDaily(
  now: number,
  opts: { dry: boolean; businessDay: boolean },
): Promise<InformezDailyResult> {
  const result: InformezDailyResult = { welcomes: [], checkins: [], closed: [], reactivated: [], failed: [] };
  const [leads, watches, prefs, subs, links] = await Promise.all([
    getLeadsSince(new Date(0)),
    getWatches(),
    getCountyAlertPrefs(),
    getLeadSubscriptions(),
    getFirmEmailLinksForAlerts(),
  ]);

  await announceReactivatedLeads(leads, watches, prefs, links, subs, now, opts.dry, result);
  if (!opts.businessDay) return result;

  for (const lead of leads.filter((l) => welcomeDueByCron(l, now)).slice(0, MAX_WELCOMES_PER_RUN)) {
    const label = `${lead.judet} · ${lead.timestamp} → ${lead.email}`;
    if (opts.dry) {
      result.welcomes.push(label);
      continue;
    }
    const outcome = await sendWelcomeIfDue(lead);
    (outcome === 'sent' ? result.welcomes : result.failed).push(label);
  }

  for (const lead of leads.filter((l) => inactiveClosureDue(l, now))) {
    const label = `${lead.judet} · ${lead.timestamp}`;
    if (!opts.dry) await closeLeadAsInactive(lead, new Date(now));
    result.closed.push(label);
  }

  const due = leads
    .map((lead) => ({ lead, attempt: checkinDue(lead, now) }))
    .filter((d): d is { lead: NewLead; attempt: number } => d.attempt !== null)
    .slice(0, MAX_CHECKINS_PER_RUN);
  for (const { lead, attempt } of due) {
    const label = `${lead.judet} · ${lead.timestamp} → ${lead.email} (check-in ${attempt}/${CHECKIN_MAX})`;
    if (opts.dry) {
      result.checkins.push(label);
      continue;
    }
    const res = await sendInformezCheckinEmail(lead, attempt, now);
    if (!res.ok) {
      result.failed.push(label);
      continue;
    }
    await markInformezCheckin(lead.timestamp, attempt, new Date(now).toISOString());
    result.checkins.push(label);
  }

  return result;
}

/**
 * Alertele pe județ pentru cererile reactivate ieri: către firmele cu județul
 * bifat, minus cele care urmăreau cererea (au primit deja emailul lor la
 * reactivare) și minus abonatul (a primit rezervarea). Marcajul AU se scrie și
 * când nu e nimeni de anunțat, ca rândul să nu se recitească zilnic.
 */
async function announceReactivatedLeads(
  leads: NewLead[],
  watches: LeadWatch[],
  prefs: Awaited<ReturnType<typeof getCountyAlertPrefs>>,
  links: FirmEmailLink[],
  subs: Awaited<ReturnType<typeof getLeadSubscriptions>>,
  now: number,
  dry: boolean,
  result: InformezDailyResult,
) {
  const pending = leads.filter(
    (l) =>
      l.reactivataLa &&
      !l.alerteReactivareLa &&
      !isPriorityHeld(l, now) &&
      !isLeadHidden(l) &&
      !isLeadClosed(l.crmStatus),
  );
  for (const lead of pending.slice(0, MAX_REACTIVATED_PER_RUN)) {
    const sub = findSubscriptionForCounty(subs, lead.judet);
    const watching = watches.filter((w) => w.leadId === lead.timestamp).map((w) => w.email);
    const recipients = filterCountyAlertRecipients(prefs, lead.judet, links, [
      sub?.email ?? '',
      ...watching,
    ]);
    const label = `${lead.judet} · ${lead.timestamp} → ${recipients.length} firme`;
    if (dry) {
      result.reactivated.push(label);
      continue;
    }
    if (recipients.length) {
      const payload = countyAlertPayloadFromLead(lead);
      await Promise.allSettled(
        recipients.map((to) => sendCountyLeadAlert({ to, ...payload, reactivated: true })),
      );
    }
    await markReactivationAlertsSent(lead.timestamp, new Date(now).toISOString());
    result.reactivated.push(label);
  }
}

// ── 5. Deschiderea programului ──────────────────────────────────────────────

export const ANNOUNCEABLE_PROGRAMS = ['afm-baterii', 'casa-verde'] as const;
export type AnnounceableProgram = (typeof ANNOUNCEABLE_PROGRAMS)[number];

/** Cine primește anunțul: se informează, a bifat programul la finanțare, n-a primit deja. */
export function programAnnouncementRecipients(leads: NewLead[], program: AnnounceableProgram): NewLead[] {
  return leads.filter((l) => isInformezClient(l) && l.finantare === program && !l.anuntProgramLa);
}

export async function announceProgramOpened(opts: {
  program: AnnounceableProgram;
  openedOn: string;
  dry: boolean;
}): Promise<{ recipients: string[]; failed: string[] }> {
  const leads = await getLeadsSince(new Date(0));
  const targets = programAnnouncementRecipients(leads, opts.program);
  const programName = getProgramName(opts.program);
  const recipients: string[] = [];
  const failed: string[] = [];
  for (const lead of targets) {
    const label = `${lead.judet} · ${lead.timestamp} → ${lead.email}`;
    if (opts.dry) {
      recipients.push(label);
      continue;
    }
    const res = await sendProgramOpenedEmail(lead, { programName, openedOn: opts.openedOn });
    if (!res.ok) {
      failed.push(label);
      continue;
    }
    await markProgramAnnounced(lead.timestamp);
    recipients.push(label);
  }
  return { recipients, failed };
}
