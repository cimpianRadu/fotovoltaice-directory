# Social Media Pipeline

> Coadă de postări pentru pagina FB „Instalatori Fotovoltaice" și canalele derivate (Instagram, YouTube Shorts, TikTok). Workflow: skill `pil-slide-composer` (pas 0 = hook brainstorm obligatoriu, 3-5 variante, userul alege). Output: `social/<data>-<tema>/` (compose.py + slide-uri 1:1 + reel/ 9:16 + fișiere de caption per platformă).
> Reguli: cifre DOAR reale (never-invent), fără hashtag-uri pe Facebook, fără em dashes. Reel-ul se postează la 1-2 zile după carousel, nu simultan.
> **Convenție foldere:** după publicare, folderul primește sufixul „ ✅" în nume (ex. `2026-07-06-cere-oferta ✅`). Dashboard de status pe site: **/admin/social** (login cu `ADMIN_PASSWORD`, ca analytics). **Sursa de adevăr e tabul „Social" din Google Sheets** (migrat din `data/social-schedule.json` pe 2026-07-28; JSON-ul rămâne doar ca arhivă). Se editează direct în Sheets, inclusiv de pe telefon, iar dashboard-ul citește live, fără deploy. Marcarea unei postări ca publicată se face din `/admin/social`: click pe badge-ul de platformă îl setează pe data de azi, click din nou îl scoate. `postat` la nivel de postare urmează platformele, se setează la prima marcată și se golește când nu mai rămâne niciuna. Adevărul despre programări: Meta Business Suite Planner.
> **De la postarea #2:** include pe 1-2 slide-uri screenshot-uri reale din site ca background cu opacity redus (feedback user 2026-07-06).

## 🎯 Focus strategic (decizie user 2026-07-20)

**Promovăm prioritar `/cere-oferta`, obiectivul e colectarea de lead-uri** (pe care userul vrea apoi să le vândă firmelor). Implicații: CTA primar al fiecărei postări noi = /cere-oferta (nu doar în comentariul fixat, ci ca destinație a unghiului); temele se triază după „aduce cereri de ofertă sau doar views?"; succes = submissions în digest, nu reach. Ideile cele mai aliniate din coadă: #4 (amortizare → calculator → cere-oferta) și #6 (câte firme în județul tău → cere-oferta).

## 📡 Distribuție multi-platformă (decizie user 2026-07-28)

Același master 9:16 se postează pe **Facebook, Instagram, YouTube Shorts și TikTok**. Ordinea de prioritate stabilită: Instagram (cel mai ieftin de activat, cross-post din Meta Business Suite), YouTube Shorts (pariul real: link clicabil în descriere + coadă lungă pe căutare), TikTok (test cu criteriu de oprire: dacă la 8 săptămâni nu bate baseline-ul de pe Facebook și nu vezi click-uri pe linkul din bio în Umami, se închide).

**Regula de aur: video-ul și vocea rămân neutre față de platformă.** Tot ce e specific unui canal trăiește în stratul de text.

- În pixeli se pune doar wordmark-ul sau URL-ul scurt (`instalatori-fotovoltaice.ro/cere-oferta`), niciodată „linkul e în comentariul fixat" (scos din toate compozițiile pe 2026-07-28). Pe IG și TikTok comentariile nu au linkuri clicabile, pe YouTube linkul stă în descriere.
- În script (voce) CTA-ul e neutru: „lasă o cerere", nu „link în comentariu". Vezi și skill-ul global `narrated-video`.
- Consecința: **un singur render, patru platforme.** Extinderea pe un canal nou costă un fișier de text, nu un re-render.

**Fișiere per reel** (șablon gol în `social/_template-reel/`; la serii se prefixează cu numărul reel-ului, ex. `caption2-instagram.txt`):

