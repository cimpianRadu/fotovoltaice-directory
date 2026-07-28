# Plan monetizare, august - septembrie 2026

> Rezultatul sesiunii de grilling din 28 iulie 2026. Toate cifrele de mai jos sunt măsurate, nu estimate. Vocabularul e cel din [CONTEXT.md](../CONTEXT.md).

## Ținta

**~1000 RON pe lună, recurent, până la 30 septembrie 2026.**

La tierurile existente de pe `/publicitate` înseamnă 5 firme × 39 EUR. Din 183 de firme listate, sub 3% trebuie să spună da. Nu e o problemă de trafic, e o problemă de cinci conversații de vânzare duse până la capăt.

## Ce am aflat pe 28 iulie

### Cereri

| | |
|---|---|
| Total | 24, între 19 iunie și 24 iulie |
| Ritm | 0,69 pe zi |
| Ritm fără nicio postare (19 iun - 5 iul) | 0,41 pe zi |
| Ritm în perioada cu postări (6 - 28 iul) | 0,74 pe zi |
| Segment | 19 rezidențial, 5 comercial |
| Județe | Timiș 6, Ilfov 4, Prahova 3, Ialomița 2, Constanța 2, apoi 7 județe cu câte una |
| Secetă | zero cereri între 25 și 28 iulie, peste cea mai intensă perioadă de postare |

Vârful de 3 cereri din 22 iulie NU e efectul postării #13. Postarea a fost făcută *despre* cererile intrate în aceeași zi. Cauzalitate inversă.

### Firme

- **25 de revendicări, din care 22 sunt JTS**, toate în 23-24 iulie. GMM 2, Happyvolt 1. 22 din 24 de cereri revendicate, practic de o singură firmă.
- Revendicările încep pe 23 iulie, imediat după seria de postări B2B #12 (21 iul), #13 (22 iul), #14 (23 iul). Corelația e în ordinea corectă, spre deosebire de cea de la cereri.
- **13 listări inbound** în total, 5 doar în iulie.
- **Zero cereri pe `/publicitate`** de la lansare, 8 mai. Unsprezece săptămâni.

### Canale

- **73% din trafic vine din Google**, la ~2.470 vizite pe lună (cifre din `scripts/outreach.mjs`, actualizate 1 iulie 2026).
- **Emailul către firme e mort:** 81 de trimiteri către 50 de firme în iulie, 75 livrate, 6 respinse, **zero răspunsuri**. DNS-ul e corect (DKIM verificat, SPF pe `send.`, DMARC `p=none`, MX Google), deci nu e o problemă tehnică.
- Singurul mecanism care a convertit vreodată e cel self-serve: butonul de revendicare de pe `/cereri`.

### Concluzia care organizează tot

**Google aduce cererile. Facebook aduce firmele.** Cele două laturi au canale diferite și se lucrează diferit.

## Produsul

**Exclusivitate pe județ, 39 EUR pe lună, fără angajament.**

O singură firmă per județ primește toate cererile din județ, cu datele de contact, în momentul în care intră. Feedul `/cereri` rămâne public și gratuit, cu întârziere, ca firma neabonată să vadă mereu ce a pierdut.

**De ce 39 și nu 99:** vinzi fără nicio dovadă de conversie. La 99 prima întrebare e „câți clienți mi-ai adus", și nu ai răspuns. La 39 întrebarea nu se pune. Și ai nevoie de 5 clienți, nu de 2, pentru că îți trebuie relații și dovezi, nu doar bani.

**De ce lunar, fără contract:** exclusivitatea pe județ la 39 EUR blochează valoarea județului la 39 EUR. Cât timp e lunar, prețul se reașază în ianuarie, când există cifre.

**Ancora de piață, ca să știi împotriva cui vinzi:** Afacerist.ro, singurul director RO cu preț public, cere ~8,5 EUR pe lună (GOLD, 508 RON pe an). Ceri de aproape cinci ori mai mult. Dacă firma aude „listare într-un director", apelul e pierdut din prima propoziție. Nu vinzi vizibilitate, vinzi numărul de telefon al unui om care vrea panouri. Detalii în [pricing-comparables.md](pricing-comparables.md).

## Riscul principal

Nu vânzarea, ci **retenția**. Scenariul care omoară planul: firma plătește, primește o cerere în luna 1, nu se închide nimic, renunță în luna 2. La 1-2 cereri pe județ pe lună, scenariul e probabil, nu marginal.

De aici concentrarea pe Timiș, Ilfov și Prahova: sunt singurele județe cu urmă de densitate. Un județ cu o cerere în cinci săptămâni nu se poate vinde nimănui, indiferent de preț.

## Secvența

### Pasul 0, înainte de orice vânzare: aflarea conversiei

Suni **5 clienți înainte de orice firmă**. Firmele spun ce sună bine, clienții spun adevărul, și e același telefon.

Motivul e mai urgent decât monetizarea: dacă JTS a revendicat 22 de cereri și n-a sunat pe nimeni, atunci 22 de oameni și-au lăsat datele degeaba, iar latura de cerere se usucă din interior.

**Clientului:** te-a sunat cineva, câte firme, ai primit ofertă sau ai semnat ceva.
**Firmei, după:** din cererile luate, câte ai sunat, câte au ajuns la ofertă, vreuna la contract.

**Regula de decizie, fixată înainte de a afla răspunsul:**

