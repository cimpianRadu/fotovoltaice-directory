// Cine a primit deja un email despre o cerere în ultimele ore, din jurnalul
// lead_sends (lib/lead-sends). Folosit ca o firmă să nu primească aceeași
// cerere de două ori la câteva minute distanță: alerta „[Se informează]” la
// creare, apoi „Cerere reactivată” când clientul apasă „Sunt gata pentru
// oferte” imediat după, sau două reactivări salvate la un minut una de alta
// (12 nov 2026: 34 din 56 de reactivări în 8 zile, cota Resend peste 100/zi).
//
// O eroare de bază întoarce lista goală: mai bine o alertă în plus decât una
// pierdută.

import 'server-only';
import { db } from './db';

/** Ferestra în care o firmă nu mai primește încă o alertă pentru aceeași cerere. */
export const RECENT_SEND_WINDOW_HOURS = 24;

export async function recentLeadSendEmails(
  leadId: string,
  hours = RECENT_SEND_WINDOW_HOURS,
): Promise<Set<string>> {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const rows = (await db()`
      SELECT DISTINCT lower(firm_email) AS email FROM lead_sends
      WHERE lead_id = ${leadId} AND sent_at >= ${since}
    `) as { email: string }[];
    return new Set(rows.map((r) => r.email));
  } catch (err) {
    console.error('[lead-recent-sends]', err);
    return new Set();
  }
}
