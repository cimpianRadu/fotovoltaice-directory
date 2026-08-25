# Workflow reels narate

Pipeline-ul tehnic (Remotion, voce, SFX) e în skill-ul global `narrated-video`.
Documentul ăsta e partea care nu ține de cod: **ce trece și ce nu trece** la un
reel pentru instalatori-fotovoltaice.ro. A fost scris pe 11 august 2026, după un
reel slab, ca pașii care l-au produs să nu se mai repete.

Ordinea e obligatorie. Pasul 0 e cel care a lipsit.

**Structura folderelor (din 13 aug 2026):** postările stau grupate pe săptămâni,
`social/YYYY-MM-wN-DD-DD/` (luni-duminică, N = a câta săptămână cu luni din luna
respectivă, ex. `2026-08-w3-17-23`). Folderul fiecărei postări rămâne datat
(`2026-08-17-compensare-furnizori`) și intră în folderul săptămânii lui. Sufixul
„ ✅" pe folderul postării înseamnă publicat, dar sursa de adevăr rămâne tabul
„Social" din Sheets.

---

## Pasul 0. Subiectul (poarta)

Înainte de orice literă de script:

1. Uită-te în `social/` la folderele ultimelor două săptămâni (`YYYY-MM-wN-DD-DD`)
   și scrie într-o propoziție ce spune fiecare postare. Dacă noul reel intră în aceeași propoziție cu vreunul, **oprește-te**.
2. Răspunde în scris la: *ce află omul din reelul ăsta și nu știa înainte?*
   Dacă răspunsul e „că noi am făcut ceva pe site", nu e reel, e changelog.
   Un changelog merge ca poză cu caption, nu ca reel narat.
3. Reelul trebuie să aibă o singură idee. Dacă ai două, sunt două reels la două
   zile distanță (userul a respins explicit un reel de 53s).

Semnul că pasul 0 a fost sărit: scriptul se umple cu al doilea exemplu numeric,
cu o frază despre metodologie și cu un disclaimer chiar înainte de CTA. Alea nu
sunt greșeli de scriere, sunt umplutură pentru un subiect care nu mai are ce
spune.

## Pasul 1. Cifrele, înainte de script

Cifrele se numără din datele reale (`data/*.json`, Sheets, GSC) și comanda care
le reproduce se scrie în `cifre.md`, în folderul reelului. Fără sursă, cifra nu
intră nici în voce, nici în caption. Vezi `feedback_never_invent_numbers`.

În `cifre.md` scrie și **ce ai refuzat să spui** și de ce. E util peste o lună,
când cineva întreabă de unde vine o formulare.

## Pasul 2. Scriptul

`script.txt`, o propoziție per rând (generatorul de voce taie pe rânduri).

- **Adresare:** conținut pentru proprietari, „dumneavoastră". Conținut pentru
  instalatori (cereri, portal, revendicări), „tu". Amestecul se aude.
- **Prima propoziție** e faptul concret care oprește scroll-ul. Contextul vine
  după, ca explicație, niciodată invers.
- **Undeva în primele 3 propoziții pune ce surprinde.** Reelul bun are un
  „pare ciudat, dar" (de ce se amortizează mai repede o factură mare, că
  atestatul expiră). Reelul slab are doar cifre corecte.
- **Propoziții întregi, vorbite.** Fără hook telegrafic fără verb, fără
  „dar uite ce nu știe multă lume", fără punchline de un cuvânt după punct.
  Testul: citește-l cu voce tare. Dacă sună a titlu de știre, rescrie-l ca și
  cum ai explica unui om la telefon.