| Fișier | Conținut |
|---|---|
| `caption-facebook.txt` | caption lung, fără hashtags, link în primul comentariu |
| `comentariu-facebook.txt` | comentariul fixat, cu linkuri UTM |
| `caption-instagram.txt` | corp scurtat, CTA „link în bio", cu hashtags |
| `titlu-youtube.txt` | titlu în formă de căutare (vezi `keywords.md` al postării), nu hook de social |
| `caption-youtube.txt` | descriere cu linkuri clicabile UTM |
| `caption-tiktok.txt` | o frază + hashtags + „link în bio" |
| `bio-link.txt` | linkurile de pus în bio pe IG și TikTok înainte de postare |

**UTM obligatoriu pe orice link** (Umami le citește automat), altfel extinderea pe patru canale nu se poate măsura:

```
?utm_source=facebook|instagram|youtube|tiktok&utm_medium=reel|shorts|bio&utm_campaign=<slug-postare>
```

Linkul din bio (IG, TikTok) se schimbă la fiecare reel, cu `utm_campaign`-ul postării curente. Altfel nu se poate atribui nicio cerere unei postări anume pe canalele fără linkuri clicabile.

**Evidența per canal:** în `data/social-schedule.json`, câmpul `platforme` per postare, cu valori `<dată ISO>` (postat), `programat` sau `sarit`. Cheie lipsă = nedistribuit pe canalul ăla. Se vede ca badge-uri FB/IG/YT/TT în /admin/social.

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

> **Postare nouă = rând nou în Sheet.** Folderul din `social/` nu e văzut de /admin/social. Adaugă rândul cu `node scripts/social-add.mjs --tema "..." --folder "social/<data>-<tema>/" --format "..." --programat <ISO> --cta <pagina>` (dry-run implicit, `--write` scrie; ID-ul se calculează automat).

## 📋 Coadă activă

> **📅 Calendar săptămâna 3-9 aug (revizuit 2026-08-03 seara, goal = cereri):** **#9 AFIR narat ✅ POSTAT 3 aug pe Facebook + Instagram** (marcat în Sheet, folder redenumit cu ✅; rămâne nedistribuit pe YouTube Shorts și TikTok, unde încă se poate posta) → joi 6 aug **#20 reel alertă, re-cut pe hook B** (aceeași zi cu articolul #43, se susțin reciproc) → sâmbătă 8 aug **#21 kit preț cu montaj** (derivat din ghidul #46, intenție de cumpărare maximă). Posterul #22 a fost **renunțat**, absorbit în #20. Decizie de format: **doar reels narate**, sunt cele care au mers cel mai bine; obiectivul pe #20 e keywords + trafic spre site, nu followers. Candidat pentru luni 10 aug: reel derivat din #36 (Legea prosumatorilor rezidențial, articolul vine joi prin rutină) sau #6 „câte firme are județul tău". ⚠️ De verificat în Meta Planner: posterul #19 (programat 30 iul) tot nu e marcat postat în Sheet.
>
> **Marcarea ca postat din terminal:** `node scripts/social-mark-posted.mjs --id <n> --platforme facebook,instagram --write` (dry-run implicit). Alternativa din UI rămâne /admin/social, click pe badge. Scriptul respectă convenția: `postat` se setează la prima platformă marcată și nu se suprascrie după.

