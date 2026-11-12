-- Ce firme au văzut rezumatul Watt AI pe cardul unei cereri (pilot 12 nov 2026).
-- „Văzut” = cel puțin jumătate din rezumat a stat în ecran, pe /cereri sau în
-- portal. Un rând pe firmă și cerere; `vizualizari` numără revenirile.
CREATE TABLE IF NOT EXISTS asistent_vizualizari (
  lead_id text NOT NULL,
  firma_email text NOT NULL,
  sursa text NOT NULL DEFAULT '',
  vizualizari integer NOT NULL DEFAULT 1,
  prima_la timestamptz NOT NULL DEFAULT now(),
  ultima_la timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, firma_email)
);
