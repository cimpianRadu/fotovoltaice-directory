# Pipeline Articole — Instalatori Fotovoltaice

> Tracking pentru articolele viitoare. Fiecare intrare e backată de date GSC (queries + impresii) nu intuiție. Ordonat după ROI estimat (impact / efort).
>
> Când publici un articol, mută-l în secțiunea **Publicat** cu link + data + next-step (GSC Request Indexing, distribuție).

Ultima actualizare: 2026-05-27 (**pivot strategic backat de GSC 3 luni: 538 clicks / 29.6K impresii / poz medie 13**). Analiza arată că ROI-ul nu mai e în articole noi, ci în (a) extinderea ghidurilor "striking distance" (poz 8-20 cu impresii mari) și (b) fix-uri pe paginile de director. Rutina e acum și **expand-aware** (PASUL 0.5): extinde ghiduri existente ÎNAINTE de a scrie articole noi. Vezi secțiunea nouă „🔧 De extins (ghiduri existente)". Template-ul geo (orașe) e PARCAT — Cluj (poz 43, 1 click) și Timișoara (poz 17, 0 click) nu rankează după ~9 zile, deci nu replicăm pe alte orașe încă. Fix `/firme` (lista era client-only → HTML gol) shipped separat în cod. **Toate cele 3 extinderi striking-distance (Casa Verde, Subvenții, Instalatori ANRE) au fost făcute manual pe 2026-05-27** — vezi „✅ Extinse recent". Faptele de program verificate sunt în memory (`reference_ro_pv_financing_programs.md`).

> Ordinea rutinei (luni + joi): PASUL 0 publică draft programat → PASUL 0.5 extinde un ghid din „🔧 De extins" → PASUL 1 scrie articol nou din „🎯 Propuneri active". Fiecare pas ocupă slotul zilei (fără stacking).

## Format intrare

```
### [Nr] — [Titlu propus]
- **Status:** 💡 idee / 🟡 în lucru / ✅ publicat
- **Cluster GSC:** <queries relevante> (impresii totale/lună)
- **Pagină existentă relevantă:** <url curent>
- **De ce:** <reason în 1-2 fraze>
- **Linkuri interne:** <ce pagini ajută să urce>
- **Next step dacă publicat:** <GSC indexing, outreach, etc.>
```

---

## 📤 De publicat (programate)

> Articole **deja scrise** (`published: false` în guides.json), programate pentru o dată. Rutina (PASUL 0, luni + joi) le publică automat când **data țintă <= azi** — flip `published: true`, fără a rescrie. Au prioritate peste scrierea unui articol nou (ocupă slotul zilei, fără stacking). După publicare se mută la "✅ Publicate recent".

### Panouri Fotovoltaice pentru Casă vs Firmă — Diferențe și Costuri 2026
- **Slug:** `panouri-fotovoltaice-casa-vs-firma` (8 secțiuni + 5 FAQ, deja scris)
- **Data țintă:** 2026-05-28 (rularea de joi `thursday-seo-articol`)
- **Acțiune rutină:** flip `published: true`. **NU rescrie, NU invoca /guide** — conținutul există.
- **De ce:** anunțul de lansare a secțiunii rezidențiale (Casă vs Firmă). Ținut dark până rezidențialul e live în producție.
- **Linkuri interne deja inserate:** /ghid/casa-verde-fotovoltaice-2026 · /calculator-panouri-fotovoltaice?segment=rezidential · /firme?segment=rezidential · /firme?segment=comercial · /verificare-anre · /cere-oferta · /ghid/legislatie-prosumator-comercial · /ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre
- **Cluster GSC țintă:** "panouri fotovoltaice casa vs firma", "diferenta panouri rezidential comercial", "cat costa panouri fotovoltaice casa", "subventie casa verde vs electric up", "amortizare panouri fotovoltaice casa".
- **Next step după publicare:** GSC Request Indexing pentru /ghid/panouri-fotovoltaice-casa-vs-firma. Monitorizare 14/30 zile — e prima piesă de conținut rezidențial, urmărește dacă clusterul rezidențial prinde.

---

## 🔧 De extins (ghiduri existente)

