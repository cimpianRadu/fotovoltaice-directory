---
name: guide
description: Creează un ghid nou complet — research, scriere conținut, generare hero image, adăugare în guides.json. Folosește când user-ul cere un articol/ghid nou.
---

# Creare Ghid Nou

Creează un ghid complet pentru instalatori-fotovoltaice.ro. Urmează toți pașii în ordine.

## Pasul 1: Research

**WebSearch — research de fond:**
```
WebSearch → multiple căutări pe topic (date, statistici, context, comparații)
WebSearch → "subvenții panouri fotovoltaice Romania 2026 fonduri nerambursabile"
WebSearch → "legislație prosumator comercial Romania 2026 modificări"
WebSearch → "prețul mediu per kW instalat sisteme fotovoltaice comerciale Romania 2026"
```

**Firecrawl — surse oficiale:**
```
firecrawl_scrape → energie.gov.ro (extract JSON: programe active, bugete, termene)
firecrawl_scrape → anre.ro/legislatie (extract JSON: reglementări prosumator)
firecrawl_scrape → afm.ro (extract JSON: programe fotovoltaice, condiții)
firecrawl_scrape → site-distribuitor.ro/produse (extract JSON: prețuri, specificații)
firecrawl_search → "piata fotovoltaice Romania 2026" (surse: zf.ro, profit.ro)
```

**Research keywords:**
- Google Keyword Planner: volumuri de căutare România, în română
- Google Trends: trending și rising queries
- WebSearch pentru trending queries recente
- "People Also Ask" din SERP-uri
- Categorii FAQ: Costuri, Subvenții, Legislație, Tehnic, Mentenanță, Alegere instalator

## Pasul 2: Scriere conținut

### Structura ghidului (data/guides.json)
```json
{
  "slug": "url-slug",
  "publishedAt": "YYYY-MM-DD",
  "author": "Radu",
  "title": "Titlu SEO - Cu Keyword Principal 2026",
  "metaDescription": "Max 160 caractere, cu keyword",
  "heroDescription": "1-2 propoziții rezumat",
  "sections": [
    { "id": "anchor-id", "title": "H2 Titlu Secțiune", "content": "Markdown content..." }
  ],
  "faq": [
    { "question": "Întrebare keyword-rich?", "answer": "Răspuns concis..." }
  ],
  "relatedSpecializations": ["hale-industriale"]
}
```

### Reguli conținut
- Titluri conțin anul curent (2026) și keyword principal
- Conținut în format Markdown (randat cu react-markdown + remark-gfm)
- Tabele pentru comparații de prețuri/specificații
- FAQ la sfârșitul fiecărui ghid (generat și ca JSON-LD)
- Autor: "Radu, Specialist Instalatori Fotovoltaice" cu logo
- **NICIODATĂ** nu inventa sau estima date — dacă nu e verificabil, nu include

## Pasul 3: Generare Hero Image

Folosește nano-banana MCP (`mcp__nano-banana-2__generate_image`):
```
- aspectRatio: "16:9" (hero banner landscape)
- resolution: "2K"
- Prompt: fotorealistic, profesional, legat de topicul ghidului
- Exemplu: "Solar panels on industrial warehouse roof, aerial view, bright sunny day, professional commercial photography"
```

**Reguli prompt:**
- Stil fotorealistic, profesional, nu cartoon/ilustrație
- Relevant pentru topic (panouri pe hale, baterii, invertoare, etc.)
- Fără text în imagine
- Culori calde, luminoase

După generare, copiază imaginea în `public/images/guides/{slug}.png`:
```bash
cp generated_imgs/<fisier-generat>.jpg public/images/guides/{slug}.png
```

## Pasul 4: Adăugare în guides.json

1. Citește `data/guides.json`
2. Adaugă ghidul nou la sfârșitul array-ului
3. Verifică JSON valid
4. Verifică că nu există deja un ghid cu același slug

## Workflow complet
```
1. Research (WebSearch + Firecrawl) → colectare date verificate
2. Scriere conținut (sections + FAQ) cu surse verificate
3. nano-banana generate_image → hero image 16:9, 2K, fotorealistic
4. Copiere imagine în public/images/guides/{slug}.png
5. Adăugare ghid în data/guides.json
6. Prezentare rezumat user-ului
```
