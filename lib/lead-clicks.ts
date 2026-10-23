// Click-urile pe cererile din /cereri (cerut de Radu pe 23 oct 2026: „count
// click pe fiecare ofertă”). Azi Umami numără `lead_claim_opened`, dar fără ID-ul
// cererii, deci nu știm pe ce cerere s-a apăsat. Aici fiecare click are cererea.
//
// Un rând pe (cerere, tip, vizitator, zi): un om care apasă de cinci ori într-o
// zi contează o dată. Roboții nu rulează JavaScript, deci nu ajung aici, iar
// apăsările din browserul cu sesiune de admin nu se salvează.

import 'server-only';
import { db } from './db';

export const LEAD_CLICK_KINDS = ['vreau', 'urmaresc', 'link'] as const;
export type LeadClickKind = (typeof LEAD_CLICK_KINDS)[number];

export function isLeadClickKind(s: unknown): s is LeadClickKind {
  return typeof s === 'string' && (LEAD_CLICK_KINDS as readonly string[]).includes(s);
}

export async function recordLeadClick(click: {
  leadId: string;
  kind: LeadClickKind;
  visitor: string;
  firmEmail?: string | null;
}): Promise<void> {
  await db()`
    INSERT INTO lead_clicks (lead_id, kind, visitor, firm_email, day)
    VALUES (${click.leadId}, ${click.kind}, ${click.visitor}, ${click.firmEmail ?? null},
            (now() AT TIME ZONE 'Europe/Bucharest')::date)
    ON CONFLICT DO NOTHING
  `;
}

export interface LeadClickStats {
  /** Vizitatori distincți care au apăsat ceva pe cerere, în total. */
  visitors: number;
  /** Apăsări pe „Vreau această cerere”, câte una pe vizitator și zi. */
  vreau: number;
  urmaresc: number;
  /** Deschideri ale linkului direct spre cerere (alertă, rezumat, postare). */
  link: number;
  /** Firme logate în portal care au apăsat. */
  firms: number;
}

const EMPTY: LeadClickStats = { visitors: 0, vreau: 0, urmaresc: 0, link: 0, firms: 0 };

export async function getLeadClickStats(leadIds: string[]): Promise<Map<string, LeadClickStats>> {
  const out = new Map<string, LeadClickStats>();
  if (!leadIds.length) return out;
  const rows = await db()`
    SELECT lead_id,
           count(DISTINCT visitor)::int AS visitors,
           count(*) FILTER (WHERE kind = 'vreau')::int AS vreau,
           count(*) FILTER (WHERE kind = 'urmaresc')::int AS urmaresc,
           count(*) FILTER (WHERE kind = 'link')::int AS link,
           count(DISTINCT firm_email)::int AS firms
    FROM lead_clicks WHERE lead_id = ANY(${leadIds})
    GROUP BY lead_id
  `;
  for (const r of rows) {
    out.set(String(r.lead_id), {
      visitors: Number(r.visitors),
      vreau: Number(r.vreau),
      urmaresc: Number(r.urmaresc),
      link: Number(r.link),
      firms: Number(r.firms),
    });
  }
  for (const id of leadIds) if (!out.has(id)) out.set(id, { ...EMPTY });
  return out;
}
