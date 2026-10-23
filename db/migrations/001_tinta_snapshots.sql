-- Lista Țintă (/admin/tinta): firmele cu atestat ANRE de execuție nou înființate
-- sau cu cifra de afaceri în scădere. Stătea în data/firme-tinta.json, dar
-- repo-ul e public, iar lista e munca de prospectare a lui Radu (23 oct 2026).
--
-- Un rând = o generare a scriptului scripts/firme-tinta.mjs, întreagă: pagina
-- filtrează în memorie, la fel ca înainte din fișier. `meta` ține sursele,
-- pragurile și statisticile; `firms` lista, deja sortată după scor.
CREATE TABLE IF NOT EXISTS tinta_snapshots (
  id serial PRIMARY KEY,
  generated_at timestamptz NOT NULL,
  meta jsonb NOT NULL,
  firms jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tinta_snapshots_generated_at ON tinta_snapshots (generated_at DESC);
