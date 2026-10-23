// Contul clientului: ce vede pe pagina cererii și ce se întâmplă când apasă
// ceva acolo (23 oct 2026). Autentificarea e în lib/client-auth.ts, emailurile
// în lib/email-cont.ts.
//
// Cererea și preluările rămân în Sheets (Leads, Revendicări). În Neon stă doar ce
// e nou: click-urile, unde a plecat cererea, apăsările pe „Încă vreau oferte”, ce
// spune clientul despre fiecare firmă și ofertele urcate de firme.
//
// Clientul NU vede statusul declarat de firmă (decizia din 12 și 22 oct): îl
// întrebăm separat, iar comparația o facem noi în admin.

import 'server-only';
import { revalidatePath } from 'next/cache';
import { db } from './db';
import {
  getClaims,
  getCountyAlertPrefs,
  getDeactivatedEmailsForAlerts,
  getFirmEmailLinksForAlerts,
  getFullLeadById,
  getLeadsSince,
  getPortalAccessEvents,
  getWatches,
  isLeadHidden,
  isLeadInformez,
  markLeadConfirmedActive,
  recordClientResponse,
  resolveEmailGroup,
  resolveGroupAlertPref,
  updateLeadCrm,
  type LeadClaim,
  type NewLead,
} from './sheets';
import { isLeadClosed, isSameFirm, type LeadStatus } from './sheets-shared';
import { getCompanies } from './utils';
import type { Company } from './utils-shared';
import {
  getBudgetLabel,
  getFinancingLabel,
  getProjectTypeLabel,
  getTimelineLabel,
  getWorkTypeLabel,
} from './utils-shared';
import { normalizeEmail } from './portal-auth';
import { canViewLead, getClientViewer, type ClientViewer } from './client-auth';
import { bucharestStamp } from './portal-session';
import { judetSiVecini } from './judete-vecine';
import { countyAlertPayloadFromLead } from './lead-alerts';
import { escapeHtml, sendEmail, sendCountyLeadAlert } from './email';
import { getLeadClickStats } from './lead-clicks';
import { logLeadSends } from './lead-sends';
import { offersForLead, type OfferForClient } from './oferte';
import { RENUNT_REASON_OPTIONS, optionLabel } from './client-response-details';
import { BUMPS_PER_WEEK, type FirmReport } from './client-account-shared';

export { FIRM_REPORT_OPTIONS, isFirmReport, BUMPS_PER_WEEK, type FirmReport } from './client-account-shared';

/**
 * Data de la care pot pleca emailurile noi către client și retrimiterile din
 * cont. Radu, 23 oct 2026 (vineri): „să nu le trimiți azi și nici în weekend”.
 * Luni 26 oct, 09:00 ora României (ora de iarnă, UTC+2). Pe lângă dată, trebuie
 * pus CLIENT_ACCOUNT=on în Vercel, după ce Radu a văzut contul de test.
 */
export const CLIENT_ACCOUNT_LIVE_FROM = '2026-10-26T07:00:00.000Z';

export function clientAccountLive(now = new Date()): boolean {
  return process.env.CLIENT_ACCOUNT === 'on' && now.getTime() >= Date.parse(CLIENT_ACCOUNT_LIVE_FROM);
}

const INTERNAL_TO = 'contact@instalatori-fotovoltaice.ro';
const DAY_MS = 86_400_000;

// ---------------------------------------------------------------------------
// Firmele: revendicare → fișa din director

/** Fișa din director a firmei care a revendicat: după email, apoi după telefon sau nume. */
export function companyForClaim(
  claim: Pick<LeadClaim, 'email' | 'numeFirma' | 'telefon'>,
  companies: Company[] = getCompanies(),
): Company | undefined {
  const email = (claim.email || '').trim().toLowerCase();
  return (
    (email ? companies.find((c) => (c.contact.email || '').trim().toLowerCase() === email) : undefined) ??
    companies.find((c) => isSameFirm({ numeFirma: c.name, telefon: c.contact.phone || '' }, claim))
  );
}

/** Numele firmei fără „S.C.” în față, ca în emailurile către client. */
export function firmDisplayName(numeFirma: string): string {
  return numeFirma.trim().replace(/^s\.?\s*c\.?\s+/i, '').trim() || numeFirma.trim();
}

