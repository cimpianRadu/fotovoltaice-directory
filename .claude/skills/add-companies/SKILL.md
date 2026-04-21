---
name: add-companies
description: MASTER orchestrator for adding new PV firms to the directory. Runs discover → prefilter → research → add pipeline. Use when user says "adaugă N firme" or "adaugă N firme din <județ>".
---

# Add Companies — master orchestrator

Calls the sub-skills in order. One entry point for "adaugă N firme" requests.

## Inputs

- `N` — number of firms to add (default 5)
- `judet` — optional, e.g. "Bucuresti", "Cluj", "Ilfov"

## Pipeline

### 1. `/anre-discover`
```bash
node scripts/anre-discover.js
```
Refreshes `docs/anre-candidates.md`. Script already filters:
- firms in `data/companies.json` (via anreMatch, normalized name+judet, CUI)
- firms in `data/anre-rejected.json` (persisted rejections)

### 2. `/anre-prefilter` — cheap CAEN/revenue gate
```bash
node scripts/anre-prefilter-input.js --judet=<judet> --limit=<N*3>
```
Then **in main Claude context** (not in a subagent), call `firecrawl_extract` on `https://www.targetare.ro/<CUI>` for each candidate in `data/anre-prefilter-input.json`.

Schema: `{caen_code, caen_label, website, revenue_2024, profit_2024, employees, address, activity_description}`

Score each:
- CAEN 4321 / 7112 / 3511: +3
- "fotovoltaic"/"solar"/"PV" în activitate: +3
- website resolvable: +2
- revenue ≥ 500k / ≥ 2M: +2 / +1
- age ≥ 3y: +1
- hasBoth C1A+C2A: +1

Write `data/anre-prefilter-results.json` + `docs/anre-prefiltered.md`. Show user the scored table.

### 3. `/company-research` — ONE agent, sequential
Pick top N from `anre-prefilter-results.json` (score ≥ 6). Launch **one** general-purpose agent with:
- the prefilter data (CUI, website, CAEN, revenue, employees, address already populated)
- a fixed per-firm pattern: homepage → /proiecte → /contact → extract description + projects + ISO certs
- explicit "NEVER estimate" rule (see MEMORY.md)

Agent returns `{ ready: [<company objects>], reject: [<rejection records>] }`.

Write ready array to `scripts/add-batch-YYYY-MM-DD.js`.

### 4. `/company-reject` — persist rejections
Append agent's `reject` array + any score ≤ 3 firms from prefilter to `data/anre-rejected.json`.

### 5. `/company-add` — execute pipeline
```bash
node scripts/add-batch-YYYY-MM-DD.js
node scripts/anre-match-companies.js
node scripts/anre-apply-match.js
node scripts/download-logos.mjs
node scripts/company-tools.js validate
node scripts/company-tools.js stats
```

### 6. Memory update
Update `MEMORY.md` "Content Status" with new total count + named new firms.

## Verification steps at each stage

| Stage | What's verified |
|---|---|
| discover | existing firms filtered out via 3 dedup strategies; rejected filtered out |
| prefilter-input | same 3 dedup + CUI existence required |
| prefilter | CAEN code real, revenue real, website fetchable |
| research | agent's output matches `Company` schema; all references to ANRE stripped from `certifications[]` |
| add | `company-tools.js validate` catches schema errors before commit |

## Token budget (baseline)

| Stage | Tokens |
|---|---|
| anre-discover | ~0 (node script) |
| prefilter-input | ~0 (node script) |
| prefilter firecrawl (15 firms) | 7-10k |
| research agent (5 firms, pre-populated) | 15-25k |
| **Total for 5 firms added** | **~25-35k** |

vs. previous flow: 3 parallel agents × 40k = 120k for 3 firms, 50% reject rate.

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
