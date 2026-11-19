-- Watt AI pentru firmele logate (19 nov 2026): o bulă pe site, gratuită până pe
-- 10 decembrie, cu cel mult 5 mesaje pe zi de firmă. Radu vede conversațiile în
-- /admin/watt-firme și poate trimite anunțuri care apar în bulă.

-- O conversație pe firmă (emailul din sesiunea portalului). `mesaje` are aceeași
-- formă ca la asistentul clientului: { api: [...], afisare: [...] }.
CREATE TABLE IF NOT EXISTS watt_firme_conversatii (
  firma_email text PRIMARY KEY,
  nume_firma text NOT NULL DEFAULT '',
  mesaje jsonb NOT NULL DEFAULT '{"api": [], "afisare": []}'::jsonb,
  replici integer NOT NULL DEFAULT 0,
  cost_usd numeric(10, 5) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Câte mesaje a trimis firma într-o zi (ora României). Limita e în cod.
CREATE TABLE IF NOT EXISTS watt_firme_utilizare (
  firma_email text NOT NULL,
  zi date NOT NULL,
  mesaje integer NOT NULL DEFAULT 0,
  PRIMARY KEY (firma_email, zi)
);

-- Anunțurile lui Radu. Apare cel mai nou activ, o singură dată pe firmă.
CREATE TABLE IF NOT EXISTS watt_firme_anunturi (
  id serial PRIMARY KEY,
  text text NOT NULL,
  activ boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Firma a deschis bula cu anunțul afișat: anunțul intră în conversația ei.
CREATE TABLE IF NOT EXISTS watt_firme_anunt_vazut (
  anunt_id integer NOT NULL REFERENCES watt_firme_anunturi (id),
  firma_email text NOT NULL,
  vazut_la timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (anunt_id, firma_email)
);
