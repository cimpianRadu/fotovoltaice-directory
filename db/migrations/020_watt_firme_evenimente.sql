-- Măsurătorile bulei Watt pentru firme (19 nov 2026, Radu: „doar dacă avem și
-- măsurători”). Un rând pe eveniment, pe firmă: bula afișată (o dată pe zi),
-- deschisă, balonul anunțului afișat / închis, un mesaj (rapid sau scris, ca
-- răspuns la anunț sau nu), limita atinsă, un link spre o cerere apăsat, nota
-- pe un răspuns. Raportul din /admin/watt-firme le numără.
CREATE TABLE IF NOT EXISTS watt_firme_evenimente (
  id bigserial PRIMARY KEY,
  firma_email text NOT NULL,
  tip text NOT NULL,
  detalii text NOT NULL DEFAULT '',
  la timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS watt_firme_evenimente_tip ON watt_firme_evenimente (tip, la);
