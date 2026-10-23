-- „Oferta nu mi-a convenit”, varianta nouă din contul clientului (23 oct 2026,
-- cerută de Radu), cu motivul opțional: prea scumpă, soluția nu i s-a potrivit,
-- nu l-a convins firma, alt motiv.
ALTER TABLE client_firm_reports ADD COLUMN IF NOT EXISTS motiv text;
