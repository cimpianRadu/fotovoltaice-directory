/* eslint-disable */
// Batch 2026-10-09 — 1 listare inbound prin formularul /listeaza-firma (NU pipeline discovery).
// Rândul 25 din tabul „Listări", status „Nou", depus 07.10.2026 dimineața de Cosmin Țigănașu,
// administrator (office@startgreen.ro, 0755 568 617). Formularul a bifat: specializare
// „hale-industriale", ANRE C2A, segment „ambele", a aflat din Google, a intrat pe /clasament.
//
// ── STARTGREEN (CUI 45755590) ─────────────────────────────────────────────────
// ANAF (interogare directă 09.10.2026): STARTGREEN S.R.L., înregistrată 07.03.2022,
// J2022000798228 (J22/798/2022), CAEN 4321, plătitoare de TVA din 01.07.2022, în RO e-Factura
// din 01.02.2024, activă, fără inactivări. Sediu Șos. Moara de Foc nr. 33, bl. 4, et. 2,
// ap. 23, Iași 700520.
//
// SITE: startgreen.ro/contact publică „STARTGREEN SRL, CUI: 45755590, Nr. Registrul
// Comerțului: J22/798/2022, Sediu social: Șoseaua Moara de Foc nr. 33, Iași, Punct de lucru:
// Șoseaua Păcurari nr. 151, Iași", deci e site-ul aceleiași entități.
//
// ANRE: potrivire sigură. Registrul are „STARTGREEN", jud. Iasi, „Sos. Moara de Foc Nr 33
// Bl:4 Et:2 Ap:23", adresa de la ANAF. Atestate ACTIVE:
//   21043 Tarif C2A, emis 03.10.2023, expiră 03.10.2028
//   21092 Tarif D1,  emis 26.10.2023, expiră 26.10.2028
//   21093 Tarif E1,  emis 26.10.2023, expiră 26.10.2028
// Retrase (înlocuite de C2A, care le include competențele): 18385 C1A, 18568 Be, din 2022.
// D1/E1 nu sunt relevante PV în lib/anre-shared.ts, nu le detaliem în descriere. Site-ul
// publică scanările C2A și E1/D1.
//
// AFM: NU apare în data/casa-verde-installers.json. Pagina /program-casa-verde-2026-start-green
// e un ghid informativ pentru Casa Verde Baterii, nu o validare. Fără tag `casa-verde`.
//
// CE FAC (de pe site, verificat pe pagini separate):
//   - Kituri la cheie 3 / 5 / 7 kW cu invertor hibrid, panouri Longi, Trina sau Canadian
//     Solar, baterie LiFePO4 opțională, cu proiect, montaj și dosar de racordare (certificat
//     de racordare), garanție de execuție 24 luni. Prețurile NU intră în profil.
//   - Branșamente electrice JT/MT, proiectare (ATR, contract de racordare, dosar instalație,
//     punere sub tensiune), stații de încărcare EV, consultanță, mentenanță și curățare panouri.
//   - Echipamente pomenite: Canadian Solar, Sungrow, Huawei, Solis, Solplanet, Schneider, Eaton.
//
// LUCRĂRI DOCUMENTATE (/proiecte-fotovoltaice, cu poze, loc și echipamente):
//   - Wonder Drift, Iași: sistem industrial 250 kW, Canadian Solar + 2× Solis 125 kW, cu
//     stocare și monitorizare SolisCloud.
//   - Parc fotovoltaic Tomești (Iași): 320 kW, 780× Canadian Solar 455 W, 6× Solplanet 50 kW.
//   - Infrastructură EV comuna Holboca: 8 stații (4 DC 60+22 kW, 4 AC 2×22 kW), turnkey.
//
// CIFRE DE PE SITE / DIN FORMULAR CARE NU INTRĂ ÎN PROFIL:
//   „Peste 100 MW capacitate fotovoltaică totală proiectată și instalată" (formular) — nu se
//   împacă cu bilanțul (6,3 mil. lei CA/an; 100 MW instalați ar însemna sute de milioane).
//   Probabil include proiectare/racordări pentru alții; neverificabil. „600+ sisteme montate"
//   (meta description), „150 de companii în mentenanță", „35% reducere costuri", „0
//   incidente" — neverificabile. Pagina „Despre noi" are conținut de template („90k+
//   utilizatori în lume", „Premiul GreenTech 2023/2024/2025", echipa „Coming soon...") și
//   testimoniale cu nume generice (Mihai Popescu, Elena Radu, Adrian Ionescu) — ignorate.
//   `projectsCompleted: 0`.
//
// EMPLOYEES: 17, din bilanțul 2025 (listafirme.ro, MF).
//
// FINANCIALS: listafirme.ro (bilanțuri MF).
//   2022: 705.145 / 184.905 / 1      2023: 3.368.599 / 646.767 / 5
//   2024: 6.337.785 / 926.510 / 13   2025: 6.340.899 / 324.933 / 17
//
// COVERAGE: declarată explicit în FAQ-ul de pe homepage: „servicii la nivel național, cu
// echipe specializate în special în zona Moldovei (Iași, Suceava, Bacău, Neamț, Vaslui,
// Botoșani)". Punem cele 6 județe numite, nu „național".
//
// SPECIALIZĂRI: `rezidential` (kituri 3-7 kW, prosumator) și `hale-industriale` (bifat în
// formular, Wonder Drift 250 kW industrial). Parcul de la Tomești intră ca tag
// `parcuri-fotovoltaice`, nu e specializare în vocabularul nostru.
//
// SEGMENT: `ambele` (formular + site: kituri rezidențiale și lucrări industriale documentate).
//
// CAPACITY: min 3 (cel mai mic kit), max 320 (cea mai mare lucrare documentată).
//
// ISO: site-ul publică certificatele ISO 9001:2015, ISO 14001:2015 și ISO 45001:2018 pe
// numele STARTGREEN SRL.
//
// LOGO: wp-content/uploads/2025/11/logo.png de pe startgreen.ro, PNG RGBA transparent 350×252,
// bec verde cu fulger albastru + „STARTGREEN", lizibil pe card alb. public/logos/startgreen.png.
//
// CONTACT PUBLIC: telefonul „Departament vânzări" din header (0756 735 053) și office@
// (același și în formular). Telefonul personal al administratorului (0755 568 617) nu intră.

