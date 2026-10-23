-- Contul clientului (cel care lasă o cerere), din 23 oct 2026. Fără parolă, ca
-- portalul firmelor: contul e emailul din cerere, intrarea e un link sau un cod
-- primit pe email. Cererile rămân în Google Sheets (Leads, Revendicări); aici
-- stă doar ce e nou și ar mânca din limita de citiri Sheets.

-- Un cont pe adresă. Se creează singur la prima cerere; `verified_at` apare la
-- prima intrare dintr-un link sau un cod primit pe email.
CREATE TABLE IF NOT EXISTS client_accounts (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  last_seen_at timestamptz,
  deleted_at timestamptz
);

-- Codurile de intrare cerute din /cont. Se păstrează doar hash-ul.
CREATE TABLE IF NOT EXISTS client_login_codes (
  id serial PRIMARY KEY,
  email text NOT NULL,
  code_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  attempts int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS client_login_codes_email ON client_login_codes (email, created_at DESC);

-- Click-urile pe cardurile din /cereri: un rând pe (cerere, tip, vizitator, zi),
-- deci un om care apasă de cinci ori într-o zi contează o dată. `visitor` e un id
-- aleator din cookie; `firm_email` e adresa din portal, dacă firma e logată.
CREATE TABLE IF NOT EXISTS lead_clicks (
  lead_id text NOT NULL,
  kind text NOT NULL,
  visitor text NOT NULL,
  firm_email text,
  day date NOT NULL,
  first_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, kind, visitor, day)
);

CREATE INDEX IF NOT EXISTS lead_clicks_lead ON lead_clicks (lead_id);

-- Fiecare email cu o cerere plecat către o firmă: alerta la creare, retrimiterea
-- din „Încă vreau oferte”. Din el vine „Trimisă la N firme” din cont.
CREATE TABLE IF NOT EXISTS lead_sends (
  id serial PRIMARY KEY,
  lead_id text NOT NULL,
  firm_email text NOT NULL,
  firm_name text,
  kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_sends_lead ON lead_sends (lead_id);

-- „Încă vreau oferte” apăsat din cont. Maximum 2 în 7 zile (decizia lui Radu).
CREATE TABLE IF NOT EXISTS lead_bumps (
  id serial PRIMARY KEY,
  lead_id text NOT NULL,
  email text NOT NULL,
  at timestamptz NOT NULL DEFAULT now(),
  firms_notified int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS lead_bumps_lead ON lead_bumps (lead_id, at DESC);

-- Ce spune clientul despre fiecare firmă care i-a preluat cererea. Ultimul rând
-- pe (cerere, revendicare) e starea de acum. Statusul declarat de firmă NU se
-- arată clientului: îl întrebăm separat și comparăm noi.
CREATE TABLE IF NOT EXISTS client_firm_reports (
  id serial PRIMARY KEY,
  lead_id text NOT NULL,
  claim_ts text NOT NULL,
  firm_name text NOT NULL,
  status text NOT NULL,
  putere text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_firm_reports_lead ON client_firm_reports (lead_id, created_at DESC);

-- Emailurile noi către client, ca niciunul să nu plece de două ori.
-- `kind`: confirmare | preluare:<timestamp revendicare> | oferta:<id ofertă>.
CREATE TABLE IF NOT EXISTS client_emails (
  lead_id text NOT NULL,
  kind text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lead_id, kind)
);

-- Ofertele urcate de firme din portal (etapa 2, pilot cu 3 firme). Fișierele stau
-- în Vercel Blob privat; aici doar adresele lor. Clientul vede toate ofertele
-- cererii lui, firma doar pe a ei.
CREATE TABLE IF NOT EXISTS offers (
  id serial PRIMARY KEY,
  lead_id text NOT NULL,
  claim_ts text NOT NULL,
  firm_name text NOT NULL,
  firm_email text NOT NULL,
  files jsonb NOT NULL,
  valoare_fara_tva numeric,
  putere_kw numeric,
  mesaj text,
  created_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz
);

CREATE INDEX IF NOT EXISTS offers_lead ON offers (lead_id);

-- Fiecare deschidere a unui fișier de ofertă. Doar deschiderile clientului
-- ajung la firmă („Clientul a deschis oferta pe ...”).
CREATE TABLE IF NOT EXISTS offer_views (
  id serial PRIMARY KEY,
  offer_id int NOT NULL,
  file_index int NOT NULL,
  viewer text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS offer_views_offer ON offer_views (offer_id, at);