> Ghiduri care stau pe poz 8-20 cu impresii mari ("striking distance") — extinderea lor (research + secțiuni noi, FĂRĂ rescriere de la zero) aduce mai multe click-uri decât un articol nou. Rutina (PASUL 0.5) ia PRIMA intrare cu status „💡 de extins", prioritate peste scrierea unui articol nou. Ordonat după impresii × intent. **Regula never-invent e strictă**: datele de program (sume, date, condiții) doar din surse oficiale (AFM/ANRE/MO).

_(coadă goală — toate cele 3 ținte striking-distance au fost extinse pe 2026-05-27, vezi mai jos. Adaugă intrări noi `💡 de extins` când apar pagini noi pe poz 8-20 cu impresii mari.)_

## ✅ Extinse recent

> Recheck poziția în GSC peste 14/30 zile pentru fiecare. Fă Request Indexing manual după push.

### Casa Verde Fotovoltaice 2026 — corectat + extins 2026-05-27
- **Slug:** `casa-verde-fotovoltaice-2026` — 9 → **12 secțiuni, 1.383 → 2.014 cuvinte, 6 → 8 FAQ**.
- **Research (firecrawl pe afm.ro + presă):** ghidul prezenta cifrele din 2024 ca fiind 2026. CORECTAT: **30.000 lei = sesiunea 2024** (panouri + baterie obligatorie), nu 2026; 2025 = suspendat; **2026 = doar baterii (~400 mil. lei)** pentru prosumatori existenți, **ghid NEPUBLICAT**, sesiune nedeschisă, sumă neconfirmată oficial. Eliminat „buget 1,5 mld" (nesusținut). Faptele salvate în memory: [reference_ro_pv_financing_programs.md].
- **Ce s-a adăugat:** tabel evoluție program 2019→2026; secțiunile „Casa Verde 2026: de la panouri la baterii", „Casa Verde vs Electric Up", „Cum alegi un instalator validat AFM" (+ link /firme?segment=rezidential, /verificare-anre); 2 FAQ.
- **GSC baseline:** 3.841 imp, poz 11.0, CTR 0.65% — **cel mai mare bazin de impresii din site**. Țintă: poz 11 → 5-7. **De urmărit special** (recheck 14/30 zile).
- **Update viitor obligatoriu:** când AFM publică ghidul „Casa Verde Baterii" 2026 (suma exactă, condiții, dată start) → actualizează secțiunea 2026 + FAQ. Sursă: afm.ro.

### Subvenții Panouri Fotovoltaice 2026 — extins 2026-05-27
- **Slug:** `subventii-panouri-fotovoltaice` — 7 → **8 secțiuni, 1.824 → 2.065 cuvinte, 4 → 7 FAQ**.
- **Ce s-a adăugat:** secțiune router „Ce subvenție e pentru tine — persoană fizică sau firmă?" (tabel PF vs IMM vs firmă autoconsum vs facilități fiscale) ca să capteze query-urile generice/rezidențiale; 3 FAQ („subvenții la casă", „mai sunt fonduri 2026", „când se primesc banii"); meta rescris pentru PF + firme (161 car). Fapte verificate: Electric UP 150.000 EUR (confirmat StartupCafe/Min. Energiei mai 2026), voucher REPowerEU 25.000 RON. Casa Verde menționat fără cifra disputată (link la afm.ro + ghidul dedicat).
- **GSC baseline:** 2.991 imp, poz 11.2, CTR 1.3%. Țintă: poz 11 → 5-7.

### Instalatori Autorizați ANRE 2026 — extins 2026-05-27
- **Slug:** `instalatori-autorizati-anre-panouri-fotovoltaice-2026` — 7 → **8 secțiuni, 2.536 → 2.852 cuvinte, 7 → 9 FAQ**.
- **Ce s-a adăugat:** secțiune „Instalatori autorizați ANRE pe județe" cu tabel pe 34 de județe (177 firme), fiecare linkat la /firme/judet/*; 2 FAQ („există listă oficială ANRE", „cum găsesc instalatori în județul meu"). Coordonat cu /firme (fix SSR shipped același timp): ghidul = editorial, /firme = directorul. Date 100% interne (companies.json), zero risc never-invent.
- **GSC baseline:** 1.085 imp, poz 17.4. Țintă: împreună cu fix-ul /firme, captează clusterul „instalatori/firme autorizate" (poz 26-55, 0 click).

