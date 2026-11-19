-- Nota platformei pentru firme (19 nov 2026, cerută de Radu): ce aflăm noi de la
-- client pe WhatsApp sau la telefon („încă așteaptă oferte”, „vrea vizită pe
-- teren”, „oferta primită i s-a părut scumpă”), scris din /admin/whatsapp și
-- arătat pe cardul cererii din /portal, la toate firmele care o țin. O notă pe
-- cerere; textul nou o înlocuiește pe cea veche, textul gol o șterge.
CREATE TABLE IF NOT EXISTS lead_nota_platforma (
  lead_id text PRIMARY KEY,
  text text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