| Ce afli | Ce faci |
|---|---|
| Cel puțin un client confirmă contract sau ofertă serioasă | Ai povestea. Începi cele 15 apeluri de vânzare la 39 EUR |
| Au fost sunați, dar nimic închis încă | Normal la 5 săptămâni, ciclul e lung. Nu vinzi încă, crești volumul |
| Majoritatea spun că nu i-a sunat nimeni | Oprești monetizarea. E problemă de livrare, nu de preț. Tai revendicarea în masă |

### Pasul 1: lista de apeluri

Nu cele 183 de firme din director. Cele ~16 care au făcut deja o acțiune de bunăvoie:

- cele 13 firme care au cerut singure listare (5 în iulie: VELIS, PowerSense, JTS, plus GMM și VTL)
- cele 3 care au revendicat cereri (JTS, GMM, Happyvolt)

Rata de răspuns la o listă auto-selectată n-are nicio legătură cu cea la 183 de adrese `office@` reci. Ținta: 10 apeluri pe săptămână, trei săptămâni.

Deschidere utilă: 50 de firme au văzut deja numele tău în inbox în iulie, chiar dacă n-au răspuns.

### Pasul 2: distribuția devine telefonică

Blastul automat către 5 firme per cerere e **oprit** din 28 iulie (`NOTIFY_FIRMS = false` în `scripts/outreach.mjs`). Confirmarea către client rămâne activă.

Înlocuitorul: suni **o singură firmă** per cerere. La 0,7 cereri pe zi înseamnă ~21 de apeluri pe lună, unul pe zi lucrătoare. Apelul face trei lucruri deodată: distribuie cererea, verifică dacă firma chiar sună clientul, și e o conversație de vânzare fără să pară una.

## Ce se construiește

**Doar captarea sursei.** Referrer + UTM la trimiterea formularului, în coloane noi la finalul tabului Leads, după U, ca să nu se spargă contractul de coloane.

Astăzi coloana „Sursa" e o valoare implicită hardcodată: `lead.sourcePage || 'cere-oferta'` în `lib/sheets.ts`, iar nimic nu trimite vreodată `sourcePage`. Toate cele 24 de cereri scriu „cere-oferta" pentru că ăla e fallback-ul. **Atribuire zero.**

**Capcana de implementare:** pe IG și TikTok nu există linkuri clicabile în postare. Omul vine din bio, aterizează cu `?utm_source=tiktok` pe o pagină oarecare, apoi navighează spre `/cere-oferta`. La submit, parametrii nu mai sunt în URL. Dacă implementarea citește doar query-ul paginii curente, va scrie gol la fiecare cerere din TikTok și vei concluziona greșit că TikTok nu aduce nimic.

Corect: la prima încărcare din sesiune se salvează `document.referrer` și parametrii UTM în `sessionStorage`, iar formularul trimite valorile alea.

## Ce NU se construiește

**Livrarea automată către firma plătitoare.** La 5 clienți și 1-2 cereri pe județ pe lună vorbim de vreo 10 mesaje pe lună. Se fac manual în cinci minute pe săptămână.

Livrarea manuală nu e un compromis temporar, e **instrumentul de research pentru august și septembrie**: fiind tu cel care sună firma, afli pe loc dacă lucrarea s-a închis, adică exact dovada care lipsește ca să vinzi mai departe și mai scump. Se automatizează când numărul de mesaje devine enervant, nu înainte.

## Postări

Regula din 20 iulie (CTA primar `/cere-oferta` pe fiecare postare) **rămâne în picioare**, pentru că nu există încă date care s-o infirme. 73% Google nu înseamnă că Facebook nu aduce deloc cereri.

- **Facebook:** rămâne canalul principal, cu postări și pentru clienți, și pentru firme. Formatul low-effort validat cu #14 și #18 (screenshot + caption, zero producție) e cel mai bun raport efort/rezultat pentru partea B2B.
- **Instagram, YouTube Shorts, TikTok:** același master 9:16, un fișier de caption per canal, zero gândire suplimentară. TikTok rămâne pornit: costul marginal e un fișier text, iar 79% din cereri sunt rezidențiale, adică public de masă.
- **Google:** ghiduri și pagini de județ pentru Timiș, Ilfov și Prahova. La 2.470 de vizite pe lună și 21 de cereri, conversia e sub 1%. E mai ieftin să urci conversia pe `/cere-oferta` decât să dublezi traficul.

Nuanță de limbaj, cost zero, valoare mare mai târziu: pe orice postare despre cereri gratuite scrie **„gratuit acum, la început"**, nu doar „gratuit". În octombrie nu vrei să fii cel care a promis gratuit pe vecie.

## Praguri de evaluare

**25 august, prima citire.** Te uiți doar după surprize mari, gen „jumătate din cereri vin din TikTok". La 21 de cereri pe lună împărțite la Google plus patru canale de social, fiecare canal are cifre de o singură cifră. E direcție, nu concluzie.

**22 septembrie, verdict.** Opt săptămâni, exact criteriul de oprire fixat pentru TikTok pe 28 iulie. Aici se decid: canalele care rămân, dacă regula din 20 iulie se răstoarnă, și dacă exclusivitatea pe județ se vinde sau nu.

## Întrebări încă deschise

1. Aduce Facebook și cereri, nu doar firme? Se răspunde din captarea sursei.
2. Produc IG și TikTok ceva? Idem, plus disciplina UTM pe linkul din bio.
3. **A semnat cineva vreun contract dintr-o cerere?** Se răspunde din telefoanele către clienți, săptămâna aceasta. E cea mai importantă dintre cele trei.
