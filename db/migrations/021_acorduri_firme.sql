-- Acordurile firmelor (20 nov 2026): termenii platformei și grila de comision,
-- acceptate cu o bifă în portal sau în formularul de revendicare. Un rând pe
-- adresă, document și versiune. Când se schimbă textul de fond (prețul,
-- condițiile Watt AI), versiunea crește în `lib/acorduri-shared.ts` și firma
-- bifează din nou. Textul exact al bifei se păstrează pe rând, ca dovadă.
CREATE TABLE IF NOT EXISTS acorduri_firme (
  id serial PRIMARY KEY,
  email text NOT NULL,
  acord text NOT NULL,
  versiune text NOT NULL,
  text_acceptat text NOT NULL,
  -- 'portal' (modalul) sau 'revendicare' (formularul de pe /cereri, fără cont).
  sursa text NOT NULL,
  ip text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  acceptat_la timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email, acord, versiune)
);

CREATE INDEX IF NOT EXISTS acorduri_firme_email ON acorduri_firme (email);