const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'startgreen',
    slug: 'startgreen',
    name: 'StartGreen',
    cui: 'RO45755590',
    logo: '/logos/startgreen.png',
    description:
      'StartGreen este o firmă de instalații electrice din Iași, înființată în 2022, care proiectează și execută sisteme fotovoltaice pentru locuințe și firme din Moldova. Deține atestat ANRE C2A nr. 21043, valabil până în octombrie 2028, pentru lucrări de joasă și medie tensiune, și certificări ISO 9001, ISO 14001 și ISO 45001. Pentru case oferă kituri la cheie de 3, 5 și 7 kW cu invertor hibrid și baterie LiFePO4 opțională, cu proiect, montaj și dosar de racordare incluse. Printre lucrările documentate se numără un sistem industrial de 250 kW cu stocare pentru Wonder Drift, în Iași, și un parc fotovoltaic de 320 kW în comuna Tomești, cu 780 de panouri Canadian Solar și invertoare Solplanet. Face și branșamente electrice de joasă și medie tensiune, se ocupă de avizul tehnic de racordare și de relația cu distribuitorul, instalează stații de încărcare pentru mașini electrice (opt stații în comuna Holboca) și asigură mentenanță și curățare pentru sistemele existente. Lucrează în special în județele Iași, Suceava, Bacău, Neamț, Vaslui și Botoșani. A ajuns la 17 angajați și o cifră de afaceri de 6,3 milioane de lei în 2025.',
    founded: 2022,
    employees: 17,
    location: {
      city: 'Iași',
      county: 'Iași',
      address: 'Șos. Moara de Foc nr. 33, Iași 700520'
    },
    contact: {
      phone: '+40756735053',
      email: 'office@startgreen.ro',
      website: 'https://startgreen.ro'
    },
    coverage: ['Iași', 'Suceava', 'Bacău', 'Neamț', 'Vaslui', 'Botoșani'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: ['ISO-9001', 'ISO-14001', 'ISO-45001'],
    capacity: { minProjectKw: 3, maxProjectKw: 320, projectsCompleted: 0 },
    financials: {
      year: 2025,
      revenue: 6340899,
      profit: 324933,
      history: [
        { year: 2022, revenue: 705145, profit: 184905, employees: 1 },
        { year: 2023, revenue: 3368599, profit: 646767, employees: 5 },
        { year: 2024, revenue: 6337785, profit: 926510, employees: 13 },
        { year: 2025, revenue: 6340899, profit: 324933, employees: 17 }
      ]
    },
    tags: [
      'pv-rezidential',
      'pv-comercial',
      'parcuri-fotovoltaice',
      'prosumator',
      'on-grid',
      'hibrid',
      'stocare-baterii',
      'statii-incarcare-ev',
      'bransamente-electrice',
      'medie-tensiune',
      'proiectare',
      'mentenanta-pv'
    ],
    featured: false,
    verified: true,
    createdAt: '2026-10-09',
    updatedAt: '2026-10-09',
    segment: 'ambele',
    anreMatch: { societate: 'STARTGREEN', judet: 'Iasi' }
  }
];

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const existingCuis = new Set(data.companies.map(c => String(c.cui).replace(/^RO/, '')));
const toAdd = newCompanies.filter(c => !existingCuis.has(String(c.cui).replace(/^RO/, '')));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);
