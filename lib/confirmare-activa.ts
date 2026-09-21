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
// Tăcerea nu închide nimic. Trimiterea e manuală, pe loturi mici, din
// /api/admin/confirmare-activa; AZ oprește retrimiterea.

import { revalidatePath } from 'next/cache';
import {
  getLeadsSince,
  isLeadClosed,
  isLeadHidden,
  isLeadInformez,
  markActiveCheckSent,
  markLeadConfirmedActive,
  recordClientResponse,
  updateLeadCrm,
  type NewLead,
} from './sheets';
import { isValidEmail } from './portal-auth';
import { escapeHtml, sendEmail } from './email';
import { sendActiveCheckEmail } from './email-client';

const DAY_MS = 86_400_000;
const TEST_PREFIX = 'routine-test-';
/** Sub atât, omul abia a trimis cererea; întrebarea ar suna a grabă. */
export const ACTIVE_CHECK_MIN_AGE_DAYS = 14;
const INTERNAL_TO = 'contact@instalatori-fotovoltaice.ro';

export function isActiveCheckCandidate(lead: NewLead, now: number): boolean {
  return (
    !isLeadHidden(lead) &&
    !isLeadClosed(lead.crmStatus) &&
    !isLeadInformez(lead) &&
    !lead.verificareTrimisaLa &&
    !lead.confirmataLa &&
    isValidEmail(lead.email) &&
    !lead.email.trim().toLowerCase().startsWith(TEST_PREFIX) &&
    now - Date.parse(lead.timestamp) >= ACTIVE_CHECK_MIN_AGE_DAYS * DAY_MS
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
  const now = Date.now();
  const minDays = Math.max(opts.minDays ?? ACTIVE_CHECK_MIN_AGE_DAYS, ACTIVE_CHECK_MIN_AGE_DAYS);
  const maxDays = opts.maxDays ?? 365;
  const leads = (await getLeadsSince(new Date(0))).filter((l) => {
    if (!isActiveCheckCandidate(l, now) || opts.exclude?.includes(l.timestamp)) return false;
    const age = (now - Date.parse(l.timestamp)) / DAY_MS;
    return age >= minDays && age <= maxDays;
  });
  // getLeadsSince vine în ordinea din Sheet, adică cronologic: cele mai vechi întâi.
  const batch = leads.slice(0, opts.limit);
  const sent: string[] = [];
  const failed: string[] = [];
  for (const lead of batch) {
    const age = Math.floor((now - Date.parse(lead.timestamp)) / DAY_MS);
    const label = `${lead.judet} · ${lead.segment} · ${lead.putere ? `${lead.putere} kW` : 'fără putere'} · acum ${age} zile · ${lead.timestamp} → ${lead.email}`;
    if (opts.dry) {
      sent.push(label);
      continue;
    }
    const res = await sendActiveCheckEmail(lead);
    if (!res.ok) {
      failed.push(`${label} (${res.reason || 'eroare'})`);
      continue;
    }
    await markActiveCheckSent(lead.timestamp);
    sent.push(label);
  }
  return { sent, failed, eligible: leads.length };
}

// ── Răspunsurile ────────────────────────────────────────────────────────────

export async function confirmLeadActive(lead: NewLead) {
  await markLeadConfirmedActive(lead.timestamp);
  revalidatePath('/cereri');
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
