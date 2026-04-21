---
name: anre-discover
description: Generate fresh list of ANRE-certified PV firms (C2A/C1A) not yet in the directory. Run first in the company-addition pipeline.
---

# ANRE Discover — refresh candidates

Regenerate the list of ANRE-certified PV firms (C2A/C1A) who are **not** in the directory and **not** in the rejected list.

## Run

```bash
node scripts/anre-discover.js
```

Reads:
- `data/anre-atestate.json` (live ANRE registry)
- `data/companies.json` (firms already in directory)
- `data/anre-with-cui.json` (CUI cross-reference)
- `data/anre-rejected.json` (firms already evaluated and rejected)

Writes: `docs/anre-candidates.md` — grouped by județ, with active codes, nr. atestat, expirare, telefon.

## Verification steps (built into the script)
- **Existing:** firms in `companies.json` are filtered by exact `anreMatch` key, normalized name+județ, and CUI cross-ref.
- **Rejected:** firms in `anre-rejected.json` are filtered by `societate|județ` key.

## When to run
- Before any company-addition session (`/add-companies` already runs it)
- After a batch of new firms has been added (to refresh the list)
- Weekly after `anre-sync.js` (future GitHub Action)
