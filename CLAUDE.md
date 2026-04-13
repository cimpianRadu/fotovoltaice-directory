# Instalatori Fotovoltaice România

## Proiect
Director online de firme de instalare panouri fotovoltaice comerciale și industriale din România.
- **Domeniu:** instalatori-fotovoltaice.ro
- **Tech stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, TypeScript
- **Deployment:** TBD (pregătit pentru Vercel)

## Structura Proiectului
```
app/                    # Next.js App Router pages
  layout.tsx            # Root layout + metadata globală
  page.tsx              # Homepage
  firme/                # Director firme
    page.tsx            # Listă filtrabilă
    [slug]/page.tsx     # Detalii firmă
    CompanyListClient.tsx
  ghid/[topic]/page.tsx # Articole ghid (markdown randat cu react-markdown)
  intrebari-frecvente/  # FAQ grupat pe categorii
  cere-oferta/          # Formular lead generation
  despre/               # Pagină despre
  rezidential/          # Coming soon
  api/leads/            # API leads
  api/waitlist/         # API waitlist rezidențial

components/
  layout/Header.tsx     # Header cu logo SVG
  layout/Footer.tsx     # Footer
  ui/SearchableSelect   # Dropdown custom cu search (înlocuiește native <select>)
  ui/Select.tsx         # Wrapper peste SearchableSelect (backward-compatible)
  ui/Markdown.tsx       # Randare markdown cu react-markdown + remark-gfm
  seo/JsonLd.tsx        # Structured data (Organization, LocalBusiness, FAQ, Breadcrumbs)
  forms/SearchBar.tsx   # Bară căutare homepage
  forms/LeadForm.tsx    # Formular cerere ofertă

data/
  companies.json        # Date firme (REALE - cu CUI, financiare, contact)
  counties.json         # Lista județe România
  specializations.json  # Specializări posibile
  guides.json           # Conținut ghiduri (markdown)

public/
  logo.svg              # Logo: soare (amber) + fulger + panou solar (navy)
  og-image.svg          # Open Graph image pentru social sharing
```

## Brandingul
- **Culori:** Amber #f59e0b (primary/soare), Navy #1e3a5f (secondary/panou)
- **Font:** Geist (Google Fonts)
- **Logo:** SVG cu soare (amber) + fulger de energie + panou solar (navy), transparent bg
- **OG Image:** Banner navy cu logo + text "Instalatori Fotovoltaice" + "Director Firme Panouri Solare"

## Conținut & Firme — Skills disponibile
- `/guide` — creare ghid nou complet (research + scriere + hero image + adăugare în guides.json)
- `/guide-image` — generare/regenerare hero image pentru un ghid (nano-banana MCP)
- `/guide-update` — actualizare date/flag-uri pe ghiduri existente
- `/add-companies` — research și adăugare firme noi în director

## SEO Checklist
- [x] Metadata per pagină (title, description, openGraph)
- [x] JSON-LD structured data (Organization, LocalBusiness, FAQPage, BreadcrumbList)
- [x] Sitemap.xml dinamic
- [x] Robots.txt
- [x] OG Image configurat
- [x] Breadcrumbs pe toate paginile
- [x] URL-uri semantice (/firme/slug, /ghid/slug)
- [x] FAQ cu schema markup
- [ ] Canonical URLs (după stabilirea domeniului final)
- [ ] Google Search Console setup
- [ ] Google Analytics / Plausible setup
- [ ] Performance audit (Core Web Vitals)

## Strategie de Monetizare

### Model: Freemium + Lead Generation
- **Listare gratuită** = profil de bază (nume, contact, județe, certificări)
- **Profil Premium** (149 EUR/lună) = badge "Partener Verificat", poziție prioritară, portofoliu extins, primește lead-uri din "Cere Ofertă", statistici profil
- **Enterprise** (299 EUR/lună) = tot din Premium + banner pe ghiduri, pagină dedicată
- **Lead-uri** = pay-per-lead (30-50 EUR/lead calificat) pentru firmele non-premium
- **Doar firmele plătesc**, vizitatorii au acces gratuit la tot

### Logica din cod
- `company.featured: true` → va deveni flag pentru firme Premium (afișate primele, badge, etc.)
- `company.verified: true` → verificare reală (ANRE, CUI, financiare)
- Formularul "Cere Ofertă" → lead-urile se trimit firmelor Premium din zona clientului

## Roadmap

### PRIORITATE SESIUNEA URMĂTOARE (Sprint 30 zile)

**Zi 1-2: LANSARE**
1. Verificare date firme din surse publice (mfinante.gov.ro, termene.ro). Fix ce e greșit, scoate ce e neverificabil.
2. Deploy pe Vercel + DNS (instalatori-fotovoltaice.ro)
3. Google Search Console + submit sitemap
4. Umami analytics setup

