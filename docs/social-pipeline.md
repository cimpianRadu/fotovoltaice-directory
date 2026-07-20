# Social Media Pipeline — Facebook

> Coadă de postări pentru pagina FB „Instalatori Fotovoltaice". Workflow: skill `pil-slide-composer` (pas 0 = hook brainstorm obligatoriu, 3-5 variante, userul alege). Output: `social/<data>-<tema>/` (compose.py + slide-uri 1:1 + reel/ 9:16 + caption.txt + caption-reel.txt).
> Reguli: cifre DOAR reale (never-invent), fără hashtag-uri, fără em dashes, link în descriere + comentariu fixat. Reel-ul se postează la 1-2 zile după carousel, nu simultan.
> **Convenție foldere:** după publicare, folderul primește sufixul „ ✅" în nume (ex. `2026-07-06-cere-oferta ✅`). Dashboard de status pe site: **/admin/social** (Basic Auth via `ADMIN_PASSWORD`, ca analytics), sursă date: `data/social-schedule.json` — de actualizat la fiecare postare/programare. Adevărul despre programări: Meta Business Suite Planner.
> **De la postarea #2:** include pe 1-2 slide-uri screenshot-uri reale din site ca background cu opacity redus (feedback user 2026-07-06).

## Cadență

**Decizie 2026-07-08: doar REELS pentru o perioadă** (fără carousel foto). 1 reel/săptămână. Implicații pe producție: slide-urile se compun NATIV la 1080×1920 (nu extinse din pătrate cu make_reel.py — arată rău pe desktop), durată per slide controlată prin MP4 generat local (ffmpeg) dacă slideshow-ul FB rămâne blocat la 2s/cadru, distribuire în cele 3 grupuri mari de PV cu text per grup + comentariu cu link pe fiecare share. Motorul de teme rămâne: **fiecare ghid nou publicat → un reel derivat**; între ghiduri: tool-uri (calculator, verificare ANRE, clasament) și status-uri de program.

## Format intrare

```
### [Nr] — [Tema]
- **Status:** 💡 idee / 🟡 în lucru / ✅ postat
- **Sursa datelor:** <ghid/tool/data reală din site>
- **Unghi:** <de ce oprește scroll-ul>
- **CTA:** <pagina țintă>
```

---

## 📋 Coadă activă

> **Calendar (revizuit 2026-07-20, seara: #2 postat 16 iul, #8 postat 20 iul)** (MP4-urile generate cu `social/make_mp4.py`, `reel.mp4` în fiecare folder; durate: hook 3s / conținut 4,5s / CTA 4s): #9 AFIR → 27-28 iul, #10 producție județe → ~4 aug. Userul postează manual din folder (reel.mp4 + caption-reel.txt + comentariu-fixat.txt).

### #9 — AFIR: fereastra se închide pe 14 august
- **Status:** ✅ generat 2026-07-16, **de programat până la ~28 iul (deadline 14 aug)** — `social/2026-07-16-afir-deadline/`
- 5 slide-uri, hook „14 AUGUST" (dată fixă, nu „X zile", ca să nu depindă de ziua postării). Fapte verificate în ghidul #39: 265 mil. EUR; 145 mil. ≤1 MW (650k EUR/MW) / 120 mil. >1 MW (550k EUR/MW); autoconsum minim 70%; selecție pe punctaj. Corecție față de nota inițială: split-ul 145/120 e pe capacitate, nu pe fermă/industrie.
- **CTA:** comentariu fixat cu /ghid/fonduri-afir-panouri-fotovoltaice-ferma-industrie-alimentara-2026 + /cere-oferta. Bonus distribuție: grupuri de fermieri, nu doar cele 3 de PV.

### #10 — Cât produce 1 kWp în județul tău?
- **Status:** ✅ generat 2026-07-16, **de programat după #8 și #9 (evergreen)** — `social/2026-07-16-productie-judete/`
- 4 slide-uri, hook „DEPINDE UNDE", tabel PVGIS 7 județe (Constanța 1.380 → Brașov 1.160), calcul 5 kWp Constanța vs Brașov (>1.000 kWh/an diferență). Engagement: net-row „Județul tău? scrie-l jos" + răspundem în comentarii cu cifra din pvgis-yields.json.
- **CTA:** comentariu fixat cu /calculator-panouri-fotovoltaice + /cere-oferta

