#!/usr/bin/env node
/**
 * One-off: append 10 researched Alba-county firms to companies.json.
 * After running: node scripts/anre-match-companies.js && node scripts/anre-apply-match.js
 */

const fs = require('fs');
const path = require('path');

const P = path.join(__dirname, '..', 'data', 'companies.json');
const today = '2026-04-22';

const newFirms = [
  {
    id: 'solar-prod-ecoinvent',
    slug: 'solar-prod-ecoinvent',
    name: 'Solar Prod Ecoinvent S.R.L.',
    cui: 'RO46334220',
    logo: '/logos/solar-prod-ecoinvent.png',
    description: 'Firmă din comuna Horea (județul Alba) înființată în 2022, atestată ANRE cu certificări C1A și C2A pentru lucrări la instalații electrice. Activitate principală CAEN 4321 — lucrări de instalații electrice. Cifra de afaceri: 5,11M RON (2024), 9 angajați.',
    founded: 2022,
    employees: 9,
    location: {
      city: 'Horea',
      county: 'Alba',
      address: 'Sat Horea, Com. Horea, Str. Valea Arazii, Nr. 5A'
    },
    contact: {
      phone: '+40725325992',
      email: 'solarprodecoinvent@yahoo.com',
      website: ''
    },
    coverage: [],
    specializations: [],
    certifications: [],
    capacity: {},
    financials: { year: 2024, revenue: 5114768, profit: 1597826 },
    tags: [],
    featured: false,
    verified: false,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'SOLAR PROD ECOINVENT', judet: 'Alba' }
  },
  {
    id: 'ener-rom-instal',
    slug: 'ener-rom-instal',
    name: 'Ener Rom Instal S.R.L.',
    cui: 'RO36398366',
    logo: '/logos/ener-rom-instal.png',
    description: 'Ener Rom Instal este o firmă din Alba Iulia activă din anul 2000 în proiectarea și execuția de instalații electrice industriale pe medie și joasă tensiune. Portofoliul include peste 40 MWp de sisteme fotovoltaice instalate — atât parcuri fotovoltaice la sol (ex. CEF Eurosiloz 1MWp, CEF Supremia 1MWp), cât și sisteme pe acoperișul halelor industriale și spațiilor comerciale. Oferă și servicii de posturi trafo MT/JT, tablouri electrice, automatizări industriale și iluminat LED. Sistem de management integrat calitate și mediu certificat TÜV Austria.',
    founded: 2016,
    employees: 15,
    location: {
      city: 'Alba Iulia',
      county: 'Alba',
      address: 'Sat Drâmbar, Com. Ciugud, Str. Energiei, Nr. 18'
    },
    contact: {
      phone: '+40258730529',
      email: 'office@enerrom.ro',
      website: 'https://enerrom.ro'
    },
    coverage: [],
    specializations: ['hale-industriale', 'retail'],
    certifications: ['ISO-9001', 'ISO-14001'],
    capacity: { maxProjectKw: 1000 },
    financials: { year: 2024, revenue: 9212374, profit: 2866094 },
    tags: ['proiecte-mari'],
    featured: false,
    verified: true,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'ENER ROM INSTAL', judet: 'Alba' }
  },
  {
    id: 'nectaria-proiect',
    slug: 'nectaria-proiect',
    name: 'Nectaria Proiect S.R.L.',
    cui: 'RO28364486',
    logo: '/logos/nectaria-proiect.png',
    description: 'Firmă din Alba Iulia înființată în 2011, atestată ANRE cu certificări C1A și C2A pentru lucrări la instalații electrice. Operează magazinul online Nectaria Solar (nectaria.solar) pentru panouri fotovoltaice, invertoare hibride și soluții de stocare energie. Activitate principală CAEN 4321 — lucrări de instalații electrice. Cifra de afaceri: 12,23M RON (2024), 10 angajați.',
    founded: 2011,
    employees: 10,
    location: {
      city: 'Alba Iulia',
      county: 'Alba',
      address: 'Str. Eugen Lovinescu, Nr. 15'
    },
    contact: {
      phone: '+40723172359',
      email: 'nectariaproiect@gmail.com',
      website: 'https://nectaria.solar'
    },
    coverage: [],
    specializations: [],
    certifications: [],
    capacity: {},
    financials: { year: 2024, revenue: 12233921, profit: 780026 },
    tags: [],
    featured: false,
    verified: true,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'NECTARIA PROIECT', judet: 'Alba' }
  },
  {
    id: 'elio-industrial',
    slug: 'elio-industrial',
    name: 'Elio Industrial S.R.L.',
    cui: 'RO1771720',
    logo: '/logos/elio-industrial.png',
    description: 'Firmă din Lancrăm (Sebeș, județul Alba) înființată în 1992, atestată ANRE cu certificări C1A și C2A pentru lucrări la instalații electrice. Activitate principală CAEN 4321 — lucrări de instalații electrice. Cifra de afaceri: 8,46M RON (2024), 14 angajați.',
    founded: 1992,
    employees: 14,
    location: {
      city: 'Sebeș',
      county: 'Alba',
      address: 'Loc. Lancrăm, Mun. Sebeș, Str. Nouă, Nr. 398'
    },
    contact: {
      phone: '+40723602004',
      email: 'elio.industrial@yahoo.com',
      website: ''
    },
    coverage: [],
    specializations: [],
    certifications: [],
    capacity: {},
    financials: { year: 2024, revenue: 8463190, profit: 2278727 },
    tags: [],
    featured: false,
    verified: false,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'ELIO INDUSTRIAL', judet: 'Alba' }
  },
  {
    id: 'ted-electro',
    slug: 'ted-electro',
    name: 'Ted Electro S.R.L.',
    cui: 'RO46875942',
    logo: '/logos/ted-electro.png',
    description: 'Firmă din Alba Iulia înființată în 2022, atestată ANRE cu certificări C1A și C2A pentru lucrări la instalații electrice. Activitate principală CAEN 4321 — lucrări de instalații electrice. Cifra de afaceri: 2,60M RON (2024), 10 angajați.',
    founded: 2022,
    employees: 10,
    location: {
      city: 'Alba Iulia',
      county: 'Alba',
      address: 'Bld. Ferdinand I, Nr. 3'
    },
    contact: {
      phone: '',
      email: '',
      website: ''
    },
    coverage: [],
    specializations: [],
    certifications: [],
    capacity: {},
    financials: { year: 2024, revenue: 2596137, profit: 104256 },
    tags: [],
    featured: false,
    verified: false,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'TED ELECTRO', judet: 'Alba' }
  },
  {
    id: 'electro-oriel',
    slug: 'electro-oriel',
    name: 'Electro Oriel S.R.L.',
    cui: 'RO38655105',
    logo: '/logos/electro-oriel.png',
    description: 'Firmă din Vințu de Jos (județul Alba) înființată în 2018, atestată ANRE cu certificări C1A și C2A pentru lucrări la instalații electrice. Activitate principală CAEN 4321 — lucrări de instalații electrice. Cifra de afaceri: 533K RON (2024), 3 angajați.',
    founded: 2018,
    employees: 3,
    location: {
      city: 'Vințu de Jos',
      county: 'Alba',
      address: 'Sat Vurpăr, Com. Vințu de Jos, Nr. 30'
    },
    contact: {
      phone: '+40740897538',
      email: 'office.ogr@yahoo.com',
      website: ''
    },
    coverage: [],
    specializations: [],
    certifications: [],
    capacity: {},
    financials: { year: 2024, revenue: 533057, profit: -245227 },
    tags: [],
    featured: false,
    verified: false,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'ELECTRO ORIEL', judet: 'Alba' }
  },
  {
    id: 'electroalba-electris',
    slug: 'electroalba-electris',
    name: 'Electroalba Electris S.R.L.',
    cui: 'RO45029163',
    logo: '/logos/electroalba-electris.png',
    description: 'Firmă din Alba Iulia înființată în 2021, atestată ANRE cu certificări C1A și C2A pentru lucrări la instalații electrice. Activitate principală CAEN 4321 — lucrări de instalații electrice. Cifra de afaceri: 1,35M RON (2024), 7 angajați.',
    founded: 2021,
    employees: 7,
    location: {
      city: 'Alba Iulia',
      county: 'Alba',
      address: 'Str. Samuel Micu, Nr. 4, Bl. 19, Et. 3, Ap. 12'
    },
    contact: {
      phone: '+40746784180',
      email: 'ana.ghibu@yahoo.com',
      website: ''
    },
    coverage: [],
    specializations: [],
    certifications: [],
    capacity: {},
    financials: { year: 2024, revenue: 1353204, profit: 107860 },
    tags: [],
    featured: false,
    verified: false,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'ELECTROALBA ELECTRIS', judet: 'Alba' }
  },
  {
    id: 'electrotimeia',
    slug: 'electrotimeia',
    name: 'Electrotimeia S.R.L.',
    cui: 'RO17223317',
    logo: '/logos/electrotimeia.png',
    description: 'Firmă din Sebeș (județul Alba) înființată în 2005, atestată ANRE cu certificare C2A pentru lucrări la instalații electrice. Activitate principală CAEN 4321 — lucrări de instalații electrice. Cifra de afaceri: 7,48M RON (2024), 18 angajați.',
    founded: 2005,
    employees: 18,
    location: {
      city: 'Sebeș',
      county: 'Alba',
      address: 'Str. Dorobanți, Nr. 75'
    },
    contact: {
      phone: '+40741104586',
      email: 'electrotimeia@yahoo.com',
      website: ''
    },
    coverage: [],
    specializations: [],
    certifications: [],
    capacity: {},
    financials: { year: 2024, revenue: 7478737, profit: 1229418 },
    tags: [],
    featured: false,
    verified: false,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'ELECTROTIMEIA', judet: 'Alba' }
  },
  {
    id: 'energo-enci',
    slug: 'energo-enci',
    name: 'Energo Enci S.R.L.',
    cui: 'RO40864839',
    logo: '/logos/energo-enci.png',
    description: 'Firmă din Daia Română (Sebeș, județul Alba) înființată în 2019, atestată ANRE cu certificare C1A pentru lucrări la instalații electrice. Activitate principală CAEN 7112 — activități de inginerie și consultanță tehnică. Cifra de afaceri: 2,44M RON (2024), 3 angajați.',
    founded: 2019,
    employees: 3,
    location: {
      city: 'Sebeș',
      county: 'Alba',
      address: 'Sat Daia Română, Com. Daia Română, Str. Sub Coastă, Nr. 510'
    },
    contact: {
      phone: '+40764901568',
      email: 'popmihaiaugustin@gmail.com',
      website: ''
    },
    coverage: [],
    specializations: [],
    certifications: [],
    capacity: {},
    financials: { year: 2024, revenue: 2438383, profit: 1870537 },
    tags: [],
    featured: false,
    verified: false,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'ENERGO ENCI', judet: 'Alba' }
  },
  {
    id: 'tobimar-group',
    slug: 'tobimar-group',
    name: 'Tobimar Group S.R.L.',
    cui: 'RO21171933',
    logo: '/logos/tobimar-group.png',
    description: 'Firmă din Vințu de Jos (județul Alba) înființată în 2007, atestată ANRE cu certificare C2A pentru lucrări la instalații electrice. Activitate principală CAEN 4321 — lucrări de instalații electrice. Cifra de afaceri: 20,55M RON (2024), 17 angajați.',
    founded: 2007,
    employees: 17,
    location: {
      city: 'Vințu de Jos',
      county: 'Alba',
      address: 'Sat Vințu de Jos, Com. Vințu de Jos, Str. Mihai Eminescu, Nr. 58'
    },
    contact: {
      phone: '',
      email: 'tobimargroup@tobimar.ro',
      website: ''
    },
    coverage: [],
    specializations: [],
    certifications: [],
    capacity: {},
    financials: { year: 2024, revenue: 20553265, profit: 3077076 },
    tags: [],
    featured: false,
    verified: false,
    createdAt: today,
    updatedAt: today,
    anreMatch: { societate: 'TOBIMAR GROUP', judet: 'Alba' }
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
