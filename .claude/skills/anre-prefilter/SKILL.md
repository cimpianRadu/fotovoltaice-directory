---
name: anre-prefilter
description: Score top ANRE candidates via targetare.ro API (CAEN, revenue, website, contacts). Cheap gate that filters out non-PV firms BEFORE expensive agent research.
---

# ANRE Prefilter — targetare.ro API gate

Scores top N candidates by calling the targetare.ro API directly. Goal: filter out firms that are *not actually doing PV* (wrong CAEN, no revenue) before spending agent tokens, and collect all official registry data (name, CAEN, financials, phone, email, website) in one pass.

## Prereq: `TARGETARE_API_KEY` in `.env.local`

Paid API (179 RON + TVA for 5000 requests / 12 months). Replaces the old firecrawl+listafirme.ro scraping which had ~35% failure rate and burned firecrawl credits.

## Step 1 — generate shortlist

```bash
node scripts/anre-prefilter-input.js [--judet=Bucuresti] [--limit=30]
```

Writes: `data/anre-prefilter-input.json` — top N candidates with `{ societate, judet, cui, codes, hasBoth, telefon, sediu }`.

Verification baked in: filters out existing + rejected + those without CUI.

## Step 2 — enrich + score via API

```bash
node scripts/anre-prefilter-api.js
```

Per firm: 2-3 API calls (general + financial + websites). ~25 requests per 10-firm batch. Loads `.env.local` automatically.

Writes:
- `data/anre-prefilter-results.json` — sorted desc by score, with reasons array
- `docs/anre-prefiltered.md` — markdown table for user review

**Scoring (max 12 points):**

| Signal | Points |
|---|---|
| CAEN in [4321, 7112, 3511] | +3 |
| "fotovoltaic" / "solar" / "PV" / "panouri" / "energie regenerabil" in name or CAEN label | +3 |
| Website listed (hasWebsite flag + actual URL) | +2 |
| Revenue ≥ 2M RON | +2 |
| Revenue ≥ 500k RON | +1 |
| Age ≥ 3 years | +1 |
| hasBoth C1A+C2A | +1 |

Threshold: **score ≥ 6** → pass to research. **score ≤ 3** → suggest auto-reject.

## Step 3 — fetch contacts for top N

```bash
node scripts/targetare-contacts.js [--min-score=6] [--limit=10]
```

Fetches `/phones` + `/emails` endpoints. Writes `data/anre-contacts.json` with full data ready for research agent: cui, name, address, phone, email, website, year_founded, employees, revenue, profit, caen, codes, hasBoth, score.

~20 API requests per 10-firm batch.

## Total budget per 10-firm batch

- ~25 requests prefilter + ~20 contacts = **~45 API credits**
- On 5000 credit budget: ~110 batches / year = way more than needed

## Output — hand-off to next skill

- **pass** candidates → `/company-research` reads `data/anre-contacts.json` (already has ALL contact + financial data)
- **reject** candidates → batch-add to `/company-reject` with auto-generated reason

## Why this matters vs old flow

| Metric | Old (firecrawl + listafirme) | New (targetare API) |
|---|---|---|
| Duration (20 firms) | ~10 min | ~30 sec |
| Fail rate | ~35% (Cloudflare) | 0% |
| Firecrawl credits | ~100 | 0 |
| Agent tokens | ~66k | 0 |
| Cost | pay per credit | 213 RON / 5000 req / 12mo |
