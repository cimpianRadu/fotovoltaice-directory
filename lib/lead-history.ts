// Jurnalul schimbărilor de stare (24 oct 2026), arătat în /admin/cereri. Sheets
// ține doar starea de acum, deci fără jurnal nu se vede când s-a mutat o cerere
// din „Nouă” în „În ofertare” sau o firmă din „De sunat” în „În discuții”.
// Se scrie din funcțiile care schimbă celula (lib/sheets.ts), după scriere.
// Scrierea nu are voie să strice nimic: erorile se înghit.

import 'server-only';
import { db } from './db';

export type LeadChangeField = 'stare' | 'contactat' | 'stare_firma';
export type LeadChangeBy = 'admin' | 'firma' | 'client' | 'automat';

export interface LeadChange {
  leadId: string;
  claimTs: string | null;
  field: LeadChangeField;
  from: string;
  to: string;
  by: LeadChangeBy;
  detail: string | null;
  at: string;
}

export async function logLeadChange(change: {
  leadId: string;
  claimTs?: string;
  field: LeadChangeField;
  from: string;
  to: string;
  by: LeadChangeBy;
  detail?: string;
}): Promise<void> {
  if (change.from === change.to) return;
  try {
    await db()`
      INSERT INTO lead_history (lead_id, claim_ts, field, from_value, to_value, by, detail)
      VALUES (${change.leadId}, ${change.claimTs ?? null}, ${change.field}, ${change.from},
              ${change.to}, ${change.by}, ${change.detail ?? null})
    `;
  } catch (err) {
    console.error('[istoric]', change.field, err);
  }
}

export async function getLeadChanges(leadIds: string[]): Promise<LeadChange[]> {
  if (!leadIds.length) return [];
  let rows: Record<string, unknown>[];
  try {
    rows = await db()`
      SELECT lead_id, claim_ts, field, from_value, to_value, by, detail, at
      FROM lead_history WHERE lead_id = ANY(${leadIds}) ORDER BY at
    `;
  } catch (err) {
    // Tabelul încă nu există (migrația 007 nu s-a aplicat): jurnal gol, nu eroare.
    if ((err as { code?: string }).code === '42P01') return [];
    throw err;
  }
  return rows.map((r) => ({
    leadId: String(r.lead_id),
    claimTs: (r.claim_ts as string) ?? null,
    field: r.field as LeadChangeField,
    from: String(r.from_value ?? ''),
    to: String(r.to_value ?? ''),
    by: r.by as LeadChangeBy,
    detail: (r.detail as string) ?? null,
    at: new Date(r.at as string).toISOString(),
  }));
}
