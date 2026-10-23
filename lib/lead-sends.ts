// Unde a plecat fiecare cerere: un rând pe email trimis unei firme (alerta la
// creare, retrimiterea din „Încă vreau oferte”, rezumatul de luni). Până pe 23 oct
// 2026 se știa doar că alertele plecaseră (coloana AF), nu la cine; din jurnalul
// ăsta vine „Trimisă la N firme” din contul clientului.
//
// Scrierea nu are voie să oprească trimiterea: o eroare de bază se înghite.

import 'server-only';
import { db } from './db';

export type LeadSendKind = 'creare' | 'retrimitere' | 'rezumat' | 'deblocare';

export async function logLeadSends(
  leadId: string,
  firmEmails: string[],
  kind: LeadSendKind,
  firmName?: string,
): Promise<void> {
  const emails = [...new Set(firmEmails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (!emails.length) return;
  try {
    await db()`
      INSERT INTO lead_sends (lead_id, firm_email, firm_name, kind)
      SELECT ${leadId}, e, ${firmName ?? null}, ${kind} FROM unnest(${emails}::text[]) AS e
    `;
  } catch (err) {
    console.error('[lead-sends]', err);
  }
}
