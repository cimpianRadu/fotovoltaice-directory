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

### Aniversare 1 an liberalizare piață energie (iulie 2026)
- **Status:** liberalizare iulie 2025; iulie 2026 = 1 an.
- **Trigger:** intrăm în iulie 2026.
- **Acțiune:** articol „1 An de Liberalizare a Pieței Energiei — Cum au Evoluat Prețurile și Cele Mai Bune Oferte 2026 pentru Firme și Persoane Fizice". Cluster „cele mai bune oferte energie 2026", „pret kwh furnizori 2026", „comparativ furnizori energie 2026". Atenție never-invent: prețurile vin din comparator gov sau wall-street/economisi cu data.

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

### Batch 2026-05-27 — 11 idei validate (10 din GSC gap analysis + 1 hot)

> Ordine de scriere recomandată: #10 (HOT) → Tier A → Tier B → Tier C. Rutina ia PRIMA intrare cu `💡 idee` din ordinea de aici. (#11 publicat 2026-06-08, vezi „Publicate recent".)

---

#### TIER A — Validat în GSC (impresii reale, risc mic)

#### #12 — Avize și Aviz de Mediu pentru Parc Fotovoltaic 2026 — Ghid pentru Investitori
- **Status:** 💡 idee
- **Cluster GSC:** „avize parc fotovoltaic" 17imp poz 22.8 + „aviz mediu parc fotovoltaic" 12imp poz 18 + „aviz de mediu parc fotovoltaic" 13imp poz 42 + „certificat urbanism parc fotovoltaic" 5imp = **~73 imp**
- **De ce:** B2B utility-scale (MW+), buget mare, zero competiție serioasă RO. Audiență = investitori parc PV.
- **Linkuri:** /ghid/avize-autorizatii · /ghid/fonduri-nerambursabile-panouri-fotovoltaice-imm-2026 · /clasament

#### #13 — Aviz Tehnic de Racordare (ATR) — Pași la E-Distribuție, Delgaz, E-ON pentru Prosumator 2026
- **Status:** 💡 idee
- **Cluster GSC:** „aviz tehnic de racordare panouri fotovoltaice" 11imp poz 47, „model contract prosumator" 2imp poz 9; cluster mai larg „racordare prosumator", „cum devii prosumator"
- **De ce:** site-ul deja afișat pe ATR (poz 47 = potențial); piesă post-decizie hi-intent (după ce omul a ales sistem). Tabel comparativ pași E-Distribuție / Delgaz / E-ON.
- **Linkuri:** /ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre · /ghid/vanzare-surplus-energie-fotovoltaica-prosumator-firma-2026 · /firme

---

#### TIER B — Logic puternic, fără validare GSC (pariu pe cerere domenială)

#### #14 — Sistem Fotovoltaic 3, 5 și 10 kW pentru Casă 2026 — Preț, Producție, Amortizare
- **Status:** 💡 idee
- **Cluster:** „pret sistem fotovoltaic 3 kw casa", „pret panouri fotovoltaice 5 kw casa", „cat costa 5 kw fotovoltaice", „panouri fotovoltaice 10 kw casa producție" (1 query în GSC la 3 imp ÎNCĂ — semnal slab dar cerere domenială mare)
- **De ce:** parallel REZIDENȚIAL la ghidul comercial 50/100/250 kW (top-performer site). Investiție strategică pe segmentul rezidențial. Aceleași praguri: ~4500/3800/3500 RON/kWp cu degresie (verifică prețuri 2026), yield PVGIS per zonă.
- **Linkuri:** /ghid/casa-verde-fotovoltaice-2026 · /ghid/panouri-fotovoltaice-casa-vs-firma · /calculator-panouri-fotovoltaice?segment=rezidential · /firme?segment=rezidential

#### #15 — Sisteme Fotovoltaice Comerciale 2026 — De la Hală Mică la MW: Ghid pentru Decident
- **Status:** 💡 idee
- **Cluster GSC:** „sisteme fotovoltaice comerciale" 18imp poz 38 (semnal direct) + intent generic „panouri fotovoltaice firma", „sisteme fotovoltaice industriale"
- **De ce:** pillar nou care leagă toate ghidurile commercial existente (hale, 50/100/250 kW, ROI, prosumator firma, lege, surplus, Electric Up). Trebuie să rankezi top pe „sisteme fotovoltaice comerciale" — e identitatea site-ului.
- **Linkuri:** toate ghidurile commercial · /firme?segment=comercial · /clasament · /calculator

