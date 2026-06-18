/* eslint-disable */
// Batch 2026-06-18 — 2 lead-uri inbound prin formularul /listeaza-firma (NU pipeline discovery).
// Ambele ANRE-verified (server-side lookup), CUI match confirmat pe site, instalatori PV reali la cheie.
const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'electrobrum-energy-automation',
    slug: 'electrobrum-energy-automation',
    name: 'Electrobrum Energy Automation S.R.L.',
    cui: 'RO46507754',
    description: 'Electrobrum Energy Automation este o firmă din Comănești, județul Bacău, înființată în 2022 și dedicată exclusiv sistemelor fotovoltaice. Oferă servicii complete la cheie: proiectare și dimensionare (PVSYST), achiziții echipamente, instalare și punere în funcțiune, branșamente și dosar de prosumator ANRE, monitorizare, audit energetic și mentenanță. Lucrează cu echipamente Huawei, Longi, Victron, Fronius, Sungrow și Canadian Solar, deservind atât proiecte rezidențiale, cât și comerciale/industriale. Instalator aprobat AFM Casa Verde, cu atestat ANRE tip B propriu.',
    founded: 2022,
    employees: 7,
    location: {
      city: 'Comănești',
      county: 'Bacău',
      address: 'Jud. Bacău, Oraș Comănești, Str. Păcii, Nr. 2A'
    },
    contact: {
      phone: '+40734570636',
      email: 'mihai.electrobrum@gmail.com',
      website: 'https://electrobrum.ro/'
    },
    coverage: ['Bacău'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 6826157, profit: 731115 },
    tags: ['pv-rezidential', 'pv-comercial', 'casa-verde', 'mentenanta-pv'],
    featured: false,
    verified: true,
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18',
    segment: 'ambele'
  },
  {
    id: 'solar-station',
    slug: 'solar-station',
    name: 'Solar Station S.R.L.',
    cui: 'RO47185541',
    description: 'Solar Station este o firmă din Chiajna, județul Ilfov, înființată în 2022, specializată în sisteme fotovoltaice și lucrări de acoperișuri. Oferă consultanță, proiectare, vânzare și montaj de panouri fotovoltaice, punere în funcțiune și întocmirea dosarului de prosumator, alături de montaj de învelitori (țiglă metalică, tablă fălțuită, structuri metalice și pe sol). Cu electricieni acreditați ANRE și statut de partener Casa Verde, deservește atât clienți rezidențiali, cât și spații comerciale și industriale.',
    founded: 2022,
    employees: 3,
    location: {
      city: 'Chiajna',
      county: 'Ilfov',
      address: 'Jud. Ilfov, Com. Chiajna, Sat Roșu, Str. Acvilei, Nr. 6A'
    },
    contact: {
      phone: '+40763054345',
      email: 'contact@solarstation.ro',
      website: 'https://solarstation.ro/'
    },
    coverage: ['Ilfov'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 1250911, profit: 87334 },
    tags: ['pv-rezidential', 'pv-comercial', 'casa-verde', 'acoperisuri'],
    featured: false,
    verified: true,
    createdAt: '2026-06-18',
    updatedAt: '2026-06-18',
    segment: 'ambele'
  }
];

const rejected = [
  { societate: 'SC A-Z VET BODONEA SRL', judet: 'Satu Mare', cui: '28169736', reason: 'Lead inbound prin formularul /listeaza-firma, dar firmă de medicină veterinară (obiect secundar activități sanitar-veterinare, contactul declară explicit că este medic veterinar). ANRE not-found, fără niciun serviciu fotovoltaic. Respins.' }
];

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const existingCuis = new Set(data.companies.map(c => c.cui));
const toAdd = newCompanies.filter(c => !existingCuis.has(c.cui));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);

const rejectedPath = path.join(__dirname, '..', 'data', 'anre-rejected.json');
const existingRejected = JSON.parse(fs.readFileSync(rejectedPath, 'utf8'));
const rejectedKeys = new Set(existingRejected.map(r => `${r.cui}|${r.societate}`));
const newRejected = rejected.filter(r => !rejectedKeys.has(`${r.cui}|${r.societate}`));
existingRejected.push(...newRejected);
fs.writeFileSync(rejectedPath, JSON.stringify(existingRejected, null, 2) + '\n');
console.log('Added', newRejected.length, 'rejections. Total:', existingRejected.length);