---

## 🎯 Propuneri active

### 2 — Quick win: update title pe /clasament
- **Status:** ✅ done — title + meta actualizate pentru a capta "top firme panouri fotovoltaice" + sortare/atestate ANRE. Recheck GSC după 14 zile.

### 3 — Quick win: meta /casa-verde
- **Status:** ✅ done (commit 3cfc347, 2026-04-29) — title + meta rescrise pentru queries înscrieri/finanțare. Recheck CTR în GSC după 14 zile.

### 7 — Dimensionare sistem fotovoltaic comercial
- **Status:** 🟡 absorbit parțial în #4 (calculator) — keyword-urile "dimensionare", "câți kw", "kwh vs kwp" sunt acoperite în #4. Rămâne ca propunere separată DOAR dacă după #4 vedem că query-urile de dimensionare pură au volum suficient să justifice un al doilea articol non-calculator-centric. Re-evaluare după 30 zile de la publicarea #4.

### Pipeline gol de propuneri „idee"
- **Status:** ⚠️ niciun articol cu status `💡 idee` rămas. Intrările #2 și #3 sunt quick-win-uri done, #7 e absorbit parțial în #4. **Asta e intenționat** — slotul rutinei merge acum pe „🔧 De extins" (ROI mai mare), nu pe articole noi.
- **Template geo (orașe) — PARCAT (2026-05-27):** Cluj (publicat 18 mai) = **poz 42.9, 1 click, 111 imp** după ~9 zile; Timișoara (publicat 21 mai) = **poz 17.2, 0 click, 45 imp**. Niciuna nu rankează → NU replicăm pe Iași/Brașov/Constanța/Oradea/Sibiu. Re-evaluare după ce trec 30 zile de la publicare (≈18 iunie): dacă tot nu urcă, problema e template-ul (probabil paginile /firme/judet care abia acum au conținut SSR decent — vezi fix /firme), nu lipsa de orașe. **Nu mai scrie un articol-oraș până nu rankează măcar unul.**
- **Cluster geo cu cerere reală (de monitorizat, NU articol nou încă):** Alba („montaj panouri fotovoltaice alba" 81 imp poz 18.7, „panouri fotovoltaice alba" 67 imp, „montaj panouri solare alba" 73 imp poz 20.4) și Arad („panouri fotovoltaice arad" 56 imp, „sisteme fotovoltaice arad" 25 imp, „firme panouri fotovoltaice arad" 19 imp). Paginile /firme/judet/alba (poz 27) și /firme/judet/arad (poz 14.5) există deja. Întâi vezi dacă urcă după fix-ul /firme; abia apoi decide dacă merită ghid dedicat.

---

## ✅ Publicate recent (pentru referință CTR)

