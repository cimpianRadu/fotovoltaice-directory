# Digitalu.io — Audit Agent pentru Outbound Sales

**Context handoff** — 2026-04-23. Folosește acest doc ca start point pentru o conversație nouă cu Claude Code în repo-ul `digitalu.io` sau în `instalatori-fotovoltaice.ro`.

---

## 1. Cine sunt eu & ce am

- **Radu Cimpian** — solo dev, construiesc `digitalu.io` ca agenție one-man de web dev, mobile dev, marketing, SEO, social media.
- **Proof of work existent:** [instalatori-fotovoltaice.ro](https://instalatori-fotovoltaice.ro) — director de firme PV din RO, 87 firme, 15 ghiduri, Next.js 16 + Tailwind, stack modern.
- **Asset cheie:** `data/companies.json` în repo-ul `fotovoltaice-comerciale` — 87 firme cu website, telefon, email, CUI, județ, revenue. Deja filtrat prin PV content gate (deci site-urile sunt real-life, nu dead domains).

## 2. Ideea

Agent automat care rulează pe lista de site-uri PV, generează **audit PDF 1-2 pagini per firmă**, apoi eu îl trimit via email ca diagnostic gratuit cu soft CTA.

**De ce merge:**
- Multe firme PV au site-uri WordPress 2012-2015 (ex: solar-service.ro are logo literalmente din `/uploads/2012/08/`).
- Cold email standard = <1% conversion. Cold email cu audit personalizat concret = 5-15%.
- Audit-ul e **genuinely useful** — nu spam. Chiar dacă nu cumpără, le las ceva de valoare.

**Poziționarea:** "am văzut site-ul vostru din directorul meu (link), am observat X, Y, Z — aici un diagnostic scurt. Dacă vă ajută, mă bucur. Dacă vreți să discutăm, sunt aici."

## 3. Ce face agent-ul (scope)

Input: `--slug=<firma>` din `companies.json` sau listă de URL-uri.

Pipeline:
```
1. Playwright → screenshot mobile (375px) + desktop (1440px), full page scroll
2. Lighthouse CLI → scoruri Performance / SEO / Accessibility / Best Practices
3. Detect automat:
   - SSL prezent? Mixed content?
   - Viewport meta tag? Responsive?
   - Schema.org LocalBusiness/Organization?
   - OG tags + Twitter card?
   - Copyright year în footer (<2023 = red flag)
   - jQuery version (<3.0 = red flag)
   - Image sizes (>500KB unoptimized)
   - Form CTAs pe homepage?
   - Tap target size mobile
   - Core Web Vitals (LCP, CLS, FID)
4. HTML template → PDF via Chrome headless
5. Output: audits/<slug>.pdf
```

**PDF structure (1-2 pagini):**
- Hero: screenshot desktop vs. mobile side-by-side, highlight vizual pe probleme
- Tabel scoruri Lighthouse cu comparație "tu vs. competitor mediu din directorul meu"
- **3-5 quick wins concrete** cu efort (S/M/L) + impact cuantificat
  - ex: "LCP 8.2s → sub 2.5s = ~40% mai multe lead-uri mobile (date Google)"
  - ex: "Lipsă schema.org LocalBusiness → Google nu știe că ești firmă locală"
- Soft CTA footer: "Vedem împreună? — Radu, digitalu.io"

**NU generează mockup de redesign** — alea iau 2-4h manual per firmă. Agent-ul doar diagnostichează. Mockup manual doar pe top 3-5 firme care răspund.

## 4. Phase order (IMPORTANT)

1. **FAZA 0 — digitalu.io redesign** (prerequisite)
   - Site-ul meu trebuie să fie proof-of-work #1. Dacă PDF-ul linkează la un site outdated, autoritatea = 0.
   - Conținut: servicii (web dev, mobile dev, SEO, social), portofoliu (instalatori-fotovoltaice.ro ca flagship), proces, preț, contact.
   - Stack: Next.js + Tailwind. Minimal, fast, clar.

2. **FAZA 1 — Build audit agent** (după digitalu.io)
   - Script `scripts/audit-firm.js` în repo separat (digitalu/) sau ca tool în fotovoltaice repo.
   - Test pe 5 firme "obvious broken" întâi — iterez pe format după feedback intern.

3. **FAZA 2 — Selection criteria pentru target**
   - Filtru: firme PV cu score Lighthouse Performance < 50 SAU copyright < 2023 SAU fără HTTPS SAU fără mobile viewport.
   - Prioritizare: revenue > 1M RON (au buget), angajați > 5 (au scale de nevoie), nu sunt dintre cele deja ranked în Google (astea nu au nevoie).

4. **FAZA 3 — Outbound pilot (5 firme)**
   - Trimit 5 emails personalizate cu PDF-ul atașat.
   - Măsor: open rate, reply rate, meeting booked rate.
   - Dacă 1/5 răspund → viable. Scalez la 20 apoi 50.

5. **FAZA 4 — Scale**
   - Dacă pilot funcționează, construiesc un simple CRM local (JSON + dashboard) pentru tracking outreach.

## 5. Riscuri & mitigări

| Risc | Mitigare |
|------|----------|
| Directorul pare funnel pentru digitalu.io → pierde trust | Menționez web dev doar în footer ca `built by [digitalu.io]`, nu în ghiduri sau pe listinguri. PDF-ul e trimis în nume personal, nu în numele directorului. |
| Firmele se simt spam-uite | Trimit doar 5-10 pe săptămână, personalizat. Respect unsubscribe imediat. Audit-ul e valoare reală, nu pitch mascat. |
| GDPR | Emails din `companies.json` sunt publice (registru firme + website lor). Cold B2B legal în RO. Includ opt-out clar. |
| Audit-ul PDF e generic/slab | Template atent lucrat, iterez pe 5 teste interne înainte să trimit. Quality > quantity. |
| Costuri Lighthouse CI | Lighthouse e free. Playwright e free. Chrome headless e free. Zero cost de infra. |

## 6. Date pe care le am deja

Lista cu 87 firme în `data/companies.json` (format wrapped `{companies: [...]}`). Fiecare firmă:
- `contact.website` — URL-ul de auditat
- `contact.email` — destinatar outreach (verificat în registru targetare.ro)
- `contact.phone` — backup contact
- `financials.revenue2024` — filter pentru "au buget"
- `employees` — filter pentru scale
- `location.county` — regionalizare pitch

Firme țintă probabile (site-uri vechi observate în ultima sesiune):
- solar-service.ro (logo din 2012)
- Multe Bihor/Alba/Timiș — site-uri minimale, zero SEO

## 7. Ce să NU fac

- ❌ Nu trimit cu directorul ca sender. Sender = personal (Radu Cimpian, digitalu.io).
- ❌ Nu promit redesign gratuit — promit doar audit. Redesign-ul e serviciu plătit.
- ❌ Nu auto-generez mockup-uri vizuale — prea slab calitativ, sabotează credibilitatea.
- ❌ Nu trimit la > 10 firme/săptămână fără să măsor reply rate.
- ❌ Nu scriu în PDF promisiuni de "dublezi lead-urile" — doar statistici Google generice.

## 8. Next session prompt

```
Vreau să construiesc audit-agent-ul descris în docs/digitalu-audit-briefing.md.

Context:
- Am digitalu.io (web dev agency, site de redesignat)
- Am instalatori-fotovoltaice.ro/data/companies.json cu 87 firme PV
- Vreau să generez PDF audit pt 5 firme test

Azi facem:
1. [alege una]: redesign digitalu.io / build audit agent / scrie email template

Start.
```

---

_Generat cu Claude Code, 2026-04-23, ca handoff din sesiunea de adăugare firme Constanța+Timiș+Bihor._
