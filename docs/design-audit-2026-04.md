# Design Audit — instalatori-fotovoltaice.ro
**Data:** 2026-04-23
**Focus:** Mobile + pagina /publicitate (pricing clarity)

---

## TL;DR — Top 5 priorități

1. **Publicitate: buton CTA pe fiecare tier** (azi există un singur CTA jos, la 5 produse). Cea mai mare pierdere de conversie.
2. **Prețurile au nevoie de echivalent RON + TVA calculat** (nu doar „+ TVA" gri deschis). Un vizitator B2B din RO vrea „49 EUR ≈ 245 RON + TVA (291 RON/lună)".
3. **Mockup-urile din Publicitate sunt ilizibile pe mobile** (text de 7-10px). Pe desktop funcționează ca thumbnails, pe mobile ocupă tot ecranul dar rămân microscopice.
4. **Header mobile: tap target-uri sub 44px** — butonul „Listează Firma" (py-1.5, text-xs) și hamburger-ul (icon 24×24 cu p-2) nu respectă minimul Apple/Google de 44×44.
5. **Tabelul de comparație scrollează orizontal pe mobile fără indicator**. User-ii nu știu că există o coloană „Rezumat" după preț.

---

## 1. Pagina /publicitate — pricing clarity

### 1.1 Critice

| # | Problemă | Unde | Fix sugerat |
|---|----------|------|-------------|
| 🔴 | **Nici un CTA pe cardurile de preț.** Single bottom CTA mail/tel la 5 produse diferite. User-ul care decide pe Enterprise trebuie să scrolleze până jos și să scrie subject manual. | `app/publicitate/page.tsx` — fiecare `<section>` tier | Adaugă `<Button>` pe fiecare card: „Activează Premium", „Discută Enterprise", cu `mailto:...?subject=Enterprise%20-%20Firma%20Ta`. |
| 🔴 | **„+ TVA" e text-xs gray-400** — contrast 2.85:1, sub WCAG AA. Și 19% TVA la €99/lună înseamnă +€18.81/lună — informație relevantă, nu footnote. | linii 338, 366, 408, 447 | Mărește la `text-sm text-gray-600`. Sau afișează direct „49 EUR + TVA (58.31 EUR)". |
| 🔴 | **Lipsă echivalent RON.** Site-ul e 100% RO, companies in RON, facturare RON — dar prețul afișat e doar EUR. | toate cardurile | Sub preț: `<span class="text-xs text-gray-500">≈ 245 RON + TVA la curs BNR</span>`. Calculează la build-time dintr-un config sau hardcodat cu disclaimer. |

### 1.2 Moderate

| # | Problemă | Fix |
|---|----------|-----|
| 🟡 | **Mockup-urile** (`PreviewFree`, `PreviewProfilPremium`, `PreviewEnterprise`) folosesc `text-[7px]`, `text-[8px]`, `text-[9px]`. Pe desktop ok ca thumbnails, pe mobile textul e ilizibil. | Pe mobile, înlocuiește mockup-urile cu un **bullet-list „Cum arată"** + un single screenshot real al fiecărui tier (PNG). SAU ascunde-le `hidden sm:block` și arată doar o listă simplă. |
| 🟡 | **Tabelul comparativ `overflow-x-auto`** — scroll orizontal mute pe mobile, fără indicator. 4 coloane × 5 rânduri. | Pe mobile (`sm:hidden`), convertește în carduri stacked: 5 carduri, fiecare cu „Pentru cine / Preț / Rezumat" vertical. Păstrează tabelul `hidden sm:table`. |
| 🟡 | **5 produse în 3 secțiuni = overload.** Quick-links de sus ajută dar sunt inconsistente (doar Popup Partner are preț în label). | Adaugă la început un **„Tu ce ești?" segmented control** (3 pills: Instalator / Furnizor / Parteneri SaaS) care scrollează la secțiunea relevantă și ascunde restul. Alternativ: accordion. |
| 🟡 | **„Vizibil doar pe desktop"** la Popup Partner (8.99€) e o limitare majoră (50%+ trafic mobile în RO), dar apare ca al 5-lea feature în listă, parantetic („— nu deranjăm"). | Mută în secțiunea principală ca notă: „Popup-ul apare doar pe desktop — mobile-ul rămâne curat. Dacă vrei și mobile, vezi Enterprise." Cinstit + direcționează spre tier mai scump. |
| 🟡 | **Nu există preț anual** pentru Premium/Enterprise — doar Listing Sponsor menționează „290€/an = 2 luni gratis". Asymmetric. | Adaugă toggle Lunar/Anual (save 2 mo) pe toate tier-urile. Commitment anual = predictibilitate. |
| 🟡 | **Lipsă social proof.** „X firme folosesc Premium", „instalat de Y ani", testimonial. | Adaugă sub pricing: „5 firme Premium active · 2 sponsori listați · pagina vizitată de ~400 manageri/lună" (dacă ai date reale). |

### 1.3 Minore

