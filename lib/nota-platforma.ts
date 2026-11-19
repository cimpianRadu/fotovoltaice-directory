// Nota platformei pe o cerere (19 nov 2026): ce aflăm noi de la client după ce
// cererea a plecat la firme, scris de Radu din /admin/whatsapp și arătat pe
// cardul cererii din /portal. „Dă și aprobă” dă cererea fără niciun email, deci
// fără nota asta firma nouă nu află că am vorbit cu clientul și ce vrea.
//
// O notă pe cerere, aceeași pentru toate firmele care o țin. Textul gol o șterge.

import 'server-only';
import { db } from './db';

export const NOTA_PLATFORMA_MAX = 1000;

export interface NotaPlatforma {
  text: string;
  /** ISO, ultima modificare. */
  la: string;
}

/** Notele pentru cererile date. O eroare de bază se aruncă: cine cheamă decide. */
export async function getNotePlatforma(leadIds: string[]): Promise<Map<string, NotaPlatforma>> {
  const ids = [...new Set(leadIds.filter(Boolean))];
  const out = new Map<string, NotaPlatforma>();
  if (!ids.length) return out;
  const rows = (await db()`
    SELECT lead_id, text, updated_at FROM lead_nota_platforma WHERE lead_id = ANY(${ids})
  `) as { lead_id: string; text: string; updated_at: Date | string }[];
  for (const r of rows) {
    out.set(r.lead_id, { text: r.text, la: new Date(r.updated_at).toISOString() });
  }
  return out;
}

/** Scrie nota (sau o șterge, la text gol). Întoarce nota salvată, null după ștergere. */
export async function setNotaPlatforma(leadId: string, raw: string): Promise<NotaPlatforma | null> {
  const text = raw.trim().slice(0, NOTA_PLATFORMA_MAX);
  if (!text) {
    await db()`DELETE FROM lead_nota_platforma WHERE lead_id = ${leadId}`;
    return null;
  }
  const rows = (await db()`
    INSERT INTO lead_nota_platforma (lead_id, text, updated_at)
    VALUES (${leadId}, ${text}, now())
    ON CONFLICT (lead_id) DO UPDATE SET text = EXCLUDED.text, updated_at = now()
    RETURNING text, updated_at
  `) as { text: string; updated_at: Date | string }[];
  return { text: rows[0].text, la: new Date(rows[0].updated_at).toISOString() };
}
