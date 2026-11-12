-- Deschiderile emailurilor cu cereri trimise firmelor (27 oct 2026, cerut de Radu:
-- „să văd la emailurile spre firme dacă au fost deschise”). Fiecare email are un
-- cod (`open_token`) într-o imagine de 1×1 de pe site (app/api/e/[token]); când
-- se încarcă imaginea, rândul primește ora primei deschideri. Rezumatul de luni
-- are un singur cod pe email, deci același cod stă pe rândul fiecărei cereri din el.
--
-- Cifra e orientativă: Apple Mail încarcă imaginile singur, la primire, iar
-- Outlook le blochează de obicei. `opened_ua` e browserul primei deschideri,
-- ca să se vadă care vine de la Apple. Rândurile de dinainte n-au cod.
ALTER TABLE lead_sends ADD COLUMN IF NOT EXISTS open_token text;
ALTER TABLE lead_sends ADD COLUMN IF NOT EXISTS opened_at timestamptz;
ALTER TABLE lead_sends ADD COLUMN IF NOT EXISTS last_opened_at timestamptz;
ALTER TABLE lead_sends ADD COLUMN IF NOT EXISTS opens int NOT NULL DEFAULT 0;
ALTER TABLE lead_sends ADD COLUMN IF NOT EXISTS opened_ua text;
CREATE INDEX IF NOT EXISTS lead_sends_open_token ON lead_sends (open_token) WHERE open_token IS NOT NULL;