**Zi 3-7: PSEO + CONȚINUT**
5. Pagini programatice per județ (`/firme/judet/[county]`) — 42 pagini indexabile automat
6. Primul articol nou (Subvenții Panouri Fotovoltaice 2026)

**Zi 8-14: HUSTLE (distribuție manuală)**
7. Reddit (r/Romania, forumuri energie), Facebook groups (fotovoltaice, IMM-uri, antreprenori)
8. Răspunde pe forumuri la întrebări despre instalatori/fotovoltaice cu link către director

**Zi 15-21: OUTREACH FIRME**
9. Email către cele 10 firme listate: "Profilul tău e live, vrei să-l revendici/actualizezi?"
10. Articol #2 + 5 firme noi verificate

**Zi 30: DECIZIE**
11. Check Search Console: Impresii? Trafic? → Double down. Zero? → Pivotează.

## Strategie (Inspirat din metoda John Rush, adaptat pentru nișă B2B)

### Principii
- **Viteză > Perfecțiune** — lansează rapid, iterează live, nu construi features înainte de validare
- **30-day rule** — dacă nu ai impresii în Search Console după 30 zile, pivotează
- **Claim listing > formular pasiv** — listează firmele din surse publice, apoi contactează-le să-și revendice profilul
- **PSEO (Programmatic SEO)** — pagini auto-generate per județ/oraș/specializare = zeci/sute de pagini indexabile
- **Distribuție manuală** — primele 30 zile, promovare activă pe Reddit, Facebook, forumuri
- **Calitate > Volum** — nișa are ~50-100 firme în RO, nu mii. Fiecare listare trebuie să fie corectă.

### Ce e diferit față de Rush clasic
- Rush scrape-uiește mii de listări din Google Maps → noi avem nișă mică, calitatea bate volumul
- Rush face directoare B2C cu trafic mare → noi suntem B2B, 10 vizitatori relevanți/zi pot fi suficienți
- Rush face "disposable directories" → noi construim un asset pe termen lung cu date verificate

### Monetizare (în ordinea implementării)
1. **Claim listing** (gratuit) — firmele își revendică profilul, adaugă date mai bune
2. **Sponsored/Premium listings** (149 EUR/lună) — poziție prioritară, badge Verificat
3. **Lead generation** — "Cere Ofertă" devine valoros când avem trafic
4. **Exit opțional** — director cu trafic în nișa energie se vinde cu 15-100k EUR

### FAZA 0 — Launch (Săptămâna 1-2, Feb-Mar 2026)
**Obiectiv:** Site live, indexat de Google, bază de conținut solidă.

- [ ] Deploy pe Vercel + DNS setup (instalatori-fotovoltaice.ro)
- [ ] Convertire logo.svg și og-image.svg în PNG (compatibilitate social sharing)
- [ ] Verificare OG image (Facebook Debugger + Twitter Card Validator)
- [ ] Google Search Console setup + submit sitemap.xml
- [ ] Canonical URLs pe toate paginile
- [ ] Plausible Analytics setup (GDPR-friendly, fără cookie banner)
- [ ] Testare mobile + Core Web Vitals audit
- [ ] Pagină index ghiduri (`/ghid/page.tsx` - listează toate articolele)
- [ ] Pagini legale: Politică de Confidențialitate (GDPR), Termeni și Condiții, Politică Cookies
- [ ] Banner/notificare cookies (dacă folosim analytics non-Plausible)
- [ ] Link-uri pagini legale în footer

### FAZA 1 — Conținut & SEO (Luna 1-3, Mar-Mai 2026)
**Obiectiv:** 15+ ghiduri, 25+ firme, trafic organic în creștere.

#### Calendar editorial (1 articol/săptămână)
Articolele existente (6):
- ✅ Panouri Fotovoltaice pentru Hale Industriale (6 Jan)
- ✅ Cât Costă un Sistem Fotovoltaic Comercial (20 Jan)
- ✅ Cum Alegi Instalatorul Fotovoltaic Potrivit (3 Feb)
- ✅ Legislație Prosumator Comercial 2026 (17 Feb)
- ✅ Subvenții Panouri Fotovoltaice 2026 - Ghid Fonduri Nerambursabile (26 Feb)
- ✅ Electric UP 2026 - Ghid Complet de Aplicare pentru Firme (26 Feb)