### #20 — Alertă energetică → anti-islanding → baterie (reel)
- **Status:** ✅ **re-cut 2026-08-03 seara pe hook-ul B**, programat joi 6 aug — `social/2026-08-03-alerta-energetica-stocare/`
- Reel narat **34s** (compoziția `Alerta`, 7 scene). Versiunea de 26s („bateria acoperă orele 20-23") a fost înlocuită integral: script, voce și compoziție noi. Decizia userului: reels narate, hook B, obiectiv **keywords + atenție + trafic spre site**, nu followers.
- **Structura:** hook pe termenul căutat („stare de alertă", 30 de zile) → citatul oficial exact cu atribuire → presiunea reală seara, orele 19-23 + Dunărea la cel mai mic debit din 40 de ani → **răsturnarea: un sistem on-grid se oprește și el la pană de curent** → anti-islanding ca protecție, nu defect → invertor hibrid + baterie → ghidul de dimensionare.
- **De ce unghiul ăsta și nu „pregătește-te de blackout":** conferința din 3 aug a schimbat faptele. Ministerul Energiei a negat explicit orice risc pentru populație („Nu restricții, nu întreruperi, nu pericole, nu raționalizări", Bușoi, via Agerpres) și a semnalat că circulă teorii ale conspirației pe subiect. Un reel alarmist ne-ar fi pus de partea greșită a unei dezinformări pe care autoritatea o combate, pe o temă unde avem interes comercial. Reelul citează poziția oficială și apoi lămurește confuzia tehnică reală.
- **Corecții de fapte față de v1:** scos „risc de 20% din producție" (imprecis), intervalul 20:00-23:00 înlocuit cu **19-23** (cifra din conferința de luni), actul identificat ca **hotărâre CNSU din 31 iulie, nu HG**. Fără afirmație pe ecran despre cât de repede se deconectează invertorul (pragul vine din norma de racordare). Tabel complet de atribuire în `../2026-08-03-alerta-energetica/surse.md`.
- **CTA:** ghidul de baterii (bio IG/TT + primul comentariu, fiindcă vocea îl promite explicit), /cere-oferta secundar. Campanie UTM `alerta-stocare`.

### #22 — Poster alertă (anti-islanding) — ❌ renunțat 2026-08-03
- Absorbit în #20 după decizia userului de a merge pe reels narate. Textele și, mai important, **tabelul de surse din `social/2026-08-03-alerta-energetica/surse.md` rămân** și sunt sursa de fapte pentru #20 și pentru articolul #43. Folderul nu se șterge.
- Nu s-a adăugat rând în Sheet (nu a ajuns să fie programat).

### #21 — Cât costă un kit fotovoltaic cu montaj (prețuri reale 3/5/10 kW)
- **Status:** ✅ generat 2026-08-03, **programat sâmbătă 8 aug** — `social/2026-08-03-kit-pret-montaj/`
- Reel narat 32s (compoziția `KitPret`), derivat din ghidul #46 publicat 3 aug (regula ghid nou → reel). Cifre din `data/kit-prices.json` (88 produse, 5 magazine, 30 iul), consistente cu ghidul: 3 kW de la 8.399 lei (Solar1000) / 5 kW de la 12.287 lei (VoltGrid) / 10 kW de la 25.554 lei (VoltExpert), cu montaj + TVA. Vocea rotunjește doar conservator, ecranul arată exact.
- **CTA:** ghid #46 + /cere-oferta (bio IG/TT pe ghid, campanie UTM `kit-pret-montaj`)

### #22 — Alertă energetică: panourile on-grid nu vă țin casa la pană de curent (poster)
- **Status:** 🟡 în lucru 2026-08-03, **de postat azi sau mâine dimineață** (știre perisabilă) — `social/2026-08-03-alerta-energetica/` · *(renumerotat din #20: în Sheet #20 e reelul de stocare; la postare adaugă rândul cu `social-add.mjs`, va primi ID 22)*
- Poster foto (nu reel), 4:5 pe FB și IG, 9:16 story. **Hook neales încă: 4 variante în `hooks.md`, A e recomandată.** Imaginea rămâne de compus cu `pil-slide-composer` după alegerea hook-ului.
- **De ce nu reel:** reelul AFIR (#9) e deja generat și are termen pe 14 august. Două video-uri suprapuse ar canibaliza. Posterul iese azi, reelul AFIR rămâne prioritar pe slotul video.
- **Unghi:** Guvernul a declarat stare de alertă în energie pe 30 de zile (hotărâre CNSU, 31 iul). Postarea nu vinde frică, ci face opusul: citează poziția oficială („nu restricții, nu întreruperi, nu raționalizări", Bușoi, 3 aug) și apoi lămurește confuzia tehnică reală, aceea că **un sistem on-grid se oprește automat la pană de curent** (anti-islanding). Poziționare de sursă calmă într-o săptămână cu multă dezinformare.
- **Fapte + surse:** toate în `surse.md`, cu tabel de atribuire și cu lista cifrelor lăsate intenționat pe dinafară (inclusiv o contradicție între surse pe cei 400 MW autorizați, nefolosită).
- **CTA:** ghidul de baterii în primul comentariu, plus /cere-oferta. Bio IG duce la ghid (postarea promite ghidul). UTM `utm_campaign=alerta-energetica`.
- **Legătură cu pipeline-ul de articole:** e perechea de social a articolului **#43**, programat joi 6 august. Postarea pregătește terenul, articolul aprofundează.

### #19 — Telefoane + formular nou: de ce nu v-a sunat nimeni
- **Status:** ✅ generat 2026-07-29, programat 30 iul — `social/2026-07-29-telefoane-formular-nou/`
- Poster foto (nu reel), 4:5 pe FB și IG, 9:16 story. Hook ales de user: „AI TRIMIS O CERERE / ȘI NU TE-A SUNAT NIMENI? / De acum te sun eu, cel puțin pentru confirmare." Fără cifre pe imagine, intenționat.
- **Unghi:** userul a sunat clienți cu cereri netratate, a aflat că nu fuseseră contactați; postarea anunță formularul nou (rută de finanțare) și trecerea de la email la telefon. CTA secundar pentru instalatori: „ce detalii v-ar ajuta la ofertare?"
- **CTA:** /cere-oferta (comentariu fixat, plus /cereri)
- **Next:** reel la 3-4 zile care combină povestea telefoanelor cu detaliile noi de pe cardurile din /cereri (capturi din ambele pagini). Postarea 2 nu apare separat ca text.

> **Calendar (revizuit 2026-07-20, seara: #2 postat 16 iul, #8 postat 20 iul)** (MP4-urile generate cu `social/make_mp4.py`, `reel.mp4` în fiecare folder; durate: hook 3s / conținut 4,5s / CTA 4s): #10 producție județe → programat joi 23 iul (decizie user, devansat; de ales static `reel.mp4` vs pilot `reel-remotion.mp4`), #9 AFIR → 27-28 iul. Userul postează manual din folder (reel.mp4 + caption-reel.txt + comentariu-fixat.txt + etichete.txt).

### #9 — AFIR: fereastra se închide pe 14 august
- **Status:** ✅ **POSTAT 2026-08-03 pe Facebook + Instagram** (marcat în Sheet, folder `social/2026-07-16-afir-deadline ✅/`). Nedistribuit încă pe YouTube Shorts și TikTok, unde masterul e același și mai poate fi urcat până pe 14 aug.
- Refăcut 2026-08-03 ca **reel narat** (`reel-voce.mp4`, 31,7s, Charon + rețeta validată)
- Compoziția Remotion `Afir` (`social/remotion/src/Afir.tsx` + `timeline-afir.json` + `voice-afir/`), 5 scene mapate pe cele 5 slide-uri originale. Fapte re-verificate 3 aug (guides.json + afir.ro: sesiunea e în continuare deschisă, fără prelungire): 265 mil. EUR; 145 mil. ≤1 MW (650k EUR/MW) / 120 mil. >1 MW (550k EUR/MW); autoconsum minim 70%; selecție pe punctaj. Hook „14 AUGUST" (dată fixă, nu „X zile"). `reel.mp4` static rămâne ca arhivă.
- Texte per platformă pe noul workflow (caption-facebook / comentariu-facebook / caption-instagram / titlu-youtube / caption-youtube / caption-tiktok / bio-link), UTM `utm_campaign=afir-deadline`; fișierele vechi caption-reel.txt și comentariu-fixat.txt au fost înlocuite. Bio-ul IG/TikTok duce la ghid (reelul promite ghidul), nu la /cere-oferta.
- **CTA:** primul comentariu FB cu /ghid/fonduri-afir-panouri-fotovoltaice-ferma-industrie-alimentara-2026 + /cere-oferta. Bonus distribuție: grupuri de fermieri, nu doar cele 3 de PV.

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

### #11 — Studiu de caz: 3 sloturi gratuite pentru firme (B2B)
- **Status:** 💡 idee (propusă de user 2026-07-20)
- **Sursa datelor:** Umami real (2-3 cifre selectate: vizitatori/lună, afișări pagini județ/firme, cereri ofertă) + 181 firme + 42 ghiduri. NIMIC umflat; cifrele se extrag la zi înainte de generare (necesită UMAMI_API_KEY local sau cifre de la user din /admin/analytics).
- **Unghi:** invităm firmele de instalații electrice să publicăm împreună un studiu de caz al unui proiect real al lor; primele 3 sloturi gratuite (limită reală, apoi devine serviciu plătit legat de /publicitate). Firma dă proiectul + cifrele ei, noi dăm expunerea + pagina pe site.
- **CTA:** contact direct / /listeaza-firma. Distribuție: postare pe pagină + email direct către cele 181 firme listate (outreach.mjs) + grupuri de instalatori; pagina FB e audiență de clienți finali, emailul e canalul principal pentru asta.

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

### #13 — News: 2 cereri noi din Ilfov, revendică primul (postat 2026-07-22)
- Reel narat 23s (news, B2B), `social/2026-07-22-cereri-ilfov ✅/`. Primul reel produs cu skill-ul `narrated-video` (sub o oră cap-coadă): alertă → screenshot live /cereri cu cele 2 carduri Ilfov → urgență (nicio revendicare, max 3 firme) → CTA revendicare. Postat în aceeași zi cu intrarea cererilor. Pattern repetabil: la fiecare val de cereri fresh dintr-un județ, reel de news din același template (schimb screenshotul + scriptul).

### #12 — Lansare /cereri: cererile clienților, publice pentru instalatori (postat 2026-07-21)
- Reel 6 slide-uri, B2B (audiență: firme de instalare), `social/2026-07-21-cereri-lansare ✅/`. Angle: „cel mai greu nu e montajul, e să găsești clientul" vs Publi24/OLX/reclame; screenshot-uri reale din /cereri (feed + navbar). Comentariu fixat cu /cereri + /cere-oferta. Prima postare după lansarea feature-ului (PR #5, 21 iul) și prima pe focusul lead-gen.

### #8 — Paradoxul caniculei: soare maxim, randament mai mic (postat 2026-07-20)
- Reel 25s, 6 slide-uri native 9:16, hook „-14%", `social/2026-07-16-canicula ✅/`. Fapte verificate în ghidul #40: 10-14% pierdere la 65°C, 400 Wp → 350-360 Wp, gap 12-15 cm, briza -5-8°C, autoconsum vară 70-80% vs 30-40% iarna. Postat în plin sezon de caniculă.

### #2 — Cum verifici un instalator fotovoltaic în 3 pași (postat 2026-07-16, 12:42)
- 5 slide-uri NATIVE 1080×1920 (primul reel nativ), hook B („3 PAȘI"), postat ca slideshow FB cu muzică, `social/2026-07-16-verificare-instalator ✅/`. Screenshot-uri /verificare-anre + /clasament ca background cu overlay navy ~90%. Cifra 181 verificată în /clasament live. Context: dezinformare activă „Casa Verde Baterii deschis" în piață (verificat afm.ro 16 iul: nimic publicat).

### #3 — Casa Verde 2026: panouri NU, baterii DA (reel, postat 2026-07-08)
- Reel 6 slide-uri, hook C corectat („prin Casa Verde? NU"), `social/2026-07-08-casa-verde-baterii ✅/`. Distribuit în 3 grupuri PV (~300k membri). Trigger update: ghidul AFM publicat → postare nouă. Sursa datelor verificată 8 iul (afm.ro direct: ghid 2026 nepublicat, listă instalatori doar 2024).

### #1 — Cere ofertă gratuit (carousel 2026-07-06, reel 2026-07-08)
- Carousel 6 slide-uri, hook „GRATIS" (brainstorm A+D+tail E), `social/2026-07-06-cere-oferta ✅/`. Lecții: fără „0 lei" repetat; comparațiile din contrast cards să fie paralele; pe viitor screenshot-uri cu opacity ca background.
