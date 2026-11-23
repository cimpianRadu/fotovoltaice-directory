-- Campania de parteneri furnizori (23 nov 2026): magazine și distribuitori de
-- echipamente cărora le propunem promovarea pe site (Premium, 79 €/lună). Un
-- rând pe firmă. Rutina locală „campanie-furnizori-followup” trimite follow-up-urile
-- din Chrome (contact@) și scrie aici prin scripts/campanie-furnizori.mjs;
-- /admin/campanie arată cifrele și are butoanele lui Radu. Adresele stau doar
-- aici, nu în repo-ul public.
--
-- status: activ (primește follow-up-uri) · a_raspuns (oprit până confirmă Radu)
-- · oprit · respins (adresa a dat eroare) · semnat · refuzat · manual (rutina
-- nu o atinge, ex. o firmă care ne-a scris ea).
-- raspuns_dupa: email | fu1 | fu2 | fu3, adică după ce mesaj a răspuns.
CREATE TABLE IF NOT EXISTS campanie_furnizori (
  id serial PRIMARY KEY,
  firma text NOT NULL,
  email text NOT NULL UNIQUE,
  sursa text NOT NULL DEFAULT 'outbound',
  subiect text NOT NULL,
  primul_email date NOT NULL,
  fu1_plan date,
  fu1_trimis date,
  fu2_plan date,
  fu2_trimis date,
  fu3_plan date,
  fu3_trimis date,
  status text NOT NULL DEFAULT 'activ',
  raspuns_la date,
  raspuns_dupa text,
  nota text NOT NULL DEFAULT '',
  creat_la timestamptz NOT NULL DEFAULT now(),
  actualizat_la timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campanie_furnizori_status ON campanie_furnizori (status);
