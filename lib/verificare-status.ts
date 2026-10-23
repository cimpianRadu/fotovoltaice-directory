// „Ați găsit o ofertă bună pentru sistemul fotovoltaic?" (6 oct 2026). Multe
// revendicări stau de săptămâni în „În discuții" sau „Ofertă trimisă", iar
// statusul îl scrie firma singură, din portal. Clientul e singura confirmare
// independentă că a semnat, deci îl întrebăm pe el, numind firmele care au
// declarat contactul (doar pe ele: „X a luat legătura cu dumneavoastră" ar fi
// fals pentru o firmă rămasă pe „De sunat"). Text aprobat de Radu pe 6 oct.
//
// Butoanele din email:
//   - „Am semnat cu X" → cererea `castigata`, firma în AT și în notă;
//   - „Încă mă decid" → doar se notează;
//   - „Am ales altă firmă sau nu mai fac lucrarea" → pe pagină alege care din
//     două, apoi `altundeva` sau `renuntat`;
//   - „Nu m-a contactat nicio firmă" → se notează, cu firmele care pretindeau
//     contactul: e alarma despre firme, nu despre client.
// După oricare, pagina arată chestionarul de feedback. Fiecare răspuns vine și
// pe contact@, pentru că emailul promite „citesc fiecare răspuns".
//
// Trimiterea: 5 pe zi (anti-spam), prin cronul zilnic din
// /api/cron/confirmare-activa, de la STATUS_CHECK_START până se epuizează
// lista. BB oprește retrimiterea.

import { revalidatePath } from 'next/cache';
import {
  getClaims,
  getLeadsSince,
  isLeadClosed,
  isLeadHidden,
  isLeadInformez,
  isSameFirm,
  markStatusCheckSent,
  recordClientResponse,
  updateLeadCrm,
  type LeadClaim,
  type NewLead,
} from './sheets';
import type { ClaimStatus, LeadStatus } from './sheets-shared';
import { CLAIM_STATUS_LABELS } from './sheets-shared';
import { isValidEmail } from './portal-auth';
import { escapeHtml, sendEmail } from './email';
import { sendStatusCheckEmail } from './email-client';
import { getCompanies } from './utils';
import { DECID_HELP_OPTIONS, describeFirmContacts, optionLabel, type ResponseDetails } from './client-response-details';

const DAY_MS = 86_400_000;
const TEST_PREFIX = 'routine-test-';
const INTERNAL_TO = 'contact@instalatori-fotovoltaice.ro';

/** Prima zi de trimitere (ora României). Înainte de ea cronul nu trimite nimic. */
export const STATUS_CHECK_START = '2026-10-07';
/** Câte emailuri pe zi, ca să nu intrăm în spam (decizia lui Radu, 6 oct 2026). */
export const STATUS_CHECK_PER_DAY = 5;
/** Revendicarea trebuie să aibă atâtea zile, altfel întrebarea vine prea devreme. */
const MIN_CLAIM_AGE_DAYS = 14;
/** Cine a primit „mai căutați oferte?" de curând nu primește încă un email. */
const ACTIVE_CHECK_GAP_DAYS = 14;
/** Statusurile în care firma declară că a vorbit cu clientul. */
export const CONTACTED_STATUSES: readonly ClaimStatus[] = ['discutii', 'ofertat', 'castigat'];

export interface NamedFirm {
  name: string;
  claimTs: string;
  status: ClaimStatus;
}

/**
 * Numele din director când revendicarea se potrivește cu o firmă de acolo
 * (după email, apoi după nume sau telefon), altfel ce a scris firma, fără
 * „SC" în față. Revendicările au „SC.SOLANUM SRL", „sc Green Seiro Montage".
 */
function firmDisplayName(claim: LeadClaim): string {
  const companies = getCompanies();
  const company =
    (claim.email && companies.find((c) => (c.contact.email || '').trim().toLowerCase() === claim.email)) ||
    companies.find((c) => isSameFirm({ numeFirma: c.name, telefon: c.contact.phone }, claim));
  if (company) return company.name;
  return claim.numeFirma.trim().replace(/^s\.?\s*c\.?\s+/i, '').trim() || claim.numeFirma.trim();
}