/** Revendicările care contează pentru client: active și cu datele lui deja la firmă. */
export function deliveredClaims(claims: LeadClaim[], leadId: string): LeadClaim[] {
  return claims
    .filter((c) => c.leadId === leadId && !c.releasedAt && c.approvedAt)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

// ---------------------------------------------------------------------------
// Datele paginii

export interface AccountFirm {
  claimTs: string;
  name: string;
  /** Telefonul public de pe fișa din director. Nu mobilul din revendicare (decizia din 22 oct). */
  phone: string | null;
  profileSlug: string | null;
  city: string | null;
  claimedAt: string;
  report: FirmReport | null;
  reportedAt: string | null;
  offers: OfferForClient[];
}

export interface AccountLeadSummary {
  id: string;
  createdAt: string;
  descriere: string;
  judet: string;
  localitate: string;
  open: boolean;
  closedLabel: string | null;
}

export interface AccountLeadData extends AccountLeadSummary {
  numeContact: string;
  details: { label: string; value: string }[];
  informez: boolean;
  firms: AccountFirm[];
  stats: { sentTo: number; clickVisitors: number; claimed: number };
  bump: { allowed: boolean; usedLast7: number; nextAt: string | null; lastAt: string | null };
}

const CLOSED_LABELS: Partial<Record<LeadStatus, string>> = {
  castigata: 'Ați semnat cu una dintre firme',
  altundeva: 'Ați ales o firmă',
  renuntat: 'Ați renunțat la lucrare',
  inactiva: 'Închisă după o perioadă fără răspuns',
};

/** „sistem fotovoltaic de 10 kW”, „baterie de stocare”, cum apare în texte. */
export function describeLead(lead: Pick<NewLead, 'tipLucrare' | 'putere'>): string {
  const kw = (lead.putere || '').trim();
  switch (lead.tipLucrare) {
    case 'doar-baterie':
      return 'baterie de stocare';
    case 'extindere':
      return kw ? `extinderea sistemului fotovoltaic de ${kw} kW` : 'extinderea sistemului fotovoltaic';
    case 'doar-montaj':
      return kw ? `montajul unui sistem fotovoltaic de ${kw} kW` : 'montajul unui sistem fotovoltaic';
    default:
      return kw ? `sistem fotovoltaic de ${kw} kW` : 'sistem fotovoltaic';
  }
}

export function leadSummaryFor(lead: NewLead): AccountLeadSummary {
  const open = !isLeadClosed(lead.crmStatus);
  return {
    id: lead.timestamp,
    createdAt: lead.timestamp,
    descriere: describeLead(lead),
    judet: lead.judet,
    localitate: lead.localitate,
    open,
    closedLabel: open ? null : (CLOSED_LABELS[lead.crmStatus] ?? 'Închisă'),
  };
}

/** Cererile unei adrese, cea mai nouă prima. Fără cele ascunse sau duplicate. */
export async function getLeadsForEmail(email: string): Promise<NewLead[]> {
  const e = normalizeEmail(email);
  return (await getLeadsSince(new Date(0)))
    .filter((l) => normalizeEmail(l.email || '') === e && !isLeadHidden(l))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function getAccountLead(id: string): Promise<NewLead | undefined> {
  return getFullLeadById(id);
}

async function latestReports(leadId: string): Promise<Map<string, { status: FirmReport; at: string }>> {
  const rows = await db()`
    SELECT DISTINCT ON (claim_ts) claim_ts, status, created_at
    FROM client_firm_reports WHERE lead_id = ${leadId}
    ORDER BY claim_ts, created_at DESC
  `;
  return new Map(
    rows.map((r) => [String(r.claim_ts), { status: r.status as FirmReport, at: new Date(r.created_at as string).toISOString() }]),
  );
}

async function bumpState(leadId: string, now: number): Promise<AccountLeadData['bump']> {
  const rows = await db()`
    SELECT at FROM lead_bumps WHERE lead_id = ${leadId} ORDER BY at DESC LIMIT ${BUMPS_PER_WEEK + 1}
  `;
  const times = rows.map((r) => Date.parse(new Date(r.at as string).toISOString()));
  const recent = times.filter((t) => now - t < 7 * DAY_MS);
  const allowed = recent.length < BUMPS_PER_WEEK;
  // Se eliberează un loc când cea mai veche apăsare din ultimele 7 zile iese din fereastră.
  const nextAt = allowed ? null : new Date(Math.min(...recent) + 7 * DAY_MS).toISOString();
  return { allowed, usedLast7: recent.length, nextAt, lastAt: times[0] ? new Date(times[0]).toISOString() : null };
}

export async function loadAccountLead(lead: NewLead, now = Date.now()): Promise<AccountLeadData> {
  const summary = leadSummaryFor(lead);
  const companies = getCompanies();
  const [claims, reports, clicks, sends, bump, offers] = await Promise.all([
    getClaims(),
    latestReports(lead.timestamp),
    getLeadClickStats([lead.timestamp]),
    db()`SELECT count(DISTINCT firm_email)::int AS n FROM lead_sends WHERE lead_id = ${lead.timestamp}`,
    bumpState(lead.timestamp, now),
    offersForLead(lead.timestamp),
  ]);

  const firms: AccountFirm[] = deliveredClaims(claims, lead.timestamp).map((c) => {
    const company = companyForClaim(c, companies);
    const report = reports.get(c.timestamp);
    return {
      claimTs: c.timestamp,
      name: company?.name ?? firmDisplayName(c.numeFirma),
      phone: company?.contact.phone || null,
      profileSlug: company?.slug ?? null,
      city: company?.location.city ?? null,
      claimedAt: c.approvedAt || c.timestamp,
      report: report?.status ?? null,
      reportedAt: report?.at ?? null,
      offers: offers.filter((o) => o.claimTs === c.timestamp),
    };
  });

  const details = [
    { label: 'Tip clădire', value: lead.tipProiect ? getProjectTypeLabel(lead.tipProiect) : '' },
    { label: 'Lucrare', value: lead.tipLucrare ? getWorkTypeLabel(lead.tipLucrare) : '' },
    { label: 'Putere', value: lead.putere ? `${lead.putere} kW` : '' },
    { label: 'Când', value: lead.termen ? getTimelineLabel(lead.termen) : '' },
    { label: 'Finanțare', value: lead.finantare ? getFinancingLabel(lead.finantare) : '' },
    { label: 'Buget', value: lead.buget ? getBudgetLabel(lead.buget) : '' },
  ].filter((d) => d.value);

  return {
    ...summary,
    numeContact: lead.numeContact || lead.numeCompanie,
    details,
    informez: isLeadInformez(lead),
    firms,
    stats: {
      sentTo: Number(sends[0]?.n ?? 0),
      clickVisitors: clicks.get(lead.timestamp)?.visitors ?? 0,
      claimed: firms.length,
    },
    bump: summary.open ? bump : { ...bump, allowed: false },
  };
}

// ---------------------------------------------------------------------------
// Acțiunile din cont

function internalLeadLine(lead: NewLead): string {
  return `Cererea <strong>${escapeHtml(lead.timestamp)}</strong>: ${escapeHtml(lead.judet)}, ${escapeHtml(
    describeLead(lead),
  )}, ${escapeHtml(lead.numeContact || lead.numeCompanie)}, ${escapeHtml(lead.telefon)}.`;
}

/**
 * Clientul spune ce a făcut o firmă. Rândul din Neon e starea pentru pagină;
 * nota din CRM e ca Radu să o vadă lângă statusul declarat de firmă. „Nu m-a
 * sunat” ajunge și pe email, ca Radu să poată da cererea altei firme.
 */
export async function reportFirm(opts: {
  lead: NewLead;
  claim: LeadClaim;
  status: FirmReport;
  putere?: string;
}): Promise<void> {
  const { lead, claim, status } = opts;
  const name = firmDisplayName(claim.numeFirma);
  const putere = status === 'semnat' && opts.putere ? opts.putere : null;
  await db()`
    INSERT INTO client_firm_reports (lead_id, claim_ts, firm_name, status, putere)
    VALUES (${lead.timestamp}, ${claim.timestamp}, ${name}, ${status}, ${putere})
  `;

  const days = Math.floor((Date.now() - Date.parse(claim.approvedAt || claim.timestamp)) / DAY_MS);
  const what: Record<FirmReport, string> = {
    nesunat: `${name} nu l-a sunat (preluată acum ${days} zile)`,
    sunat: `${name} l-a sunat, fără ofertă deocamdată`,
    oferta: `a primit ofertă de la ${name}`,
    semnat: `a semnat cu ${name}${putere ? `, ${putere} kW după contract` : ''}`,
  };
  const note = `${status === 'nesunat' ? 'ATENȚIE: ' : ''}Din contul clientului: ${what[status]}. Firma declară: ${claim.firmStatus}.`;
  if (status === 'semnat') {
    await recordClientResponse(lead.timestamp, 'semnat', `${new Date().toISOString()} ${name}`);
    await updateLeadCrm(lead.timestamp, { status: 'castigata', note, ...bucharestStamp() });
    revalidatePath('/cereri');
  } else {
    await updateLeadCrm(lead.timestamp, { note, ...bucharestStamp() });
  }

  if (status === 'nesunat' || status === 'semnat') {
    await sendEmail({
      to: INTERNAL_TO,
      subject:
        status === 'semnat'
          ? `[Semnat, din cont] ${lead.judet}: clientul a semnat cu ${name}`
          : `[Nu l-a sunat, din cont] ${lead.judet}: ${name}, preluată acum ${days} zile`,
      html: `<p>${escapeHtml(note)}</p><p>${internalLeadLine(lead)}</p>`,
    });
  }
}

/**
 * Firmele care primesc retrimiterea: cele cu cont în portal care au bifat
 * județul cererii sau un vecin, plus cele cu sediul (fișa din director) în
 * județ sau într-un vecin. Fără firmele care au deja cererea sau o urmăresc,
 * fără conturile dezactivate. Dezabonarea o respectă sendCountyLeadAlert.
 */
export async function bumpRecipients(lead: NewLead): Promise<string[]> {
  const [prefs, links, deactivated, events, watches, claims] = await Promise.all([
    getCountyAlertPrefs(),
    getFirmEmailLinksForAlerts(),
    getDeactivatedEmailsForAlerts(),
    getPortalAccessEvents(),
    getWatches(),
    getClaims(),
  ]);
  const area = new Set(judetSiVecini(lead.judet).map(countyKey));
  const off = new Set(deactivated.map((e) => e.toLowerCase()));
  const excluded = new Set(
    [
      ...watches.filter((w) => w.leadId === lead.timestamp).map((w) => w.email),
      ...claims.filter((c) => c.leadId === lead.timestamp && !c.releasedAt).map((c) => c.email),
    ].map((e) => (e || '').trim().toLowerCase()),
  );
  const companies = getCompanies();

  const out = new Set<string>();
  const seen = new Set<string>();
  for (const e of events) {
    if (e.event !== 'intrat') continue;
    const group = resolveEmailGroup(links, e.email);
    if (!group.length || seen.has(group[0])) continue;
    seen.add(group[0]);
    if (group.some((m) => off.has(m) || excluded.has(m))) continue;

    const pref = resolveGroupAlertPref(prefs, group);
    const byAlerts = Boolean(pref?.active && pref.counties.some((c) => area.has(countyKey(c))));
    const own = claims.filter((c) => group.includes((c.email || '').trim().toLowerCase()));
    const company =
      companies.find((c) => group.includes((c.contact.email || '').trim().toLowerCase())) ??
      (own[0] ? companyForClaim(own[0], companies) : undefined);
    const byHq = Boolean(company && area.has(countyKey(company.location.county)));
    // O firmă care și-a oprit alertele din portal le-a oprit pentru tot.
    if (pref && !pref.active) continue;
    if (byAlerts || byHq) for (const m of group) out.add(m);
  }
  return [...out];
}

function countyKey(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

export type BumpResult = { ok: true; firms: number } | { ok: false; error: string };

/** „Încă vreau oferte” din cont: urcă cererea în feed și o retrimite firmelor din zonă. */
export async function bumpLead(lead: NewLead, email: string, now = new Date()): Promise<BumpResult> {
  if (isLeadClosed(lead.crmStatus)) return { ok: false, error: 'Cererea e închisă.' };
  // Până la pornire (luni 26 oct, după aprobarea lui Radu) nu pleacă nimic la firme,
  // deci nici cererea nu urcă: „Încă vreau oferte” fără retrimitere ar minți.
  if (!clientAccountLive(now)) return { ok: false, error: 'Butonul pornește în curând.' };
  const state = await bumpState(lead.timestamp, now.getTime());
  if (!state.allowed) {
    return { ok: false, error: 'Ați apăsat deja de 2 ori săptămâna aceasta. Butonul revine în câteva zile.' };
  }
  const at = now.toISOString();
  await markLeadConfirmedActive(lead.timestamp, at);

  const recipients = await bumpRecipients(lead);
  const payload = countyAlertPayloadFromLead(lead);
  const results = await Promise.allSettled(
    recipients.map((to) => sendCountyLeadAlert({ to, ...payload, confirmedActive: true })),
  );
  const sent = recipients.filter((_, i) => {
    const r = results[i];
    return r.status === 'fulfilled' && r.value.ok;
  });
  const firms = sent.length;
  await logLeadSends(lead.timestamp, sent, 'retrimitere');
  await db()`
    INSERT INTO lead_bumps (lead_id, email, at, firms_notified)
    VALUES (${lead.timestamp}, ${normalizeEmail(email)}, ${at}, ${firms})
  `;
  await updateLeadCrm(lead.timestamp, {
    note: `Clientul a apăsat „Încă vreau oferte” din cont. Retrimisă la ${firms} firme din ${lead.judet} și vecine.`,
    ...bucharestStamp(),
  });
  revalidatePath('/cereri');
  return { ok: true, firms };
}

// ---------------------------------------------------------------------------
// Accesul la o cerere

/** Cererea, dacă browserul are voie s-o vadă (lib/client-auth: email dovedit sau cookie de după formular). */
export async function leadForViewer(leadId: string): Promise<{ lead: NewLead; viewer: ClientViewer } | null> {
  const viewer = await getClientViewer();
  if (!viewer.email && !viewer.leads.length) return null;
  const lead = await getAccountLead(leadId);
  if (!lead || !canViewLead(viewer, lead)) return null;
  return { lead, viewer };
}

// ---------------------------------------------------------------------------
// Închiderea cererii din cont

export type CloseRequest =
  | { kind: 'aleasa'; claimTs?: string; firma?: string }
  | { kind: 'renunt'; motive: string[]; altceva?: string };

/**
 * „Am ales o firmă” sau „Nu mai fac lucrarea”. O firmă de-a noastră aleasă e
 * lucrare concretizată prin platformă (castigata); alta, altundeva. Ca la
 * butoanele din emailuri, dar cu nota „din cont”, ca Radu să știe de unde a venit.
 */
export async function closeFromAccount(lead: NewLead, req: CloseRequest): Promise<void> {
  const at = new Date().toISOString();
  if (req.kind === 'aleasa') {
    const claims = req.claimTs ? deliveredClaims(await getClaims(), lead.timestamp) : [];
    const ours = claims.find((c) => c.timestamp === req.claimTs);
    const name = ours ? firmDisplayName(ours.numeFirma) : (req.firma || '').trim().slice(0, 120);
    await recordClientResponse(lead.timestamp, 'aleasa', at);
    const note = ours
      ? `Din contul clientului: a ales ${name}, care a preluat cererea la noi. Status pus automat pe castigata.`
      : `Din contul clientului: a ales ${name ? `firma „${name}”` : 'o firmă, fără să spună care'}. De verificat dacă e una de la noi.`;
    await updateLeadCrm(lead.timestamp, { status: ours ? 'castigata' : 'altundeva', note, ...bucharestStamp() });
    revalidatePath('/cereri');
    await sendEmail({
      to: INTERNAL_TO,
      subject: ours ? `[Ales, din cont] ${lead.judet}: ${name}` : `[Altă firmă, din cont] ${lead.judet}`,
      html: `<p>${escapeHtml(note)}</p><p>${internalLeadLine(lead)}</p>`,
    });
    return;
  }

  const motive = req.motive.filter((m) => RENUNT_REASON_OPTIONS.some((o) => o.value === m));
  const labels = motive.map((m) => optionLabel(RENUNT_REASON_OPTIONS, m).toLowerCase());
  const altceva = (req.altceva || '').trim().slice(0, 500);
  const nesunat = motive.includes('nesunat');
  const note =
    `${nesunat ? 'ATENȚIE: ' : ''}Din contul clientului: nu mai face lucrarea.` +
    (labels.length ? ` Motiv: ${labels.join(', ')}.` : '') +
    (altceva ? ` A scris: „${altceva}”.` : '');
  await recordClientResponse(lead.timestamp, 'renunt', at);
  await updateLeadCrm(lead.timestamp, { status: 'renuntat', note, ...bucharestStamp() });
  revalidatePath('/cereri');
  if (labels.length || altceva) {
    await sendEmail({
      to: INTERNAL_TO,
      subject: `[Renunțat, din cont${nesunat ? ': nu l-a sunat nicio firmă' : ''}] ${lead.judet}`,
      html: `<p>${escapeHtml(note)}</p><p>${internalLeadLine(lead)}</p>`,
    });
  }
}

// ---------------------------------------------------------------------------
// Ștergerea contului

/**
 * „Ștergeți contul și datele mele”. Contul se închide pe loc; datele din Sheets
 * le șterge Radu de mână (cererile sunt și ale firmelor care le-au preluat, iar
 * o ștergere automată dintr-un buton e prea ușor de apăsat din greșeală).
 */
export async function requestAccountDeletion(email: string, leads: NewLead[]): Promise<void> {
  await db()`UPDATE client_accounts SET deleted_at = now() WHERE email = ${normalizeEmail(email)}`;
  await sendEmail({
    to: INTERNAL_TO,
    subject: `[GDPR] Clientul cere ștergerea datelor: ${email}`,
    html:
      `<p>${escapeHtml(email)} a apăsat „Ștergeți contul și datele mele” din cont. Răspunsul legal e în 30 de zile.</p>` +
      `<p>Cererile adresei:</p><ul>${leads.map((l) => `<li>${internalLeadLine(l)}</li>`).join('')}</ul>`,
  });
}