Articole noi planificate:
| Săpt. | Data publicare | Titlu (keyword principal) | Keyword target |
|-------|---------------|---------------------------|----------------|
| 7 | 17 Mar | Stocare Energie cu Baterii pentru Firme - Merită Investiția? | baterii stocare energie |
| 8 | 24 Mar | Tipuri Panouri Fotovoltaice 2026 - Monocristaline vs TOPCon vs HJT | tipuri panouri fotovoltaice |
| 9 | 31 Mar | Invertoare Fotovoltaice Comerciale - Huawei vs Fronius vs SMA | invertoare fotovoltaice |
| 10 | 7 Apr | Panouri Fotovoltaice pentru Clădiri de Birouri - Ghid 2026 | panouri fotovoltaice birouri |
| 11 | 14 Apr | Agrovoltaic 2026 - Panouri Fotovoltaice în Agricultură | agrovoltaic panouri solare |
| 12 | 21 Apr | Mentenanță Sisteme Fotovoltaice - Ce Trebuie Să Știi | mentenanță panouri fotovoltaice |
| 13 | 28 Apr | Fondul de Modernizare 2026 - Ghid Finanțare Energie Verde | fondul de modernizare 2026 |
| 14 | 5 Mai | Panouri Fotovoltaice pentru Magazine și Centre Comerciale | panouri fotovoltaice retail |
| 15 | 12 Mai | Monitorizare Sisteme Fotovoltaice - Platforme și Soluții | monitorizare fotovoltaice |
| 16 | 19 Mai | PNRR Energie Verde 2026 - Cum Accesezi Fondurile | pnrr energie verde |

#### Firme (target: 25-30)
- [ ] Research și adăugare 5 firme noi / lună
- [ ] Verificare și actualizare date firme existente trimestrial
- [ ] Focus pe acoperire geografică (toate regiunile României)

#### SEO tehnic
- [ ] Internal linking între ghiduri (articole înrudite)
- [ ] Schema markup Article pe ghiduri (în plus față de FAQ)
- [ ] Pagini per județ (`/firme/judet/[county]`) pentru SEO local
- [ ] Meta descriptions optimizate pe toate paginile

### FAZA 2 — Credibilitate & Engagement (Luna 4-6, Jun-Aug 2026)
**Obiectiv:** Autoritate în nișă, primele lead-uri, pregătire monetizare.

- [ ] Sistem de recenzii/rating pentru firme (Google-style stars)
- [ ] Pagină comparație firme (side-by-side)
- [ ] Calculator ROI interactiv (input: consum, suprafață → output: economii, amortizare)
- [ ] Newsletter signup + email drip cu ghiduri
- [ ] Integrare Google Maps pe pagina firmei
- [ ] Badge-uri vizuale: "Partener Verificat", "Top Performer", "Proiecte Mari"
- [ ] Continuare calendar editorial (1 articol/săptămână)
- [ ] Studii de caz cu firme reale (cu permisiunea lor)
- [ ] Pagini per oraș mare (București, Cluj, Timișoara, Iași, Brașov)

### FAZA 3 — Monetizare (Luna 7-9, Sep-Nov 2026)
**Obiectiv:** Primele venituri, model validat.

- [ ] Implementare planuri Premium/Enterprise (Stripe integration)
- [ ] Dashboard firme - profil editabil, statistici, lead-uri primite
- [ ] Sistem lead distribution (formularul "Cere Ofertă" → matching cu firme din zonă)
- [ ] Email notificări lead-uri pentru firme premium
- [ ] Pagină pricing publică (/pentru-firme sau /premium)
- [ ] Outreach direct către cele 25-30 firme listate (email/telefon)
- [ ] Landing page B2B: "Listează-ți firma" cu beneficii clare
- [ ] A/B testing pe CTA-uri și conversia lead-urilor

### FAZA 4 — Scale (2027+)
**Obiectiv:** Marketplace complet, venituri recurente stabile.

- [ ] Marketplace: cereri de ofertă cu matching automat (client → 3 firme)
- [ ] Claim business: firme își revendică profilul gratuit, upsell la Premium
- [ ] Verificare automată ANRE (API/scraping registru atestări)
- [ ] Verificare automată date financiare (API ANAF / termene.ro)
- [ ] Secțiune rezidențial (waitlist există, lansare separată)
- [ ] Blog cu știri din industrie (feed automatizat)
- [ ] App mobil (React Native sau PWA)
- [ ] Extindere pe alte piețe (Bulgaria, Ungaria - dacă modelul e validat)

## Convenții Cod
- Componente: PascalCase, fișiere .tsx
- Data: JSON în /data, importat static
- Valori financiare: RON (din registre oficiale românești)
- Formatare monedă: `formatCurrency()` din lib/utils.ts (Intl.NumberFormat ro-RO, RON)
- Dropdown-uri: folosesc `SearchableSelect` (custom, cu search), NU native `<select>`
- Markdown în conținut: folosește `<Markdown content={...} />` component (react-markdown + remark-gfm)