- **Numerele se scriu în litere** („două mii opt sute"), altfel TTS-ul le rostește
  urât.
- **Nicio cifră pusă ca acuzație.** Testul, învățat pe reelul ANRE din 12 august:
  dacă din cifră iese concluzia „firmele nu-și fac treaba", ai nevoie de o cifră
  care chiar susține concluzia aia, și de obicei n-o ai („au avut atestat 2.814,
  mai au 1.499" conține și firme dispărute de pe piață, nu doar neglijenți).
  Numără pe partea bună (câte SUNT în regulă) și explică mecanismul, nu vina.
  Dacă simți nevoia să scrii undeva „nu e o acuzație la adresa nimănui", ai
  scris deja acuzația; rescrie propoziția, nu adăuga disclaimerul.
- **Nu-i spune omului că nu are ce face.** „Din afară nu aveți cum să știți" e
  frână chiar înainte de CTA. Orice constatare negativă trebuie să aibă gestul
  concret imediat după ea.
- **Nicio propoziție nu începe cu „I" majuscul urmat de literă mică** („Iar",
  „Intri"). Captions-urile se generează din chiar rândurile scriptului, iar în
  Geist „I" se citește „l", deci pe ecran apare „lar dacă". Verificatorul îl
  semnalează ca avertisment; la nume proprii (Iași, Ilfov) lasă-l în voce, dar
  ține-l departe de textul mare din scenă.
- **Lungime țintă 25-32s.** Peste 35s, taie o propoziție, nu accelera vocea.
- **CTA-ul e ultima propoziție și conține o singură acțiune.** Niciun disclaimer
  între ultima informație și CTA; disclaimerele stau în caption.
- Fără em dash-uri. Fără reproșuri către instalatori, nici implicite.

## Pasul 2.5. Proba de rostire (obligatorie, înainte de voce)

Adăugat pe 20 august 2026, după reelul „soare-judete", pe care userul l-a ascultat
și a spus că sună rău. Patru propoziții din cinci erau corecte gramatical și
imposibil de rostit firesc. Nu vocea era de vină, scriptul era scris pentru citit.

Două verificări, în ordinea asta:

**a. Mecanic.**

```bash
node scripts/check-reel-script.mjs "social/<săptămână>/<reel>/script.txt"
```

Pe lângă filtrul editorial de dinainte, checkerul prinde acum aglomerarea de
numerale (un număr scris în litere ocupă patru-șase cuvinte, două în aceeași
propoziție înseamnă că primul e pierdut), cuvântul de conținut repetat la mai
puțin de opt cuvinte distanță, coada scurtă și fără verb după ultima virgulă,
propoziția lungă fără nicio virgulă, cliticele lipite, „în cam" în loc de „cam
în", și unitatea ruptă în două („kilowați oră").

**b. Agentul `corector-ro`.** Îi dai calea către `script.txt` și **nimic
altceva**. Nu-i spui subiectul reelului, nu-i spui ce vrei să demonstrezi, nu-i
dai `cifre.md`. Ăsta e tot rostul lui: cine a scris propoziția o aude cum a
gândit-o, nu cum sună. Agentul n-are contextul, deci aude ce aude omul care
derulează.

Întoarce TRECE / PICĂ pe fiecare propoziție, cu rescriere la fiecare picată.
Rescrierile nu se acceptă automat: dacă schimbă o cifră sau adaugă informație,
se refuză și se rescrie de mână.

Abia după ce trec amândouă se trimite scriptul userului, și abia după aprobarea
lui se generează vocea. Motivul e bani și timp: vocea și render-ul costă, textul
nu.

## Pasul 3. Capturile de ecran

Capturile se fac cu `social/remotion/capture-shots.mjs`, care rulează Playwright
cu emulare de iPhone (viewport 393 px, deviceScaleFactor 3) pe site-ul **public**:

```bash
cd social/remotion
NODE_PATH=../../node_modules node capture-shots.mjs "../<folder-săptămână>/<folder-reel>/shots.json"
```

Manifestul (`shots.json`) descrie fiecare captură: `url`, `steps` (fill, click,
waitFor, scroll, scrollTo, wait), `clip` sau `full`. Rezultatul intră în
`public/shots/`, iar dimensiunile reale ajung în `capturi.json`, de unde le iei
pentru `PhoneScroll`.

Reguli:

- **Ecrane reale, nu mockup-uri.** Dacă ecranul nu există încă, nu e reel încă.
- **Niciun nume de firmă terță lângă ceva negativ.** Registrul ANRE afișează și
  atestate „Retras" sau „Expirat" pentru firme reale, cu numele lor. Alea nu intră
  în cadru. Decupează deasupra numelui sau alege un ecran cu stare validă.
- **Nicio dată personală.** Nici telefon de firmă, nici date de client. Pentru
  ecrane care cer autentificare, cont demo șters imediat după (vezi
  `2026-08-w2-10-16/2026-08-11-portal-instalatori/nota-capturi.md`).
- Capturile lungi (`full: true`) sunt pentru `PhoneScroll` și pentru fundaluri.

## Pasul 4. Vizualul

Primitivele sunt în `social/remotion/src/lib.tsx`:

| Când | Ce folosești |
|---|---|
| text mare peste context vizual | `ScreenshotBackdrop` (captura blurată și întunecată, `dim` 0.72-0.9) |
| „uite ecranul despre care vorbesc" | `PhoneFrame` (captură statică, Ken Burns lent) |
| „uite unde dai și ce apare" | `PhoneScroll` (captura lungă se derulează în ramă) |
| „uite exact linia asta" | `Spotlight` peste `PhoneScroll`/`PhoneFrame`, cu `label` |
| cifre | `CountUp` + bară, pornite **pe cadrul în care vocea rostește cifra** |

Poziția lui `Spotlight` se calculează, nu se ghicește: înălțimea randată a
capturii = `lățime_interioară × srcH / srcW`, cursa = `randată − înălțime_ramă`.
Apoi verifici pe un frame extras.

## Pasul 5. Vocea

```bash
python3 ~/.claude/skills/narrated-video/scripts/generate_voice.py \
  --script social/<folder>/script.txt \
  --outdir social/remotion/public/voice-<slug> \
  --timeline social/remotion/src/timeline-<slug>.json
```

Default-urile validate: tempo 1.12, gap 0.28, lead 0.5, tail 1.0. SFX rare și
variate, maximum unul la 4 secunde, un singur whoosh pe tot reelul.

## Pasul 6. Verificarea (obligatorie, înainte să arăți ceva)

1. `ffprobe` pe MP4: durata = `timeline.total`, există stream audio.
2. Extrage un frame din fiecare scenă și **uită-te la ele**:
   - textul nu se rupe urât și nu iese din chenar (CTA-ul cu URL e recidivist);
   - `Spotlight` cade pe elementul corect;
   - animațiile de intrare sunt terminate în frame-ul reprezentativ, altfel
     culorile par murdare la jumătatea spring-ului.
3. **Geist: „I" majuscul se citește „l".** Evită „Ia" în text mare, scrie „Preia".
4. Citește scriptul cu voce tare încă o dată, cu videoul pe mut.

## Pasul 7. Livrarea

În folderul reelului: `script.txt`, `cifre.md`, `shots.json`, `capturi.json`,
`reel-voce.mp4`, `caption-facebook.txt`, `caption-instagram.txt`,
`caption-tiktok.txt`, `caption-youtube.txt`, `titlu-youtube.txt`,
`comentariu-facebook.txt`, `bio-link.txt`.

Caption-urile: Facebook fără hashtag-uri, Instagram cu; „Păstrăm legătura 📞" la
final pe Facebook; linkurile în primul comentariu pe Facebook, în bio pe Instagram.
Disclaimerele scoase din voce se pun aici.

Statusul publicării e tabul „Social" din Sheets, nu `data/social-schedule.json`.
Folderul `social/` nu se comite.

---

## Seria de luni: „Ce e nou?"

Rezumatul săptămânal pentru instalatori (postat luni dimineață) e o serie cu
identitate fixă, din 17 august 2026. Aceleași trei rânduri pe reel și pe poster:

```
SĂPTĂMÂNA N DIN <LUNA>     (etichetă amber)
Ce e nou?                  (întrebarea care se repetă)
17 - 23 august             (intervalul raportat)
```

Șablonul complet (compoziție, script, captions, manifest de capturi, regulile care
nu se negociază) e în `social/_template-rezumat-saptamanal/`. Instanța de referință,
cu cifre reale, e ediția din 17 august 2026.

Reelul deschide cu `SeriesCover` din `social/remotion/src/lib.tsx` (etichetă,
întrebare, interval, plus o captură generică din platformă într-o ramă de telefon).
Cifrele din scene se citesc din `src/cifre-<slug>.json`, scris de
`weekly-summary.mjs --json`, ca să nu fie retastate la fiecare ediție.
Posterul primește același cap de afiș din `scripts/compose-posters.py`, unde
eticheta se calculează singură: `(zi_de_început - 1) // 7 + 1`.

**N e a câta luni a lunii e ziua de început a săptămânii RAPORTATE**, nu ziua
postării: ediția de luni 17 august raportează 10-16 august, deci „SĂPTĂMÂNA 2 DIN
AUGUST". Aceeași numerotare ca folderele `social/YYYY-MM-wN-DD-DD`. Motivul: vocea
spune „săptămâna trecută", iar o etichetă cu săptămâna curentă s-ar contrazice cu
ce se aude.

**Captura de pe copertă e generică pe intenție** (capul paginii `/cereri`, fără
carduri de partener și fără numere de telefon în cadru), ca să se refolosească de la
o ediție la alta fără recaptură săptămânală.

### Cifrele: două categorii, tratate diferit

| Categorie | Unde intră | De ce |
|---|---|---|
| bilanțul săptămânii, fixat duminică seara | voce, poster, caption | un reel postat nu se mai corectează |
| starea de moment (liber acum, locuri rămase) | doar caption | se schimbă de la o oră la alta |

`scripts/weekly-summary.mjs` numără revendicările ținute **la închiderea
săptămânii**. Înainte de fixul din 17 august număra „acum", iar aceeași săptămână a
dat 5 preluate / 3 libere, apoi 6 / 2 la 40 de minute distanță, pentru că o firmă
revendicase între timp. Scriptul citește `Leads!A:V` și aplică filtrele din
`lib/sheets.ts`: „Ascuns" (col. M) și `LEAD_CLOSED_STATUSES` (col. V). Cifra de
context se verifică pe `/cereri` („N cereri primite, M încă disponibile"): dacă nu
dă la fel, ceva e ascuns sau închis și nu ai văzut-o.

### Argumentul recurent pentru instalatori

Urgența vine din regulă, nu din adjective: `MAX_CLAIMS_PER_LEAD = 3`, deci o cerere
revendicată o dată mai are două locuri („revendicată ≠ luată"). Nicio cerere plină
(3 din 3) nu se numește pe județ în reel: ar trimite oameni exact spre ce nu mai pot
lua.
