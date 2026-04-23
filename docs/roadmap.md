# Roadmap & Strategie — Instalatori Fotovoltaice România

> Planning, monetizare, calendar editorial. Nu e nevoie să fie în CLAUDE.md (context per conversație).

## Strategie de Monetizare

### Model: Freemium + Lead Generation
- **Listare gratuită** = profil de bază (nume, contact, județe, certificări)
- **Profil Premium** (149 EUR/lună) = badge "Partener Verificat", poziție prioritară, portofoliu extins, primește lead-uri din "Cere Ofertă", statistici profil
- **Enterprise** (299 EUR/lună) = tot din Premium + banner pe ghiduri, pagină dedicată
- **Lead-uri** = pay-per-lead (30-50 EUR/lead calificat) pentru firmele non-premium
- **Doar firmele plătesc**, vizitatorii au acces gratuit la tot

### Logica din cod
- `company.featured: true` → flag pentru firme Premium (afișate primele, badge, etc.)
- `company.verified: true` → verificare reală (ANRE, CUI, financiare)
- Formularul "Cere Ofertă" → lead-urile se trimit firmelor Premium din zona clientului

## SEO Checklist
- [x] Metadata per pagină (title, description, openGraph)
- [x] JSON-LD structured data (Organization, LocalBusiness, FAQPage, BreadcrumbList)
- [x] Sitemap.xml dinamic
- [x] Robots.txt
- [x] OG Image configurat
- [x] Breadcrumbs pe toate paginile
- [x] URL-uri semantice (/firme/slug, /ghid/slug)
- [x] FAQ cu schema markup
- [x] Google Search Console setup
- [x] Umami Analytics setup
- [ ] Canonical URLs (după stabilirea domeniului final)
- [ ] Performance audit (Core Web Vitals)

## Sprint 30 zile (referință istorică)

**Zi 1-2: LANSARE** — verificare date firme, deploy Vercel, GSC, Umami
**Zi 3-7: PSEO + CONȚINUT** — pagini județ (42), articol nou
**Zi 8-14: HUSTLE** — Reddit, Facebook groups, forumuri
**Zi 15-21: OUTREACH FIRME** — email către firme listate
**Zi 30: DECIZIE** — GSC impresii? Double down : pivot

## Strategie (Inspirat din John Rush, adaptat B2B nișă)

### Principii
- **Viteză > Perfecțiune** — lansează rapid, iterează live
- **30-day rule** — dacă nu ai impresii în GSC după 30 zile, pivotează
- **Claim listing > formular pasiv** — listează din surse publice, apoi contactează firmele
- **PSEO** — pagini auto-generate per județ/oraș/specializare
- **Distribuție manuală** primele 30 zile
- **Calitate > Volum** — nișa are ~50-100 firme calitative în RO

### Ce e diferit față de Rush clasic
- Noi avem nișă mică (calitate bate volumul)
- B2B — 10 vizitatori relevanți/zi pot fi suficienți
- Asset pe termen lung cu date verificate, nu disposable

### Monetizare (ordine implementare)
1. Claim listing (gratuit)
2. Sponsored/Premium listings (149 EUR/lună)
3. Lead generation ("Cere Ofertă" valoros când avem trafic)
4. Exit opțional (director energie se vinde 15-100k EUR)

## Faze

### FAZA 0 — Launch (Feb-Mar 2026) ✅ DONE
- [x] Deploy Vercel + DNS instalatori-fotovoltaice.ro
- [x] GSC + sitemap
- [x] Umami Analytics
- [x] Pagini legale (GDPR, T&C, Cookies)
- [x] Pagină index ghiduri
- [ ] Canonical URLs
- [ ] PNG-uri pentru logo + OG

### FAZA 1 — Conținut & SEO (Mar-Mai 2026) — în progres
**Obiectiv:** 15+ ghiduri, 25+ firme, trafic organic în creștere.

Status: 14 ghiduri published (3 unpublished), 65 firme. Vezi MEMORY.md pentru lista completă.

#### Calendar editorial (referință; status live în guides.json)

Articole existente (6 inițiale):
- ✅ Hale Industriale (6 Jan)
- ✅ Cât Costă Sistem Comercial (20 Jan)
- ✅ Cum Alegi Instalatorul (3 Feb)
- ✅ Legislație Prosumator (17 Feb)
- ✅ Subvenții 2026 (26 Feb)
- ✅ Electric UP 2026 (26 Feb)

Articole noi planificate (dacă calendarul se reia):
| Săpt. | Titlu | Keyword |
|-------|-------|---------|
| 7 | Stocare Energie cu Baterii pentru Firme | baterii stocare energie |
| 8 | Tipuri Panouri 2026 - Mono vs TOPCon vs HJT | tipuri panouri |
| 9 | Invertoare Comerciale - Huawei vs Fronius vs SMA | invertoare fotovoltaice |
| 10 | Panouri pentru Birouri | panouri fotovoltaice birouri |
| 11 | Agrovoltaic 2026 | agrovoltaic |
| 12 | Mentenanță Sisteme | mentenanță fotovoltaice |
| 13 | Fondul de Modernizare 2026 | fondul modernizare |
| 14 | Panouri pentru Retail | panouri fotovoltaice retail |
| 15 | Monitorizare Sisteme | monitorizare fotovoltaice |
| 16 | PNRR Energie Verde 2026 | pnrr energie verde |

#### SEO tehnic
- [ ] Internal linking între ghiduri
- [ ] Schema markup Article (pe lângă FAQ)
- [x] Pagini per județ (`/firme/judet/[county]`)
- [ ] Meta descriptions optimizate universal

### FAZA 2 — Credibilitate & Engagement (Jun-Aug 2026)
- [ ] Recenzii/rating firme
- [ ] Comparație firme side-by-side
- [ ] Calculator ROI interactiv
- [ ] Newsletter + email drip
- [ ] Google Maps pe pagina firmei
- [ ] Badge-uri: Partener Verificat, Top Performer
- [ ] Studii de caz cu firme reale
- [x] Pagini per oraș mare (8 orașe live)

### FAZA 3 — Monetizare (Sep-Nov 2026)
- [ ] Stripe integration — Premium/Enterprise
- [ ] Dashboard firme (profil editabil, lead-uri)
- [ ] Lead distribution (formular → firme zonă)
- [ ] Email notificări lead-uri
- [ ] Pagină pricing publică
- [ ] Outreach direct către firme listate
- [ ] Landing B2B "Listează-ți firma"
- [ ] A/B testing CTA-uri

### FAZA 4 — Scale (2027+)
- [ ] Marketplace cereri cu matching automat
- [ ] Claim business self-service
- [x] Verificare automată ANRE (live lookup)
- [ ] Verificare automată ANAF/termene
- [ ] Secțiune rezidențial (waitlist există)
- [ ] Blog feed automatizat
- [ ] App mobil
- [ ] Extindere BG/HU
