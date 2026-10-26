-- Jurnalul de apeluri din /admin/azi (26 oct 2026). Radu: „să notez ce sun și
-- ce se întâmplă, apoi la sfârșit de zi să faci digest”. Un rând = o notă
-- scrisă pe loc. Digestul îl scrie seara rutina `jurnal-digest-instalatori`
-- (scripts/jurnal.mjs) și apare a doua zi dimineață pe /admin/azi.
--
-- `day` e ziua din România în care s-a scris nota. Subiectul e opțional: firma
-- din CRM Instalatori sau cererea din Leads (`subject_id` = timestamp-ul
-- rândului din Sheets), cu `subject_meta` = ce arăta rândul atunci (telefon,
-- status, follow-up), ca digestul să nu mai citească din Sheets.
CREATE TABLE IF NOT EXISTS jurnal_note (
  id serial PRIMARY KEY,
  day date NOT NULL,
  at timestamptz NOT NULL DEFAULT now(),
  text text NOT NULL,
  subject_kind text,
  subject_id text,
  subject_label text,
  subject_meta jsonb,
  edited_at timestamptz
);

CREATE INDEX IF NOT EXISTS jurnal_note_day ON jurnal_note (day, at);

-- Un digest pe zi, în markdown. Se rescrie dacă apar note după el.
CREATE TABLE IF NOT EXISTS jurnal_digest (
  day date PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  notes int NOT NULL,
  body text NOT NULL
);
