-- Vizitele pe pagina cererii din contul clientului (24 oct 2026). Până atunci nu
-- știam dacă omul care a trimis cererea și-a deschis pagina: intrarea din
-- browserul cu care a trimis-o nu lăsa nicio urmă. Un rând pe (cerere, cum a
-- intrat, zi): `formular` = cookie-ul de după trimitere, `cont` = link sau cod.
CREATE TABLE IF NOT EXISTS client_lead_views (
  lead_id text NOT NULL,
  via text NOT NULL,
  day date NOT NULL,
  first_at timestamptz NOT NULL DEFAULT now(),
  last_at timestamptz NOT NULL DEFAULT now(),
  views int NOT NULL DEFAULT 1,
  PRIMARY KEY (lead_id, via, day)
);
