/* eslint-disable */
// Batch 2026-07-20 — 2 listări inbound prin formularul /listeaza-firma (NU pipeline discovery).
// VELIS AG (Velis Energy, Iași): CUI RO27504298 confirmat pe pagina de contact a site-ului,
// ANRE C1A (22821) + C2A (22822) active până în 2030, ISO 9001/14001/45001 declarate pe site.
// PowerSense (Vâlcea): CUI RO29144594 confirmat în politica de confidențialitate a site-ului,
// ANRE B (22833) activ până în 2030, punct de lucru în Râmnicu Vâlcea, sediu în Brezoi.
// Financiare: targetare.ro (bilanț 2025), 2026-07-20.
const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'velis-ag',
    slug: 'velis-ag',
    name: 'VELIS AG S.R.L.',
    cui: 'RO27504298',
    description: 'VELIS AG, care operează sub brandul Velis Energy, este o companie din Iași înființată în 2010, cu activități de construcții și instalații electrice, specializată în proiectarea, execuția și mentenanța sistemelor fotovoltaice. Realizează instalații PV rezidențiale, parcuri fotovoltaice comerciale la cheie (inclusiv racordare la rețea) și stații de încărcare AC și DC pentru vehicule electrice. Lucrează cu echipamente Huawei, Jinko, LONGi, JA Solar, Canadian Solar, Sofar și Victron Energy, este înregistrată în SEAP pentru proiecte cu instituții publice și deservește județele Iași, Suceava, Bacău, Neamț și Vaslui.',
    founded: 2010,
    employees: 8,
    location: {
      city: 'Iași',
      county: 'Iași',
      address: 'Mun. Iași, Bld. Socola, Nr. 2'
    },
    contact: {
      phone: '+40740969853',
      email: 'office@velis-energy.ro',
      website: 'https://velis-energy.ro/'
    },
    coverage: ['Iași', 'Suceava', 'Bacău', 'Neamț', 'Vaslui'],
    specializations: ['rezidential', 'hale-industriale', 'parcuri-logistice'],
    certifications: ['ISO-9001', 'ISO-14001', 'ISO-45001'],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 1610849, profit: 161432 },
    tags: ['pv-rezidential', 'pv-comercial', 'parcuri-fotovoltaice', 'statii-incarcare-ev', 'stocare-baterii'],
    featured: false,
    verified: true,
    createdAt: '2026-07-20',
    updatedAt: '2026-07-20',
    segment: 'ambele'
  },
  {
    id: 'powersense',
    slug: 'powersense',
    name: 'PowerSense S.R.L.',
    cui: 'RO29144594',
    description: 'PowerSense este o companie din județul Vâlcea (sediu în Brezoi, punct de lucru în Râmnicu Vâlcea) specializată în proiectarea și instalarea sistemelor fotovoltaice pentru clienți rezidențiali, comerciali și industriali. Oferă soluții complete, de la consultanță și dimensionare după consumul real până la montaj, punere în funcțiune, monitorizarea producției și consumului și mentenanță. Lucrează cu invertoare Fronius, Huawei, Victron Energy, Solis și Deye, plus sisteme de stocare (inclusiv BYD), și pune la dispoziție un configurator online pentru dimensionarea sistemului.',
    founded: 2011,
    employees: 2,
    location: {
      city: 'Râmnicu Vâlcea',
      county: 'Vâlcea',
      address: 'Punct de lucru: Calea București 255B, Râmnicu Vâlcea (sediu social: Ors. Brezoi, Str. Calea Eroilor, Nr. 175)'
    },
    contact: {
      phone: '+40799444222',
      email: 'office@powersense.ro',
      website: 'https://powersense.ro'
    },
    coverage: ['Vâlcea'],
    specializations: ['rezidential', 'hale-industriale', 'retail'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 1079341, profit: 47110 },
    tags: ['pv-rezidential', 'pv-comercial', 'stocare-baterii', 'monitorizare', 'mentenanta-pv'],
    featured: false,
    verified: true,
    createdAt: '2026-07-20',
    updatedAt: '2026-07-20',
    segment: 'ambele'
  }
];

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const existingCuis = new Set(data.companies.map(c => c.cui));
const toAdd = newCompanies.filter(c => !existingCuis.has(c.cui));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);
