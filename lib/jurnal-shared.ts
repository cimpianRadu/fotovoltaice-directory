// Tipurile jurnalului de apeluri, fără `server-only`: le folosește și panoul din
// /admin/azi (client). Citirile și scrierile sunt în lib/jurnal.ts.

export type JournalSubjectKind = 'firma' | 'cerere';

/** Despre cine e nota: o firmă din CRM Instalatori sau o cerere din Leads. */
export interface JournalSubject {
  kind: JournalSubjectKind;
  /** Timestamp-ul rândului din Sheets, cheia folosită peste tot în admin. */
  id: string;
  label: string;
  /** Ce arăta rândul când s-a scris nota: telefon, status, follow-up, județ. */
  meta?: Record<string, string>;
}

export interface JournalEntry {
  id: number;
  day: string;
  at: string;
  text: string;
  subject: JournalSubject | null;
  editedAt: string | null;
}

export interface JournalDigest {
  day: string;
  createdAt: string;
  notes: number;
  body: string;
}

/** Evenimentul cu care butoanele „notează” de pe rânduri aleg subiectul în panou. */
export const JOURNAL_SUBJECT_EVENT = 'jurnal:subiect';
/** Evenimentul cu care panoul anunță rândurile că au primit o notă. */
export const JOURNAL_NOTED_EVENT = 'jurnal:notat';

/**
 * Cheia unui rând din agendă. Cu numele inclus: până pe 26 oct 2026 două fișe
 * din CRM Firme aveau același timestamp (scrise deodată de un script de mână),
 * iar „notat” nu trebuie să apară pe amândouă dacă se mai întâmplă.
 */
export function subjectKey(s: { kind: string; id: string; label: string }): string {
  return `${s.kind}:${s.id}:${s.label}`;
}
