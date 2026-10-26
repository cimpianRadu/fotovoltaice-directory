-- Mărimea firmelor de pe necesit.ro (/admin/necesit): CUI din ONRC, cifra de
-- afaceri, profitul și angajații din bilanțurile publice 2023–2025. Nu în
-- data/necesit-firms.json: repo-ul e public, iar potrivirea e munca de
-- prospectare a lui Radu (26 oct 2026).
--
-- Un rând = o generare a scriptului scripts/necesit-fin.mjs, întreagă: `firms`
-- e un obiect slug necesit → mărime, `meta` ține sursele și statisticile.
CREATE TABLE IF NOT EXISTS necesit_fin_snapshots (
  id serial PRIMARY KEY,
  generated_at timestamptz NOT NULL,
  meta jsonb NOT NULL,
  firms jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS necesit_fin_snapshots_generated_at ON necesit_fin_snapshots (generated_at DESC);