### Top Firme Panouri Fotovoltaice Timișoara 2026 — Instalatori Autorizați ANRE
- **Publicat:** 2026-05-21 → [/ghid/top-firme-panouri-fotovoltaice-timisoara-2026](/ghid/top-firme-panouri-fotovoltaice-timisoara-2026)
- **Cluster GSC țintă:** "firme montaj panouri fotovoltaice timisoara", "firme montaj panouri solare timisoara", "instalare panouri fotovoltaice timisoara", "montaj panouri fotovoltaice timisoara", "panouri fotovoltaice timisoara", "firme panouri fotovoltaice timis", "instalatori autorizati ANRE timisoara", "instalator panouri fotovoltaice timisoara", "panouri solare timisoara firma", "firme acreditate fotovoltaice timis" — cluster geo capital regional V, intent B2B industrial puternic (Banat = hub manufacturing). Baseline GSC de re-verificat după publicare.
- **Strategie:** replică template București/Cluj la nivel regional V. Diferențiator local: angle B2B industrial (Continental, Dräxlmaier, Hella, CTPark Ghiroda, VGP — a doua piață industrială/logistică după București). 8 secțiuni: de ce Timișoara, criterii selecție, top 6 firme cu sediu Timiș (Flexik Automation 186M, Restart Energy One 92.7M cu notă transparență C1A/C2A retras + pierdere 2024, Eltal Group 14.2M marjă 36.6%, Melbo Instal 9M portofoliu IKEA/Coca-Cola/Leroy Merlin, CBM Elpro Instal cu A3 + referințe Aquatim 1MWp, Solar - Service specialist PV multi-județ), prețuri+producție Timișoara cu yield PVGIS 1.260 kWh/kWp/an (din `data/pvgis-yields.json`, single source of truth) + praguri 4500/3800/3500 RON/kWp, verificare ANRE, finanțare (Electric Up + fonduri IMM, **fără** beneficiu local — Timișoara n-a votat reducere impozit PV specifică, notat onest vs Cluj 50%), greșeli comune, pas următor. 10 FAQ schema FAQPage. ~3.900 cuvinte. Leagă /firme/judet/timis + /firme/oras/timisoara + /verificare-anre + /clasament + /calculator + 5 ghiduri existente (50/100/250 kW, hale industriale, ROI, Electric Up, fonduri IMM, lege prosumator 2026).
- **Next step:** GSC Request Indexing manual, monitorizare 14/30 zile. KPI: clicks pe queries geo head ("panouri fotovoltaice timisoara", "instalatori timisoara", "firme montaj panouri fotovoltaice timisoara"), impresii rank pe /firme/judet/timis. Dacă atât Cluj cât și Timișoara ranchează → pattern geo validat pe capitale regionale = continuă cu Iași, Brașov, Constanța, Oradea, Sibiu. Dacă niciuna nu ranchează în 30 zile, regândește template-ul geo.

### Top Firme Panouri Fotovoltaice Cluj-Napoca 2026 — Instalatori Autorizați ANRE
- **Publicat:** 2026-05-18 → [/ghid/top-firme-panouri-fotovoltaice-cluj-napoca-2026](/ghid/top-firme-panouri-fotovoltaice-cluj-napoca-2026)
- **Cluster GSC țintă:** "firme montaj panouri fotovoltaice cluj", "firme montaj panouri solare cluj", "instalare panouri fotovoltaice cluj-napoca", "montaj panouri fotovoltaice cluj", "panouri fotovoltaice cluj", "firme panouri fotovoltaice cluj-napoca", "instalatori autorizati ANRE cluj", "firme acreditate panouri fotovoltaice cluj", "instalator panouri fotovoltaice cluj-napoca", "panouri solare cluj firma" — cluster geo regional N-V, intent comercial puternic. Baseline GSC de re-verificat după publicare (~190 impresii/lună estimat după modelul București).
- **Strategie:** replică template București (publicat 23 Apr 2026) la nivel regional N-V. H1 keyword-rich, 8 secțiuni (de ce Cluj, criterii selecție, top 10 firme cu profil scurt, prețuri+producție Cluj cu yield PVGIS 1.180 kWh/kWp/an, verificare ANRE, finanțare cu beneficiu local Cluj-Napoca 50% impozit clădiri, greșeli comune, pas următor). 10 FAQ cu schema FAQPage. Diferențiator: live ANRE lookup ([/verificare-anre](/verificare-anre)) + clasament sortable filtrabil pe județ ([/clasament](/clasament)) + 13 firme top din [/firme/judet/cluj](/firme/judet/cluj) cu cifră de afaceri verificată ANAF. ~3.900 cuvinte. Leagă /firme/judet/cluj + /firme/oras/cluj-napoca + /verificare-anre + /clasament + /calculator + 5 ghiduri existente (50/100/250 kW, ROI, Electric Up, fonduri IMM, lege prosumator 2026).
- **Next step:** GSC Request Indexing manual, monitorizare 14/30 zile. KPI: clicks pe queries geo head ("panouri fotovoltaice cluj", "instalatori cluj", "firme montaj panouri fotovoltaice cluj"), impresii rank pe /firme/judet/cluj. Dacă ranchează în 2-4 săpt → declanșează automat #9 Timișoara (template validat pentru capitale regionale). Dacă nu ranchează, parchează #9 și înțelege întâi de ce template-ul nu scalează.

