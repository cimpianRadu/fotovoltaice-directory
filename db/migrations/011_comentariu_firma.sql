-- Comentariul liber al clientului la răspunsul despre o firmă (26 oct 2026, cerut
-- de Radu: „să aibă unde să își lase părerea la fiecare acțiune”). Opțional, apare
-- după ce alege varianta; îl citim doar noi, firma nu îl vede.
ALTER TABLE client_firm_reports ADD COLUMN IF NOT EXISTS comentariu text;
