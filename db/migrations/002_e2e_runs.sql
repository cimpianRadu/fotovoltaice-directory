-- Rulările testelor E2E (scripts/e2e.mjs), arătate în /admin/teste (23 oct 2026).
-- Până atunci rezultatele ajungeau doar în emailul rutinei de duminică.
--
-- `results` e lista testelor: [{suite, name, status: pass|fail|skip, ms, error, details}].
-- `git_sha` e commitul de pe producție, luat din Vercel, sau cel local pe localhost.
CREATE TABLE IF NOT EXISTS e2e_runs (
  id serial PRIMARY KEY,
  started_at timestamptz NOT NULL,
  finished_at timestamptz NOT NULL,
  target text NOT NULL,
  trigger text NOT NULL,
  git_sha text,
  passed int NOT NULL,
  failed int NOT NULL,
  skipped int NOT NULL DEFAULT 0,
  results jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS e2e_runs_started_at ON e2e_runs (started_at DESC);
