---
name: anre-prefilter
description: Score top ANRE candidates via targetare.ro Firecrawl extract (CAEN, revenue, website). Cheap gate that filters out non-PV firms BEFORE expensive agent research.
---

# ANRE Prefilter — cheap CAEN/revenue gate

Scores top N candidates by fetching public data from targetare.ro. Goal: filter out firms that are *not actually doing PV* (wrong CAEN, no revenue, no website) before spending agent tokens.

## Step 1 — generate shortlist

```bash
node scripts/anre-prefilter-input.js [--judet=Bucuresti] [--limit=20]
```

Writes: `data/anre-prefilter-input.json` — top N candidates with `{ societate, judet, cui, codes, hasBoth, telefon, sediu }`.

Verification baked in: filters out existing + rejected + those without CUI.

## Step 2 — fetch targetare.ro data (main Claude, NOT agent)

For each candidate in the shortlist, call Firecrawl extract on `https://www.targetare.ro/<CUI>`:

```
firecrawl_extract
  urls: ["https://www.targetare.ro/<CUI>"]
  schema:
    caen_code (string)    — cod CAEN principal (e.g. "4321")
    caen_label (string)   — denumire CAEN
    website (string)      — site web dacă e listat
    revenue_2024 (number) — cifra de afaceri RON
    profit_2024 (number)
    employees (number)    — nr. angajați
    address (string)
    activity_description (string) — text descriere activitate
```

**Do this in the main conversation, not in a subagent.** Firecrawl output is compact (~500 tokens per firm with schema). 15 firms ≈ 7-10k tokens total.

## Step 3 — score + persist

For each result, compute a score:

| Signal | Points |
|---|---|
| CAEN in [4321, 7112, 3511] (electrical/engineering/electricity) | +3 |
| CAEN in [4120, 4399, 4329, 4399] (construction adj.) | +1 |
| Website listed + resolvable | +2 |
| "fotovoltaic" / "solar" / "PV" in `activity_description` | +3 |
| Revenue ≥ 500k RON | +2 |
| Revenue ≥ 2M RON | +1 bonus |
| Age ≥ 3y from `codInmatriculare` | +1 |
| hasBoth (C1A+C2A already active) | +1 |

Threshold: **score ≥ 6** → pass to research. **score ≤ 3** → suggest auto-reject with reason.

Write results to `data/anre-prefilter-results.json`:
```json
[
  { "societate": "...", "judet": "...", "cui": "...",
    "caen": "4321", "website": "...", "revenue": 1234567,
    "score": 8, "decision": "pass|borderline|reject", "reason": "..." }
]
```

And render `docs/anre-prefiltered.md` with a sortable table (score desc) for user to eyeball.

## Output — hand-off to next skill

- **pass** candidates → `/company-research` picks these up from `anre-prefilter-results.json`
- **reject** candidates → batch-add to `/company-reject` with the auto-generated reason

## Why this matters

Previous flow: 3 parallel agents × 40k tokens = 120k for 3 firms, 50% rejected mid-research.
New flow: 7-10k prefilter + 15-20k focused research = 25-30k for 5-8 qualified firms. **~5× cheaper**.