### Noua Lege a Prosumatorilor 2026 pentru Firmă — Plata Lunară, Compensare Multi-Locație, Client Activ și Dezechilibre
- **Publicat:** 2026-05-14 → [/ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre](/ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre)
- **Cluster GSC țintă:** "legea prosumatorilor 2026", "noua lege prosumator", "lege prosumator firma", "modificari lege prosumator 2026", "prosumator plata lunara energie livrata", "compensare prosumator multiple locuri consum", "compensare cantitativa vs financiara prosumator", "dezechilibre prosumator firma", "client activ prosumator", "vanzare energie invertor prosumator 400 kw", "energy sharing prosumator romania", "lege prosumator 200 kw 400 kw" — cluster head + commercial intent maxim, declanșat de CCR rejected 29 apr 2026 + promulgare mai 2026.
- **Strategie:** ghid de actualitate pe legea promulgată în mai 2026, complementar ghidului Feb 17 (legislație generală, acum baseline) și ghidului May 4 (preț achiziție surplus). Acoperă cele 8 modificări concrete: plata lunară, compensare multi-locație (același furnizor + OD), praguri 200/400 kWp, vânzare directă invertor, client activ + dezechilibre (~1.000-7.500 RON/an pe taglă), energy sharing, exclusio compensare gaz pentru firme. Plan operațional 90 zile pentru decident firmă. ~4.500 cuvinte, 10 FAQ schema FAQPage. Leagă /ghid/legislatie-prosumator-comercial + /ghid/vanzare-surplus + /ghid/stocare-energie-baterii-firme + /ghid/calculator + /clasament + /verificare-anre + /firme.
- **Next step:** GSC Request Indexing manual, monitorizare 14/30 zile. KPI: clicks pe queries head ("legea prosumatorilor 2026", "noua lege prosumator", "compensare prosumator multiple locuri consum"), impresii rank pe queries tehnice ("client activ prosumator", "dezechilibre prosumator firma"). Long-tail bonus: "compensare cantitativa vs financiara 200 kw" sau "vanzare energie invertor parc industrial" — dacă apar e dovada că ghidul ranchează granular. **Update obligatoriu** când ANRE publică normele tehnice (60 zile de la intrarea în vigoare a legii) — adaugă procedura concretă pe compensare multi-locație + cost real dezechilibre + procedura vânzare directă.

### Sistem Fotovoltaic 50, 100 și 250 kW pentru Firmă 2026 — Preț, Suprafață Acoperiș, Producție Anuală
- **Publicat:** 2026-05-11 → [/ghid/sistem-fotovoltaic-50-100-250-kw-firma-pret-suprafata-productie](/ghid/sistem-fotovoltaic-50-100-250-kw-firma-pret-suprafata-productie)
- **Cluster GSC țintă:** "preț sistem fotovoltaic 50 kw firmă", "preț sistem fotovoltaic 100 kw industrial", "cât costă 250 kw fotovoltaic", "sistem fotovoltaic 50 kw preț", "sistem fotovoltaic 100 kwp preț", "panouri fotovoltaice 100 kw cost", "fotovoltaic 250 kw producție anuală", "câți metri pătrați pentru 100 kw fotovoltaic", "suprafață acoperiș 50 kw panouri" — queries cu intent comercial maxim, neacoperite în piață.
- **Strategie:** un singur ghid cu 3 secțiuni paralele (50/100/250 kWp) + breakdown comparativ pe un singur tabel. Preț în RON cu medianele validate în calculator (4.500/3.800/3.500 RON/kWp), suprafață m²/kWp pe înclinat vs terasă, producție anuală pe 3 zone PVGIS (București/Cluj/Constanța), amortizare estimată. 10 FAQ cu schema FAQPage. Leagă /calculator + /clasament + /verificare-anre + ghidul costuri + ghidul ROI + ghidul hale + ghid surplus prosumator + ghid stocare baterii.
- **Next step:** GSC Request Indexing manual, monitorizare 14/30 zile. KPI: clicks pe queries head ("preț sistem fotovoltaic 100 kw industrial", "cât costă 250 kw fotovoltaic"), impresii rank pe queries dimensionare ("câți metri pătrați pentru 100 kw fotovoltaic"). Long-tail bonus: combinări "50 kw + acoperiș" sau "250 kw + amortizare" — dacă apar în GSC e dovada că ghidul ranchează granular.

