-- Evenimentele contului de client, pentru verdictul experimentului (Radu, 24 oct
-- 2026: „să putem analiza peste 2 săptămâni dacă e un succes și dacă trebuie să
-- fim mai agresivi”). Un rând pe eveniment; `lead_id` lipsește doar la cele
-- legate de adresă, nu de o cerere (codul de intrare).
CREATE TABLE IF NOT EXISTS client_events (
  id serial PRIMARY KEY,
  lead_id text,
  event text NOT NULL,
  props jsonb,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_events_event_at ON client_events (event, at);

CREATE INDEX IF NOT EXISTS client_events_lead ON client_events (lead_id);
