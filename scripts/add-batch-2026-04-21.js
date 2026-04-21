#!/usr/bin/env node
/**
 * One-off: append 5 researched Bucharest firms to companies.json.
 * After running: node scripts/anre-match-companies.js && node scripts/anre-apply-match.js
 */

const fs = require('fs');
const path = require('path');

const P = path.join(__dirname, '..', 'data', 'companies.json');
const today = '2026-04-21';

const newFirms = [
  {
    id: 'allsys-energy',
    slug: 'allsys-energy',
    name: 'Allsys Energy S.A.',
    cui: 'RO14906056',
    logo: '/logos/allsys-energy.png',
    description: 'Allsys Energy este o companie bucureșteană înființată în 2002, parte a grupului ALLSYS, specializată în soluții de energie regenerabilă și servicii conexe pentru industria energetică. Activitatea include proiectarea și execuția de sisteme fotovoltaice comerciale și industriale, măsurare și monitorizare energetică, întreținere infrastructură electrică. A realizat proiecte precum sistemul de 1.409 kW la Shopping City Piatra Neamț și 450 kW la Selgros Craiova. Vizează proiecte industriale între 400 și 5.000 kW, precum și parcuri fotovoltaice.',
    founded: 2002,
    employees: 435,
    location: {
      city: 'București',
      county: 'București',
      address: 'Bd. Alexandru Ioan Cuza 81, Parter, Sector 1'
    },
    contact: {
      phone: '+40212234209',
      email: 'office@allsysenergy.ro',
      website: 'https://allsysenergy.ro'
    },
    coverage: [],
    specializations: ['hale-industriale', 'retail', 'parcuri-fotovoltaice'],
    certifications: [],
    capacity: { minProjectKw: 400, maxProjectKw: 5000 },
    financials: { year: 2024, revenue: 31943736, profit: 1789730 },
    tags: ['proiecte-mari'],
    featured: false,
    verified: true,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'ALLSYS ENERGY', judet: 'Bucuresti' }
  },
  {
    id: 'amiras-green-proiect',
    slug: 'amiras-green-proiect',
    name: 'Amiras Green Proiect S.R.L.',
    cui: 'RO40094551',
    logo: '/logos/amiras-green-proiect.png',
    description: 'Firmă din București specializată în proiectare și execuție de infrastructură energetică pentru administrația publică și sectorul privat, cu portofoliu axat pe iluminat public LED (contracte cu mai multe primării din România) și sisteme fotovoltaice on-grid și off-grid pentru aplicații rezidențiale și industriale. Oferă și stații de încărcare pentru vehicule electrice și proiecte Smart City.',
    founded: 2018,
    employees: 4,
    location: {
      city: 'București',
      county: 'București',
      address: 'Str. Trapezului 2, Bl. M6, Sc. C, Et. 6, Ap. 113, Sector 3'
    },
    contact: {
      phone: '+40735191678',
      email: 'office@amirasproiect.ro',
      website: 'https://www.amirasproiect.ro'
    },
    coverage: [],
    specializations: ['hale-industriale', 'sedii-administrative'],
    certifications: ['ISO-9001', 'ISO-14001', 'ISO-27001'],
    capacity: {},
    financials: { year: 2024, revenue: 5045858, profit: 207406 },
    tags: [],
    featured: false,
    verified: true,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'AMIRAS GREEN PROIECT', judet: 'Bucuresti' }
  },
  {
    id: 'alter-man-engineering',
    slug: 'alter-man-engineering',
    name: 'Alter Man Engineering S.R.L.',
    cui: 'RO27464690',
    logo: '/logos/alter-man-engineering.png',
    description: 'Alter Man Engineering (brand Alterman Group) este o companie din București activă în energie regenerabilă, dezvoltare imobiliară și instalații electrice. Dezvoltă și execută parcuri fotovoltaice comerciale și industriale, cu proiecte precum parcul fotovoltaic Videle (5 MW), instalația pe hala de producție Mogoșoaia (500 kW) și Cartierul Solar din București.',
    founded: 2010,
    employees: 11,
    location: {
      city: 'București',
      county: 'București',
      address: 'Calea Dorobanților 33A, Etaj 4, Sector 1'
    },
    contact: {
      phone: '+40213303109',
      email: 'info@altermangroup.ro',
      website: 'https://altermangroup.ro'
    },
    coverage: [],
    specializations: ['parcuri-fotovoltaice', 'hale-industriale'],
    certifications: [],
    capacity: {},
    financials: { year: 2024, revenue: 4933766, profit: -329868 },
    tags: ['experienta-10-ani'],
    featured: false,
    verified: true,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'ALTER MAN ENGINEERING', judet: 'Bucuresti' }
  },
  {
    id: 'clean-energy-revolution',
    slug: 'clean-energy-revolution',
    name: 'Clean Energy Revolution S.R.L.',
    cui: 'RO45294461',
    logo: '/logos/clean-energy-revolution.png',
    description: 'Integrator de sisteme fotovoltaice din București care oferă soluții end-to-end pentru clienți rezidențiali și comerciali — audit energetic, proiectare, instalare, obținere statut prosumator, mentenanță și consultanță pentru finanțare (PNRR, facilități bancare). Firmă activă din 2021 cu atestate ANRE C2A și C1A.',
    founded: 2021,
    employees: 0,
    location: {
      city: 'București',
      county: 'București',
      address: 'Str. Băneasa 10, Et. 2, Sector 1'
    },
    contact: {
      phone: '+40761468115',
      email: 'sales@energyrevolution.ro',
      website: 'https://energyrevolution.ro'
    },
    coverage: [],
    specializations: ['hale-industriale', 'cladiri-birouri'],
    certifications: [],
    capacity: {},
    financials: {},
    tags: [],
    featured: false,
    verified: true,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'CLEAN ENERGY REVOLUTION', judet: 'Bucuresti' }
  },
  {
    id: 'prosolar-green-evolution',
    slug: 'prosolar-green-evolution',
    name: 'Prosolar Green Evolution S.R.L.',
    cui: 'RO18029514',
    logo: '',
    description: 'Firmă din Popești-Leordeni (Ilfov) cu sediu ANRE București, activă din 2005, specializată în proiectare, instalare și mentenanță sisteme fotovoltaice. Deține atestate ANRE C2A și C1A active.',
    founded: 2005,
    employees: 8,
    location: {
      city: 'Popești-Leordeni',
      county: 'Ilfov',
      address: 'Str. Speranței 46, Casa 10, Camera 3'
    },
    contact: {
      phone: '+40723911433',
      email: '',
      website: ''
    },
    coverage: [],
    specializations: [],
    certifications: [],
    capacity: {},
    financials: { year: 2024, revenue: 13313116, profit: 816429 },
    tags: [],
    featured: false,
    verified: false,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'PROSOLAR GREEN EVOLUTION', judet: 'Bucuresti' }
  }
];

const data = JSON.parse(fs.readFileSync(P, 'utf8'));
const existingIds = new Set(data.companies.map((c) => c.id));
const existingCuis = new Set(data.companies.map((c) => c.cui));

let added = 0;
for (const f of newFirms) {
  if (existingIds.has(f.id)) {
    console.log(`SKIP: ${f.id} already exists (id collision)`);
    continue;
  }
  if (existingCuis.has(f.cui)) {
    console.log(`SKIP: ${f.id} CUI ${f.cui} already exists`);
    continue;
  }
  data.companies.push(f);
  added++;
  console.log(`+ ${f.id}`);
}

fs.writeFileSync(P, JSON.stringify(data, null, 2) + '\n');
console.log(`\nTotal: ${added} firme adăugate. Companies.json acum are ${data.companies.length} firme.`);
