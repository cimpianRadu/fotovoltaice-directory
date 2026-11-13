-- Nota clientului pentru Watt AI (13 nov 2026, cerută de Radu): după replica de
-- final, clientul spune dacă i-a fost util asistentul. „util” sau „nu_prea”,
-- cu motivul opțional; ultima notă o înlocuiește pe cea dinainte.
ALTER TABLE asistent_conversatii ADD COLUMN IF NOT EXISTS nota_client text;
ALTER TABLE asistent_conversatii ADD COLUMN IF NOT EXISTS motiv_client text NOT NULL DEFAULT '';
ALTER TABLE asistent_conversatii ADD COLUMN IF NOT EXISTS nota_client_la timestamptz;
