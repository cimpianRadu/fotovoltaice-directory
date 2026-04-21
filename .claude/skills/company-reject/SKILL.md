---
name: company-reject
description: Append firm(s) to data/anre-rejected.json so they never resurface in future discover runs. Pass array of {societate, judet, cui, reason}.
---

# Company Reject — persist rejections

Marks firms as evaluated-and-rejected so `/anre-discover` filters them out forever.

## Usage

Given one or more rejections, append to `data/anre-rejected.json`:

```js
// scripts/reject-batch.js (inline)
const fs = require('fs');
const P = 'data/anre-rejected.json';
const existing = fs.existsSync(P) ? JSON.parse(fs.readFileSync(P, 'utf8')) : [];
const today = new Date().toISOString().slice(0, 10);

const newRejections = [
  { societate: "FIRM NAME EXACT ANRE", judet: "Judet exact ANRE", cui: "12345678",
    reason: "short why (non-PV / no website / too new / etc.)" }
];

for (const r of newRejections) {
  if (existing.some(e => e.societate === r.societate && e.judet === r.judet)) continue;
  existing.push({ ...r, rejectedAt: today });
}

fs.writeFileSync(P, JSON.stringify(existing, null, 2) + '\n');
```

## Required fields

- `societate` — **exact** ANRE name (for dedup key with discover)
- `judet` — **exact** ANRE judet
- `cui` — CUI (no "RO" prefix) for audit trail
- `reason` — 1 sentence, factual (e.g. "CAEN 4291, hidrotechnic, no PV"; "no website, microentity w/ losses")

## After rejecting

Re-run discover so the candidates list reflects the new rejections:

```bash
node scripts/anre-discover.js
```

## Why this matters

Without persisted rejections, we'd re-research the same dead-ends every session. `anre-discover.js` reads `anre-rejected.json` and skips those keys automatically (see `rejectedKeys` in the script).