### Calculator Panouri Fotovoltaice Firmă 2026 — Estimează Cost, Producție și ROI Gratuit Online
- **Publicat:** 2026-05-07 → [/ghid/calculator-panouri-fotovoltaice-firma-2026-cost-roi](/ghid/calculator-panouri-fotovoltaice-firma-2026-cost-roi)
- **Cluster GSC țintă:** "calculator panouri fotovoltaice" (head), "calculator panouri fotovoltaice firmă/firma", "calculator fotovoltaic online gratuit", "calculator ROI panouri fotovoltaice", "calculator dimensionare sistem fotovoltaic", "câți kw fotovoltaic pentru firmă", "cât economisesc cu panouri fotovoltaice firmă 2026", "calcul rentabilitate panouri fotovoltaice", "calculator amortizare sistem fotovoltaic", "simulator sistem fotovoltaic comercial".
- **Strategie:** announcement-but-keyword-rich pentru lansarea /calculator-panouri-fotovoltaice (commit f440367, 2026-05-03). Diferențiator vs Brig/Enera/Greenlead/BilanțVerde: independent, fără lead capture, transparență totală pe formulă (yield PVGIS per județ, factori montaj, praguri preț 4500/3800/3500 RON/kWp, degradare 0.5%/an). 3 scenarii walk-through cu cifre exacte din formulă (București mic, Cluj mediu, Constanța mare). 8 FAQ cu schema FAQPage. ~3.500 cuvinte.
- **Next step:** GSC Request Indexing manual, monitorizare 14/30 zile. KPI: clicks pe head ("calculator panouri fotovoltaice firmă"), impresii rank pe queries dimensionare ("calculator dimensionare sistem fotovoltaic", "câți kw pentru firmă"). Dacă ranchează, absorbi #7 (dimensionare) definitiv. Verifică și sesiunile de pe /calculator-panouri-fotovoltaice — dacă cresc semnificativ post-publicare, e dovadă că ghidul drives traffic la tool.

### Vânzare Surplus Energie Fotovoltaică Prosumator Firmă 2026 — Preț, Mecanism, Furnizori
- **Publicat:** 2026-05-04 → [/ghid/vanzare-surplus-energie-fotovoltaica-prosumator-firma-2026](/ghid/vanzare-surplus-energie-fotovoltaica-prosumator-firma-2026)
- **Cluster GSC țintă:** "vânzare surplus energie fotovoltaică preț", "preț achiziție surplus prosumator", "OUG surplus fotovoltaice 2026", "compensare cantitativă vs regularizare financiară", "tarif surplus prosumator 2026". În creștere odată cu Legea 169/2025 (regim prosumator post 1 iulie 2025).
- **Strategie:** complementar pillar-ului prosumator (legislație) — acolo cadrul juridic, aici răspunsul tactic la "cât plătește furnizorul kWh injectat". Comparație concretă PPC / E.ON / ENGIE / Hidroelectrica / Electrica + scenarii ROI pe sisteme 100/250/350 kWp + breakdown praguri 200kW vs 200-400kW vs 400+kW.
- **Next step:** GSC Request Indexing manual, monitorizare 14/30 zile. KPI: clicks pe queries head (vânzare surplus, preț achiziție surplus), impresii rank pe "regularizare financiară". Long-tail bonus: "spread furnizori prosumator" (formulare unică, dacă apare în GSC e dovada că ghidul ranchează pe interogări specifice).

### Asigurare Panouri Fotovoltaice Firmă 2026 — Ghid Complet pentru Sisteme Comerciale
- **Publicat:** 2026-04-30 → [/ghid/asigurare-panouri-fotovoltaice-comerciale](/ghid/asigurare-panouri-fotovoltaice-comerciale)
- **Cluster GSC țintă:** "asigurare panouri fotovoltaice comerciale" + variații (firmă/SRL/hală) — bottom-of-funnel, zero competiție serioasă în RO.
- **Strategie:** singurul ghid din director pe nișa de operare/protecție post-instalare. Audiență pre-calificată (au făcut deja investiția). Acoperă: all-risks vs name-perils, riscuri acoperite, excluderi tipice, BI, cost, checklist 10 puncte, asiguratori activi pe RO (Allianz-Țiriac, Omniasig, Generali, Groupama, UNIQA).
- **Next step:** GSC Request Indexing manual, monitorizare 14/30 zile. KPI: clicks pe ghid + impresii pe queries head ("asigurare centrale fotovoltaice", "asigurare panouri fotovoltaice firmă"). Dacă urcă, considerăm ramificații (asigurare parc solar, BI calculator).

