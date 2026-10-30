/* eslint-disable */
// Batch 2026-10-28 — 1 listare inbound prin formularul /listeaza-firma (NU pipeline discovery).
// Rândul 28 din tabul „Listări", „Nou", trimis pe 28.10.2026 la 14:46 de Blaga Daniel,
// administrator (contact@sunbit.ro, 0757 793 959). Formularul a bifat: specializare „agricol",
// segment „ambele", fără interes pentru Premium, a aflat din Google (intrat pe /firme/judet/alba).
// Descrierea din formular e textul de pe homepage-ul lor.
// Publicată pe 30.10.2026, după apelul cu administratorul, cu fișa neschimbată față de 28.10.
//
// ── SUN BIT (CUI 32562066) ─────────────────────────────────────────────────
// ANAF (interogare directă 28.10.2026): SUN BIT S.R.L., înregistrată 09.12.2013,
// J2013000768012, CAEN 4321 (lucrări de instalații electrice), plătitoare de TVA din
// 01.06.2025, fără TVA la încasare, activă, fără inactivări. Sediu: Sat Craiva, Com. Cricău,
// nr. 18, jud. Alba, 517266 (~10 km de Alba Iulia).
//
// ISTORIC: până în 2022 firma se numea WOW COMPUTER SRL (service calculatoare, CAEN 9511).
// Bilanțul 2023 apare deja ca SUN BIT. Bilanțul 2025 are încă CAEN 9510 (repararea
// calculatoarelor) ca activitate principală, deși registrul ANAF are acum 4321. Saltul de
// cifră de afaceri din 2025 și înregistrarea în scopuri de TVA din iunie 2025 se potrivesc cu
// trecerea pe fotovoltaice; site-ul e făcut în aug-sept 2026. Istoricul nu intră în profil.
//
// SITE: sunbit.ro are în footer „© 2026 SUN BIT S.R.L.", același telefon (+40 757 793 959) și
// emailul din formular, deci e site-ul aceleiași entități. Pagina de Facebook: facebook.com/sunbit.ro.
//
// ANRE: FĂRĂ ATESTAT ȘI FĂRĂ CERERE. Registrul live (portal.anre.ro, descărcat integral pe
// 28.10.2026, 9.935 de operatori) nu are nicio intrare după nume (SUN BIT, SUNBIT, WOW
// COMPUTER), telefon sau localitate (Craiva, Alba). Nici snapshotul nostru nu o are. Coloana M
// din „Listări" zice `not-found`, de data asta corect. Site-ul nu pomenește nicăieri ANRE,
// dosarul de prosumator sau racordarea. `anreMatch: null`, fără insignă.
//
// AFM: NU apare în data/casa-verde-installers.json. Fără tag `casa-verde`.
//
// LUCRĂRI DOCUMENTATE (sunbit.ro/proiecte, fiecare cu pagină, locație, echipamente și poze):
//   - Alba Iulia: 30 kWp la sol (structură metalică), Deye 30 kW trifazic, Canadian Solar
//   - Alba Iulia: 20 kWp pe acoperiș, Deye 30 kW trifazic, stocare 96 kWh LiFePO4
//   - Râmeți: 15 kWp, Deye 15 kW trifazic, 32 kWh (2026)
//   - Poșaga: 11 kWp la sol, Deye 12 kW trifazic, 32 kWh (2026)
//   - Micești (Alba Iulia): 11 kWp, Deye 15 kW trifazic, 32 kWh (2026)
//   - Șard: 11 kWp acoperiș + structură, Deye 12 kW, 16 kWh (2026)
//   - Șard: 11 kWp, Deye 12 kW, 17 kWh (2026)
//   - Aiud: 11 kWp, Deye 12 kW, 17 kWh
//   - Alba Iulia: 11 kWp pe locuință, Deye 12 kW monofazic, 16 kWh
// Toate cu panouri Canadian Solar. Tipul proprietății e scris doar la unele („locuință
// rezidențială"); la 20 și 30 kWp nu scrie dacă e casă, fermă sau firmă.
//
// CIFRE DE PE SITE CARE NU INTRĂ ÎN PROFIL: „peste 10 ani de experiență în domeniul electric"
// (firma a fost service IT până în 2022; poate fi experiența administratorului, de întrebat),
// „mărci de top" (Fronius, Huawei, LONGi, Victron apar doar în bandă, lucrările sunt toate
// Deye + Canadian Solar). `projectsCompleted: 0`, ca la celelalte listări.
//
// SEGMENT: `rezidential`, deși formularul a ales „ambele" și specializarea „agricol". Site-ul
// are o carte „Sistem comercial" (firme, hale, spații comerciale) și pomenește „fermă" la
// contact, dar nicio lucrare documentată nu e comercială sau agricolă. Se schimbă în `ambele`
// (+ `agricol`) dacă la apel confirmă lucrările de 20/30 kWp ca firmă sau fermă. Precedent:
// Prokonstrukt (26 oct).
//
// COVERAGE: doar Alba. Site-ul zice „Alba Iulia, județul Alba și județele învecinate", dar nu
// numește niciun alt județ și toate lucrările sunt în Alba. De întrebat la apel.
//
// CAPACITY: max 30 (lucrarea de 30 kWp la sol din Alba Iulia), min 0 (face rezidențial).
// Vezi feedback „capacitate = cea mai mare lucrare documentată".
//
// EMPLOYEES: 1, din bilanțul 2025 (ANAF, webservicesp.anaf.ro/bilant).
//
// FINANCIALS: bilanțuri ANAF sub numele SUN BIT (2022 și înainte: WOW COMPUTER, nu intră):
//   2023: CA 13.100 / pierdere 2.401 / 1 salariat
//   2024: CA 146.829 / profit 21.054 / 1 salariat
//   2025: CA 541.732 / profit 101.092 / 1 salariat. Capitaluri 130.480, datorii 8.765,
//         stocuri 45.806 lei.
//
// LOGO: /wp-content/uploads/2026/08/logo-sunbit.png.png de pe sunbit.ro (1536×1024 RGBA
// transparent: soare, casă cu panouri, „SUNBIT", „Sisteme fotovoltaice complete"), decupat
// pe conținut, redus la 480×292 și cuantizat la 256 de culori (21 KB).
// public/logos/sun-bit.png.
//
// CONTACT PUBLIC: telefonul și emailul de pe site (aceleași ca în formular).

