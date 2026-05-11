# Pipeline Articole — Instalatori Fotovoltaice

> Tracking pentru articolele viitoare. Fiecare intrare e backată de date GSC (queries + impresii) nu intuiție. Ordonat după ROI estimat (impact / efort).
>
> Când publici un articol, mută-l în secțiunea **Publicat** cu link + data + next-step (GSC Request Indexing, distribuție).

Ultima actualizare: 2026-05-11

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

## 🎯 Propuneri active

### 2 — Quick win: update title pe /clasament
- **Status:** ✅ done — title + meta actualizate pentru a capta "top firme panouri fotovoltaice" + sortare/atestate ANRE. Recheck GSC după 14 zile.

### 3 — Quick win: meta /casa-verde
- **Status:** ✅ done (commit 3cfc347, 2026-04-29) — title + meta rescrise pentru queries înscrieri/finanțare. Recheck CTR în GSC după 14 zile.

### 7 — Dimensionare sistem fotovoltaic comercial
- **Status:** 🟡 absorbit parțial în #4 (calculator) — keyword-urile "dimensionare", "câți kw", "kwh vs kwp" sunt acoperite în #4. Rămâne ca propunere separată DOAR dacă după #4 vedem că query-urile de dimensionare pură au volum suficient să justifice un al doilea articol non-calculator-centric. Re-evaluare după 30 zile de la publicarea #4.

### 8 — (placeholder) Replicate București template pentru Cluj
- **Status:** 💡 idee, blocat de validarea ghidului București + național
- **Declanșator:** dacă /firme/judet/bucuresti aduce >5 clicks/săpt în 2 săpt de la 27 Apr (ghid național)
- **De ce:** Cluj are 10 firme acum (post 2026-04-22 batch), pagina județ există deja. Dacă template funcționează pe București, scalezi ieftin.

---

## ✅ Publicate recent (pentru referință CTR)

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
