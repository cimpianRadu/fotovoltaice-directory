# Strategie Lansare & Creștere — Instalatori Fotovoltaice România
> Inspirat din metoda John Rush, adaptat pentru nișă B2B

---

## Principii Fundamentale

- **Viteză > Perfecțiune** — lansează rapid, iterează live, nu construi features înainte de validare
- **30-day rule** — dacă nu ai impresii în Search Console după 30 zile, pivotează
- **Claim listing > formular pasiv** — listează firmele din surse publice, apoi contactează-le să-și revendice profilul
- **PSEO (Programmatic SEO)** — pagini auto-generate per județ/oraș/specializare = zeci/sute de pagini indexabile
- **Distribuție manuală** — primele 30 zile, promovare activă pe Reddit, Facebook, forumuri
- **Calitate > Volum** — nișa are ~50-100 firme în RO, nu mii. Fiecare listare trebuie să fie corectă.

---

## Ce e diferit față de Rush clasic

| John Rush (clasic) | Noi (adaptat B2B) |
|---|---|
| Scrape-uiește mii de listări din Google Maps | Nișă mică, calitatea bate volumul |
| Directoare B2C cu trafic mare | B2B — 10 vizitatori relevanți/zi pot fi suficienți |
| "Disposable directories" | Asset pe termen lung cu date verificate |

---

## Monetizare (în ordinea implementării)

1. **Claim listing** (gratuit) — firmele își revendică profilul, adaugă date mai bune
2. **Sponsored/Premium listings** (149 EUR/lună) — poziție prioritară, badge Verificat
3. **Lead generation** — "Cere Ofertă" devine valoros când avem trafic
4. **Exit opțional** — director cu trafic în nișa energie se vinde cu 15-100k EUR

### Detalii planuri

| Plan | Preț | Include |
|---|---|---|
| **Gratuit** | 0 | Profil de bază (nume, contact, județe, certificări) |
| **Premium** | 149 EUR/lună | Badge "Partener Verificat", poziție prioritară, portofoliu extins, primește lead-uri, statistici profil |
| **Enterprise** | 299 EUR/lună | Tot din Premium + banner pe ghiduri, pagină dedicată |
| **Pay-per-lead** | 30-50 EUR/lead | Pentru firmele non-premium |

> **Doar firmele plătesc**, vizitatorii au acces gratuit la tot.

---

## Sprint 30 Zile (PRIORITATE MAXIMĂ)

### Zi 1-2: LANSARE
1. Verificare date firme din surse publice (mfinante.gov.ro, termene.ro). Fix ce e greșit, scoate ce e neverificabil.
2. Deploy pe Vercel + DNS (instalatori-fotovoltaice.ro)
3. Google Search Console + submit sitemap
4. Umami analytics setup

### Zi 3-7: PSEO + CONȚINUT
5. Pagini programatice per județ (`/firme/judet/[county]`) — 42 pagini indexabile automat
6. Primul articol nou (Subvenții Panouri Fotovoltaice 2026)

### Zi 8-14: HUSTLE (distribuție manuală)
7. Reddit (r/Romania, forumuri energie), Facebook groups (fotovoltaice, IMM-uri, antreprenori)
8. Răspunde pe forumuri la întrebări despre instalatori/fotovoltaice cu link către director

### Zi 15-21: OUTREACH FIRME
9. Email către cele 10 firme listate: "Profilul tău e live, vrei să-l revendici/actualizezi?"
10. Articol #2 + 5 firme noi verificate

### Zi 30: DECIZIE
11. Check Search Console: Impresii? Trafic? → **Double down.** Zero? → **Pivotează.**

---

## Roadmap pe Faze

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

Articolele existente (4):
- ✅ Panouri Fotovoltaice pentru Hale Industriale (6 Jan)
- ✅ Cât Costă un Sistem Fotovoltaic Comercial (20 Jan)
- ✅ Cum Alegi Instalatorul Fotovoltaic Potrivit (3 Feb)
- ✅ Legislație Prosumator Comercial 2026 (17 Feb)

Articole noi planificate:

| Săpt. | Data | Titlu | Keyword target |
|-------|------|-------|----------------|
| 5 | 3 Mar | Subvenții Panouri Fotovoltaice 2026 - Ghid Fonduri Nerambursabile | subvenții panouri fotovoltaice |
| 6 | 10 Mar | Electric UP 2026 - Ghid Complet de Aplicare pentru Firme | electric up 2026 |
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

---

## Metrici de Succes

| Fază | Metrica cheie | Target |
|---|---|---|
| Faza 0 | Site live + indexat | Sitemap submis, primele pagini indexate |
| Faza 1 | Impresii Search Console | 1000+ impresii/lună |
| Faza 2 | Trafic organic | 500+ vizitatori/lună |
| Faza 3 | Venituri | Primul client plătitor |
| Faza 4 | MRR | 1000+ EUR/lună |

---

*Strategie creată pe baza metodei John Rush, adaptată pentru directorul B2B de instalatori fotovoltaici din România.*
