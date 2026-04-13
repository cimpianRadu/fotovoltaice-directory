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
firecrawl_scrape → anre.ro registrul atestatelor (extract JSON: nume, nr atestat)
```

**Surse:** ANRE (anre.ro), altreal.ro/comparator, financiarul.ro, zf.ro

## Pasul 2: Colectare date
```json
{
  "id": "slug-firma",
  "slug": "slug-firma",
  "name": "Nume Firma S.R.L.",
  "cui": "RO12345678",
  "description": "Descriere 2-3 propoziții",
  "founded": 2010,
  "employees": 50,
  "location": { "city": "", "county": "", "address": "" },
  "contact": { "phone": "", "email": "", "website": "" },
  "coverage": ["Județ1", "Județ2"],
  "specializations": ["hale-industriale", "parcuri-logistice", "cladiri-birouri", "retail", "agricol", "hotel"],
  "certifications": ["ANRE-C2A", "ISO-9001", "ISO-14001", "ISO-45001"],
  "capacity": { "minProjectKw": 10, "maxProjectKw": 5000, "projectsCompleted": 100 },
  "financials": { "revenue": 0, "profit": 0, "year": 2024 },
  "tags": ["experienta-10-ani", "proiecte-mari", "mentenanta-inclusa"],
  "updatedAt": "2026-01-15"
}
```

## Pasul 3: Verificare date

**Cu Firecrawl:**
```
firecrawl_scrape → termene.ro/firma/CUI (revenue, profit, angajați, an înființare)
firecrawl_scrape → risco.ro/firma/CUI (date financiare, stare firmă)
firecrawl_scrape → site-firma.ro (telefon, email, adresă, certificări, portofoliu)
firecrawl_map → site-firma.ro (descoperă: /contact, /proiecte, /despre-noi)
```

**Cu WebSearch:**
```
WebSearch → "firma X SRL CUI Y date financiare Romania"
WebSearch → "X SRL certificare ANRE C2A"
WebSearch → "X SRL proiecte fotovoltaice"
```

## Pasul 4: Workflow complet (batch)
```
1. WebSearch → "firme EPC solar comercial Romania" → listă candidați
2. node scripts/company-tools.js check-bulk <CUI-uri> → filtrare duplicate
3. Pentru fiecare firmă unică:
   a. firecrawl_scrape → termene.ro/firma/CUI → date financiare
   b. firecrawl_scrape → site-firma.ro → contact, descriere, certificări
   c. firecrawl_map → site-firma.ro → pagini relevante
   d. WebSearch → "X SRL proiecte fotovoltaice comerciale" → context
4. Adaugă în companies.json
5. node scripts/company-tools.js validate → verificare completă
6. node scripts/company-tools.js stats → summary
```

## Pasul 5: Validare
- Firma trebuie să aibă minim 2-3 ani activitate
- Preferabil cu autorizare ANRE C2A
- Date financiare verificabile (nu self-reported)
- Focus pe comercial/industrial (nu doar rezidențial)

## REGULA DE AUR: NU ESTIMA, NU UMFLA DATE
- **NICIODATĂ** nu inventa sau estima date (nr. proiecte, angajați, capacități, cifre financiare)
- Dacă un câmp nu e verificabil din surse publice, lasă-l gol sau pune 0
- Mai bine afișăm mai puțin decât afișăm date false
- Surse acceptate: termene.ro, risco.ro, listafirme.eu, anre.ro, site-ul oficial al firmei

## Pipeline
Firme pre-researched disponibile în `docs/company-pipeline.md`
