-- Locul lucrării pe cerere (6 nov 2026, cerut de un instalator: „să vadă din
-- satelit cam care e situația”). Opțional, completat de client după trimitere
-- sau din contul lui, și modificabil oricând. Îl vede doar firma care a preluat
-- cererea. Stă aici, nu în Sheets: e o adresă de casă, iar tabul Leads e deja
-- la 56 de coloane și împarte cota cu tot site-ul. Un rând pe cerere.
CREATE TABLE IF NOT EXISTS lead_locatii (
  lead_id text PRIMARY KEY,
  adresa text NOT NULL DEFAULT '',
  coordonate text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
