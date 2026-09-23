/* eslint-disable */
// Batch 2026-09-23 — 1 listare inbound prin formularul /listeaza-firma (NU pipeline discovery).
// Rândul 24 din tabul „Listări", status „Nou", depus 22.09.2026 seara de Stefan Iordache
// (stefan@energyfix.ro, 0741 073 111). Formularul a bifat: specializare „retail", ANRE B,
// segment „rezidential", a aflat de noi din Google, a intrat direct pe „/".
//
// Rândul 19 (ALEXLIAN / SolarMount, Bihor) rămâne pe „Nou" din 26 august, decizia e la user.
//
// ── ENERGYFIX (CUI 38389879) ──────────────────────────────────────────────────
// ANAF (interogare directă 23.09.2026): înregistrată 24.10.2017, J40/17905/2017 (format nou
// J2017017905400), CAEN 4321 (lucrări de instalații electrice), plătitoare de TVA din
// 19.10.2022, în RO e-Factura din 01.05.2024, sediu Str. Șoimuș nr. 49, Sector 4, București,
// cod 040705. Istoric de ținut minte, nu de publicat: inactivată fiscal 06.08.2020 →
// reactivată 13.10.2020; TVA anulat din oficiu de două ori (2020 și 2022) înainte de
// înregistrarea curentă. Bilanțurile 2017-2023 sunt de firmă mică (sub 330 mii lei/an),
// activitatea fotovoltaică serioasă începe în 2024.
//
// SITE: energyfix.ro publică pe /contact „ENERGYFIX SRL, CUI 38389879, Reg. Com.
// J40/17905/2017, Sediu social: București, Sector 4, Str. Șoimuș, Nr.49", deci e site-ul
// aceleiași entități, nu sister site. Are și magazin online shop.energyfix.ro (OpenCart:
// panouri Jinko, Canadian Solar, Hyundai, AIKO; invertoare Deye, Solis; Victron; baterii
// Deye, V-TAC, Felicity; structuri și accesorii, livrare în toată țara).
//
// ANRE: potrivire sigură. Registrul are „ENERGYFIX", jud. Bucuresti, „Str. Soimus nr. 49,
// sect. 4", adică adresa de la ANAF. Telefonul din registru (0747620217) diferă de cel din
// formular (0741073111) și de cel public de pe site (0743454164), dar adresa + numele unic
// sunt suficiente. Atestat ACTIV:
//   18981 Tarif B, emis 19.01.2023, expiră 19.01.2028
// Tip B = execuție instalații electrice de joasă tensiune, adică exact montaj PV rezidențial
// și comercial mic. Nu au C1A/C2A, deci fără medie tensiune.
//
// AFM: NU apare în data/casa-verde-installers.json (521 firme validate). Site-ul are o pagină
// /casa-verde care e doar listă de așteptare pentru 2026 („te ținem la curent când se deschid
// înscrierile"), nu o validare. Fără tag `casa-verde`.
//
// CE FAC (de pe site, verificat pe pagini separate):
//   - Kituri la cheie cu montaj inclus, 6 / 8 / 10 mono / 10 tri / 12 kW, prețuri publicate
//     (19.490 - 36.990 lei în septembrie 2026), panouri Canadian Solar 505 W (textul de jos
//     zice Hyundai N-Type HJT, se schimbă în funcție de stoc), invertoare hibride Deye,
//     structură Hangerbolt inox + bară H aluminiu. Baterii V-TAC 5,12 / 10 kWh și Felicity
//     16 kWh cu montaj gratuit. Prețurile NU intră în profil (se schimbă).
//   - Rate prin TBI Bank, fără avans (pagină dedicată).
//   - Dosar de prosumator inclus, măsurare priză de pământ și PRAM.
//   - Mentenanță sisteme fotovoltaice (pagină dedicată).
//   - Pagină de soluții industriale: hale, fabrici, depozite logistice, centre comerciale,
//     ferme; „exemple de sisteme 50-500 kWp", stocare LiFePO4 modulară 50-500 kWh și BESS
//     peste 1 MWh. Sunt oferte, NU lucrări documentate: nicio lucrare industrială cu nume,
//     loc sau putere pe site. Instagram zice „sisteme de 20-100 kWp" pentru spații
//     comerciale, tot fără exemplu concret.
//   - Singura lucrare documentată cu detalii: sistem de 8,5 kWp monofazat (Deye 8 kW,
//     Canadian Solar 425 W N-type TOPCon, smartmeter), pagina /test-3, martie 2024.
//     Portofoliul (/portofoliu-lucrari) are 34 de poze de montaje fără text.
//
// CIFRE DE PE SITE CARE NU INTRĂ ÎN PROFIL:
//   „500+ proiecte instalate" (pagina de kituri, meta description industrial) — neverificabil,
//   și nu se împacă cu bilanțul: 1 salariat și 5,75 mil. lei cifră de afaceri în 2025.
//   `projectsCompleted: 0`. „Reduci costurile cu 50-60%", „amortizare 3-5 ani" sunt promisiuni
//   comerciale, nu date.
//
// EMPLOYEES: 1, din bilanțul 2025 (listafirme.ro, MF). Site-ul zice „echipă proprie" și
// „fără subcontractări", ceea ce cu 1 salariat înseamnă fie colaboratori, fie oameni pe alte
// firme ale administratorului (vezi mai jos). Punem cifra din bilanț, ca la toate firmele.
// De întrebat la telefon.
//
// ADMINISTRATOR: Iordache Ș. (latermen.ro) administrează alte 8 firme, majoritatea din
// grupul MobileFix (service telefoane: MobileFix Brașov, MobileFix Cluj, MobileFix Shop,
// FixMobile Tools, Best Online Business, Evo Trade Solutions, Evotrade Union, IR Tech Prod).
// Explică numele „EnergyFix" și saltul din 2024: e un grup de retail/service care a intrat
// în fotovoltaic. Nu intră în profil. Formularul a fost depus de Stefan Iordache.
//
// FINANCIALS: listafirme.ro (bilanțuri MF, aceleași cifre și pe latermen.ro).
//   2017: 61.912 / 53.767 / 1        2018: 299.947 / 128.076 / 1
//   2019: 321.637 / 165.833 / 1      2020: 0 / -18.372 / 1
//   2021: 112.125 / 55.633 / 1       2022: 1.052 / -95.468 / 1
//   2023: 102.962 / -826 / 1         2024: 898.026 / 23.735 / 1
//   2025: 5.753.948 / 213.245 / 1
// Păstrăm ultimii 5 ani în history. 2022 cu 1.052 lei cifră de afaceri e real (firmă
// practic inactivă în anul ăla), nu eroare de scriere.
//
// COVERAGE: lista e explicită pe site, în FAQ-ul de pe /kituri-fotovoltaice: „acoperim
// Bucureștiul, județul Ilfov și județele limitrofe: Giurgiu, Călărași, Dâmbovița, Prahova
// și Ialomița". Le punem pe toate 7, sunt declarate de firmă, nu deduse.
//
// SPECIALIZĂRI: `rezidential` (kiturile, prosumator, Casa Verde, rate) și `hale-industriale`
// (pagina industrială numește hale, fabrici, depozite). Formularul a bifat „retail", care în
// vocabularul nostru înseamnă magazine/centre comerciale ca tip de clădire; site-ul
// pomenește „centre comerciale" într-o enumerare, prea subțire pentru o specializare.
//
// SEGMENT: `ambele`. Formularul a bifat „rezidential" și aia e clar activitatea principală
// (kituri 6-12 kW, prosumator, rate), dar site-ul vinde explicit și sisteme industriale,
// cu pagină dedicată actualizată pe 22.09.2026 (ziua depunerii). Pe București sunt 5 cereri
// rezidențiale libere pe Ilfov la publicare, deci au ce prelua din prima zi.
//
// CAPACITY: 0 / 0 / 0. Documentat: 8,5 kWp (o lucrare) și kituri până la 12 kW. Un
// `maxProjectKw: 12` i-ar scoate din potrivirea pe cereri comerciale (lead-match ia max
// ca plafon), iar 100 sau 500 nu se susțin cu nicio lucrare. Se completează după apel.
//
// ISO: niciun badge, nicio mențiune. `certifications: []`.
//
// LOGO: logo-1024x303-1.png de pe energyfix.ro (og:image), PNG RGBA transparent, albastru,
// lizibil pe card alb. Descărcat în public/logos/energyfix.png.
//
// CONTACT PUBLIC: telefonul și emailul de pe site (0743 454 164, contact@energyfix.ro), nu
// cele personale din formular (stefan@, 0741...). Emailul de confirmare merge la stefan@.

