/* eslint-disable */
// Batch 2026-10-26 — 1 listare inbound prin formularul /listeaza-firma (NU pipeline discovery).
// Rândurile 26 și 27 din tabul „Listări", ambele „Nou", aceeași firmă trimisă de două ori:
// 24.10.2026 05:39 și 25.10.2026 07:54, de Florian Cernea, manager
// (exclusiveprokonstruktinvest@outlook.com, 0734 070 429). A doua oară a scris și o descriere.
// Formularul a bifat: specializare „parcuri-logistice", apoi „hale-industriale", segment
// „comercial", a aflat din Google (intrat pe /cereri, apoi pe /firme/judet/timis).
//
// ── EXCLUSIVE PROKONSTRUKT INVEST (CUI 52942159) ─────────────────────────────
// ANAF (interogare directă 26.10.2026): EXCLUSIVE PROKONSTRUKT INVEST S.R.L., înregistrată
// 18.11.2025, J2025089465005, CAEN 4322 (instalații sanitare, de încălzire și aer condiționat,
// NU 4321), plătitoare de TVA din 16.12.2025, TVA la încasare din 01.01.2026, activă, fără
// inactivări. Sediu Cal. Dorobanților nr. 20, birou 1, et. V, ap. 27, Timișoara 300298.
// Telefonul de la ANAF (0734070429) e și cel din formular și de pe site.
//
// SITE: prokonstrukt.ro are în footer „© 2026 Exclusive Prokonstrukt Invest S.R.L." și același
// telefon, deci e site-ul aceleiași entități. Brand: „Prokonstrukt Solar".
//
// ANRE: FĂRĂ ATESTAT EMIS. Registrul live (portal.anre.ro, 26.10.2026) are „EXCLUSIVE
// PROKONSTRUKT INVEST", Timișoara, adresa de la ANAF, cu un singur rând: „Tarif B", fără număr,
// date 01/01/001, stare „Inregistrare" (cerere depusă). Snapshotul nostru (11 sept) nu are
// firma deloc. Coloanele M-O din „Listări" ziceau „verified-pv, INVEST, ANRE B": potrivire
// greșită după nume cu firma „INVEST" din Timișoara (atestat B 21936), reparată în lib/anre.ts
// în același commit. `anreMatch: null`, deci fără insignă ANRE până primesc atestatul și
// reîmprospătăm registrul.
//
// AFM: NU apare în data/casa-verde-installers.json. Fără tag `casa-verde`.
//
// CE FAC (de pe site): exclusiv rezidențial. Trei pachete la cheie: 5-6 kW monofazat, 10 kW
// trifazat, 10-15 kW cu baterie LiFePO4 de 5-10 kWh și backup EPS. Invertor hibrid, aplicație
// de monitorizare, dosar de prosumator inclus, plata integrală după recepție („zero avans").
// Prețurile NU intră în profil. Footerul zice „rezidențiale și industriale", dar nu există nicio
// lucrare comercială sau industrială pe site, deci specializarea bifată în formular
// (hale/parcuri logistice) nu intră până nu o confirmă la telefon.
//
// CIFRE DE PE SITE CARE NU INTRĂ ÎN PROFIL: „Peste 100 de proprietari reali în Banat", „5.0
// din 5 stele", „100 de recenzii". Recenziile se publică dintr-un formular deschis de pe propriul
// site, deci nu sunt verificate de terți, iar firma nu avea cifră de afaceri la 31.12.2025.
// „25 ani garanție" și „montaj 48h" sunt promisiuni comerciale. `projectsCompleted: 0`.
//
// EMPLOYEES: 0, din bilanțul 2025 (ANAF, webservicesp.anaf.ro/bilant).
//
// FINANCIALS: bilanț 2025 (ANAF), primul exercițiu, o lună și jumătate:
//   2025: CA 0 / pierdere netă 13.713 / 0 salariați. Capitaluri -11.713, datorii 39.665,
//   stocuri 23.734 lei.
//
// COVERAGE: Timiș și Arad, singurele județe numite pe site (recenziile și textele despre Banat).
// Meta description zice și „toată România", nu punem `acoperire-nationala`.
//
// SEGMENT: `rezidential` (tot ce e documentat), deși formularul a ales „comercial".
//
// CAPACITY: min 5, max 15 (pachetele de pe site).
//
// LOGO: /assets/icons/logo-emblem.png de pe prokonstrukt.ro, PNG RGBA transparent 192×192,
// hexagon auriu cu casă, panou și fulger, lizibil pe card alb.
// public/logos/exclusive-prokonstrukt-invest.png.
//
// CONTACT PUBLIC: telefonul firmei (site + ANAF) și emailul din formular; site-ul nu publică email.

const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'exclusive-prokonstrukt-invest',
    slug: 'exclusive-prokonstrukt-invest',
    name: 'Exclusive Prokonstrukt Invest',
    cui: 'RO52942159',
    logo: '/logos/exclusive-prokonstrukt-invest.png',
    description:
      'Exclusive Prokonstrukt Invest este o firmă din Timișoara, înființată în noiembrie 2025, care montează sisteme fotovoltaice la cheie pentru locuințe din județele Timiș și Arad, sub numele Prokonstrukt Solar. Oferă pachete de 5 până la 15 kW cu invertor hibrid și aplicație de monitorizare a producției, iar la varianta cu stocare adaugă o baterie LiFePO4 de 5 până la 10 kWh, cu alimentare de rezervă la căderea rețelei. Dosarul de prosumator este inclus în pachet. Firma anunță că montajul se face cu echipa proprie și că lucrarea se plătește integral după recepția tehnică, fără avans. A depus cererea pentru atestatul ANRE de tip B, care la 26 octombrie 2026 figura în registrul ANRE ca înregistrată, fără atestat emis.',
    founded: 2025,
    employees: 0,
    location: {
      city: 'Timișoara',
      county: 'Timiș',
      address: 'Calea Dorobanților nr. 20, et. V, ap. 27, birou 1, Timișoara 300298'
    },
    contact: {
      phone: '+40734070429',
      email: 'exclusiveprokonstruktinvest@outlook.com',
      website: 'https://www.prokonstrukt.ro'
    },
    coverage: ['Timiș', 'Arad'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 5, maxProjectKw: 15, projectsCompleted: 0 },
    financials: {
      year: 2025,
      revenue: 0,
      profit: -13713,
      history: [
        { year: 2025, revenue: 0, profit: -13713, employees: 0 }
      ]
    },
    tags: [
      'pv-rezidential',
      'prosumator',
      'hibrid',
      'stocare-baterii',
      'monitorizare-inclusa'
    ],
    featured: false,
    verified: true,
    createdAt: '2026-10-26',
    updatedAt: '2026-10-26',
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
