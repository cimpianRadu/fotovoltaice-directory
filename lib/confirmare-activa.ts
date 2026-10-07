// Verificarea „mai căutați oferte?" (21 sept 2026). Cererile obișnuite (nu „mă
// informez", acelea au check-in-urile lor) nu primeau nimic după trimitere, iar
// firmele nu aveau de unde ști care sunt încă vii. Clientul primește un email
// cu trei butoane:
//   - „Da, încă vreau oferte" → BA = acum: cardul urcă în feed cu badge
//     „Confirmată activă" și se datează de la confirmare;
//   - „Am ales deja o firmă" → închisă ca `altundeva`, cu firma (opțională)
//     în notă, și un email intern, fiindcă e singura confirmare de concretizare
//     care nu vine de la firmă;
//   - „Nu mai vreau" → același `renunt` ca la „mă informez".
// Tăcerea nu închide nimic. Trimiterea: un lot de test de 10 pe 22 sept, apoi
// nimic până pe 7 oct, când Radu a cerut-o continuă: ACTIVE_CHECK_PER_DAY pe
// zi de la ACTIVE_CHECK_START, fără duminică, prin /api/cron/confirmare-activa
// (sau manual din /api/admin/confirmare-activa). AZ oprește retrimiterea.
// E și unealta de curățenie a feedului: „am ales" și „nu mai vreau" închid
// cererea singure.
//
// Cererile cu o firmă care declară că vorbește cu clientul nu intră aici: pe
// ele le întreabă „Ați găsit o ofertă bună?" (lib/verificare-status), iar
// clientul nu primește ambele emailuri.

import { revalidatePath } from 'next/cache';
import {
  getClaims,
  getLeadsSince,
  isLeadClosed,
  isLeadHidden,
  isLeadInformez,
  markActiveCheckResent,
  markActiveCheckSent,
  markLeadConfirmedActive,
  recordClientResponse,
  updateLeadCrm,
  type LeadClaim,
  type NewLead,
} from './sheets';
import { isValidEmail } from './portal-auth';
import { escapeHtml, sendEmail } from './email';
import { sendActiveCheckEmail } from './email-client';
import { CONTACTED_STATUSES, responseAfter } from './verificare-status';
import { bucharestDay } from './client-email-schedule';
import { alertCountyLeadConfirmedActive } from './informez';

const DAY_MS = 86_400_000;
const TEST_PREFIX = 'routine-test-';
/** Sub atât, omul abia a trimis cererea; întrebarea ar suna a grabă. */
export const ACTIVE_CHECK_MIN_AGE_DAYS = 14;
const INTERNAL_TO = 'contact@instalatori-fotovoltaice.ro';

/** Prima zi a trimiterii continue (ora României). Lotul de test din 22 sept e deja în AZ. */
export const ACTIVE_CHECK_START = '2026-10-08';
/** Câte pe zi, ca la „Ați găsit o ofertă bună?": anti-spam (Radu, 7 oct 2026). Include retrimiterile. */
export const ACTIVE_CHECK_PER_DAY = 5;
/** A doua trimitere, la cine n-a răspuns, cel mai devreme după atâtea zile. */
export const ACTIVE_CHECK_RESEND_AFTER_DAYS = 30;

/** Cereri rezolvate la telefon, încă nemarcate închise în CRM: nu le scriem. */
export const ACTIVE_CHECK_EXCLUDE = [
  '2026-06-24T13:34:08.537Z', // hotelul din Prahova, concretizat prin Electro Prahova
];

/** Cererile la care o firmă declară că vorbește cu clientul: le întreabă celălalt email. */
export function contactedLeadIds(claims: LeadClaim[]): Set<string> {
  return new Set(
    claims.filter((c) => !c.releasedAt && CONTACTED_STATUSES.includes(c.firmStatus)).map((c) => c.leadId),
  );
}

/** Cererea e încă deschisă și e a emailului ăstuia, nu a lui „Ați găsit o ofertă bună?". */
function isOpenForActiveCheck(lead: NewLead, contacted: Set<string>): boolean {
  return (
    !isLeadHidden(lead) &&
    !contacted.has(lead.timestamp) &&
    !lead.verificareStatusLa &&
    !isLeadClosed(lead.crmStatus) &&
    !isLeadInformez(lead) &&
    !lead.confirmataLa &&
    isValidEmail(lead.email) &&
    !lead.email.trim().toLowerCase().startsWith(TEST_PREFIX) &&
    !ACTIVE_CHECK_EXCLUDE.includes(lead.timestamp)
  );
}

