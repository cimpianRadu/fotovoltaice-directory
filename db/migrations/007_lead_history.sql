-- Schimbările de stare, cu data și cine le-a făcut (24 oct 2026). Până atunci
-- Sheets ținea doar starea de acum: coloana V pentru cerere, F pe revendicare.
-- Radu: „vreau să văd când a intrat, când s-a schimbat statusul”.
--
-- `field`: stare (V, starea cererii), contactat (X), stare_firma (F, pe o
-- revendicare, cu `claim_ts`). `by`: admin | firma | client | automat.
CREATE TABLE IF NOT EXISTS lead_history (
  id serial PRIMARY KEY,
  lead_id text NOT NULL,
  claim_ts text,
  field text NOT NULL,
  from_value text,
  to_value text,
  by text NOT NULL,
  detail text,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_history_lead ON lead_history (lead_id, at);
