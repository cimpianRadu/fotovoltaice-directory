---
name: add-companies
description: MASTER orchestrator for adding new PV firms to the directory. Runs discover → prefilter → research → add pipeline. Use when user says "adaugă N firme" or "adaugă N firme din <județ>".
---

# Add Companies — master orchestrator

Calls the sub-skills in order. One entry point for "adaugă N firme" requests.

## Inputs

- `N` — number of firms to add (default 5)
- `judet` — optional, e.g. "Bucuresti", "Cluj", "Ilfov"

## Prereq

- `TARGETARE_API_KEY` in `.env.local` (paid API, 179 RON + TVA / 5000 req / 12 months). Scripts auto-load it.

## Pipeline

### 1. `/anre-discover`
```bash
node scripts/anre-discover.js
```
Refreshes `docs/anre-candidates.md`. Script already filters:
- firms in `data/companies.json` (via anreMatch, normalized name+judet, CUI)
- firms in `data/anre-rejected.json` (persisted rejections)

### 2. `/anre-prefilter` — CAEN/revenue/website gate via targetare.ro API
```bash
node scripts/anre-prefilter-input.js --judet=<judet> --limit=<N*3>
node scripts/anre-prefilter-api.js
```

Second script hits targetare.ro API (general + financial + websites endpoints), scores each firm (max 12 pts), writes `data/anre-prefilter-results.json` + `docs/anre-prefiltered.md`. Show scored table to user.

Scoring: CAEN 4321/7112/3511 (+3), solar keywords (+3), website (+2), revenue ≥2M (+2) or ≥500k (+1), age ≥3y (+1), hasBoth C1A+C2A (+1). Threshold ≥6 → research; ≤3 → auto-reject candidate.

### 2.5 **PV content gate** — scrape homepage, verify PV activity
```bash
node scripts/anre-prefilter-content.js
```
Fetches homepage (+ /servicii, /despre-noi, /portofoliu) of each score ≥6 firm. Counts distinct PV keyword matches (fotovoltaic, panouri solare, kWp, invertor, prosumator, on/off-grid, etc.). Updates `anre-prefilter-results.json` with:
- `pvGate: 'pass'` (3+ hits) — definitely PV → prioritize for contacts + research
- `pvGate: 'weak'` (1-2 hits) — worth researching, PV may be minor service
- `pvGate: 'fail'` (0 hits) — non-PV electrical/automation/lighting firm → skip
- `pvGate: 'dead-site'` — homepage 404/timeout → skip

**Why this step exists:** targetare API scoring (CAEN 4321 + revenue + website flag) yields ~25-40% PV installers in older-discovered judete (Timiș, Ilfov). Content check flips this to ~90%+ by reading what the site actually says. Saves API credits on /phones+/emails and avoids wasted research agent turns.

Validated on Ilfov batch 2026-04-22: 2 PASS = 2 accepted, 3 FAIL + 1 DEAD-SITE = 4 rejected → 100% match with research agent decisions.

### 3. Fetch contacts for PV-pass firms only
```bash
node scripts/targetare-contacts.js --min-score=6 --limit=<N*2> --pv-gate=pass,weak
```
Hits `/phones` + `/emails` endpoints **only for firms that passed the PV content gate**. Writes `data/anre-contacts.json` with full dataset.

**This replaces the old firecrawl+listafirme.ro contact scrape.** No more Cloudflare failures, no more manual fallback.

### 4. `/company-research` — ONE agent, sequential
Launch **one** general-purpose agent and feed it `data/anre-contacts.json` (already has all registry data). Agent only needs to scrape the firm's website for:
- `description` (Romanian, factual, no marketing fluff)
- `specializations[]` (hale/birouri/agricol/retail/etc. — only what the site shows)
- `certifications[]` — ISO only, NEVER "ANRE-*"
- `capacity`, `projectsCompleted` — real numbers from site or 0

Explicit "NEVER estimate" rule (see MEMORY.md). If the site is down or uninformative, agent flags `reject` with reason.

Agent returns `{ ready: [<company objects>], reject: [<rejection records>] }`. Write ready array to `scripts/add-batch-YYYY-MM-DD.js`.

### 5. `/company-reject` — persist rejections
Append agent's `reject` array + any score ≤ 3 firms from prefilter to `data/anre-rejected.json`.

### 6. `/company-add` — execute pipeline
```bash
node scripts/add-batch-YYYY-MM-DD.js
node scripts/anre-match-companies.js
node scripts/anre-apply-match.js
node scripts/download-logos.mjs
node scripts/company-tools.js validate
node scripts/company-tools.js stats
```

### 7. Memory update
Update `MEMORY.md` "Content Status" with new total count + named new firms.

## Verification steps at each stage

| Stage | What's verified |
|---|---|
| discover | existing firms filtered out via 3 dedup strategies; rejected filtered out |
| prefilter-input | same 3 dedup + CUI existence required |
| prefilter-api | CAEN code real, revenue real, website flag from registry |
| contacts | phone + email from official registry (no scraping) |
| research | agent's output matches `Company` schema; all references to ANRE stripped from `certifications[]` |
| add | `company-tools.js validate` catches schema errors before commit |

## API budget

- Prefilter: ~2-3 requests/firm (general + financial + websites) = ~25 req per 10-firm batch
- Contacts: 2 requests/firm (phones + emails) = ~20 req per 10-firm batch
- **~45 API credits per 10-firm batch** → 5000-credit plan = ~110 batches/year

## Token budget (baseline)

| Stage | Tokens |
|---|---|
| anre-discover | ~0 (node script) |
| prefilter-input + prefilter-api | ~0 (node scripts) |
| contacts | ~0 (node script) |
| research agent (N firms, fully pre-populated) | 15-25k |
| **Total for 5 firms added** | **~15-25k** |

vs. old flow (firecrawl scrape): 25-35k tokens + ~100 firecrawl credits + 35% fail rate.

## When user says...

- "adaugă 5 firme" → run full pipeline, default judet = auto (whatever has most C2A+C1A candidates)
- "adaugă 5 firme din București" → `--judet=Bucuresti`
- "adaugă 5 firme din județe neacoperite" → pick judet with 0 firms in directory + highest candidate count
- "respinge firma X" → `/company-reject` only
- "refresh candidați" → `/anre-discover` only

## Company schema (authoritative)

Defined in `lib/utils.ts` interface `Company`. Critical fields:
- `certifications[]`: ISO only, NEVER "ANRE-*" (live from registry via `anreMatch`)
- `anreMatch`: `{ societate, judet }` exact from `data/anre-atestate.json`, case-sensitive
- `capacity`, `projectsCompleted`, `employees`, `financials`: real or `0` / empty. **Never estimate.**
- `verified: true` only if website + revenue ≥ 500k confirmed
- `featured: false` by default
- `createdAt`, `updatedAt`: today ISO date

## Valid specializations (from `data/specializations.json`)
`hale-industriale, cladiri-birouri, parcuri-logistice, agricol, retail, hoteluri, spitale, scoli`

## Valid ISO certifications
`ISO-9001, ISO-14001, ISO-45001, ISO-27001, ISO-50001`
