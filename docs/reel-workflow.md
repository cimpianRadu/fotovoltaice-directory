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