- **Badge-ul „Cel mai popular"** cu `whitespace-nowrap absolute -top-3 left-1/2 -translate-x-1/2` — pe viewport-uri foarte înguste (<360px) ar putea depăși cardul. Testează pe iPhone SE (375px).
- **„Partenerii Noștri" cu 3 carduri dashed „Firma ta aici"** la finalul paginii arată ca placeholder gol. Risk: pare că nimeni nu folosește platforma. Ascunde-l până ai măcar 1 partener real per categorie.
- **Quick-links de sus** (`→ Pentru firme / → Pentru furnizori / → Popup Partner (8.99€)`) — pe mobile wrap-uie pe 2 rânduri cu separator `·` în mijloc, arătând ciudat. Folosește `inline-flex flex-col sm:flex-row` + `divide-y sm:divide-y-0`.

---

## 2. Mobile — probleme generale

### 2.1 Header (`components/layout/Header.tsx`)

| # | Problemă | Linie | Fix |
|---|----------|-------|-----|
| 🔴 | Buton „Listează Firma" mobile are `text-xs px-3 py-1.5` ≈ 28px înălțime. **Sub 44×44.** | L62-66 | Schimbă la `text-sm px-3 py-2.5` (~40px) sau mărește padding. |
| 🔴 | Hamburger `p-2 -mr-2` cu icon 24×24 = target ~40px. Sub minim. | L67-79 | `p-3` sau `min-w-[44px] min-h-[44px] flex items-center justify-center`. |
| 🟡 | Logo text trunchiat la „Instalatori FV" pe mobile. Pierde brand recognition. | L32-33 | Dacă bara e aglomerată, mai bine afișează doar logo-ul SVG și scoate textul pe mobile complet, decât o abreviere care arată incompletă. |
| 🟢 | Meniul mobile overlay nu are backdrop/overlay — nu se închide la tap în afara lui. | L84-103 | Adaugă un `<div class="fixed inset-0" onClick={close}>` sau gestionează cu `useEffect` pe click outside. |

### 2.2 Homepage (`app/page.tsx`)

- **Hero `py-16 sm:py-24`** — pe mobile user-ul vede doar headline + puțin din search înainte de fold. Redu la `py-10 sm:py-20` pentru a aduce SearchBar deasupra fold-ului pe iPhone.
- **SearchBar mobile**: input, două select-uri, buton — toate stacked vertical = ~240px înălțime. Ocupă mult spațiu. Consideră un design „1 input + buton" inițial, cu „Filtre avansate" expand.
- **Promo banner Premium** (L98-138) — pe mobile ascunde `De la 49 EUR/lună` (`hidden sm:flex flex-col items-end`). **Chiar prețul, care e diferențiatorul, dispare pe mobile.** Arată prețul și pe mobile, măcar în linia de footer a banner-ului.
- **Sponsor section** (L294-298) — `max-w-sm mx-auto` — card izolat în mijlocul paginii fără context. Pe mobile arată ca ad rătăcit. Alătură-l unei secțiuni cu titlu („Parteneri recomandați").

### 2.3 Footer (`components/layout/Footer.tsx`)

- OK, folosește `FooterAccordion` pe mobile. Bun.
- „Instalatori per Județ" grid `grid-cols-2 gap-x-4 gap-y-1.5` — pe mobile îngust (<360px) link-urile `{județ} ({count})` pot wrap-a urât. Testează.

### 2.4 Accesibilitate generală

| # | Problemă | Fix |
|---|----------|-----|
| 🔴 | Text sub 12px în multe locuri (mockup-uri, „+ TVA", breadcrumb-uri). WCAG recomandă min 12px, ideal 16px pentru body. | Ridică min la `text-xs` (12px). Nimic sub. |
| 🟡 | `text-gray-400` pe `bg-white` = contrast 2.85:1. **Fail WCAG AA** pentru text normal (<18px). | Pentru text informativ (disclaimers, captions), folosește `text-gray-500` (contrast ≈ 4.8:1) sau `text-gray-600` (7:1). |
| 🟢 | `*:focus-visible { outline: 2px solid var(--color-primary) }` în globals.css — excelent, ține-l. |

---

## 3. Ce funcționează bine

- Arhitectura de pricing logic-ordonată (Instalator → Furnizor → Partener complementar) — clară conceptual, doar executia mobile trebuie polișată.
- Mockup-urile din Publicitate sunt o idee f. bună ca concept (vezi exact ce primești) — doar implementarea pe mobile e problema.
- FAQ-ul accordion cu `<details>` native — accesibil, fără JS, tap target mare.
- Footer accordion pe mobile — pattern corect.
- ANRE live verification — diferențiator clar, bine expus pe home.

---

## 4. Recomandări prioritizate (ordine de implementare)

1. **CTA pe fiecare tier** din Publicitate + `mailto` pre-populat cu subject. *(15 min, impact mare)*
2. **Preț RON + TVA vizibil** pe fiecare card. *(30 min)*
3. **Tap target-uri header mobile** ≥44px. *(10 min)*
4. **Mobile mockup fallback** — `hidden sm:block` pe mockup-uri, adaugă o listă text simplă pentru <sm. *(20 min)*
5. **Tabel comparativ → carduri stacked pe mobile.** *(30 min)*
6. **Toggle Lunar/Anual** cu 2 luni gratis anual pe toate tier-urile. *(1h)*
7. **Segmented control** („Instalator / Furnizor / Partener") sus pe /publicitate, filtrează secțiunile. *(1-2h)*

---

*Audit făcut doar pe baza codului — nu am putut testa live pe device real. Recomand testare pe iPhone SE (375px) și Pixel 5 (393px) după implementare.*
