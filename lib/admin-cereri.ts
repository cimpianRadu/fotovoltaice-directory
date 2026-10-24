// Ce s-a întâmplat cu fiecare cerere în afara Sheets-ului, pentru /admin/cereri
// (24 oct 2026): contul clientului, vizitele lui, click-urile de pe /cereri,
// emailurile plecate, ofertele și jurnalul schimbărilor de stare. Toate stau în
// Neon din 23-24 oct, deci cererile mai vechi au aici doar ce s-a întâmplat după.
//
// Baza poate să nu răspundă: atunci funcțiile aruncă, iar pagina arată datele
// din Sheets fără coloanele de aici.

import 'server-only';
import { db } from './db';
import { getLeadClickStats, type LeadClickStats } from './lead-clicks';
import { getLeadChanges, type LeadChange } from './lead-history';
import { normalizeEmail } from './portal-auth';

/** De când se numără click-urile pe /cereri (lib/lead-clicks, deploy 23 oct seara). */
export const CLICKS_SINCE = '2026-10-23T18:00:00.000Z';
/** De când se numără vizitele clientului pe pagina cererii (client_lead_views). */
export const CLIENT_VIEWS_SINCE = '2026-10-24T10:00:00.000Z';

export interface ClientAccountInfo {
  createdAt: string;
  /** Prima intrare dintr-un link sau un cod primit pe email. */
  verifiedAt: string | null;
  lastSeenAt: string | null;
  deletedAt: string | null;
}

export interface LeadActivity {
  account: ClientAccountInfo | null;
  /** Deschideri ale paginii cererii de către client, oricum ar fi intrat. */
  clientViews: number;
  /** În câte zile diferite și-a deschis-o: 2+ = a revenit. */
  clientViewDays: number;
  clientLastView: string | null;
  /** A apăsat „Urmăriți cererea” pe ecranul de după formular. */
  followClicked: boolean;
  clicks: LeadClickStats;
  /** La câte firme a plecat cererea pe email (alertă, retrimitere, rezumat). */
  sentTo: number;
  /** Ultima schimbare de stare din jurnal, a cererii sau a unei firme. */
  lastChange: string | null;
  /** Ultima schimbare a stării cererii (coloana V). */
  lastStatusChange: string | null;
  /** Pe fiecare revendicare: ultima schimbare a stării firmei. */
  claimStatusChanges: Map<string, string>;
}

const iso = (v: unknown): string | null => (v ? new Date(v as string).toISOString() : null);

async function accountsFor(emails: string[]): Promise<Map<string, ClientAccountInfo>> {
  const out = new Map<string, ClientAccountInfo>();
  if (!emails.length) return out;
  const rows = await db()`
    SELECT email, created_at, verified_at, last_seen_at, deleted_at
    FROM client_accounts WHERE email = ANY(${emails})
  `;
  for (const r of rows) {
    out.set(String(r.email), {
      createdAt: iso(r.created_at) as string,
      verifiedAt: iso(r.verified_at),
      lastSeenAt: iso(r.last_seen_at),
      deletedAt: iso(r.deleted_at),
    });
  }
  return out;
}

/** Pentru listă: câte un rezumat pe cerere. */
export async function getLeadsActivity(
  leads: { timestamp: string; email: string }[],
): Promise<Map<string, LeadActivity>> {
  const ids = leads.map((l) => l.timestamp);
  const emails = [...new Set(leads.map((l) => normalizeEmail(l.email || '')).filter(Boolean))];
  const q = db();
  const [accounts, views, follows, clicks, sends, changes] = await Promise.all([
    accountsFor(emails),
    q`SELECT lead_id, sum(views)::int AS views, count(DISTINCT day)::int AS days, max(last_at) AS last_at
      FROM client_lead_views WHERE lead_id = ANY(${ids}) GROUP BY lead_id`,
    q`SELECT DISTINCT lead_id FROM client_events WHERE event = 'cta_click' AND lead_id = ANY(${ids})`,
    getLeadClickStats(ids),
    q`SELECT lead_id, count(DISTINCT firm_email)::int AS n FROM lead_sends WHERE lead_id = ANY(${ids}) GROUP BY lead_id`,
    getLeadChanges(ids),
  ]);

  const viewsBy = new Map(views.map((r) => [String(r.lead_id), r]));
  const followed = new Set(follows.map((r) => String(r.lead_id)));
  const sentBy = new Map(sends.map((r) => [String(r.lead_id), Number(r.n)]));

  const out = new Map<string, LeadActivity>();
  for (const l of leads) {
    const v = viewsBy.get(l.timestamp);
    const mine = changes.filter((c) => c.leadId === l.timestamp);
    const claimStatusChanges = new Map<string, string>();
    for (const c of mine) if (c.field === 'stare_firma' && c.claimTs) claimStatusChanges.set(c.claimTs, c.at);
    out.set(l.timestamp, {
      account: accounts.get(normalizeEmail(l.email || '')) ?? null,
      clientViews: Number(v?.views ?? 0),
      clientViewDays: Number(v?.days ?? 0),
      clientLastView: iso(v?.last_at),
      followClicked: followed.has(l.timestamp),
      clicks: clicks.get(l.timestamp) ?? { visitors: 0, vreau: 0, urmaresc: 0, link: 0, firms: 0 },
      sentTo: sentBy.get(l.timestamp) ?? 0,
      lastChange: mine.at(-1)?.at ?? null,
      lastStatusChange: mine.filter((c) => c.field === 'stare').at(-1)?.at ?? null,
      claimStatusChanges,
    });
  }
  return out;
}

