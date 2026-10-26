// Jurnalul de apeluri din /admin/azi (26 oct 2026): ce suni și ce se întâmplă,
// scris pe loc, plus digestul de seară scris de rutina `jurnal-digest-instalatori`
// prin scripts/jurnal.mjs. Stă în Neon, nu în Sheets: o zi de apeluri înseamnă
// zeci de scrieri mici, care ar mânca din limita comună cu producția.

import 'server-only';
import { db } from './db';
import type { JournalDigest, JournalEntry, JournalSubject } from './jurnal-shared';

export type { JournalDigest, JournalEntry, JournalSubject } from './jurnal-shared';

type Row = Record<string, unknown>;

function iso(v: unknown): string {
  return new Date(v as string).toISOString();
}

function toEntry(r: Row): JournalEntry {
  return {
    id: Number(r.id),
    day: String(r.day),
    at: iso(r.at),
    text: String(r.text),
    subject: r.subject_kind
      ? {
          kind: r.subject_kind as JournalSubject['kind'],
          id: String(r.subject_id ?? ''),
          label: String(r.subject_label ?? ''),
          meta: (r.subject_meta as Record<string, string> | null) ?? undefined,
        }
      : null,
    editedAt: r.edited_at ? iso(r.edited_at) : null,
  };
}

// Tabelul încă nu există (migrația 009 nu s-a aplicat): jurnal gol, nu eroare.
function missingTable(err: unknown): boolean {
  return (err as { code?: string }).code === '42P01';
}

/** Notele unei zile, cea mai nouă prima. */
export async function getJournalDay(day: string): Promise<JournalEntry[]> {
  try {
    const rows = await db()`
      SELECT id, day::text AS day, at, text, subject_kind, subject_id, subject_label, subject_meta, edited_at
      FROM jurnal_note WHERE day = ${day} ORDER BY at DESC
    `;
    return rows.map(toEntry);
  } catch (err) {
    if (missingTable(err)) return [];
    throw err;
  }
}

export async function addJournalEntry(input: {
  day: string;
  text: string;
  subject: JournalSubject | null;
}): Promise<JournalEntry> {
  const s = input.subject;
  const rows = await db()`
    INSERT INTO jurnal_note (day, text, subject_kind, subject_id, subject_label, subject_meta)
    VALUES (${input.day}, ${input.text}, ${s?.kind ?? null}, ${s?.id ?? null}, ${s?.label ?? null},
            ${s?.meta ? JSON.stringify(s.meta) : null})
    RETURNING id, day::text AS day, at, text, subject_kind, subject_id, subject_label, subject_meta, edited_at
  `;
  return toEntry(rows[0]);
}

export async function updateJournalEntry(id: number, text: string): Promise<JournalEntry | null> {
  const rows = await db()`
    UPDATE jurnal_note SET text = ${text}, edited_at = now() WHERE id = ${id}
    RETURNING id, day::text AS day, at, text, subject_kind, subject_id, subject_label, subject_meta, edited_at
  `;
  return rows[0] ? toEntry(rows[0]) : null;
}

export async function deleteJournalEntry(id: number): Promise<boolean> {
  const rows = await db()`DELETE FROM jurnal_note WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

/** Digestul zilei sau, dacă nu există încă, cel mai recent dinaintea ei. */
export async function getLatestJournalDigest(onOrBefore: string): Promise<JournalDigest | null> {
  try {
    const rows = await db()`
      SELECT day::text AS day, created_at, notes, body FROM jurnal_digest
      WHERE day <= ${onOrBefore} ORDER BY day DESC LIMIT 1
    `;
    const r = rows[0];
    return r
      ? { day: String(r.day), createdAt: iso(r.created_at), notes: Number(r.notes), body: String(r.body) }
      : null;
  } catch (err) {
    if (missingTable(err)) return null;
    throw err;
  }
}
