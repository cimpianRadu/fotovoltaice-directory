const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    "id": "dma-eco-buildings",
    "slug": "dma-eco-buildings",
    "name": "DMA Eco Buildings",
    "cui": "RO37769985",
    "logo": "",
    "description": "Firmă din Cluj-Napoca fondată în 2017, specializată în sisteme fotovoltaice on-grid și off-grid și instalații electrice. Activă în programul Casa Verde 2024 și RePowerEU, cu echipe proprii de instalare.",
    "founded": 2017,
    "employees": 7,
    "location": {
      "city": "Cluj-Napoca",
      "county": "Cluj",
      "address": "Str. Cernăuți, Nr. 17-21, Bl. J, Ap. 8"
    },
    "contact": {
      "phone": "+40758064013",
      "email": "office@dma-energy.ro",
      "website": "https://dma-energy.ro/"
    },
    "coverage": ["Cluj"],
    "specializations": [],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2024,
      "revenue": 4388289,
      "profit": 690527
    },
    "tags": [],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  },
  {
    "id": "electric-line",
    "slug": "electric-line",
    "name": "Electric Line",
    "cui": "RO18428086",
    "logo": "",
    "description": "Firmă din Huedin (Cluj) fondată în 2006, cu activitate în proiectare și execuție de instalații electrice pentru construcții civile și industriale. Oferă rețele de distribuție aeriene și subterane (0.4-20 kV), iluminat public, sisteme de protecție și automatizări, plus mentenanță post-garanție.",
    "founded": 2006,
    "employees": 11,
    "location": {
      "city": "Huedin",
      "county": "Cluj",
      "address": "Str. Câmpului, Nr. 2"
    },
    "contact": {
      "phone": "+40724390827",
      "email": "office@electric-line.ro",
      "website": "https://electric-line.ro/"
    },
    "coverage": ["Cluj"],
    "specializations": [],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2024,
      "revenue": 4662861,
      "profit": 33384
    },
    "tags": [],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  },
  {
    "id": "imsat-service-cluj",
    "slug": "imsat-service-cluj",
    "name": "Imsat Service Cluj",
    "cui": "RO5178727",
    "logo": "",
    "description": "Antreprenor cu sediul în Cluj-Napoca, fondat în 1994, activ în proiectarea, implementarea și întreținerea instalațiilor electrice de medie și joasă tensiune pentru clădiri civile și industriale. Portofoliu cu clienți precum Robert Bosch, Bosch Rexroth, Emerson, Kaufland și Polaris Medical. Activ și în rețele voce-date, BMS și sisteme de securitate.",
    "founded": 1994,
    "employees": 63,
    "location": {
      "city": "Cluj-Napoca",
      "county": "Cluj",
      "address": "Bld. Muncii, Nr. 279"
    },
    "contact": {
      "phone": "+40745191336",
      "email": "office@imsatservice.ro",
      "website": "https://www.imsatservice.ro/"
    },
    "coverage": ["Cluj"],
    "specializations": ["hale-industriale", "cladiri-birouri", "retail", "spitale"],
    "certifications": ["ISO-9001", "ISO-14001"],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2024,
      "revenue": 86045921,
      "profit": 7766032
    },
    "tags": ["experienta-10-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  },
  {
    "id": "enera-switch",
    "slug": "enera-switch",
    "name": "Enera Switch",
    "cui": "RO46596263",
    "logo": "",
    "description": "Firmă din Dej (Cluj) fondată în 2022, specializată în sisteme fotovoltaice complete — de la consultanță și dimensionare până la instalare, monitorizare și mentenanță. Acoperă proiecte rezidențiale și industriale (hale, fabrici, clădiri comerciale), cu parteneriate pentru echipamente Huawei, Fronius, Canadian Solar, Trina Solar.",
    "founded": 2022,
    "employees": 14,
    "location": {
      "city": "Dej",
      "county": "Cluj",
      "address": "Str. Porumbeilor, Nr. 1A"
    },
    "contact": {
      "phone": "+40786027177",
      "email": "contact@eneraswitch.ro",
      "website": "https://www.eneraswitch.ro/"
    },
    "coverage": ["Cluj", "Maramureș", "Sălaj", "Bistrița-Năsăud"],
    "specializations": ["hale-industriale"],
    "certifications": [],
    "capacity": {
      "minProjectKw": 3,
      "maxProjectKw": 10000,
      "projectsCompleted": 300
    },
    "financials": {
      "year": 2024,
      "revenue": 4296843,
      "profit": 500283
    },
    "tags": ["mentenanta-inclusa", "monitorizare-inclusa"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  },
  {
    "id": "delcom-import-export",
    "slug": "delcom-import-export",
    "name": "Delcom Import Export",
    "cui": "RO219923",
    "logo": "",
    "description": "Firmă din Cluj-Napoca fondată în 1992, activă în lucrări de instalații electrice și conexe. Atestată ISCIR și ANRE, cu personal autorizat ANRE pentru branșamente aeriene și subterane, stații de transformare, instalații de legare la pământ și paratrăsnet, iluminat public.",
    "founded": 1992,
    "employees": 5,
    "location": {
      "city": "Cluj-Napoca",
      "county": "Cluj",
      "address": "Str. Tulcea, Nr. 18, Bl. M3, Ap. 65"
    },
    "contact": {
      "phone": "+40745394295",
      "email": "delcomcj@yahoo.com",
      "website": "https://delcomcj.ro/"
    },
    "coverage": ["Cluj"],
    "specializations": [],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2024,
      "revenue": 1679127,
      "profit": 216750
    },
    "tags": ["experienta-10-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  },
  {
    "id": "electromedia-instal",
    "slug": "electromedia-instal",
    "name": "Electromedia Instal",
    "cui": "RO41908178",
    "logo": "",
    "description": "Firmă din Cluj-Napoca fondată în 2019, cu 9 angajați, activă în lucrări de instalații electrice (CAEN 4321). Certificată ANRE C1A și C2A pentru proiectarea și execuția instalațiilor electrice de joasă și medie tensiune.",
    "founded": 2019,
    "employees": 9,
    "location": {
      "city": "Cluj-Napoca",
      "county": "Cluj",
      "address": "Str. Paris, Nr. 19-21, Ap. 13"
    },
    "contact": {
      "phone": "+40747411260",
      "email": "",
      "website": ""
    },
    "coverage": ["Cluj"],
    "specializations": [],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2024,
      "revenue": 2908731,
      "profit": 280004
    },
    "tags": [],
    "featured": false,
    "verified": false,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  },
  {
    "id": "electris-instal",
    "slug": "electris-instal",
    "name": "Electris Instal",
    "cui": "RO8728833",
    "logo": "",
    "description": "Firmă din Gherla (Cluj) fondată în 1996, cu 10 angajați, activă în lucrări de instalații electrice (CAEN 4321). Certificată ANRE C1A și C2A pentru proiectarea și execuția instalațiilor electrice de joasă și medie tensiune.",
    "founded": 1996,
    "employees": 10,
    "location": {
      "city": "Gherla",
      "county": "Cluj",
      "address": "Str. Cărămizii, Nr. 10"
    },
    "contact": {
      "phone": "+40744554798",
      "email": "electris_instal@yahoo.com",
      "website": ""
    },
    "coverage": ["Cluj"],
    "specializations": [],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2024,
      "revenue": 1729270,
      "profit": 205604
    },
    "tags": ["experienta-10-ani"],
    "featured": false,
    "verified": false,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  }
];

const companiesPath = path.join(__dirname, '..', 'data', 'companies.json');
const raw = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
// Support both shapes: { companies: [...] } and [...]
const isWrapped = raw && Array.isArray(raw.companies);
const companies = isWrapped ? raw.companies : raw;

const existingIds = new Set(companies.map(c => c.id));
const existingCuis = new Set(companies.map(c => c.cui));

let added = 0;
for (const c of newCompanies) {
  if (existingIds.has(c.id) || existingCuis.has(c.cui)) {
    console.log(`Skip duplicate: ${c.name}`);
    continue;
  }
  companies.push(c);
  added++;
  console.log(`Added: ${c.name}`);
}

const output = isWrapped ? { ...raw, companies } : companies;
fs.writeFileSync(companiesPath, JSON.stringify(output, null, 2) + '\n');
console.log(`\nTotal added: ${added}/${newCompanies.length}`);
console.log(`Total companies now: ${companies.length}`);