function namedFirms(lead: Pick<NewLead, 'timestamp'>, claims: LeadClaim[], now: number): NamedFirm[] {
  return claims
    .filter(
      (c) =>
        c.leadId === lead.timestamp &&
        !c.releasedAt &&
        CONTACTED_STATUSES.includes(c.firmStatus) &&
        now - Date.parse(c.timestamp) >= MIN_CLAIM_AGE_DAYS * DAY_MS,
    )
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((c) => ({ name: firmDisplayName(c), claimTs: c.timestamp, status: c.firmStatus }));
}

function isCandidate(lead: NewLead, now: number): boolean {
  if (isLeadHidden(lead) || isLeadClosed(lead.crmStatus) || isLeadInformez(lead)) return false;
  if (lead.verificareStatusLa) return false;
  if (!isValidEmail(lead.email) || lead.email.trim().toLowerCase().startsWith(TEST_PREFIX)) return false;
  const activeCheck = Date.parse(lead.verificareTrimisaLa || '');
  return !(Number.isFinite(activeCheck) && now - activeCheck < ACTIVE_CHECK_GAP_DAYS * DAY_MS);
}

function bucharestDay(iso: string | number): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
}

function nowBucharest(now = new Date()): { today: string; time: string } {
  return {
    today: bucharestDay(now.getTime()),
    time: now.toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

/** Câte au plecat deja în ziua dată (ora României): lotul zilei nu se dublează. */
export async function statusChecksSentOn(day: string): Promise<number> {
  const leads = await getLeadsSince(new Date(0));
  return leads.filter((l) => l.verificareStatusLa && bucharestDay(l.verificareStatusLa) === day).length;
}

/**
 * Trimite celor mai vechi `limit` cereri eligibile. Cu `dry` doar le listează.
 * `eligible` = câte mai sunt în total, inclusiv cele din lotul de acum.
 */
export async function sendStatusChecks(opts: {
  limit: number;
  dry: boolean;
}): Promise<{ sent: string[]; failed: string[]; eligible: number }> {
  const now = Date.now();
  const [leads, claims] = await Promise.all([getLeadsSince(new Date(0)), getClaims()]);
  // getLeadsSince vine în ordinea din Sheet, adică cronologic: cele mai vechi întâi.
  const eligible = leads
    .filter((l) => isCandidate(l, now))
    .map((lead) => ({ lead, firms: namedFirms(lead, claims, now) }))
    .filter((x) => x.firms.length > 0);
  if (opts.limit <= 0) return { sent: [], failed: [], eligible: eligible.length };

  const sent: string[] = [];
  const failed: string[] = [];
  for (const { lead, firms } of eligible.slice(0, opts.limit)) {
    const age = Math.floor((now - Date.parse(lead.timestamp)) / DAY_MS);
    const firmList = firms.map((f) => `${f.name} (${CLAIM_STATUS_LABELS[f.status]})`).join(', ');
    const label = `${lead.judet} · ${lead.putere ? `${lead.putere} kW` : 'fără putere'} · acum ${age} zile · ${firmList} · ${lead.timestamp} → ${lead.email}`;
    if (opts.dry) {
      sent.push(label);
      continue;
    }
    const res = await sendStatusCheckEmail(lead, firms);
    if (!res.ok) {
      failed.push(`${label} (${res.reason || 'eroare'})`);
      continue;
    }
    await markStatusCheckSent(lead.timestamp);
    sent.push(label);
  }
  return { sent, failed, eligible: eligible.length };
}

// ── Răspunsurile ────────────────────────────────────────────────────────────

export type StatusResponse = 'semnat' | 'decid' | 'altafirma' | 'necontactat';
export const ALTA_FIRMA_MOTIVE = ['altundeva', 'renuntat'] as const;
export type AltaFirmaMotiv = (typeof ALTA_FIRMA_MOTIVE)[number];

/** Firma pe care o numește linkul „Am semnat cu X": revendicarea cu timestampul `claimTs`, pe cererea asta. */
export async function findNamedClaim(leadId: string, claimTs: string): Promise<string | null> {
  const claim = (await getClaims()).find((c) => c.leadId === leadId && c.timestamp === claimTs);
  return claim ? firmDisplayName(claim) : null;
}

/** Firmele numite în email, pentru întrebarea „ce s-a întâmplat cu fiecare firmă?" de pe pagină. */
export async function declaredFirmsFor(leadId: string): Promise<{ claimTs: string; name: string }[]> {
  const claims = await getClaims();
  return namedFirms({ timestamp: leadId }, claims, Date.now()).map(({ claimTs, name }) => ({ claimTs, name }));
}

/**
 * Toate firmele care au revendicat cererea, inclusiv cele care au renunțat
 * (Solanum a renunțat la Caraș-Severin pe „nu răspunde", omul putea totuși să
 * semneze cu ea), câte o dată pe firmă. Pentru „Am ales deja o firmă".
 */
export async function claimedFirmsFor(leadId: string): Promise<{ claimTs: string; name: string }[]> {
  const seen = new Set<string>();
  return (await getClaims())
    .filter((c) => c.leadId === leadId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .map((c) => ({ claimTs: c.timestamp, name: firmDisplayName(c) }))
    .filter((f) => !seen.has(f.name) && seen.add(f.name));
}

/** Firmele care declarau contactul, pentru notă și emailul intern. */
function declaredFirms(lead: NewLead, claims: LeadClaim[]): string {
  const firms = namedFirms(lead, claims, Date.now());
  return firms.map((f) => `${f.name} (${CLAIM_STATUS_LABELS[f.status]})`).join(', ') || 'niciuna';
}

export async function recordStatusResponse(
  lead: NewLead,
  response: StatusResponse,
  opts: { claimTs?: string; motiv?: AltaFirmaMotiv; details?: ResponseDetails } = {},
  now = new Date(),
): Promise<{ error?: string }> {
  const at = now.toISOString();
  const when = nowBucharest(now);
  // O singură citire a revendicărilor pentru tot răspunsul: limita Sheets e comună cu site-ul.
  const claims = await getClaims();
  const declared = declaredFirms(lead, claims);
  const details = opts.details ?? {};
  // Răspunsurile pe fiecare firmă se iau doar pentru firmele numite în email.
  const names = Object.fromEntries(
    namedFirms({ timestamp: lead.timestamp }, claims, Date.now()).map((f) => [f.claimTs, f.name]),
  );
  const perFirm = details.firme ? describeFirmContacts(details.firme, names) : '';
  const notCalled = Object.entries(details.firme ?? {}).filter(([ts, v]) => names[ts] && v === 'nu').length;
  let status: LeadStatus | undefined;
  let note: string;
  let subject: string;

  if (response === 'semnat') {
    const named = opts.claimTs ? claims.find((c) => c.leadId === lead.timestamp && c.timestamp === opts.claimTs) : undefined;
    const firma = named ? firmDisplayName(named) : null;
    if (!firma) return { error: 'Nu am găsit firma din link. Scrieți-ne și rezolvăm manual.' };
    await recordClientResponse(lead.timestamp, `semnat`, `${at} ${firma}`);
    status = 'castigata';
    note = `Clientul a confirmat în emailul „Ați găsit o ofertă bună?" că a semnat cu ${firma}.${
      details.putere ? ` Puterea din contract, după client: ${details.putere} kW.` : ''
    }`;
    subject = `[Semnat] ${lead.judet}: clientul confirmă că a semnat cu ${firma}`;
  } else if (response === 'decid') {
    await recordClientResponse(lead.timestamp, 'decid', at);
    const ajutor = (details.ajutor ?? []).map((v) => optionLabel(DECID_HELP_OPTIONS, v).toLowerCase());
    note =
      `${notCalled ? 'ATENȚIE: ' : ''}Clientul a răspuns în emailul „Ați găsit o ofertă bună?": încă se decide. Firme declarate: ${declared}.` +
      (perFirm ? ` După client: ${perFirm}.` : '') +
      (ajutor.length ? ` L-ar ajuta: ${ajutor.join(', ')}.` : '') +
      (details.suna ? ' Vrea să-l sunăm noi.' : '');
    const tags = [details.suna && 'de sunat', details.ajutor?.includes('alta-firma') && 'vrea altă firmă', notCalled && 'firmă care nu l-a sunat']
      .filter(Boolean)
      .join(', ');
    subject = `[Se decide${tags ? `: ${tags}` : ''}] ${lead.judet}: clientul încă se decide`;
  } else if (response === 'altafirma') {
    const motiv = opts.motiv;
    if (!motiv || !(ALTA_FIRMA_MOTIVE as readonly string[]).includes(motiv)) {
      return { error: 'Alegeți una dintre variante.' };
    }
    await recordClientResponse(lead.timestamp, `altafirma-${motiv}`, at);
    status = motiv;
    note =
      motiv === 'altundeva'
        ? `Clientul a răspuns în emailul „Ați găsit o ofertă bună?": a ales o firmă din afara platformei. Firme declarate: ${declared}.`
        : `Clientul a răspuns în emailul „Ați găsit o ofertă bună?": nu mai face lucrarea. Firme declarate: ${declared}.`;
    subject =
      motiv === 'altundeva'
        ? `[Altundeva] ${lead.judet}: clientul a ales o firmă din afara platformei`
        : `[Renunțat] ${lead.judet}: clientul nu mai face lucrarea`;
  } else {
    await recordClientResponse(lead.timestamp, 'necontactat', at);
    note =
      `ATENȚIE: clientul spune în emailul „Ați găsit o ofertă bună?" că nu l-a contactat nicio firmă. Firmele declarau contact: ${declared}.` +
      (perFirm ? ` Pe fiecare firmă, după client: ${perFirm}.` : '');
    subject = `[Necontactat] ${lead.judet}: clientul spune că nu l-a contactat nicio firmă`;
  }

  await updateLeadCrm(lead.timestamp, { ...(status ? { status } : {}), note, ...when });
  if (status) revalidatePath('/cereri');

  await sendEmail({
    to: INTERNAL_TO,
    subject,
    html: `<p>${escapeHtml(note)}</p><p>Cererea <strong>${escapeHtml(lead.timestamp)}</strong>: ${escapeHtml(lead.judet)}, ${escapeHtml(lead.putere ? `${lead.putere} kW` : 'fără putere')}, ${escapeHtml(lead.numeContact || lead.numeCompanie)}, ${escapeHtml(lead.telefon)}.</p>${
      status ? `<p>Status setat automat: <code>${status}</code>. Dacă e greșit, schimbă-l din /admin/crm.</p>` : ''
    }<p>Dacă omul completează și chestionarul, răspunsul apare în tabul „Feedback clienți".</p>`,
  });
  return {};
}

// ── Vederea din /admin/emailuri ─────────────────────────────────────────────

export interface StatusCheckRow {
  lead: NewLead;
  /** Revendicările active pe cerere, cu statusul de azi al firmei. */
  firms: NamedFirm[];
  /** Răspunsul din AT, doar dacă a venit după emailul ăsta (AT ține ultimul răspuns, la orice email). */
  response: { code: string; at: string; firma: string } | null;
}

/** Ultimul răspuns al clientului, dacă e mai nou decât `since`. */
export function responseAfter(lead: NewLead, since: string): { code: string; at: string; firma: string } | null {
  const [code = '', at = '', ...rest] = lead.raspunsClient.split(' ');
  if (!code || !at || !since || at < since) return null;
  return { code, at, firma: rest.join(' ') };
}

const STATUS_CODES = ['semnat', 'decid', 'altafirma', 'necontactat'];

export async function getStatusCheckOverview(): Promise<{
  sent: StatusCheckRow[];
  queue: { lead: NewLead; firms: NamedFirm[] }[];
  sentToday: number;
}> {
  const now = Date.now();
  const [leads, claims] = await Promise.all([getLeadsSince(new Date(0)), getClaims()]);
  const activeFirms = (lead: NewLead): NamedFirm[] =>
    claims
      .filter((c) => c.leadId === lead.timestamp && !c.releasedAt)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
      .map((c) => ({ name: firmDisplayName(c), claimTs: c.timestamp, status: c.firmStatus }));
  const sent = leads
    .filter((l) => l.verificareStatusLa)
    .sort((a, b) => b.verificareStatusLa.localeCompare(a.verificareStatusLa))
    .map((lead) => {
      const response = responseAfter(lead, lead.verificareStatusLa);
      const ours = response && STATUS_CODES.some((c) => response.code.startsWith(c));
      return { lead, firms: activeFirms(lead), response: ours ? response : null };
    });
  const queue = leads
    .filter((l) => isCandidate(l, now))
    .map((lead) => ({ lead, firms: namedFirms(lead, claims, now) }))
    .filter((x) => x.firms.length > 0);
  const today = bucharestDay(now);
  const sentToday = sent.filter((r) => bucharestDay(r.lead.verificareStatusLa) === today).length;
  return { sent, queue, sentToday };
}