export interface LeadActivityDetail {
  account: ClientAccountInfo | null;
  views: { day: string; via: string; views: number; firstAt: string; lastAt: string }[];
  events: { event: string; props: Record<string, unknown> | null; at: string }[];
  sends: { firmEmail: string; firmName: string | null; kind: string; at: string }[];
  bumps: { at: string; firms: number }[];
  reports: { claimTs: string; firm: string; status: string; motiv: string | null; putere: string | null; at: string }[];
  emails: { kind: string; at: string }[];
  offers: {
    id: number;
    claimTs: string;
    firm: string;
    valoare: number | null;
    putereKw: number | null;
    files: number;
    createdAt: string;
    withdrawnAt: string | null;
    clientViews: number;
    clientFirstView: string | null;
  }[];
  clicks: { kind: string; day: string; firmEmail: string | null; at: string }[];
  changes: LeadChange[];
}

/** Pentru fișa unei cereri: tot, rând cu rând. */
export async function getLeadActivityDetail(lead: {
  timestamp: string;
  email: string;
}): Promise<LeadActivityDetail> {
  const id = lead.timestamp;
  const q = db();
  const [accounts, views, events, sends, bumps, reports, emails, offers, clicks, changes] =
    await Promise.all([
      accountsFor([normalizeEmail(lead.email || '')].filter(Boolean)),
      q`SELECT day::text AS day, via, views, first_at, last_at FROM client_lead_views WHERE lead_id = ${id} ORDER BY day`,
      q`SELECT event, props, at FROM client_events WHERE lead_id = ${id} ORDER BY at`,
      q`SELECT firm_email, firm_name, kind, sent_at FROM lead_sends WHERE lead_id = ${id} ORDER BY sent_at`,
      q`SELECT at, firms_notified FROM lead_bumps WHERE lead_id = ${id} ORDER BY at`,
      q`SELECT claim_ts, firm_name, status, motiv, putere, created_at FROM client_firm_reports
        WHERE lead_id = ${id} ORDER BY created_at`,
      q`SELECT kind, sent_at FROM client_emails WHERE lead_id = ${id} ORDER BY sent_at`,
      q`SELECT o.id, o.claim_ts, o.firm_name, o.valoare_fara_tva, o.putere_kw, o.files, o.created_at, o.withdrawn_at,
               count(v.id) FILTER (WHERE v.viewer = 'client')::int AS client_views,
               min(v.at) FILTER (WHERE v.viewer = 'client') AS client_first_view
        FROM offers o LEFT JOIN offer_views v ON v.offer_id = o.id
        WHERE o.lead_id = ${id} GROUP BY o.id ORDER BY o.created_at`,
      q`SELECT kind, day::text AS day, firm_email, first_at FROM lead_clicks WHERE lead_id = ${id} ORDER BY first_at`,
      getLeadChanges([id]),
    ]);

  return {
    account: [...accounts.values()][0] ?? null,
    views: views.map((r) => ({
      day: String(r.day),
      via: String(r.via),
      views: Number(r.views),
      firstAt: iso(r.first_at) as string,
      lastAt: iso(r.last_at) as string,
    })),
    events: events.map((r) => ({
      event: String(r.event),
      props: (r.props as Record<string, unknown>) ?? null,
      at: iso(r.at) as string,
    })),
    sends: sends.map((r) => ({
      firmEmail: String(r.firm_email),
      firmName: (r.firm_name as string) ?? null,
      kind: String(r.kind),
      at: iso(r.sent_at) as string,
    })),
    bumps: bumps.map((r) => ({ at: iso(r.at) as string, firms: Number(r.firms_notified) })),
    reports: reports.map((r) => ({
      claimTs: String(r.claim_ts),
      firm: String(r.firm_name),
      status: String(r.status),
      motiv: (r.motiv as string) ?? null,
      putere: (r.putere as string) ?? null,
      at: iso(r.created_at) as string,
    })),
    emails: emails.map((r) => ({ kind: String(r.kind), at: iso(r.sent_at) as string })),
    offers: offers.map((r) => ({
      id: Number(r.id),
      claimTs: String(r.claim_ts),
      firm: String(r.firm_name),
      valoare: r.valoare_fara_tva == null ? null : Number(r.valoare_fara_tva),
      putereKw: r.putere_kw == null ? null : Number(r.putere_kw),
      files: Array.isArray(r.files) ? r.files.length : 0,
      createdAt: iso(r.created_at) as string,
      withdrawnAt: iso(r.withdrawn_at),
      clientViews: Number(r.client_views),
      clientFirstView: iso(r.client_first_view),
    })),
    clicks: clicks.map((r) => ({
      kind: String(r.kind),
      day: String(r.day),
      firmEmail: (r.firm_email as string) ?? null,
      at: iso(r.first_at) as string,
    })),
    changes,
  };
}
