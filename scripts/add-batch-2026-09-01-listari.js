/* eslint-disable */
// Batch 2026-09-01 — 1 listare inbound prin formularul /listeaza-firma (NU pipeline discovery).
//
// KARMENERGY (Cromo Semper Automatic SRL, CUI 17512803): firma a cerut explicit să fie
// publicată sub brandul comercial, nu sub denumirea juridică. Entitatea juridică apare
// în descriere și în CUI, ca să rămână verificabilă.
//
// ANAF (interogare directă 01.09.2026): înregistrată din 21.04.2005, J03/823/2005,
// plătitoare de TVA din 18.12.2020, înscrisă în RO e-Factura, fără stare de inactivitate.
// CAEN principal 4120 (lucrări de construcții clădiri) — fotovoltaicele sunt activitatea
// brandului KarmEnergy, nu obiectul principal declarat, la fel ca la axionet-iot.
//
// ANRE: atestat 18022, Tarif B, emis 07.03.2022, expiră 07.03.2027, stare „Atestat",
// pe „CROMO SEMPER AUTOMATIC", județul Arges în registru — de aceea anreMatch.judet
// rămâne „Arges" chiar dacă listarea e pe Constanța (precedent: axionet-iot, waldevar-energy).
// Site-ul lor publică același număr de atestat și decizia ANRE 281/07.03.2022.
//
// JUDEȚ: formularul a fost completat cu Argeș (sediul social din Pitești), dar montajul
// e în Dobrogea. Pagina „Despre noi" spune explicit: montaj la cheie în principal în
// Constanța și Tulcea, iar Călărași, Ialomița și Brăila în funcție de proiect; livrare
// de echipamente în toată România. Cum /firme/judet filtrează după location.county,
// firma intră pe Constanța (punct operațional Str. Celulozei nr. 2), nu pe Argeș, unde
// nu execută lucrări. Adresa sediului social rămâne în descriere.
//
// Financials: listafirme.ro (bilanțuri MF). RisCo omite 2019 și 2023, listafirme le are.
// 2023 a fost anul bun (1,72M cifră de afaceri), 2024 slab (825k, profit 16k), 2025 în
// revenire (1,41M, profit 449k). Intră ca atare.
//
// Capacitate: min/max/projectsCompleted rămân 0. Site-ul revendică „peste 500 de sisteme
// instalate", dar cu 3 angajați și cifră de afaceri cumulată de circa 6,7M RON din 2018
// încoace cifra nu se susține din bilanțuri, deci nu o preluăm. Atestatul tip B e la
// 0,4 kV, ceea ce îi plasează pe rezidențial și comercial mic, nu pe centrale mari.
//
// Specializări: doar „rezidential". Vând și către firme (segment „ambele", au în stoc
// kituri Solis Industrial 50 kW / 109 kWh), dar nu au portofoliu public pe un tip anume
// de clădire comercială. Formularul cerea „hotel"; se adaugă „hoteluri" doar dacă arată
// un proiect real. Validarea AFM pe care o publică e strict din sesiunea Casa Verde 2022
// (contract 214/RF), nu una curentă, deci fără tag „casa-verde".
const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'karmenergy',
    slug: 'karmenergy',
    name: 'KarmEnergy',
    cui: 'RO17512803', // plătitor de TVA din 18.12.2020, confirmat la ANAF
    // Logo: Logo-Karmenergy de pe karmenergy.ro (PNG cu fundal transparent, text închis,
    // lizibil pe cardurile albe).
    logo: '/logos/karmenergy.png',
    description: 'KarmEnergy este brandul comercial al Cromo Semper Automatic SRL, firmă înregistrată în 2005, cu sediul social în Pitești (Argeș) și punct operațional în Constanța. Proiectează și instalează sisteme fotovoltaice on-grid, hibride și off-grid pentru locuințe și firme, acoperind analiza consumului, dimensionarea, montajul, punerea în funcțiune, monitorizarea și mentenanța. Deține atestat ANRE tip B nr. 18022 din 07.03.2022, pentru instalații de 0,4 kV, și a fost instalator validat în programul Casa Verde Fotovoltaice, sesiunea 2022 (contract 214/RF). Montajul la cheie se face în principal în Constanța și Tulcea, iar în Călărași, Ialomița și Brăila în funcție de proiect. Operează și un magazin online cu panouri, invertoare Victron, Fronius, Sungrow și Solis, baterii, structuri de prindere și kituri complete, inclusiv echipamente pentru rulote și ambarcațiuni, livrate în toată țara.',
    founded: 2005,
    employees: 3,
    location: {
      city: 'Constanța',
      county: 'Constanța',
      address: 'Str. Celulozei, Nr. 2 (punct operațional). Sediu social: Mun. Pitești, Bd. 1 Decembrie 1918, Bl. M5, Sc. A, Et. 4, Ap. 10, jud. Argeș'
    },
    contact: {
      phone: '+40757986762',
      email: 'office@karmenergy.ro',
      website: 'https://karmenergy.ro'
    },
    coverage: [
      'Constanța',
      'Tulcea',
      'Călărași',
      'Ialomița',
      'Brăila'
    ],
    specializations: [
      'rezidential'
    ],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: {
      year: 2025,
      revenue: 1408113,
      profit: 449554,
      history: [
        { year: 2021, revenue: 681233, profit: 50399, employees: 4 },
        { year: 2022, revenue: 862527, profit: 86233, employees: 3 },
        { year: 2023, revenue: 1722985, profit: 522575, employees: 4 },
        { year: 2024, revenue: 825285, profit: 16269, employees: 4 },
        { year: 2025, revenue: 1408113, profit: 449554, employees: 3 }
      ]
    },
    tags: [
      'pv-rezidential',
      'on-grid',
      'hibrid',
      'off-grid',
      'stocare-baterii',
      'prosumator',
      'mentenanta-pv',
      'magazin-online',
      'victron-energy',
      'experienta-20-ani'
    ],
    featured: false,
    verified: true,
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
    segment: 'ambele',
    anreMatch: { societate: 'CROMO SEMPER AUTOMATIC', judet: 'Arges' }
  }
];

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const existingCuis = new Set(data.companies.map(c => String(c.cui).replace(/^RO/, '')));
const toAdd = newCompanies.filter(c => !existingCuis.has(String(c.cui).replace(/^RO/, '')));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);
