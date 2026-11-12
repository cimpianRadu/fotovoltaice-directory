-- Taskurile de lângă jurnal (26 oct 2026). Radu: „jurnalul să fie the main
-- thing, să îmi notez ce am de făcut, și când faci digest să îmi scoți task pe
-- mâine, poimâine”. Le scrie el din /admin/azi sau le scoate digestul de seară
-- din note (scripts/jurnal.mjs tasks). Înlocuiesc tabul „Todo” din Sheets, care
-- avea două rânduri, amândouă bifate.
--
-- `source`: manual | digest. `source_day` = ziua digestului care l-a scos; la
-- rescrierea digestului se înlocuiesc doar taskurile lui nebifate și needitate.
CREATE TABLE IF NOT EXISTS jurnal_task (
  id serial PRIMARY KEY,
  due date NOT NULL,
  text text NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  source_day date,
  created_at timestamptz NOT NULL DEFAULT now(),
  done_at timestamptz,
  edited_at timestamptz
);

CREATE INDEX IF NOT EXISTS jurnal_task_due ON jurnal_task (due);
