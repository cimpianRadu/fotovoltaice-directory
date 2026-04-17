---
name: add-companies
description: Research și adăugare firme noi de instalare fotovoltaice în director. Folosește când user-ul cere să adauge firme noi.
---

# Adăugare Firme Noi în Director

Research și adăugare firme de instalare panouri fotovoltaice în `data/companies.json`.

## Pasul 0: Pre-check — Verifică firmele existente
**IMPORTANT: Înainte de orice research, verifică ce firme sunt deja în director.**
```bash
node scripts/company-tools.js stats
# La fiecare candidat nou:
node scripts/company-tools.js check-bulk <CUI-uri>
```

## Pasul 1: Discovery

**Cu WebSearch (preferat):**
```
WebSearch → "firme instalare panouri fotovoltaice comerciale Romania 2026"
WebSearch → "top companii EPC solar Romania"
WebSearch → "cele mai mari firme instalare panouri fotovoltaice comerciale Romania"
```

**Cu Firecrawl (liste specifice):**
```
firecrawl_search → "firme fotovoltaice Romania"
firecrawl_scrape → portal.anre.ro/cautare_atestate (extract JSON: societate, judet, cod, nr atestat)
```

**Surse:** portal.anre.ro, altreal.ro/comparator, financiarul.ro, zf.ro

**ANRE pre-researched:** `data/anre-atestate.json` conține deja TOATE atestatele ANRE scrape-uite. Caută în el firme cu cod `C2A`, `C1A`, `B`, `BP`, `BE` (PV-relevant) și `stare: "Atestat"` care NU sunt încă în `companies.json` — ele sunt candidați de top (deja pre-validate ANRE). După ce Task #5 (`anre-discover.js`) e gata, scriptul va genera automat lista în `docs/anre-candidates.md`.

## Pasul 2: Colectare date

**Schema completă (oglindește interfața `Company` din `lib/utils.ts`):**
```json
{
  "id": "slug-firma",
  "slug": "slug-firma",
  "name": "Nume Firma S.R.L.",
  "cui": "RO12345678",
  "logo": "/logos/slug-firma.png",
  "description": "Descriere 2-3 propoziții, factuală, din surse publice.",
  "founded": 2010,
  "employees": 50,
  "location": { "city": "", "county": "", "address": "" },
  "contact": { "phone": "+40...", "email": "", "website": "https://..." },
  "coverage": ["Județ1", "Județ2"],
  "specializations": ["hale-industriale", "parcuri-logistice", "cladiri-birouri", "retail", "agricol", "hotel"],
  "certifications": ["ISO-9001", "ISO-14001", "ISO-45001"],
  "capacity": { "minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0 },
  "financials": { "year": 2024, "revenue": 0, "profit": 0 },
  "tags": ["experienta-10-ani", "proiecte-mari", "mentenanta-inclusa"],
  "featured": false,
  "verified": true,
  "createdAt": "2026-04-17",
  "updatedAt": "2026-04-17",
  "anreMatch": { "societate": "NUME EXACT DIN REGISTRU ANRE", "judet": "Județul din registru" }
}
```

### Reguli critice pentru câmpuri
- **`certifications[]`**: **NUMAI certificări non-ANRE** (ISO-9001, ISO-14001, ISO-45001 etc.). **NU adăuga „ANRE-C2A", „ANRE-B" etc.** — acestea se rezolvă **live** din `data/anre-atestate.json` prin `lib/anre.ts` (`getCompanyAnreCerts(company.anreMatch)`). Orice „ANRE-*" scris aici e ignorat la afișare și va fi eliminat automat de `anre-apply-match.js`.
- **`anreMatch`**: obligatoriu pentru firmele cu atestat. `societate` și `judet` trebuie să fie **exact** cum apar în `data/anre-atestate.json` (case-sensitive, diacritice păstrate). Dacă firma nu e pe ANRE → `null`.
- **`logo`**: `/logos/<slug>.png`. Poți rula `node scripts/download-logos.mjs` după adăugare (sau descarcă manual de pe site-ul firmei în `public/logos/`).
- **`verified: true`** doar dacă ai verificat CUI + date financiare dintr-o sursă publică (termene.ro/risco.ro). `featured: false` by default.
- **`capacity` și `projectsCompleted`**: dacă nu sunt verificabile din surse publice, pune `0`. **NU estima.**