#### #16 — Întreținere și Curățare Panouri Fotovoltaice — Frecvență, Costuri, Ce Faci Singur
- **Status:** 💡 idee
- **Cluster:** „intretinere panouri fotovoltaice", „curatare panouri fotovoltaice", „cat de des cureti panouri solare", „mentenanta sistem fotovoltaic" (0 imp GSC — gap pur)
- **De ce:** evergreen post-instalare, audiență pre-calificată (au sistem). Foarte puțin conținut serios RO.
- **Linkuri:** /ghid/asigurare-panouri-fotovoltaice-comerciale · /firme

#### #17 — Sistem Fotovoltaic Hibrid vs On-Grid vs Off-Grid pentru Casă și Firmă
- **Status:** 💡 idee
- **Cluster:** „sistem fotovoltaic hibrid", „off grid vs on grid", „panouri fotovoltaice cu baterie sau fara", „fotovoltaic fara baterie" (0 imp GSC; cerere domenială cunoscută)
- **De ce:** configuration explainer pre-decizie, captează intent de descoperire („cu sau fără baterie?").
- **Linkuri:** /ghid/stocare-energie-baterii-firme · /ghid/casa-verde-fotovoltaice-2026 · /ghid/legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre

---

#### TIER C — Vertical / niche (volum mic dar diferențiator)

#### #18 — Durată de Viață Panouri Fotovoltaice — Degradare, Garanție și Ce Schimbi după 10 Ani
- **Status:** 💡 idee
- **Cluster:** „cat dureaza panouri fotovoltaice", „durata viata panouri solare", „degradare panouri fotovoltaice", „garantie panouri fotovoltaice" (0 imp GSC)
- **De ce:** combinație durată + garanție + degradare = high-trust evergreen. Combină 3 query-uri într-o piesă.
- **Linkuri:** /ghid/asigurare-panouri-fotovoltaice-comerciale · /ghid/tipuri-panouri-fotovoltaice · /ghid/invertoare-fotovoltaice-comerciale

#### #19 — Panouri Fotovoltaice pe Carport / Parcare — Soluție pentru Firme cu Suprafețe Mari
- **Status:** 💡 idee
- **Cluster:** „carport solar", „panouri fotovoltaice parcare", „structura carport panouri", „panouri parcare firma cost" (0 imp GSC)
- **De ce:** nișă emergentă RO (mall, retail, logistică, CT-parks), aproape zero competiție. B2B cu buget.
- **Linkuri:** /ghid/panouri-fotovoltaice-hale-industriale · /ghid/sistem-fotovoltaic-50-100-250-kw-firma-pret-suprafata-productie · /firme?segment=comercial

#### #20 — Panouri Fotovoltaice pentru Fermă Agricolă 2026 — Subvenții AFIR și Aplicații (Irigații, Hale, Sere)
- **Status:** 💡 idee
- **Cluster:** „panouri fotovoltaice ferma agricola", „afir fotovoltaice", „fotovoltaice irigatii", „panouri solare ferma 2026" (1 imp GSC)
- **De ce:** vertical agro absent pe site, AFIR are scheme dedicate (verifică PNS/intervenții 2026). Diferențiator vs orice altă pagină RO.
- **Linkuri:** /ghid/subventii-panouri-fotovoltaice · /ghid/fonduri-nerambursabile-panouri-fotovoltaice-imm-2026

---

**Template geo (orașe) — PARCAT (2026-05-27):** Cluj (publicat 18 mai) = **poz 42.9, 1 click, 111 imp** după ~9 zile; Timișoara (publicat 21 mai) = **poz 17.2, 0 click, 45 imp**. Niciuna nu rankează → NU replicăm pe Iași/Brașov/Constanța/Oradea/Sibiu. Re-evaluare după ce trec 30 zile de la publicare (≈18 iunie): dacă tot nu urcă, problema e template-ul (probabil paginile /firme/judet care abia acum au conținut SSR decent — vezi fix /firme), nu lipsa de orașe. **Nu mai scrie un articol-oraș până nu rankează măcar unul.**

---

## ✅ Publicate recent (pentru referință CTR)

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
