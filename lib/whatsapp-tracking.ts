// Urmărirea mesajelor WhatsApp către clienți, pentru /admin/whatsapp (17 nov
// 2026, cerut de Radu: „vreau să văd în admin”). Pornește de la marcajele din
// client_events, scrise când mesajul pleacă (lib/whatsapp-verificare), și
// strânge pe fiecare cerere ce a urmat: linkul deschis, răspunsul dat pe link,
// răspunsul scris pe WhatsApp (notat de Radu sau de rutina de dimineață).
//
// Tot aici, firmele cu cont în portal care primesc alerte pe județul cererii:
// pe cine poți da cererea mai departe, din aceeași pagină.

import 'server-only';
import { db } from './db';
import {
  getCountyAlertPrefs,
  getDeactivatedAccounts,
  getFirmEmailLinks,
  getFirmProfiles,
  getPortalAccessEvents,
  resolveEmailGroup,
  resolveGroupAlertPref,
  resolveGroupProfile,
  type LeadClaim,
} from './sheets';
import { MAX_ACTIVE_CLAIMS_PER_FIRM, countActiveClaimsForFirm, isSameFirm } from './sheets-shared';
import { getCompanies } from './utils';
import type { WhatsappKind } from './whatsapp-verificare';

const SENT_EVENT: Record<string, WhatsappKind> = {
  whatsapp_deschis: 'oferta',
  whatsapp_firma_deschis: 'firma',
};

/**
 * Până pe 17 nov 2026 deschiderea linkului o nota și preview-ul făcut de
 * WhatsApp cât mesajul era încă în caseta de scris (secunde înainte de
 * trimitere). Rândurile de atunci n-au `ua`; pe ele, o deschidere la mai puțin
 * de 3 minute de trimitere e preview-ul, nu clientul.
 */
const PREVIEW_WINDOW_MS = 3 * 60 * 1000;

export interface WhatsappReply {
  text: string;
  /** Ora mesajului clientului, dacă se știe; altfel ora notării. */
  la: string;
  savedAt: string;
}

export interface WhatsappThread {
  leadId: string;
  kind: WhatsappKind;
  /** Primul mesaj de felul ăsta pe cerere. */
  sentAt: string;
  /** De câte ori a fost marcat (o retrimitere apare ca a doua marcare). */
  sends: number;
  /** Clientul a deschis linkul din mesaj (doar „ofertă bună?”), fără preview-uri. */
  linkOpenedAt: string | null;
  /** Clientul a ales firma pe pagina „Cu ce firmă ați lucrat?”. */
  firmAnswer: { at: string; firma: string } | null;
  reply: WhatsappReply | null;
}

const iso = (v: unknown) => new Date(v as string).toISOString();

