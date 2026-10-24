-- De câte ori a răspuns Google Sheets „prea multe cereri” (429) sau „indisponibil”
-- (503) pe site (24 oct 2026). Radu: „am tot pățit să primesc eroare”. Cifra
-- decide dacă mutăm cererile din Sheets în Neon. `final` = au picat și toate
-- reîncercările, deci utilizatorul a văzut eroarea.
CREATE TABLE IF NOT EXISTS sheets_quota_events (
  id serial PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT now(),
  label text NOT NULL,
  status int NOT NULL,
  attempt int NOT NULL,
  final boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS sheets_quota_events_at ON sheets_quota_events (at);