### #4 — În câți ani se amortizează panourile? (cifre pe scenarii)
- **Status:** 💡 idee
- **Sursa datelor:** ghid #37 Amortizare — tabele payback 5 kWp casă / 100 kWp firmă, cu și fără subvenție
- **Unghi:** răspunsul la întrebarea #1 a oricui se gândește la panouri; receipt-slide cu formula e formatul perfect pentru pil-slide-composer
- **CTA:** /calculator-panouri-fotovoltaice + /ghid/amortizare-panouri-fotovoltaice-2026

### #5 — 8 capcane când alegi firma pentru Casa Verde
- **Status:** 💡 idee
- **Sursa datelor:** ghid #38 — secțiunea capcane (confuzia 2024 vs 2026, ANRE retras, intermediari „prin partener" etc.)
- **Unghi:** listă de avertismente = engagement bun (oamenii taghează cunoscuți); poziționează platforma ca protector
- **CTA:** /ghid/lista-firme-autorizate-afm-casa-verde-fotovoltaice-2026

### #6 — Câte firme verificate are județul tău?
- **Status:** 💡 idee
- **Sursa datelor:** companies.json — 179 firme, 34 județe (recalculează la zi înainte de postare)
- **Unghi:** personalizare geografică, invită comentarii („București?", „Cluj?") la care răspundem cu linkul județului
- **CTA:** /firme

### #7 — Top firme după cifră de afaceri (date ANAF reale)
- **Status:** 💡 idee
- **Sursa datelor:** /clasament (sortare CA, date ANAF)
- **Unghi:** „clasamentul pe bani reali, nu pe promisiuni"; screenshot /clasament ca background
- **CTA:** /clasament

---

## 🟡 Backlog / recurente

- **Status program X s-a schimbat** (Electric Up Ciclul 3, norme ANRE prosumatori, ghid AFM baterii) — postare de news în 24-48h de la trigger, aceleași triggere ca în articles-pipeline.md (watchlist).
- **Fiecare ghid nou publicat** → carousel derivat în aceeași săptămână (regulă permanentă, nu intrare separată).
- **Testimonial / caz real** — abia după ce avem lead-uri convertite documentabile; NU inventăm.

## ✅ Postate

### #8 — Paradoxul caniculei: soare maxim, randament mai mic (postat 2026-07-20)
- Reel 25s, 6 slide-uri native 9:16, hook „-14%", `social/2026-07-16-canicula ✅/`. Fapte verificate în ghidul #40: 10-14% pierdere la 65°C, 400 Wp → 350-360 Wp, gap 12-15 cm, briza -5-8°C, autoconsum vară 70-80% vs 30-40% iarna. Postat în plin sezon de caniculă.

### #2 — Cum verifici un instalator fotovoltaic în 3 pași (postat 2026-07-16, 12:42)
- 5 slide-uri NATIVE 1080×1920 (primul reel nativ), hook B („3 PAȘI"), postat ca slideshow FB cu muzică, `social/2026-07-16-verificare-instalator ✅/`. Screenshot-uri /verificare-anre + /clasament ca background cu overlay navy ~90%. Cifra 181 verificată în /clasament live. Context: dezinformare activă „Casa Verde Baterii deschis" în piață (verificat afm.ro 16 iul: nimic publicat).

### #3 — Casa Verde 2026: panouri NU, baterii DA (reel, postat 2026-07-08)
- Reel 6 slide-uri, hook C corectat („prin Casa Verde? NU"), `social/2026-07-08-casa-verde-baterii ✅/`. Distribuit în 3 grupuri PV (~300k membri). Trigger update: ghidul AFM publicat → postare nouă. Sursa datelor verificată 8 iul (afm.ro direct: ghid 2026 nepublicat, listă instalatori doar 2024).

### #1 — Cere ofertă gratuit (carousel 2026-07-06, reel 2026-07-08)
- Carousel 6 slide-uri, hook „GRATIS" (brainstorm A+D+tail E), `social/2026-07-06-cere-oferta ✅/`. Lecții: fără „0 lei" repetat; comparațiile din contrast cards să fie paralele; pe viitor screenshot-uri cu opacity ca background.
