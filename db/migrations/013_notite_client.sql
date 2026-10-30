-- Notițele clientului despre fiecare firmă care i-a preluat cererea (30 oct 2026,
-- cerut de Radu: „la fiecare secțiune de firmă, să poată să își lase comments sau
-- notițe”, de exemplu „am vorbit cu X, mi-a zis asta”). Fiecare notiță are data
-- ei și apare în istoricul firmei de pe pagina cererii. Firma nu le vede; le
-- citim doar noi. Clientul își poate șterge o notiță, iar rândul dispare.
CREATE TABLE IF NOT EXISTS client_firm_notes (
  id serial PRIMARY KEY,
  lead_id text NOT NULL,
  claim_ts text NOT NULL,
  nota text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS client_firm_notes_lead ON client_firm_notes (lead_id, created_at);
