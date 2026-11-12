-- Asistentul de după cerere (pilot din 12 nov 2026, cererile „doar baterie” și
-- „extindere”). Clientul discută cu asistentul după ce a trimis cererea, iar ce
-- confirmă ajunge la firme ca rezumat. Totul stă aici, nu în Sheets: un mesaj e
-- o scriere, iar tabul Leads împarte cota cu tot site-ul.
--
-- Un rând pe cerere. `cerere` e instantaneul câmpurilor din Sheets luat la
-- prima replică, ca restul conversației să nu mai citească Sheets.
CREATE TABLE IF NOT EXISTS asistent_conversatii (
  lead_id text PRIMARY KEY,
  cerere jsonb NOT NULL,
  mesaje jsonb NOT NULL DEFAULT '[]'::jsonb,
  date jsonb NOT NULL DEFAULT '{}'::jsonb,
  replici integer NOT NULL DEFAULT 0,
  cost_usd numeric(10, 5) NOT NULL DEFAULT 0,
  incheiata_la timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Nota firmei pe rezumatul unei cereri: „util” sau „nu prea”, cu motivul
-- opțional. O notă pe firmă și cerere, ultima o înlocuiește pe cea dinainte.
CREATE TABLE IF NOT EXISTS asistent_note (
  lead_id text NOT NULL,
  firma_email text NOT NULL,
  nota text NOT NULL,
  motiv text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, firma_email)
);

-- Rezumatul se poate opri din portal, pe cont. Lipsa rândului = pornit.
CREATE TABLE IF NOT EXISTS firma_setari (
  email text PRIMARY KEY,
  rezumat_ai boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
