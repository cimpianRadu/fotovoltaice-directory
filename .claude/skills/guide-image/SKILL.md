---
name: guide-image
description: Generează sau regenerează hero image pentru un ghid existent folosind nano-banana MCP. Folosește când user-ul cere o imagine nouă pentru un ghid.
---

# Generare Hero Image pentru Ghid

Generează imagini hero pentru ghidurile de pe instalatori-fotovoltaice.ro folosind nano-banana MCP.

## Workflow

1. Citește `data/guides.json` și identifică ghidul (după slug sau titlu)
2. Generează imagine cu `mcp__nano-banana-2__generate_image`:
   - **aspectRatio:** `"16:9"` (hero banner landscape)
   - **resolution:** `"2K"`
   - **Prompt:** fotorealistic, profesional, relevant pentru topicul ghidului
3. Copiază imaginea generată în `public/images/guides/{slug}.png`
4. Dacă user-ul nu e mulțumit, folosește `mcp__nano-banana-2__continue_editing` pentru ajustări

## Reguli prompt
- Stil fotorealistic, profesional — NU cartoon, NU ilustrație
- Relevant pentru topicul ghidului (panouri pe hale, baterii, invertoare, etc.)
- Fără text în imagine (textul se pune în HTML)
- Culori calde, luminoase (se potrivesc cu brandul amber #f59e0b / navy #1e3a5f)
- Prompt în engleză (Gemini funcționează mai bine)

## Exemple prompturi bune
- Hale industriale: "Solar panels on large industrial warehouse roof, aerial drone view, bright sunny day, professional commercial photography, clean modern facility"
- Baterii stocare: "Industrial battery energy storage system next to solar panels, modern warehouse setting, professional commercial photography, clean and organized"
- Invertoare: "Commercial solar inverter installation on wall, professional electrician, clean modern building, warm lighting"
- Legislație: "Romanian government building with solar panels, official modern architecture, EU flags, professional photography"
- Costuri: "Business meeting discussing solar panel investment, documents and charts on table, modern office, warm professional lighting"

## Copiere imagine
```bash
cp generated_imgs/<fisier-generat>.jpg public/images/guides/{slug}.png
```

## Bulk: generare pentru toate ghidurile fără imagine
```bash
# Listează ghidurile fără imagine
for slug in $(node -e "const g=require('./data/guides.json'); g.forEach(x=>console.log(x.slug))"); do
  [ ! -f "public/images/guides/${slug}.png" ] && echo "LIPSĂ: $slug"
done
```
