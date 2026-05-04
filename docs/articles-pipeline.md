# Pipeline Articole — Instalatori Fotovoltaice

> Tracking pentru articolele viitoare. Fiecare intrare e backată de date GSC (queries + impresii) nu intuiție. Ordonat după ROI estimat (impact / efort).
>
> Când publici un articol, mută-l în secțiunea **Publicat** cu link + data + next-step (GSC Request Indexing, distribuție).

Ultima actualizare: 2026-05-04

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

### 4 — 🎯 NEXT: Anunț feature /calculator-panouri-fotovoltaice — Calculator gratuit cost & ROI sistem fotovoltaic firmă 2026
- **Status:** 💡 idee — următor în pipeline (prioritar)
- **Format:** ghid de tip **announcement-but-keyword-rich**. Anunțăm public lansarea calculatorului (commit f440367, 2026-05-03), dar structurat ca răspuns SEO la queries comerciale, nu ca post de blog corporate.
- **Title propus (testabil):** "Calculator Panouri Fotovoltaice Firmă 2026 — Estimează Cost, Producție și ROI Gratuit Online"
- **Meta description propus:** "Calculator gratuit pentru sisteme fotovoltaice comerciale: introdu kWh/an, județ și suprafață acoperiș, primește dimensiunea kWp recomandată, costul estimativ, producția anuală și perioada de amortizare."
- **Cluster GSC țintă (validate via WebSearch 2026-05-04, intent comercial maxim):**
  - "calculator panouri fotovoltaice" (head, mass intent)
  - "calculator panouri fotovoltaice firmă" / "firma" (commercial qualifier)
  - "calculator fotovoltaic online gratuit" (free tool intent)
  - "calculator ROI panouri fotovoltaice" (financial intent)
  - "calculator dimensionare sistem fotovoltaic" (technical intent)
  - "câți kw fotovoltaic pentru firmă" (raw question)
  - "cât economisesc cu panouri fotovoltaice firmă 2026" (savings intent)
  - "calcul rentabilitate panouri fotovoltaice"
  - "calculator amortizare sistem fotovoltaic"
  - "simulator sistem fotovoltaic comercial"
- **Competitori existenți (de bătut prin specializare B2B + indep.):** Enera Switch, Enel X simulator, Re-Energy, GreenLead, ECOVOLT, PVGIS24, Brig.ro. Toți au calculator + articol. Diferențiator-ul nostru: **independent, fără intent de vânzare directă** (doar director) + transparența formulei.
- **Structură propusă (8-10 secțiuni, ~2.500-3.500 cuvinte):**
  1. **Intro:** anunț scurt al lansării + de ce un calculator independent contează (toți ceilalți te duc spre ofertă proprie)
  2. **Ce face calculatorul** — input-urile (kWh/an consum, județ, suprafață acoperiș, tarif energie), output-urile (kWp recomandat, cost estimativ EUR și RON, producție anuală kWh, economie anuală RON, ROI ani)
  3. **Cum interpretezi rezultatul** — ce înseamnă fiecare cifră, când e estimarea conservatoare vs optimistă
  4. **3 scenarii walk-through:** firmă mică (consum 30 MWh/an), firmă medie (80 MWh/an), firmă mare (250 MWh/an) — cu screenshots/cifre din calculator
  5. **Formula din spate** — yield specific per județ (PVGIS), preț EUR/kWp pe taglie comercială, ipoteze (autoconsum vs surplus, preț mediu energie)
  6. **Limitele calculatorului** — nu modelează dinamica autoconsum vs surplus, nu vede sezonierea reală, nu include subvenții (Electric UP, Casa Verde), nu calculează regimul prosumator (link spre /ghid/vanzare-surplus-energie-fotovoltaica-prosumator-firma-2026)
  7. **De la calculator la ofertă concretă** — ce întrebări să-i pui instalatorului cu cifrele tale; link spre /verificare-anre + /clasament + /firme
  8. **FAQ** — calculatoare alternative, de ce nu cerem datele tale, e gratis pentru totdeauna, sursa formulelor
- **Linkuri interne (obligatorii):**
  - /calculator-panouri-fotovoltaice (CTA principal, embed multiple în corp + final)
  - /clasament (pentru "după calculator, alege instalatorul")
  - /firme (browse complet)
  - /verificare-anre
  - /ghid/cat-costa-sistem-fotovoltaic-comercial (cost detaliat)
  - /ghid/merita-panouri-fotovoltaice-firma-2026 (ROI complet)
  - /ghid/vanzare-surplus-energie-fotovoltaica-prosumator-firma-2026 (regim prosumator — gap explicit menționat)
- **Hero image:** screenshot real al calculatorului (NU AI-generated) — arată tool-ul, nu o imagine generică. Sau split: jumătate screenshot, jumătate fotorealist generat.
- **Slug propus:** `calculator-panouri-fotovoltaice-firma-2026-cost-roi`
- **Next step:** unifică cu #7 (dimensionare) — devine același articol. Înainte de scriere, recheck calculator UI + verifică ce câmpuri are exact (input list real) ca să nu inventezi.

### 6 — Sistem fotovoltaic 50 / 100 / 250 kW pentru firmă — preț, suprafață, producție
- **Status:** 💡 idee
- **Cluster GSC:** "preț sistem fotovoltaic 50 kw firmă", "preț sistem fotovoltaic 100 kw industrial", "cât costă 250 kw fotovoltaic" — query-uri cu intent comercial maxim, neacoperite.
- **Pagină existentă:** ghid costuri (general), ghid hale (calitativ — nu are dimensiuni concrete).
- **De ce:** Cumpărătorul comercial caută cu putere instalată specifică. Răspunsul direct = breakdown pe kWp + suprafață acoperiș + producție anuală + ROI estimat.
- **Format:** unul singur cu 3 secțiuni paralele (50/100/250 kW), nu 3 ghiduri separate.
- **Linkuri interne:** ghid ROI, ghid costuri, ghid hale industriale, /clasament (firme cu istoric pe taglia respectivă).
- **Next step:** culege 5-10 oferte reale per dimensiune (de la firmele din director sau public), normalizează RON/kWp, suprafață m²/kWp pe acoperiș plat vs înclinat.

### 7 — Dimensionare sistem fotovoltaic comercial
- **Status:** 🟡 absorbit parțial în #4 (calculator) — keyword-urile "dimensionare", "câți kw", "kwh vs kwp" sunt acoperite în #4. Rămâne ca propunere separată DOAR dacă după #4 vedem că query-urile de dimensionare pură au volum suficient să justifice un al doilea articol non-calculator-centric. Re-evaluare după 30 zile de la publicarea #4.

### 8 — (placeholder) Replicate București template pentru Cluj
- **Status:** 💡 idee, blocat de validarea ghidului București + național
- **Declanșator:** dacă /firme/judet/bucuresti aduce >5 clicks/săpt în 2 săpt de la 27 Apr (ghid național)
- **De ce:** Cluj are 10 firme acum (post 2026-04-22 batch), pagina județ există deja. Dacă template funcționează pe București, scalezi ieftin.

---

## ✅ Publicate recent (pentru referință CTR)

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
