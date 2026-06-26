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

_(coadă goală — următorul draft programat se adaugă aici cu data țintă.)_

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

## 🔥 Hot topics watch (de monitorizat → promovează la `💡 idee` când se confirmă)

> Lucruri în derulare care, când se confirmă, devin candidate de top — promovate la `💡 idee` (PASUL 1 al rutinei). Verifică această listă o dată pe săptămână (sau ad-hoc dacă apare ceva în presă).

### Casa Verde Baterii — publicare ghid AFM (UPDATE după publicare)
- **Status la 2026-06-04:** buget 400 mil. lei **APROBAT OFICIAL 21 mai 2026**; ghid de finanțare încă nepublicat; sesiune nedeschisă. Articol dedicat publicat preventiv pe 4 iunie 2026 (vezi `/ghid/casa-verde-baterii-2026-program-stocare-afm`).
- **Trigger:** AFM publică ghidul oficial pe [afm.ro](https://www.afm.ro/sisteme_fotovoltaice.php) cu suma per beneficiar + condiții + dată sesiune.
- **Acțiune:** (a) update ghidul `casa-verde-baterii-2026-program-stocare-afm` cu suma + datele oficiale + lista echipamente eligibile + calendar real; (b) update colateral pe ghidul-umbrelă `casa-verde-fotovoltaice-2026` cu cifrele confirmate; (c) Request Indexing GSC pe ambele după update.

### Normele tehnice ANRE post-Legea Prosumatorilor 2026
- **Status:** legea promulgată mai 2026 (vezi [/ghid/legea-prosumatorilor-2026...](/ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre)); ANRE are 60 zile să publice normele de aplicare (~vara/toamna 2026).
- **Trigger:** ANRE publică normele (Monitorul Oficial + anre.ro).
- **Acțiune:** (a) update obligatoriu ghidul legii cu procedurile reale (compensare multi-locație, calcul dezechilibre); (b) candidat articol nou „Normele ANRE 2026 — Cum se aplică legea prosumatorilor în practică".

### Electric Up Ciclul 3
- **Status:** Ciclul 2 (2.859 cereri) în evaluare; niciun anunț Ciclul 3.
- **Trigger:** Ministerul Energiei anunță apel nou pe [energie.gov.ro](https://energie.gov.ro) sau granturi.imm.gov.ro.
- **Acțiune:** articol „Electric Up Ciclul 3 — Cum aplici" în 24-48h de la anunț (window-ul de aplicare e scurt, traficul vine masiv în primele zile).

### ~~Aniversare 1 an liberalizare piață energie (iulie 2026)~~ ✅ promovat și publicat 2026-06-26
- Vezi „Publicate recent" — articol „1 An Liberalizare Energie 2026" cu cluster „cele mai bune oferte energie 2026", „pret kwh furnizori 2026", „comparativ furnizori energie 2026". Publicat preventiv cu 5 zile înainte de aniversarea oficială a liberalizării (1 iulie 2026), pentru a prinde valul de căutări din iulie când consumatorii primesc factura după 12 luni de liberalizare.

### REPowerEU vouchere 25.000 RON (persoane fizice)
- **Status la 2026-05-27:** schemă cunoscută (sursă gov 2024), dar fără date clare de lansare 2025/2026 confirmate.
- **Trigger:** lansare oficială pentru aplicare.
- **Acțiune:** articol „Voucher REPowerEU 25.000 RON — Cum aplici pentru panouri + stocare". Cluster „voucher repowereu", „voucher panouri 25000 lei", „voucher stocare repowereu".

> **Cum se gestionează:** când un trigger se confirmă, mutați intrarea de aici la „🎯 Propuneri active" cu status `💡 idee` (sau direct scrisă, dacă urgent). NU rămân aici după ce s-au scris — mergeți în „Publicate recent".

---

## 🎯 Propuneri active

### 2 — Quick win: update title pe /clasament
- **Status:** ✅ done — title + meta actualizate pentru a capta "top firme panouri fotovoltaice" + sortare/atestate ANRE. Recheck GSC după 14 zile.

### 3 — Quick win: meta /casa-verde
- **Status:** ✅ done (commit 3cfc347, 2026-04-29) — title + meta rescrise pentru queries înscrieri/finanțare. Recheck CTR în GSC după 14 zile.

### 7 — Dimensionare sistem fotovoltaic comercial
- **Status:** 🟡 absorbit parțial în #4 (calculator) — keyword-urile "dimensionare", "câți kw", "kwh vs kwp" sunt acoperite în #4. Rămâne ca propunere separată DOAR dacă după #4 vedem că query-urile de dimensionare pură au volum suficient să justifice un al doilea articol non-calculator-centric. Re-evaluare după 30 zile de la publicarea #4.

### Batch 2026-05-27 — coadă activă (re-priorizată 2026-06-13 cu date live)

> **Date live (13 iun, 3 luni):** 1.430 clicks, 59,2K imp, poz 10.8. Casa Verde Baterii (#10) = 229 cl, 42% trafic recent. Confirmă pattern-ul: **hot + news + pillar > niche evergreen**. Ordinea de mai jos prioritizează articolele cu cea mai mare probabilitate de tracțiune. Rutina ia PRIMA intrare cu `💡 idee`. Backlog-ul (jos) NU e luat — promovat la `idee` doar la semnal GSC nou.

**Publicate din batch:** #10 Casa Verde Baterii (4 iun, 229cl pos 6.4), #11 Cert Urbanism (8 iun), #12 Avize Parc (11 iun), #13 ATR Prosumator (15 iun), #14 Sistem 3/5/10 kW Casă (18 iun), #15 Pillar Comercial Decident (24 iun) — vezi „Publicate recent" pentru detalii.

---

### 🟡 Backlog (NU sunt în coada activă, rutina le SARE)

> Status `🟡 backlog` ≠ `💡 idee`. Toate au 0 impresii GSC. Pattern-ul validat la 13 iun arată că niche evergreen fără validare aduce trafic mic comparativ cu hot/news/pillar. Promovează manual la `💡 idee` doar dacă: (a) apare semnal GSC peste 10 imp pe cluster, (b) coada activă se golește complet, sau (c) leagă natural de un articol hot publicat recent. Păstrate pentru posibilă re-evaluare; NU șterse pentru că pot deveni relevante dacă apare un trigger.

#### #16 — Întreținere și Curățare Panouri Fotovoltaice — Frecvență, Costuri, Ce Faci Singur
- **Status:** 🟡 backlog · cluster „intretinere/curatare panouri fotovoltaice", 0 imp GSC.

#### #17 — Sistem Fotovoltaic Hibrid vs On-Grid vs Off-Grid pentru Casă și Firmă
- **Status:** 🟡 backlog · cluster „hibrid/on-grid/off-grid", 0 imp GSC.

#### #18 — Durată de Viață Panouri Fotovoltaice — Degradare, Garanție și Ce Schimbi după 10 Ani
- **Status:** 🟡 backlog · cluster „durata viata/degradare/garantie panouri", 0 imp GSC.

#### #19 — Panouri Fotovoltaice pe Carport / Parcare — Soluție pentru Firme cu Suprafețe Mari
- **Status:** 🟡 backlog · cluster „carport solar/panouri parcare", 0 imp GSC; nișă fără competiție dar fără cerere validată.

#### #20 — Panouri Fotovoltaice pentru Fermă Agricolă 2026 — Subvenții AFIR și Aplicații (Irigații, Hale, Sere)
- **Status:** 🟡 backlog · cluster „ferma agricola/AFIR fotovoltaice", 1 imp GSC.

---

**Template geo (orașe) — PARCAT (2026-05-27):** Cluj (publicat 18 mai) = **poz 42.9, 1 click, 111 imp** după ~9 zile; Timișoara (publicat 21 mai) = **poz 17.2, 0 click, 45 imp**. Niciuna nu rankează → NU replicăm pe Iași/Brașov/Constanța/Oradea/Sibiu. Re-evaluare după ce trec 30 zile de la publicare (≈18 iunie): dacă tot nu urcă, problema e template-ul (probabil paginile /firme/judet care abia acum au conținut SSR decent — vezi fix /firme), nu lipsa de orașe. **Nu mai scrie un articol-oraș până nu rankează măcar unul.**

---

## ✅ Publicate recent (pentru referință CTR)

### 1 An Liberalizare Energie 2026 — Prețuri și Oferte Furnizori
- **Publicat:** 2026-06-26 → [/ghid/1-an-liberalizare-energie-iulie-2026-oferte-pret-kwh-furnizori](/ghid/1-an-liberalizare-energie-iulie-2026-oferte-pret-kwh-furnizori)
- **Cluster GSC țintă:** „cele mai bune oferte energie 2026", „pret kwh furnizori 2026", „comparativ furnizori energie 2026", „1 an liberalizare energie", „liberalizare energie 2026 efecte", „oferte energie casa 2026", „oferte energie firma 2026", „oferta PPC fix 2026 / engie ampero / hidroelectrica casnic", „cat costa kwh acum", „cum scapi de factura mare energie", „preturi energie iulie 2026", „ce s-a schimbat cu liberalizarea energie". Articol HOT publicat preventiv cu 5 zile înainte de aniversarea liberalizării (1 iulie 2026), pentru a prinde valul de căutări din iulie când consumatorii primesc factura după 12 luni post-plafonare. Promovat din „🔥 Hot topics watch".
- **Strategie:** bilanț real al evoluției prețurilor 2025-2026 cu cifre verificate + comparativ oferte active iunie 2026 + pivotare strategică către soluția PV. 13 secțiuni + 10 FAQ FAQPage, ~4.337 cuvinte. Acoperă: cadrul legal plafonare OUG 27/2022 + Legea 357/2022 expirate 30 iun 2025; evoluție preț 0,80 plafonat → mediană 1,48 RON/kWh (creștere 85% în 12 luni — sursă economisi.ro feb 2026); diferența preț energie activă vs preț final cu TVA (componente reglementate 50-60% din factură); **tabel comparativ ofertele casnici iunie 2026** cu cifre din site-uri oficiale (Hidroelectrica 1,06-1,14 final cu TVA / PPC Fix Online 1,20 / PPC Fix Verde 1,24 / PPC Simplu 1,63 / ENGIE Ampero Verde Online 0,695 preț final energie + TG / Premier Energy 0,550 energie activă / Hidroelectrica VIITOR HIDRO 0,45 fără TG / Hidroelectrica promo martie 2026 0,40 primele 3 luni); ofertă firme cu ENGIE Ampero Verde Business 0,790 fix până 30.09.2027 + plaje negociere RFP individual per volum; procedură schimbare furnizor 4 pași 21 zile gratuit (OUG 153/2022); explicație de ce a crescut factura chiar la contract fix (TVA 19→21% din 1 aug 2025, distribuție majorată ANRE, certificate verzi); **soluția PV cu autoconsum 70-90%** cu tabel ROI 10 ani comparativ schimbare furnizor (1.500-3.000 lei/an) vs PV 5 kWp (4.500-7.500 lei/an + surplus) → diferență 30-50k RON pe 10 ani; cum primești bani pe surplus Legea 169/2025 (plaje preț achiziție per furnizor 0,30-0,50 lei/kWh); status subvenții 2026 (Casa Verde Baterii buget aprobat ghid nepublicat, Electric Up Ciclul 2 evaluare, Ciclul 3 neanunțat, Fond Modernizare 815 mil EUR plafon 20 mil EUR/proiect); checklist 8 pași concreti pentru reducere factură; pas următor cere ofertă. NEVER-INVENT strict: TOATE prețurile RON/kWh cu sursă explicită link la site furnizor (ppcenergy.ro, engie.ro, client.hidroelectrica.ro PDF, premierenergy.info, electricafurnizare.ro PDF, posf.ro PDF) + datele istorice plafonare din legislatie.just.ro + presă cu dată (libertatea.ro 26 mar 2026 / economisi.ro feb 2026 / startupcafe.ro TVA / stirileprotv.ro 30 iun 2025). Leagă /ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre + /ghid/vanzare-surplus-energie-fotovoltaica-prosumator-firma-2026 + /ghid/sistem-fotovoltaic-3-5-10-kw-casa-pret-productie-amortizare-2026 + /ghid/sistem-fotovoltaic-50-100-250-kw-firma-pret-suprafata-productie + /ghid/calculator-panouri-fotovoltaice-firma-2026-cost-roi + /calculator-panouri-fotovoltaice + /firme + /firme?segment=rezidential + /firme?segment=comercial + /verificare-anre + /cere-oferta + /ghid/casa-verde-fotovoltaice-2026 + /ghid/casa-verde-baterii-2026-program-stocare-afm + /ghid/electric-up-2026-ghid-aplicare + /ghid/fonduri-nerambursabile-panouri-fotovoltaice-imm-2026 + /ghid/aviz-tehnic-racordare-atr-prosumator-2026 + /ghid/subventii-panouri-fotovoltaice + /clasament + /ghid/sisteme-fotovoltaice-comerciale-2026-pillar-decident-firma.
- **Next step:** GSC Request Indexing manual pentru /ghid/1-an-liberalizare-energie-iulie-2026-oferte-pret-kwh-furnizori. Monitorizare 14/30 zile — KPI: clicks pe queries head („cele mai bune oferte energie 2026", „pret kwh furnizori 2026", „comparativ furnizori energie 2026"), impresii rank pe queries hot („1 an liberalizare", „preturi energie iulie 2026"), CTR pe queries decident („cum scapi de factura mare energie", „oferte energie firma 2026"). **Cea mai bună fereastră de tracțiune: 1-15 iulie 2026** (aniversarea efectivă + emiterea facturilor la 12 luni post-liberalizare). Long-tail bonus dacă apar: „cat costa kwh acum", „oferta PPC fix vs hidroelectrica" — dovadă ranking granular pe comparație furnizori. **Update obligatoriu** când: (a) ofertele PPC/ENGIE/Hidroelectrica se schimbă (de obicei lunar/trimestrial, urmărește site-urile oficiale + posf.ro comparator), (b) AFM publică Casa Verde Baterii ghid → update secțiune subvenții, (c) Electric Up Ciclul 3 anunțat → update secțiune subvenții, (d) iulie 2027 = aniversare 2 ani → review complet articol cu cifre noi. Pattern în replicare dacă urcă: articol similar pentru gaze (OUG 12/2026 plafonare gaze valabilă 1 apr 2026 – 31 mar 2027, expirare ar putea declanșa val similar la gaze).

### Sisteme Fotovoltaice Comerciale 2026 — De la Hală Mică la MW: Ghid pentru Decident
- **Publicat:** 2026-06-24 → [/ghid/sisteme-fotovoltaice-comerciale-2026-pillar-decident-firma](/ghid/sisteme-fotovoltaice-comerciale-2026-pillar-decident-firma)
- **Cluster GSC țintă:** „sisteme fotovoltaice comerciale" 18imp poz 38 (semnal direct GSC) + „sisteme fotovoltaice industriale", „panouri fotovoltaice firma", „panouri fotovoltaice comerciale", „sistem fotovoltaic industrial", „panouri fotovoltaice industriale pret", „instalare panouri fotovoltaice firma", „panouri fotovoltaice hala", „panouri fotovoltaice fabrica", „sistem fotovoltaic comercial pret", „sistem fotovoltaic 100 kw firma", „sistem fotovoltaic 500 kw", „sistem fotovoltaic 1 mw firma", „ROI panouri fotovoltaice firma", „amortizare panouri fotovoltaice firma", „decident achizitie panouri fotovoltaice". Identitatea site-ului — pillar nou care leagă toate ghidurile commercial existente.
- **Strategie:** PILLAR COMERCIAL pentru audiență DECIDENT (CEO/CFO/Operations Manager) cu hală/fabrică/depozit. Slug `sisteme-fotovoltaice-comerciale-2026-pillar-decident-firma`. 13 secțiuni + 10 FAQ FAQPage, **5.731 cuvinte**. Acoperă: context decident 2026 (preț kWh post-plafonare iulie 2025, Legea prosumator 2025/2026 aplicată, finanțare Electric Up Ciclul 2 evaluare), profile firmă (atelier 20-50 kWp / birou 50-100 / hală 100-250 / industrial 250 kWp-1 MWp / utility >1 MWp) cu praguri concrete consum+suprafață, dimensionare formulă rapidă kWp = (consum × autoconsum) / yield PVGIS, **tabel praguri preț 2026** cu mediană RON/kWp (sub 50 kWp=4.500 / 50-200=3.800 / peste 200=3.500 / utility 580-700k EUR/MW), **tabel yield PVGIS pe 10 județe** + factor montaj (înclinat 1,00 / terasă 0,94 / sol 1,02), **tabel ROI/payback pentru 100/250/500 kWp** București (autoconsum 70%, surplus 30% la 0,40 RON/kWh, autoconsum la 1,00 RON/kWh — payback 3,45-3,85 ani fără subvenție, 0,9-1,95 ani cu Electric Up), finanțare 2026 (Electric Up 150k EUR 75% Ciclul 2 evaluare, Fond Modernizare 815 mil EUR 2024-2026 plafon 20 mil EUR/proiect, leasing/PPA, autofinanțare), cadrul legislativ prosumator firmă (facturare lunară sub 200 kWp, compensare multi-locație, praguri 200/400 kWp), avize hală (notificare primărie Legea 50/1991 modif. 254/2022) vs parc la sol (CU+PUZ+scoatere agricol+aviz mediu+ATR+AC), proces achiziție pas cu pas (7 etape 6-8 luni cu termene ATR reglementate Ord ANRE 15/2026), 10 greșeli decident, cum alegi instalator (ANRE+ISO+portofoliu+financial), pas următor (calculator+cere oferte). NEVER-INVENT strict: praguri preț din ghidurile interne validate, yield-uri din pvgis-yields.json (single source), tarife energie inline cu ENGIE 0,790 lei/kWh 11.06-30.09.2027 + GreenLead analiză post-plafonare „peste 1 RON/kWh", Electric Up 150k EUR 75% sursă energie.gov.ro + 2.859 dosare oportunitati-ue.gov.ro, Fond Modernizare cifrele din [reference_ro_pv_financing_programs.md]. Leagă **toate** ghidurile comerciale: cost-sistem + 50/100/250 kW + hale + merita + invertoare + tipuri panouri + electric-up + fonduri-imm + legea-prosumatorilor + legislatie-prosumator + vanzare-surplus + stocare-baterii + asigurare + cert-urbanism + avize-firma + avize-parc + atr-prosumator + instalatori-anre + cum-alegi-instalator + /calculator?segment=comercial + /firme?segment=comercial + /clasament + /verificare-anre + /cere-oferta.
- **Next step:** GSC Request Indexing manual pentru /ghid/sisteme-fotovoltaice-comerciale-2026-pillar-decident-firma. Monitorizare 14/30 zile — KPI: clicks pe queries head („sisteme fotovoltaice comerciale" baseline poz 38 → țintă top 15, „panouri fotovoltaice firma", „sisteme fotovoltaice industriale"), impresii rank pe queries comerciale („sistem fotovoltaic 100 kw firma", „sistem fotovoltaic 500 kw", „sistem fotovoltaic 1 mw firma"), CTR pe queries decident („ROI panouri fotovoltaice firma", „amortizare panouri fotovoltaice firma"). Long-tail bonus: „panouri fotovoltaice hala", „panouri fotovoltaice fabrica", „decident achizitie panouri fotovoltaice", „sistem fotovoltaic comercial pret" — dovadă că pillar ranchează granular pe scenarii decident. **Update obligatoriu** când Electric Up Ciclul 3 e anunțat sau Fond Modernizare deschide apel nou → secțiunea „Finanțare 2026" cu calendarul real. Pattern în replicare dacă urcă: pillar similar pentru parc utility-scale (>5 MW) sau pillar agro-industrial cu AFIR.

### Sistem Fotovoltaic 3, 5 și 10 kW Casă — Preț 2026
- **Publicat:** 2026-06-18 → [/ghid/sistem-fotovoltaic-3-5-10-kw-casa-pret-productie-amortizare-2026](/ghid/sistem-fotovoltaic-3-5-10-kw-casa-pret-productie-amortizare-2026)
- **Cluster GSC țintă:** „pret sistem fotovoltaic 3 kw casa", „pret panouri fotovoltaice 5 kw casa", „cat costa 5 kw fotovoltaice", „panouri fotovoltaice 10 kw casa producție", „sistem fotovoltaic 5 kw pret casa", „sistem fotovoltaic 10 kw casa pret", „cat produce 5 kw panouri solare", „cat produce 10 kw fotovoltaic anual", „cati metri patrati pentru 5 kw panouri", „amortizare panouri fotovoltaice casa 5 kw", „cati kw imi trebuie pentru o casa", „dimensionare panouri fotovoltaice casa". Cluster generic rezidențial volum mare — target Tier A GSC, intent commercial puternic post-decizie.
- **Strategie:** parallel REZIDENȚIAL la ghidul comercial 50/100/250 kW (top-performer site). Casa Verde Baterii (229cl/10 zile) a confirmat că rezidențialul prinde tracțiune. 13 secțiuni + 10 FAQ FAQPage, ~5.500 cuvinte. Acoperă: praguri preț 2026 cu tabel RON/kWp (~6.300/5.400/5.100), suprafață m²/kWp pe înclinat+terasă (5,3/6,5), producție anuală kWh pe 3 zone PVGIS (București 1.280, Cluj 1.180, Constanța 1.380 — din pvgis-yields.json), breakdown dedicat pentru 3/5/10 kW cu profil utilizator + cifre cheie + când e potrivit, tabel comparativ unic 3 vs 5 vs 10 kW, calcul economie+amortizare cu tarif energie 2026 (PPC Fix Online 1,20 / mediană 1,48 RON/kWh), invertor on-grid vs hibrid (recomandare puternică hibrid din start pentru extensibilitate baterii), capitol baterii (LFP 5-15 kWh, când merită), prosumator Legea 169/2025 pe scurt, 10 greșeli frecvente (supradimensionare, invertor greșit, lipsa branșament trifazat la 10 kW, așteptare pasivă Casa Verde 2026 pentru panouri etc.), pași de la decizie la sistem. NEVER-INVENT strict: prețuri cu surse explicite (NovaSol 25 mar 2026, GreenLead 26 mar 2026, PPC Energy ofertă activă iun 2026); yield-uri PVGIS-SARAH3 (single source pvgis-yields.json); tarife energie inline cu link la engie.ro/ppcenergy.ro/economisi.ro/posf.ro; Casa Verde 2026 framing strict (panouri scoase din buget AFM 2026, doar baterii buget aprobat 21 mai 2026 ghid nepublicat). Leagă /ghid/casa-verde-fotovoltaice-2026 + /ghid/casa-verde-baterii-2026-program-stocare-afm + /ghid/panouri-fotovoltaice-casa-vs-firma + /calculator-panouri-fotovoltaice?segment=rezidential + /firme?segment=rezidential + /verificare-anre + /cere-oferta + /ghid/aviz-tehnic-racordare-atr-prosumator-2026 + /ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre + /ghid/vanzare-surplus-energie-fotovoltaica-prosumator-firma-2026 + /ghid/subventii-panouri-fotovoltaice.
- **Next step:** GSC Request Indexing manual pentru /ghid/sistem-fotovoltaic-3-5-10-kw-casa-pret-productie-amortizare-2026. Monitorizare 14/30 zile — KPI: clicks pe queries head („cat costa 5 kw fotovoltaice", „pret sistem fotovoltaic 5 kw casa", „sistem fotovoltaic 10 kw casa pret"), impresii rank pe queries dimensionare („cati metri patrati pentru 5 kw panouri", „cati kw imi trebuie pentru o casa", „cat produce 10 kw fotovoltaic anual"). Long-tail bonus dacă apar: „dimensionare panouri casa cu pompa caldura", „amortizare 5 kw fara subventie", „invertor hibrid vs on-grid casa" — dovadă ranking granular pe scenariu concret. **Update obligatoriu** când AFM publică ghidul Casa Verde Baterii 2026 oficial sau dacă revine subvenție pentru panouri — actualizează secțiunea „Economie anuală și amortizare" + FAQ 8 cu cifrele finale. Pattern în replicare dacă urcă: variante mai înguste „Sistem fotovoltaic monofazat vs trifazat casă" sau „Panouri fotovoltaice casă cu pompă căldură" (cluster de extindere).

### Aviz Tehnic Racordare (ATR) Prosumator 2026 — Ghid Pași
- **Publicat:** 2026-06-15 → [/ghid/aviz-tehnic-racordare-atr-prosumator-2026](/ghid/aviz-tehnic-racordare-atr-prosumator-2026)
- **Cluster GSC țintă (Tier B validat):** „aviz tehnic de racordare panouri fotovoltaice" 11 imp poz 47 (site deja afișat) + „model contract prosumator" 2 imp poz 9 + cluster mai larg „racordare prosumator", „cum devii prosumator", „atr panouri fotovoltaice", „racordare prosumator e-distributie/delgaz/deer", „cerere racordare prosumator", „documente racordare panouri fotovoltaice", „tarif racordare prosumator 2026", „termen racordare prosumator", „PIF prosumator panouri fotovoltaice", „nota de constatare prosumator", „contract racordare prosumator", „contract de servicii prosumator", „procedura simplificata prosumator", „notificare racordare prosumator". Hi-intent post-decizie (după ce omul a ales sistemul).
- **Strategie:** piesă procedurală pură — pas-cu-pas operațional la operatorul de distribuție, complementară (NU duplicat) ghidurilor existente despre prosumator (Legea 169/2025 legislativ, vânzare surplus financiar, legislație generală). 12 secțiuni, 10 FAQ FAQPage, ~5.500 cuvinte. Acoperă: definiție ATR + cadru legal (Legea 123/2012, Ord ANRE 59/2013 modif. Ord 15/2026 din 21 mai 2026, Ord 19/2022 procedura simplificată prosumatori, Ord 228/2018 norma tehnică); cei **4 operatori de distribuție** (Delgaz Grid Moldova, DEER cu 3 zone Transilvania N+S + Muntenia N, Distribuție Energie Oltenia, Rețele Electrice România/PPC cu 3 zone Banat+Dobrogea+Muntenia S) cu tabel județe + portaluri + telverde; cele 8 etape cumulate (cerere → ATR → contract racordare → execuție → instalație utilizare → PIF → certificat racordare → contract prosumator cu furnizor); documente standard 8-10 (cerere tip Anexa 1/4/5 la Delgaz, act identitate/ONRC, act proprietate/CF, plan situație, memoriu tehnic + schemă monofilară, fișa invertor de pe lista conformă a operatorului, aviz amplasament/CU când e cazul); comparativ portaluri online (delgaz.ro, avize.distributie-energie.ro Portalul Dedicat obligatoriu din 2024 la DEER, portal.distributieoltenia.ro, contulmeu.reteleelectrice.ro); termene reglementate (5 zile lucrătoare evaluare + 15 zile lucrătoare emitere ATR + 90 zile execuție + 5 zile PIF + 3 zile certificat + 30 zile regularizare); costuri (taxa ATR Ord 11/2014, tarif racordare variabil, mecanism regularizare ANRE rambursare parțială); pași contract racordare (alegere executant operator vs terț atestat ANRE, achitare 15 zile); pași PIF (notificare TU operatorului, vine în 5 zile, schimbă contor cu bidirecțional smart meter GRATUIT, emite nota constatare + certificat); contract prosumator cu furnizor (Ord 15/2022 + 227/2018 + Legea 169/2025, schema cantitativă vs cantitativă+financiară, compară PPC/ENGIE/Electrica/Hidroelectrica/Restart/Tinmar); procedura simplificată (notificare fără ATR per ANRE când nu modifici soluția de racordare, Anexa 2 Delgaz + Anexa 5 monofazat sub 10,8 kW); 10 greșeli frecvente (confuzia furnizor/operator, invertor în afara listei conforme, depunere fizică în loc de portal, pornire înainte de PIF, ATR vs AC). Surse confirmate strict: anre.ro „Cum devin prosumator", anre.ro tabel oficial distribuitori, Ord ANRE 15/2026 pe legislatie.just.ro, Delgaz prosumatori cu Anexele 1-5 oficiale, Distribuție Energie pentru prosumatori, Distribuție Oltenia pași AFM, Rețele Electrice Anexa 1 prosumator cu termene reglementate. NEVER-INVENT strict: NU am dat cifre exacte pentru taxa ATR sau tarif racordare (sunt variabile, comunicate de operator); NU am citat standarde IEC 62116/61727/62109 specific deoarece nu am sursă concretă în procedura ATR (am referit la „lista de invertoare conforme" Delgaz). Leagă /ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre + /ghid/vanzare-surplus-energie-fotovoltaica-prosumator-firma-2026 + /ghid/legislatie-prosumator-comercial + /ghid/certificat-urbanism-autorizatie-construire-fotovoltaice-2026 + /ghid/avize-autorizatii-instalare-fotovoltaice-firma + /ghid/avize-aviz-mediu-parc-fotovoltaic-2026 + /verificare-anre + /firme + /firme?segment=rezidential + /firme?segment=comercial + /cere-oferta.
- **Next step:** GSC Request Indexing manual pentru /ghid/aviz-tehnic-racordare-atr-prosumator-2026. Monitorizare 14/30 zile — KPI: clicks pe queries head („aviz tehnic de racordare panouri fotovoltaice" la baseline poz 47 → țintă top 20, „atr panouri fotovoltaice", „racordare prosumator e-distributie/delgaz/deer", „PIF prosumator"), impresii rank pe queries procedurale („cerere racordare prosumator", „documente racordare prosumator", „termen emitere atr"). Long-tail bonus dacă apar: „procedura simplificata prosumator", „notificare racordare 10.8 kW", „contract de servicii prosumator" — dovadă că ghidul ranchează granular pe instrucțiuni procedurale concrete. **Update obligatoriu** când ANRE publică normele tehnice post-Legea 169/2025 (compensare multi-locație, calcul dezechilibre — vezi „Hot topics watch") → actualizează secțiunea contractului de prosumator cu furnizorul.

### Avize Parc Fotovoltaic 2026 — Ghid Investitori Utility-Scale
- **Publicat:** 2026-06-11 → [/ghid/avize-aviz-mediu-parc-fotovoltaic-2026](/ghid/avize-aviz-mediu-parc-fotovoltaic-2026)
- **Cluster GSC țintă (Tier A validat):** „avize parc fotovoltaic" 17 imp poz 22.8 + „aviz mediu parc fotovoltaic" 12 imp poz 18 + „aviz de mediu parc fotovoltaic" 13 imp poz 42 + „certificat urbanism parc fotovoltaic" 5 imp = **~73 imp/lună**. Long-tail adițional: „PUZ parc fotovoltaic", „scoatere circuit agricol parc fotovoltaic", „aviz Natura 2000 parc fotovoltaic", „ATR Transelectrica parc fotovoltaic", „autorizatie ANRE infiintare 1 MW", „aviz MApN parc fotovoltaic", „racordare parc fotovoltaic 50 MVA". Audiență: investitori utility-scale (MW+), dezvoltatori energie, fonduri investiții, firme cu portofoliu de teren agricol/industrial. B2B intent comercial maxim, zero competiție serioasă RO.
- **Strategie:** 13 secțiuni + 10 FAQ FAQPage, ~5.500 cuvinte. Matricea scenariilor (sub 1 MW / 1–5 MW / 5–50 MW / peste 50 MW) cu coloane pentru emitent autorizație, ANRE, racordare, PUZ, scoatere agricol. CU + PUZ (cu nota cadrului dinamic — Legea 254/2022 vs PLx 255/2025 în lucru, deadline 31 aug 2026 PNRR Milestone 509). Aviz de mediu cu Legea 292/2018 Anexa 2 (etapa de încadrare „fără EIM" sau „cu EIM" + Studiu Evaluare Adecvată OUG 57/2007 Natura 2000). Scoatere circuit agricol cu OUG 34/2013, Ord. MADR 83/2018, Legea 254/2022 (clase III–V max 50 ha). ATR cu pragul **50 MVA / 110 kV** (Cod RET — Transelectrica vs operator distribuție). Autorizație de înființare ANRE peste 1 MW (Legea 123/2012 + Regulament ANRE 12.03.2025). Calendar realist 12–36 luni cu defalcare pe faze. 10 greșeli frecvente investitori. NEVER-INVENT strict: taxa scoatere agricol nu are tabel național unic (calcul individualizat OSPA/DAJ); costul PUZ 15.000–70.000 EUR (5–10 MW) cu sursă Simtel; cost 1 MW = 580.000–700.000 EUR cu sursă Genersy 2025; PUZ durata 8–18 luni cu sursă Simtel; 1 MW = 1–1,5 ha cu sursă Energynomics. Linkuri interne: [/ghid/avize-autorizatii-instalare-fotovoltaice-firma](/ghid/avize-autorizatii-instalare-fotovoltaice-firma) pillar firmă + [/ghid/certificat-urbanism-autorizatie-construire-fotovoltaice-2026](/ghid/certificat-urbanism-autorizatie-construire-fotovoltaice-2026) procedural + [/ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre](/ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre) + [/clasament](/clasament) + [/verificare-anre](/verificare-anre) + [/firme?segment=comercial](/firme?segment=comercial) + [/cere-oferta](/cere-oferta).
- **Next step:** GSC Request Indexing manual pentru /ghid/avize-aviz-mediu-parc-fotovoltaic-2026. Monitorizare 14/30 zile — KPI: clicks pe queries head („avize parc fotovoltaic", „aviz mediu parc fotovoltaic", „certificat urbanism parc fotovoltaic"), impresii rank pe queries tehnice („ATR Transelectrica parc fotovoltaic", „scoatere circuit agricol parc fotovoltaic 50 ha", „autorizatie ANRE infiintare 1 MW"). Long-tail bonus: „PUZ parc fotovoltaic teren extravilan", „aviz Natura 2000 parc fotovoltaic ROSCI" — dovadă ranking granular pe utility-scale. **Update obligatoriu** când PLx 255/2025 e promulgat (eliminare PUZ + dublare 100 ha) → actualizează secțiunile PUZ + matrice scenarii cu noul cadru legal. Sursă tracking: [Capital.ro PLx 255/2025](https://www.capital.ro/autorizatiile-pentru-energie-regenerabila-se-schimba-radical-plx-255-2025-elimina-puz-pug-si-clarifica-regimul-infrastructurii.html).

### Certificat Urbanism Autorizație Construire Fotovoltaice 2026
- **Publicat:** 2026-06-08 → [/ghid/certificat-urbanism-autorizatie-construire-fotovoltaice-2026](/ghid/certificat-urbanism-autorizatie-construire-fotovoltaice-2026)
- **Cluster GSC țintă:** „certificat urbanism fotovoltaice" 28 imp poz 22, „autorizatie construire panouri fotovoltaice" 11 imp, „certificat urbanism panouri fotovoltaice" 10 imp + variante = ~58 imp/lună poz 22-43. Tier A validat GSC.
- **Strategie:** dedicat exclusiv pe CU + AC (separat de pillar-ul `avize-autorizatii-instalare-fotovoltaice-firma`). Acoperă diferența CU vs AC, matrix decizional 10 scenarii (rezidențial/comercial/peste 400 kWp/parc la sol/monument/modificare structurală), textul citat al Legii 50/1991 art. 11 alin. (2) lit. f (modif. Legea 254/2022), procedura completă notificare primărie (4 pași), procedura CU + AC pași, taxe primării cu tabel București Sector 2 (HCGMB 514/2025) + intervale Cod Fiscal, procedură parc fotovoltaic extravilan (PUZ + scoatere agricol MADR + aviz mediu APM + Natura 2000), 10 greșeli frecvente, pas următor concret. 12 secțiuni, 10 FAQ FAQPage. ~3.500 cuvinte. Surse confirmate: Legea 50/1991 (ISC PDF + lege5), Legea 254/2022 (lege5), Codul Fiscal Legea 227/2015 (lege5), HCGMB 514/2025 (ps2.ro), OUG 34/2013 (madr.ro + legislatie.just.ro). NEVER-INVENT: taxele HCL doar București Sector 2 confirmate; restul „verifică pe site primărie\". Leagă /ghid/avize-autorizatii-instalare-fotovoltaice-firma (pillar) + /ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre (prag 400 kWp) + /ghid/verificare-instalator-panouri-fotovoltaice-2026 + /firme + /verificare-anre + /cere-oferta.
- **Next step:** GSC Request Indexing manual pentru /ghid/certificat-urbanism-autorizatie-construire-fotovoltaice-2026. Monitorizare 14/30 zile — KPI: clicks pe queries head („certificat urbanism fotovoltaice", „autorizatie construire panouri fotovoltaice"), impresii rank pe queries dimensionare/scenariu („cand am nevoie de autorizatie panouri fotovoltaice", „certificat urbanism firma fotovoltaic"). Long-tail bonus dacă apar: „parc fotovoltaic teren extravilan", „scoatere circuit agricol panouri" — dovadă că ghidul ranchează granular pe utility-scale.

### Casa Verde Baterii 2026 — Program Stocare AFM (Status Real)
- **Publicat:** 2026-06-04 → [/ghid/casa-verde-baterii-2026-program-stocare-afm](/ghid/casa-verde-baterii-2026-program-stocare-afm)
- **Cluster GSC țintă:** „casa verde baterii", „casa verde 2026 baterii", „casa verde stocare", „afm baterii fotovoltaice", „casa verde inscriere baterii 2026", „program baterii fotovoltaice 2026", „subventie baterii fotovoltaice 2026", „casa verde baterii prosumator", „cat costa o baterie fotovoltaica", „baterie stocare casa verde valoare". Volum în creștere odată cu aprobarea bugetului 21 mai 2026.
- **Strategie:** articol HOT publicat preventiv (înainte de publicarea ghidului AFM) pentru a capta valul de impresii când iese ghidul. Framing „ce știm OFICIAL\" (buget 400 mil. lei aprobat 21 mai, prosumatori existenți, panourile scoase din buget AFM 2026) + „ce NU s-a confirmat\" (sumă, dată, condiții, plafon kWh) + secțiune dedicată pregătirii dosarului + tabel Casa Verde Baterii vs Casa Verde Fotovoltaice + dimensionare LFP/NMC + cost piață 2026 + 10 greșeli de evitat. Disclaimer obligatoriu la început/sfârșit (regula never-invent). 12 secțiuni, 10 FAQ, ~3.715 cuvinte. Leagă /ghid/casa-verde-fotovoltaice-2026 (parent umbrelă) + /verificare-anre + /firme?segment=rezidential + /ghid/stocare-energie-baterii-firme + /ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre + /ghid/subventii-panouri-fotovoltaice + /ghid/vanzare-surplus-energie-fotovoltaica-prosumator-firma-2026.
- **Next step:** GSC Request Indexing manual pentru /ghid/casa-verde-baterii-2026-program-stocare-afm. **Update obligatoriu** când AFM publică ghidul oficial (suma per beneficiar, condiții finale, dată start sesiune, lista echipamente eligibile, lista instalatorilor validați) — vezi „🔥 Hot topics watch\" pentru declanșator. Monitorizare 14/30 zile: clicks pe queries head („casa verde baterii\", „casa verde 2026 baterii\"), impresii pe queries tehnice („cat costa o baterie fotovoltaica\", „dimensionare baterie casa verde\"). Pivot strategic: dacă ghidul prinde repede e dovadă că publicarea preventivă pe topice fierbinți merită replicată (eg. Electric Up Ciclul 3 când se anunță).

### Panouri Fotovoltaice pentru Casă vs Firmă — Diferențe și Costuri 2026
- **Publicat:** 2026-05-28 → [/ghid/panouri-fotovoltaice-casa-vs-firma](/ghid/panouri-fotovoltaice-casa-vs-firma)
- **Cluster GSC țintă:** "panouri fotovoltaice casa vs firma", "diferenta panouri rezidential comercial", "cat costa panouri fotovoltaice casa", "subventie casa verde vs electric up", "amortizare panouri fotovoltaice casa".
- **Strategie:** anunț de lansare a secțiunii rezidențiale. Conținutul exista deja scris în guides.json (`published: false`), rutina de joi (PASUL 0) a făcut flip pe `published: true`. Acoperă 8 secțiuni + 5 FAQ: dimensionare (3/5/10 kW vs 30 kW–1 MW), costuri RON/kW (6.000–7.300 rezidențial vs 3.000–4.600 comercial), subvenții (Casa Verde 30.000 RON vs Electric UP 150.000 EUR), legislație prosumator (net metering vs net billing, prag 200/400 kW), amortizare/ROI, avize și autorizații, rezumat decizional. Linkuri interne: /ghid/casa-verde-fotovoltaice-2026, /calculator-panouri-fotovoltaice?segment=rezidential, /firme?segment=rezidential, /firme?segment=comercial, /verificare-anre, /cere-oferta, /ghid/legislatie-prosumator-comercial, /ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre.
- **Next step:** GSC Request Indexing manual pentru /ghid/panouri-fotovoltaice-casa-vs-firma. Monitorizare 14/30 zile — e prima piesă de conținut rezidențial, urmărește dacă clusterul rezidențial prinde (impresii pe queries "panouri fotovoltaice casa", "casa verde vs electric up"). Dacă urcă, pivot strategic spre mai mult conținut rezidențial (calculator-pe-rezidential ranchează deja, /firme?segment=rezidential are 24 firme).

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