export function isActiveCheckCandidate(lead: NewLead, now: number, contacted: Set<string> = new Set()): boolean {
  return (
    isOpenForActiveCheck(lead, contacted) &&
    !lead.verificareTrimisaLa &&
    now - Date.parse(lead.timestamp) >= ACTIVE_CHECK_MIN_AGE_DAYS * DAY_MS
  );
}

/**
 * A doua și ultima trimitere (7 oct 2026, cerută de Radu, „să nu fie spammy"):
 * doar cui n-a răspuns deloc primului email, la cel puțin
 * ACTIVE_CHECK_RESEND_AFTER_DAYS de la el, și doar pe locurile rămase libere
 * din lotul zilei după cererile care îl primesc prima dată (vezi cronul).
 */
export function isActiveCheckResendCandidate(lead: NewLead, now: number, contacted: Set<string> = new Set()): boolean {
  const first = Date.parse(lead.verificareTrimisaLa || '');
  return (
    isOpenForActiveCheck(lead, contacted) &&
    Number.isFinite(first) &&
    !lead.verificareRetrimisaLa &&
    now - first >= ACTIVE_CHECK_RESEND_AFTER_DAYS * DAY_MS &&
    !responseAfter(lead, lead.verificareTrimisaLa)
  );
}

function nowBucharest(now = new Date()): { today: string; time: string } {
  return {
    today: now.toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' }),
    time: now.toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

/**
 * Trimite verificarea celor mai vechi `limit` cereri eligibile (cele mai vechi
 * întâi) cu vechimea între `minDays` și `maxDays`. Cu `dry` doar le listează.
 */
export async function sendActiveChecks(opts: {
  limit: number;
  minDays?: number;
  maxDays?: number;
  /** Id-uri de sărit (ex: cereri rezolvate la telefon, încă nemarcate în CRM). */
  exclude?: string[];
  dry: boolean;
}): Promise<{ sent: string[]; failed: string[]; eligible: number }> {
  if (opts.limit <= 0) return { sent: [], failed: [], eligible: 0 };
  const now = Date.now();
  const minDays = Math.max(opts.minDays ?? ACTIVE_CHECK_MIN_AGE_DAYS, ACTIVE_CHECK_MIN_AGE_DAYS);
  const maxDays = opts.maxDays ?? 365;
  const [allLeads, claims] = await Promise.all([getLeadsSince(new Date(0)), getClaims()]);
  const contacted = contactedLeadIds(claims);
  const leads = allLeads.filter((l) => {
    if (!isActiveCheckCandidate(l, now, contacted)) return false;
    if (opts.exclude?.includes(l.timestamp)) return false;
    const age = (now - Date.parse(l.timestamp)) / DAY_MS;
    return age >= minDays && age <= maxDays;
  });
  // getLeadsSince vine în ordinea din Sheet, adică cronologic: cele mai vechi întâi.
  const result = await sendBatch(leads.slice(0, opts.limit), markActiveCheckSent, now, opts.dry);
  return { ...result, eligible: leads.length };
}

/** A doua trimitere, la cine n-a răspuns: cei cu primul email cel mai vechi întâi. */
export async function sendActiveCheckResends(opts: {
  limit: number;
  dry: boolean;
}): Promise<{ sent: string[]; failed: string[]; eligible: number }> {
  if (opts.limit <= 0) return { sent: [], failed: [], eligible: 0 };
  const now = Date.now();
  const leads = await getActiveCheckResendQueue(now);
  const result = await sendBatch(leads.slice(0, opts.limit), markActiveCheckResent, now, opts.dry);
  return { ...result, eligible: leads.length };
}

async function sendBatch(
  batch: NewLead[],
  mark: (timestamp: string) => Promise<void>,
  now: number,
  dry: boolean,
): Promise<{ sent: string[]; failed: string[] }> {
  const sent: string[] = [];
  const failed: string[] = [];
  for (const lead of batch) {
    const age = Math.floor((now - Date.parse(lead.timestamp)) / DAY_MS);
    const label = `${lead.judet} · ${lead.segment} · ${lead.putere ? `${lead.putere} kW` : 'fără putere'} · acum ${age} zile · ${lead.timestamp} → ${lead.email}`;
    if (dry) {
      sent.push(label);
      continue;
    }
    const res = await sendActiveCheckEmail(lead);
    if (!res.ok) {
      failed.push(`${label} (${res.reason || 'eroare'})`);
      continue;
    }
    await mark(lead.timestamp);
    sent.push(label);
  }
  return { sent, failed };
}

// ── Răspunsurile ────────────────────────────────────────────────────────────

/**
 * „Da, încă vreau oferte": cardul urcă în feed și, din 7 oct 2026, firmele din
 * județ primesc alertă, ca la o cerere reactivată. Doar la prima confirmare: un
 * al doilea click pe același link nu mai trimite nimic.
 */
export async function confirmLeadActive(lead: NewLead) {
  await markLeadConfirmedActive(lead.timestamp);
  revalidatePath('/cereri');
  if (lead.confirmataLa) return;
  // Eșecul alertei nu strică răspunsul clientului; se vede în loguri.
  try {
    await alertCountyLeadConfirmedActive(lead);
  } catch (err) {
    console.error('[confirmare-activa] alertă județ:', err);
  }
}

export async function closeLeadChosenFirm(lead: NewLead, firma: string, now = new Date()) {
  const clean = firma.trim().slice(0, 120);
  await recordClientResponse(lead.timestamp, 'aleasa', now.toISOString());
  await updateLeadCrm(lead.timestamp, {
    status: 'altundeva',
    note: clean
      ? `Clientul a răspuns în email: a ales firma „${clean}”. De verificat dacă e una de la noi (atunci: castigata).`
      : 'Clientul a răspuns în email: a ales deja o firmă, fără să spună care.',
    ...nowBucharest(now),
  });
  revalidatePath('/cereri');
  // Singura confirmare de concretizare care nu vine de la firmă: să nu se piardă în Sheet.
  await sendEmail({
    to: INTERNAL_TO,
    subject: `[Cerere închisă] ${lead.judet}: clientul a ales ${clean ? `„${clean}”` : 'o firmă (nespecificată)'}`,
    html: `<p>Cererea <strong>${escapeHtml(lead.timestamp)}</strong> (${escapeHtml(lead.judet)}, ${escapeHtml(lead.numeContact)}, ${escapeHtml(lead.telefon)}) a fost închisă ca <code>altundeva</code> din emailul „mai căutați oferte?".</p><p>Firma aleasă: <strong>${clean ? escapeHtml(clean) : 'nespecificată'}</strong>.</p><p>Dacă e o firmă care a revendicat cererea la noi, schimbă statusul în <code>castigata</code> din /admin/crm.</p>`,
  });
}

/**
 * Câte au plecat deja în ziua dată (ora României), prima dată sau retrimise:
 * lotul nu se trimite de două ori.
 */
export async function activeChecksSentOn(day: string): Promise<number> {
  const leads = await getLeadsSince(new Date(0));
  return leads.filter(
    (l) =>
      (l.verificareTrimisaLa && bucharestDay(l.verificareTrimisaLa) === day) ||
      (l.verificareRetrimisaLa && bucharestDay(l.verificareRetrimisaLa) === day),
  ).length;
}

/** Coada pentru /admin/emailuri, în ordinea în care pleacă (cele mai vechi întâi). */
export async function getActiveCheckQueue(): Promise<NewLead[]> {
  const now = Date.now();
  const [leads, claims] = await Promise.all([getLeadsSince(new Date(0)), getClaims()]);
  const contacted = contactedLeadIds(claims);
  return leads.filter((l) => isActiveCheckCandidate(l, now, contacted));
}

/** Cine primește emailul a doua oară azi, în ordinea trimiterii (primul email cel mai vechi întâi). */
export async function getActiveCheckResendQueue(now = Date.now()): Promise<NewLead[]> {
  const [leads, claims] = await Promise.all([getLeadsSince(new Date(0)), getClaims()]);
  const contacted = contactedLeadIds(claims);
  return leads
    .filter((l) => isActiveCheckResendCandidate(l, now, contacted))
    .sort((a, b) => a.verificareTrimisaLa.localeCompare(b.verificareTrimisaLa));
}
