# Instalatori Fotovoltaice România

## Proiect
Director online de firme de instalare panouri fotovoltaice comerciale și industriale din România.
- **Domeniu:** instalatori-fotovoltaice.ro (live)
- **Tech stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript
- **Deployment:** Vercel

## Structura Proiectului
```
app/            # Next.js App Router — pages (firme, ghid, cere-oferta, intrebari-frecvente, publicitate, clasament, despre)
components/     # layout/, ui/ (SearchableSelect, Markdown), seo/JsonLd, forms/, sponsor/
data/           # companies.json, counties.json, specializations.json, guides.json, anre-atestate.json, anre-rejected.json
docs/           # planning, pipeline firme, long-tail keywords, roadmap.md
public/         # logo.svg, og-image.svg, logos/ (firme)
scripts/        # company-tools, anre-* pipeline, targetare-contacts
```

## Brand
- **Culori:** Amber #f59e0b (primary/soare), Navy #1e3a5f (secondary/panou)
- **Font:** Geist (Google Fonts)
- **Logo:** SVG — soare amber + fulger + panou navy, transparent bg

## Skills disponibile
- `/guide` — creare ghid nou complet (research + scriere + hero image)
- `/guide-image` — generare/regenerare hero image (nano-banana MCP)
- `/guide-update` — actualizare date/flag-uri pe ghiduri existente
- `/add-companies` — research și adăugare firme noi

## Convenții Cod
- Componente: PascalCase, fișiere .tsx
- Data: JSON static în `/data`
- Valori financiare: RON (registre românești), format cu `formatCurrency()` din `lib/utils.ts`
- Dropdown-uri: `SearchableSelect` (custom, cu search), NU native `<select>`
- Markdown: `<Markdown content={...} />` (react-markdown + remark-gfm)
- Certificări ANRE: **nu** hardcodate în `certifications[]` — live lookup via `anreMatch` din `anre-atestate.json`

## Referințe
- Roadmap, monetizare, calendar editorial, faze: [docs/roadmap.md](docs/roadmap.md)
- Pipeline firme pre-researched: [docs/company-pipeline.md](docs/company-pipeline.md)
- Long-tail keywords: [docs/long-tail-keywords.md](docs/long-tail-keywords.md)
- Pipeline articole (backate de GSC): [docs/articles-pipeline.md](docs/articles-pipeline.md)
- Status live (firme, ghiduri, analytics, sponsori): vezi `MEMORY.md`