## Pasul 2b: ANRE matching (obligatoriu)

După ce ai adăugat firmele în `companies.json`, leagă-le de registrul ANRE:

**Opțiunea A — automat (recomandat):**
```bash
node scripts/anre-match-companies.js   # scrie data/anre-match-proposal.json (match prin CUI → nume+județ → telefon)
node scripts/anre-apply-match.js --dry-run   # preview
node scripts/anre-apply-match.js       # aplică: setează anreMatch + șterge ANRE-* din certifications[]
```

**Opțiunea B — manual:**
Caută firma în `data/anre-atestate.json` după `cui` sau `societate`. Copiază `societate` și `judet` exact așa cum apar și pune-le în `anreMatch`. Firmele fără atestat ANRE → `"anreMatch": null`.

**Verificare rapidă:**
```bash
node -e "const {getCompanyAnreCerts} = require('./lib/anre.ts'); /* folosește un REPL TS sau verifică în browser după build */"
# sau pur și simplu: npx next build && vezi paginile firmei
```

## Pasul 3: Verificare date

**Cu Firecrawl:**
```
firecrawl_scrape → termene.ro/firma/CUI (revenue, profit, angajați, an înființare, CAEN)
firecrawl_scrape → risco.ro/firma/CUI (date financiare, stare firmă)
firecrawl_scrape → site-firma.ro (telefon, email, adresă, portofoliu)
firecrawl_scrape → portal.anre.ro/cautare_atestate (cert ANRE activ — nr atestat, stare, data expirare)
firecrawl_map → site-firma.ro (descoperă: /contact, /proiecte, /despre-noi)
```

**Cu WebSearch:**
```
WebSearch → "firma X SRL CUI Y date financiare Romania"
WebSearch → "X SRL proiecte fotovoltaice"
```

**Sursa autoritară pentru ANRE:** `portal.anre.ro/cautare_atestate` + `data/anre-atestate.json` (sincronizat cu `scripts/anre-sync.js`). NU te baza pe ce zice site-ul firmei — verifică întotdeauna în registru.

## Pasul 4: Workflow complet (batch)
```
1. WebSearch → "firme EPC solar comercial Romania" → listă candidați
2. Cross-check cu data/anre-atestate.json (firme cu C2A/C1A/B active) → prioritizează pre-validated
3. node scripts/company-tools.js check-bulk <CUI-uri> → filtrare duplicate
4. Pentru fiecare firmă unică:
   a. firecrawl_scrape → termene.ro/firma/CUI → date financiare + CAEN + nr angajați
   b. firecrawl_scrape → site-firma.ro → contact, descriere, certificări ISO
   c. firecrawl_map → site-firma.ro → pagini relevante
5. Adaugă în companies.json (fără „ANRE-*" în certifications[])
6. node scripts/anre-match-companies.js → generează propunerea de match
7. node scripts/anre-apply-match.js → setează anreMatch + curăță certifications[]
8. node scripts/download-logos.mjs (opțional) → descarcă logo-uri
9. node scripts/company-tools.js validate → verificare completă
10. npx next build → confirmă că build-ul trece și certurile ANRE apar live
11. node scripts/company-tools.js stats → summary
```

## Pasul 5: Validare
- Firma trebuie să aibă minim 2-3 ani activitate
- Preferabil cu atestat ANRE activ (C2A pentru >50kW, sau C1A/B/BP/BE pentru rezidențial)
- Date financiare verificabile (nu self-reported)
- Focus pe comercial/industrial (nu doar rezidențial)
- `anreMatch` validat prin `scripts/anre-match-companies.js` (match de încredere high/medium) sau confirmat manual

## REGULA DE AUR: NU ESTIMA, NU UMFLA DATE
- **NICIODATĂ** nu inventa sau estima date (nr. proiecte, angajați, capacități, cifre financiare)
- Dacă un câmp nu e verificabil din surse publice, lasă-l gol sau pune 0
- Mai bine afișăm mai puțin decât afișăm date false
- Surse acceptate: termene.ro, risco.ro, listafirme.eu, portal.anre.ro, site-ul oficial al firmei

## Pipeline
- Firme pre-researched generic: `docs/company-pipeline.md`
- Candidați ANRE pre-validate (după Task #5): `docs/anre-candidates.md`