export async function getWhatsappThreads(): Promise<WhatsappThread[]> {
  const rows = await db()`
    SELECT lead_id, event, props, at FROM client_events
    WHERE event IN ('whatsapp_deschis', 'whatsapp_firma_deschis', 'verificare_deschisa',
                    'firma_aleasa_raspuns', 'whatsapp_raspuns')
      AND lead_id IS NOT NULL
    ORDER BY at
  `;

  type Row = { leadId: string; event: string; props: Record<string, unknown> | null; at: string };
  const byLead = new Map<string, Row[]>();
  for (const r of rows) {
    const row: Row = {
      leadId: String(r.lead_id),
      event: String(r.event),
      props: (r.props as Record<string, unknown>) ?? null,
      at: iso(r.at),
    };
    const list = byLead.get(row.leadId);
    if (list) list.push(row);
    else byLead.set(row.leadId, [row]);
  }

  const threads: WhatsappThread[] = [];
  for (const [leadId, events] of byLead) {
    const sends = events.filter((e) => SENT_EVENT[e.event]);
    if (sends.length === 0) continue;
    const sendTimes = sends.map((e) => Date.parse(e.at));

    const replyRow = events.filter((e) => e.event === 'whatsapp_raspuns').at(-1);
    const replyText = String(replyRow?.props?.text ?? '').trim();
    const reply: WhatsappReply | null =
      replyRow && replyText
        ? { text: replyText, la: String(replyRow.props?.la || replyRow.at), savedAt: replyRow.at }
        : null;

    for (const kind of ['oferta', 'firma'] as const) {
      const mine = sends.filter((e) => SENT_EVENT[e.event] === kind);
      if (mine.length === 0) continue;
      const sentAt = mine[0].at;

      let linkOpenedAt: string | null = null;
      if (kind === 'oferta') {
        const open = events.find((e) => {
          if (e.event !== 'verificare_deschisa') return false;
          if (e.props && 'ua' in e.props) return true;
          const t = Date.parse(e.at);
          return !sendTimes.some((s) => Math.abs(t - s) <= PREVIEW_WINDOW_MS);
        });
        linkOpenedAt = open?.at ?? null;
      }

      const answer =
        kind === 'firma' ? events.find((e) => e.event === 'firma_aleasa_raspuns' && e.at >= sentAt) : undefined;

      threads.push({
        leadId,
        kind,
        sentAt,
        sends: mine.length,
        linkOpenedAt,
        firmAnswer: answer ? { at: answer.at, firma: String(answer.props?.firma ?? '') } : null,
        // Un singur fir de WhatsApp pe client: răspunsul ține de ultimul mesaj trimis înaintea lui.
        reply: reply && (kind === 'oferta' || !sends.some((s) => SENT_EVENT[s.event] === 'oferta')) ? reply : null,
      });
    }
  }
  return threads.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

// ── Firmele cu cont, pe județ ───────────────────────────────────────────────

export interface RegisteredFirm {
  /** Adresa principală a firmei în portal (prima din grupul de adrese legate). */
  email: string;
  emails: string[];
  numeFirma: string;
  numeContact: string;
  telefon: string;
  /** Județele pe care primește alerte; gol = alerte oprite. */
  counties: string[];
  /** Revendicări care îi țin un loc din cele MAX_ACTIVE_CLAIMS_PER_FIRM. */
  activeClaims: number;
  slotsFree: number;
  /** Ultima mișcare: intrare în portal sau revendicare. */
  lastActivity: string;
}

function countyKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Firmele care s-au autentificat cel puțin o dată în portal, câte una pe firmă
 * (adresele legate se strâng), fără conturile dezactivate și fără cele fără
 * nume și telefon: pe ele n-ai ce scrie în „Revendicări”.
 */
export async function getRegisteredFirms(claims: LeadClaim[]): Promise<RegisteredFirm[]> {
  const [events, links, prefs, profiles, deactivated] = await Promise.all([
    getPortalAccessEvents(),
    getFirmEmailLinks().catch(() => []),
    getCountyAlertPrefs(),
    getFirmProfiles(),
    getDeactivatedAccounts().catch(() => []),
  ]);
  const companies = getCompanies();

  const groups = new Map<string, string[]>();
  for (const e of events) {
    if (e.event !== 'intrat' || !e.email) continue;
    const members = resolveEmailGroup(links, e.email);
    if (members.length && !groups.has(members[0])) groups.set(members[0], members);
  }

  const firms: RegisteredFirm[] = [];
  for (const [email, members] of groups) {
    if (deactivated.some((d) => members.includes(d.email))) continue;
    const mine = claims.filter((c) => members.includes((c.email || '').trim().toLowerCase()));
    const profile = resolveGroupProfile(profiles, members);
    const company = companies.find((c) => members.includes(c.contact.email?.trim().toLowerCase() || ''));
    const identity = mine[0]
      ? { numeFirma: mine[0].numeFirma, telefon: mine[0].telefon }
      : profile?.numeFirma
        ? { numeFirma: profile.numeFirma, telefon: profile.telefon }
        : company
          ? { numeFirma: company.name, telefon: company.contact.phone }
          : null;
    if (!identity?.numeFirma || !identity.telefon) continue;

    const alerts = resolveGroupAlertPref(prefs, members);
    const activeClaims = countActiveClaimsForFirm(claims, identity);
    const lastActivity = [
      ...events.filter((e) => members.includes(e.email)).map((e) => e.timestamp),
      ...mine.map((c) => c.timestamp),
    ]
      .sort()
      .at(-1);

    firms.push({
      email,
      emails: members,
      numeFirma: identity.numeFirma,
      numeContact:
        mine.find((c) => c.numeContact && c.numeContact !== '-')?.numeContact || profile?.numeContact || '',
      telefon: identity.telefon,
      counties: alerts?.active ? alerts.counties : [],
      activeClaims,
      slotsFree: Math.max(0, MAX_ACTIVE_CLAIMS_PER_FIRM - activeClaims),
      lastActivity: lastActivity ?? '',
    });
  }
  return firms;
}

/**
 * Firmele cu cont care primesc alerte pe județul cererii și n-au luat-o deja,
 * cele cu locuri libere și mișcate de curând întâi.
 */
export function registeredFirmsForLead(
  lead: { timestamp: string; judet: string },
  firms: RegisteredFirm[],
  claims: LeadClaim[],
): RegisteredFirm[] {
  const judet = countyKey(lead.judet || '');
  if (!judet) return [];
  const onLead = claims.filter((c) => c.leadId === lead.timestamp);
  return firms
    .filter((f) => f.counties.some((c) => countyKey(c) === judet))
    .filter(
      (f) =>
        !onLead.some(
          (c) => f.emails.includes((c.email || '').trim().toLowerCase()) || isSameFirm(c, f),
        ),
    )
    .sort(
      (a, b) =>
        Number(b.slotsFree > 0) - Number(a.slotsFree > 0) || b.lastActivity.localeCompare(a.lastActivity),
    );
}
