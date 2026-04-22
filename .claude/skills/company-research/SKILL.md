---
name: company-research
description: Deep-research top prefiltered firms using ONE sequential agent (not parallel). Builds company profiles ready for batch insert.
---

# Company Research — focused agent pass

Takes the top-scored firms from `/anre-prefilter` (enriched with contacts via targetare.ro API) and builds complete company profiles. Uses **one agent** with a fixed research pattern per firm — no parallel bloat.

## Input

`data/anre-contacts.json` — produced by `scripts/targetare-contacts.js`. Each entry already has:

- `cui`, `name`, `judet`, `localitate`, `address`
- `phone`, `email`, `website` (from targetare.ro registry, NOT scraped)
- `year_founded`, `employees`, `revenue_2024`, `profit_2024`
- `caen_code`, `caen_label`, `codes` (ANRE), `hasBoth`, `score`

Agent does NOT re-research any of these. The API already settled them.

## Agent task (launch ONE agent, subagent_type=general-purpose)

Agent prompt template:

```
You have a shortlist of {N} pre-qualified solar firms. Data for each is in
data/anre-contacts.json — registry truth for contacts, financials, address.

For EACH firm, follow this FIXED pattern (don't deviate, don't parallelize):

1. If website present → WebFetch homepage
   → extract: tagline, key services, specializations (hale/birouri/agricol/retail/etc.)
2. WebFetch /proiecte OR /portofoliu OR /projects (if exists)
   → extract: 1-3 named projects (client, location, kW), notable anchor clients
3. WebFetch /despre OR /about (if exists)
   → extract: certifications mentioned (ISO only), team cues
4. If website has NO PV content → mark as REJECT with reason.
5. If no website → only reject if firm clearly isn't doing PV (low score + no CAEN 4321).
   Otherwise add with verified: false, minimal description from CAEN + name.

DO NOT scrape contact details from the website — use phone/email/address
from data/anre-contacts.json verbatim.

Output: JSON array of company objects matching the schema in CLAUDE.md.

Rules:
- certifications[]: ISO only. NEVER "ANRE-*" (live-resolved from registry).
- NEVER estimate: projects count, employees, kW capacity, financials — leave 0/empty.
- contact.phone / email / website: from anre-contacts.json (registry).
- location.{city,county,address}: from anre-contacts.json (registry).
- anreMatch: { societate: "<exact ANRE name>", judet: "<exact ANRE judet>" } from input.
- createdAt / updatedAt: today's date.
- verified: true only if website confirms PV operation AND revenue ≥ 500k.

Return: { ready: [company objects], reject: [{ societate, judet, cui, reason }] }
```

Include in the agent prompt the full data from `data/anre-contacts.json` so the agent doesn't re-fetch known data.

## Output

Write the agent's `ready` array to a new batch script:

```
scripts/add-batch-YYYY-MM-DD.js
```

(based on an existing `add-batch-*.js` template).

Write the agent's `reject` array appended to `data/anre-rejected.json` via `/company-reject`.

## Why one agent, not parallel

- Shared context across firms: agent learns the pattern once, applies it N times.
- Deterministic token cost: ~3-5k per firm when data is pre-populated = 15-25k for 5 firms.
- Vs. parallel 3-agent earlier: 120k for 3 firms. ~5× saving.

## Handoff to `/company-add`

Once the batch script is written and the reject list updated, call `/company-add` to execute the pipeline.
