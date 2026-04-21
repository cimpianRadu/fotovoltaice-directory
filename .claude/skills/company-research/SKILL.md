---
name: company-research
description: Deep-research top prefiltered firms using ONE sequential agent (not parallel). Builds company profiles ready for batch insert.
---

# Company Research — focused agent pass

Takes the `pass` list from `/anre-prefilter` and builds complete company profiles. Uses **one agent** with a fixed research pattern per firm — no parallel bloat.

## Input

`data/anre-prefilter-results.json` — filter to `decision === "pass"`, take top N (user-requested count).

Each entry has already: CUI, website, CAEN, revenue, profit, employees, address from prefilter. Agent does NOT re-research these.

## Agent task (launch ONE agent, subagent_type=general-purpose)

Agent prompt template:

```
You have a shortlist of {N} pre-qualified solar firms. Data for each is provided below.
For EACH firm, follow this FIXED pattern (don't deviate, don't parallelize):

1. WebFetch the firm's website homepage
   → extract: official legal name, tagline, key services, phone, email
2. WebFetch /proiecte OR /portofoliu OR /projects
   → extract: 1-3 named projects (client, location, kW), any notable anchor clients
3. WebFetch /despre OR /about OR /contact
   → extract: founded year confirmation, team size cue, certifications mentioned (ISO only)
4. If website has NO PV content → mark as REJECT with reason.

Output: JSON array of company objects matching the schema in CLAUDE.md / add-companies skill.

Rules:
- certifications[]: ISO only. NEVER "ANRE-*" (live-resolved from registry).
- NEVER estimate: projects count, employees, kW capacity, financials — leave 0/empty.
- location.city + location.county + location.address: from sediu field, clean format.
- anreMatch: { societate: "<exact ANRE name>", judet: "<exact ANRE judet>" } from prefilter input.
- createdAt / updatedAt: today's date.
- verified: true only if website confirms operation AND revenue > 500k.

Return: { ready: [company objects], reject: [{ societate, judet, cui, reason }] }
```

Include in the agent prompt the full data from `anre-prefilter-results.json` (pass candidates only) so the agent doesn't re-fetch known data.

## Output

Write the agent's `ready` array to a new batch script:

```
scripts/add-batch-YYYY-MM-DD.js
```

(based on the existing `add-batch-2026-04-21.js` template).

Write the agent's `reject` array appended to `data/anre-rejected.json` via `/company-reject`.

## Why one agent, not parallel

- Shared context across firms: agent learns the pattern once, applies it N times.
- Deterministic token cost: ~3-5k per firm when data is pre-populated = 15-25k for 5 firms.
- Vs. parallel 3-agent earlier: 120k for 3 firms. ~5× saving.

## Handoff to `/company-add`

Once the batch script is written and the reject list updated, call `/company-add` to execute the pipeline.