const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'sun-bit',
    slug: 'sun-bit',
    name: 'Sun Bit',
    cui: 'RO32562066',
    logo: '/logos/sun-bit.png',
    description:
      'Sun Bit este o firmă din satul Craiva, comuna Cricău, lângă Alba Iulia, care proiectează și montează sisteme fotovoltaice în Alba Iulia și în restul județului Alba. Lucrează cu panouri Canadian Solar și invertoare Deye, iar cele mai multe sisteme pe care le prezintă sunt hibride, cu baterii LiFePO4. Lucrările documentate pe site merg de la sisteme de 11 kWp cu 16 până la 32 kWh de stocare, în Șard, Aiud, Poșaga, Micești și Alba Iulia, și unul de 15 kWp în Râmeți, până la un sistem de 20 kWp cu 96 kWh de stocare și unul de 30 kWp montat pe structură metalică la sol, ambele în Alba Iulia. Panourile se montează pe acoperiș sau pe structuri la sol. Pe lângă montajul la cheie, firma face instalații electrice și tablouri, configurează invertoare, integrează pompe de căldură și se ocupă de diagnoză, reparații și mentenanță pentru sistemele existente. Cifra de afaceri a ajuns la 0,54 milioane de lei în 2025, de la 0,15 milioane în 2024.',
    founded: 2013,
    employees: 1,
    location: {
      city: 'Craiva',
      county: 'Alba',
      address: 'Sat Craiva, Com. Cricău, Nr. 18'
    },
    contact: {
      phone: '+40757793959',
      email: 'contact@sunbit.ro',
      website: 'https://www.sunbit.ro'
    },
    coverage: ['Alba'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 30, projectsCompleted: 0 },
    financials: {
      year: 2025,
      revenue: 541732,
      profit: 101092,
      history: [
        { year: 2023, revenue: 13100, profit: -2401, employees: 1 },
        { year: 2024, revenue: 146829, profit: 21054, employees: 1 },
        { year: 2025, revenue: 541732, profit: 101092, employees: 1 }
      ]
    },
    tags: [
      'pv-rezidential',
      'on-grid',
      'off-grid',
      'hibrid',
      'stocare-baterii',
      'pompe-caldura',
      'instalatii-electrice',
      'mentenanta-pv'
    ],
    featured: false,
    verified: true,
    createdAt: '2026-10-30',
    updatedAt: '2026-10-30',
    segment: 'rezidential',
    anreMatch: null
  }
];

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const existingCuis = new Set(data.companies.map(c => String(c.cui).replace(/^RO/, '')));
const toAdd = newCompanies.filter(c => !existingCuis.has(String(c.cui).replace(/^RO/, '')));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);