const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'energyfix',
    slug: 'energyfix',
    name: 'EnergyFix',
    cui: 'RO38389879',
    logo: '/logos/energyfix.png',
    description:
      'EnergyFix este o firmă din București, Sector 4, înființată în 2017, care proiectează, montează și pune în funcțiune sisteme fotovoltaice pentru locuințe și firme din București, Ilfov și județele limitrofe. Deține atestat ANRE tip B nr. 18981, emis în ianuarie 2023 și valabil până în ianuarie 2028. Vinde kituri la cheie cu montaj inclus, de la 6 la 12 kW, monofazate și trifazate, cu panouri Canadian Solar și invertoare hibride Deye, la care se pot adăuga baterii V-TAC sau Felicity. Întocmește și depune dosarul de prosumator, face măsurarea prizei de pământ și eliberează buletinul PRAM, iar sistemele pot fi plătite în rate prin TBI Bank. Pentru firme oferă sisteme pe hale, fabrici, depozite și ferme, cu stocare modulară pe baterii LiFePO4, și servicii de mentenanță pentru sistemele existente. Are și un magazin online, shop.energyfix.ro, cu panouri Jinko, Canadian Solar și Hyundai, invertoare Deye și Solis, echipamente Victron, baterii, structuri și accesorii, cu livrare în toată țara. Cifra de afaceri a crescut de la 0,9 milioane de lei în 2024 la 5,75 milioane de lei în 2025.',
    founded: 2017,
    employees: 1,
    location: {
      city: 'București',
      county: 'București',
      address: 'Str. Șoimuș, Nr. 49, Sector 4, București 040705'
    },
    contact: {
      phone: '+40743454164',
      email: 'contact@energyfix.ro',
      website: 'https://energyfix.ro'
    },
    coverage: ['București', 'Ilfov', 'Giurgiu', 'Călărași', 'Dâmbovița', 'Prahova', 'Ialomița'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: {
      year: 2025,
      revenue: 5753948,
      profit: 213245,
      history: [
        { year: 2021, revenue: 112125, profit: 55633, employees: 1 },
        { year: 2022, revenue: 1052, profit: -95468, employees: 1 },
        { year: 2023, revenue: 102962, profit: -826, employees: 1 },
        { year: 2024, revenue: 898026, profit: 23735, employees: 1 },
        { year: 2025, revenue: 5753948, profit: 213245, employees: 1 }
      ]
    },
    tags: [
      'pv-rezidential',
      'pv-comercial',
      'prosumator',
      'on-grid',
      'hibrid',
      'stocare-baterii',
      'finantare-disponibila',
      'mentenanta-pv',
      'proiectare',
      'magazin-online'
    ],
    featured: false,
    verified: true,
    createdAt: '2026-09-23',
    updatedAt: '2026-09-23',
    segment: 'ambele',
    anreMatch: { societate: 'ENERGYFIX', judet: 'Bucuresti' }
  }
];

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const existingCuis = new Set(data.companies.map(c => String(c.cui).replace(/^RO/, '')));
const toAdd = newCompanies.filter(c => !existingCuis.has(String(c.cui).replace(/^RO/, '')));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);
