/* eslint-disable */
// Batch 2026-08-05 — 1 listare inbound prin formularul /listeaza-firma (NU pipeline discovery).
// SUNLUX ENERGY (Giurgiu): CUI 54633400 confirmat la ANAF (înregistrată 06.05.2026,
// CAEN 4321, sat Câmpurelu com. Colibași, telefon identic cu cel din listare).
// Fără bilanț depus (firmă de 3 luni) — financials cu zerouri, precedent VTL Energy
// (câmpul e obligatoriu în tipul Company; FinancialStability crapă la prerender fără el).
// ANRE: not-found real, verificat direct în anre-atestate.json (nu mismatch de nume).
// Echipă de montaj cu deplasare națională, disponibilă și în regim de subcontractare.
const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'sunlux-energy',
    slug: 'sunlux-energy',
    name: 'SUNLUX ENERGY S.R.L.',
    cui: '54633400',
    description: 'Sunlux Energy este o firmă din comuna Colibași, județul Giurgiu, înființată în 2026, activă în lucrări de instalații electrice (CAEN 4321). Echipa de montaj are peste 3 ani de experiență practică în instalarea sistemelor fotovoltaice rezidențiale și comerciale, dispune de scule, echipamente proprii și autoutilitară, se deplasează oriunde în țară și preia lucrări și în regim de subcontractare pentru alți instalatori.',
    founded: 2026,
    employees: 0,
    location: {
      city: 'Câmpurelu',
      county: 'Giurgiu',
      address: 'Sat Câmpurelu, Com. Colibași, Str. Principală, Nr. 167'
    },
    contact: {
      phone: '+40749620795',
      email: 'mariomro001@icloud.com',
      website: ''
    },
    coverage: ['Giurgiu'],
    specializations: ['rezidential', 'retail'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2026, revenue: 0, profit: 0 },
    tags: ['pv-rezidential', 'pv-comercial', 'acoperire-nationala'],
    featured: false,
    verified: true,
    createdAt: '2026-08-05',
    updatedAt: '2026-08-05',
    segment: 'ambele',
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