### Instalatori Autorizați ANRE Panouri Fotovoltaice 2026 — Top Firme Verificate
- **Publicat:** 2026-04-27 → [/ghid/instalatori-autorizati-anre-panouri-fotovoltaice-2026](/ghid/instalatori-autorizati-anre-panouri-fotovoltaice-2026)
- **Cluster GSC țintă (snapshot 2026-04-27):**
  - "instalatori sisteme fotovoltaice" — 50
  - "top firme panouri fotovoltaice" — 49
  - "instalatori panouri fotovoltaice" — 41
  - "panouri fotovoltaice instalatori autorizati" — 38
  - "instalatori autorizati fotovoltaice" — 34
  - "firme acreditate panouri fotovoltaice" — 28
  - "instalator panouri fotovoltaice" — 24
  - "instalator panouri fotovoltaice autorizat" — 23
  - "firma panouri fotovoltaice" — 21
  - **Total ~308 impresii/lună, 0 clicks la baseline. Intent național, fără oraș.**
- **Strategie:** replică template-ul București (publicat 23 Apr) la nivel național. Diferențiator: live ANRE lookup (/verificare-anre) + clasament sortable (/clasament) + 12 firme top selectate cu cifră de afaceri verificată ANAF.
- **Next step:** GSC Request Indexing manual, monitorizare 14/30 zile. KPI: clicks pe ghid + impresii rank pe queries head ("instalatori sisteme fotovoltaice", "top firme panouri fotovoltaice").

### Top Firme Panouri Fotovoltaice București 2026 — Instalatori Autorizați ANRE
- **Publicat:** 2026-04-23 → [/ghid/top-firme-panouri-fotovoltaice-bucuresti-2026](/ghid/top-firme-panouri-fotovoltaice-bucuresti-2026)
- **Cluster GSC țintă (snapshot 2026-04-22):**
  - "firme montaj panouri fotovoltaice bucuresti" — 40
  - "firme montaj panouri solare bucuresti" — 39
  - "instalare panouri fotovoltaice bucuresti" — 39
  - "montaj panouri fotovoltaice bucuresti" — 35
  - "montaj panouri solare bucuresti" — 19
  - "panouri fotovoltaice bucuresti" — 19
  - Cluster secundar "instalatori autorizati / firme acreditate" — ~97
  - **Total ~190 impresii/lună, 0 clicks la baseline**
- **Next step:** GSC Request Indexing manual, monitorizare 14/30 zile. Dacă urcă /firme/judet/bucuresti peste 5 clicks/săpt, replică template-ul pentru Cluj.

---

Vezi `MEMORY.md` — secțiunea "Content Status" are lista completă de ghiduri. GSC top performers:
- `/ghid/subventii-panouri-fotovoltaice` — 10 clicks / 1004 impresii (1% CTR) — hero page
- `/ghid/electric-up-2026-ghid-aplicare` — 9 / 210 (4.3% CTR) — excelent CTR, meta funcționează
- `/ghid/merita-panouri-fotovoltaice-firma-2026` — 6 / 373
- `/ghid/fonduri-nerambursabile-panouri-fotovoltaice-imm-2026` — 6 / 169
- `/ghid/casa-verde-fotovoltaice-2026` — 4 / 480 (CTR 0.8% — candidat la update meta)

## 🔴 Ideei respinse / parcate

(nimic încă)

---

## Proces

1. Când user aduce date GSC noi → adaugă aici cluster-ul + propunere, nu scrie articolul pe loc.
2. Prioritizare după: (impresii cluster) × (intent comercial) / (efort research).
3. După publicare: mută la "Publicate", notează clicks/impresii după 14 și 30 zile.
4. Re-review pipeline lunar — stale ideas (>60 zile fără mișcare) merg la "parcate".
