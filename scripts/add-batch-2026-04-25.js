const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    "id": "andalex-genersy",
    "slug": "andalex-genersy",
    "name": "Andalex Genersy",
    "cui": "RO45800313",
    "logo": "",
    "description": "Firmă fondată în 2022 în Zărnești, județul Brașov, specializată în proiectarea, dimensionarea, montajul și mentenanța sistemelor fotovoltaice. Oferă asistență pentru documentația de prosumator și execută branșamente electrice și studii de coexistență, predominant în zona Brașov.",
    "founded": 2022,
    "employees": 3,
    "location": {
      "city": "Zărnești",
      "county": "Brașov",
      "address": "Str. Bârsei, Nr.73, Biroul 2, Zărnești"
    },
    "contact": {
      "phone": "+40726275559",
      "email": "office@genersy.ro",
      "website": "https://genersy.ro/"
    },
    "coverage": ["Brașov"],
    "specializations": [],
    "certifications": [],
    "capacity": {"minProjectKw": 6, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 3214809, "profit": 1227117},
    "tags": ["on-grid", "mentenanta-inclusa"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-25",
    "updatedAt": "2026-04-25",
    "anreMatch": null
  },
  {
    "id": "dg-solar",
    "slug": "dg-solar",
    "name": "DG Solar",
    "cui": "RO25289665",
    "logo": "",
    "description": "Firmă fondată în 2009 în Cristian, județul Brașov, activă în distribuția și montajul echipamentelor fotovoltaice (panouri, invertoare, regulatoare, baterii) sub brandul „Depozit Fotovoltaice\". Furnizează soluții on-grid și off-grid (12V/24V/48V) pentru locuințe, hale industriale, hoteluri și spitale, inclusiv stocare cu acumulatori litiu.",
    "founded": 2009,
    "employees": 28,
    "location": {
      "city": "Cristian",
      "county": "Brașov",
      "address": "Str. Vulcanului, Nr.3, Ap.1, Cristian"
    },
    "contact": {
      "phone": "+40786690264",
      "email": "office@dgsolar.ro",
      "website": "https://depozitfotovoltaice.ro/"
    },
    "coverage": ["Brașov"],
    "specializations": ["hale-industriale", "hoteluri", "spitale"],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 6270213, "profit": -480945},
    "tags": ["on-grid", "off-grid", "stocare", "experienta-10-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-25",
    "updatedAt": "2026-04-25",
    "anreMatch": null
  },
  {
    "id": "electrical-standard",
    "slug": "electrical-standard",
    "name": "Electrical Standard",
    "cui": "RO4904660",
    "logo": "",
    "description": "Firmă fondată în 1993 în Șura Mică, județul Sibiu, specializată în instalații electro-energetice 0,4-20 kV, microhidrocentrale și sisteme fotovoltaice. Portofoliul include un parc fotovoltaic conectat la 20 kV (Hosman, Sibiu) și instalații de 400 kW, plus servicii de monitorizare parametri electrici și termografie în infraroșu.",
    "founded": 1993,
    "employees": 11,
    "location": {
      "city": "Șura Mică",
      "county": "Sibiu",
      "address": "Parc Industrial Nr. P20, Șura Mică"
    },
    "contact": {
      "phone": "+40745119935",
      "email": "gabi.olareanu@gmail.com",
      "website": "https://electrical-standard.ro/"
    },
    "coverage": ["Sibiu"],
    "specializations": [],
    "certifications": [],
    "capacity": {"minProjectKw": 400, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 3033198, "profit": -602725},
    "tags": ["on-grid", "monitorizare-inclusa", "experienta-20-ani", "proiecte-mari"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-25",
    "updatedAt": "2026-04-25",
    "anreMatch": null
  },
  {
    "id": "att-technology",
    "slug": "att-technology",
    "name": "ATT Technology",
    "cui": "RO39782093",
    "logo": "",
    "description": "Firmă fondată în 2018 în Pielești, județul Dolj, activă în proiectarea, execuția și mentenanța sistemelor fotovoltaice rezidențiale și industriale. Oferă suplimentar instalații electrice industriale, iluminat LED și stații de încărcare pentru vehicule electrice.",
    "founded": 2018,
    "employees": 1,
    "location": {
      "city": "Pielești",
      "county": "Dolj",
      "address": "Str. Aviatorilor, Nr.27a, Pielești"
    },
    "contact": {
      "phone": "+40753010505",
      "email": "contact@att-technology.ro",
      "website": "https://att-technology.ro/"
    },
    "coverage": ["Dolj"],
    "specializations": [],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 498921, "profit": 199838},
    "tags": ["on-grid", "mentenanta-inclusa"],
    "featured": false,
    "verified": false,
    "createdAt": "2026-04-25",
    "updatedAt": "2026-04-25",
    "anreMatch": null
  }
];

const filePath = path.join(__dirname, '..', 'data', 'companies.json');
const raw = fs.readFileSync(filePath, 'utf8');
const json = JSON.parse(raw);
const existing = new Set(json.companies.map(c => c.cui));

let added = 0;
for (const c of newCompanies) {
  if (existing.has(c.cui)) {
    console.log(`skip (duplicate CUI): ${c.name} ${c.cui}`);
    continue;
  }
  json.companies.push(c);
  added++;
  console.log(`+ ${c.name} (${c.cui})`);
}

fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
console.log(`\nAdded ${added} companies. Total: ${json.companies.length}`);
