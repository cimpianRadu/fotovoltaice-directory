/* eslint-disable */
// Batch 2026-07-14 — 2 lead-uri inbound prin formularul /listeaza-firma (NU pipeline discovery).
// GMM Electrosolutions: ANRE B verificat server-side, website + telefon + email confirmate pe site.
// VTL Energy: fără ANRE și fără bilanț depus (înființată oct 2024), dar activitate PV reală
// confirmată (listare Google Maps „service pentru panouri solare" + anunțuri active, telefon identic).
const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'gmm-electrosolutions',
    slug: 'gmm-electrosolutions',
    name: 'GMM Electrosolutions S.R.L.',
    cui: 'RO46508490',
    description: 'GMM Electrosolutions este o firmă din Mangalia, județul Constanța, înființată în 2022, specializată în instalații electrice și sisteme fotovoltaice pentru case, hale și afaceri. Oferă instalații electrice noi, service și intervenții, montaj de sisteme fotovoltaice cu electricieni autorizați ANRE, plus supervizare de calitate în industria navală. Deține certificare ISO pentru managementul calității și oferă posibilitatea plății în rate prin parteneri financiari.',
    founded: 2022,
    employees: 6,
    location: {
      city: 'Mangalia',
      county: 'Constanța',
      address: 'Mun. Mangalia, Str. George Murnu, Nr. 21, Bl. A21, Sc. B, Ap. 18'
    },
    contact: {
      phone: '+40799523658',
      email: 'gmmelectrosolutions@outlook.com',
      website: 'https://www.gmmelectrosolutions.ro/'
    },
    coverage: ['Constanța'],
    specializations: ['rezidential', 'hale-industriale', 'retail'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 1296834, profit: 114143 },
    tags: ['pv-rezidential', 'pv-comercial', 'mentenanta-pv', 'finantare-disponibila'],
    featured: false,
    verified: true,
    createdAt: '2026-07-14',
    updatedAt: '2026-07-14',
    segment: 'ambele'
  },
  {
    id: 'vtl-energy',
    slug: 'vtl-energy',
    name: 'VTL Energy S.R.L.',
    cui: 'RO50660801',
    description: 'VTL Energy este o firmă din Bălcăuți, județul Suceava, înființată în 2024, activă în lucrări de instalații electrice (CAEN 4321) și specializată în montajul și service-ul sistemelor fotovoltaice pentru clienți rezidențiali din zona Suceava.',
    founded: 2024,
    employees: 0,
    location: {
      city: 'Bălcăuți',
      county: 'Suceava',
      address: 'Sat Bălcăuți, Com. Bălcăuți, Nr. 343'
    },
    contact: {
      phone: '+40752808121',
      email: 'office.vtl.energy@gmail.com',
      website: ''
    },
    coverage: ['Suceava'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 0, profit: 0 },
    tags: ['pv-rezidential', 'mentenanta-pv'],
    featured: false,
    verified: true,
    createdAt: '2026-07-14',
    updatedAt: '2026-07-14',
    segment: 'rezidential'
  }
];

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const existingCuis = new Set(data.companies.map(c => c.cui));
const toAdd = newCompanies.filter(c => !existingCuis.has(c.cui));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);
