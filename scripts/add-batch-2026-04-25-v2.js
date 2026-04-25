const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    "id": "atria-concept",
    "slug": "atria-concept",
    "name": "Atria Concept",
    "cui": "RO35988245",
    "logo": "",
    "description": "Firmă fondată în 2016 în Liești, județul Galați, specializată în proiectare și execuție instalații electrice 0,4-20 kV, iluminat public și sisteme fotovoltaice cu consultanță prosumator. Operează și un punct de lucru în Galați (Str. Eroilor 15).",
    "founded": 2016,
    "employees": 48,
    "location": {
      "city": "Liești",
      "county": "Galați",
      "address": "Str. Cireșului, Nr.38, Liești"
    },
    "contact": {
      "phone": "+40753113919",
      "email": "atriaconcept@yahoo.com",
      "website": "https://www.atriaconcept.ro/"
    },
    "coverage": ["Galați"],
    "specializations": [],
    "certifications": ["ISO-9001", "ISO-14001"],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 32052219, "profit": 2109999},
    "tags": ["on-grid"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-25",
    "updatedAt": "2026-04-25",
    "anreMatch": null
  },
  {
    "id": "docerom-sistem",
    "slug": "docerom-sistem",
    "name": "Docerom Sistem",
    "cui": "RO31189199",
    "logo": "",
    "description": "Firmă fondată în 2013 în Movileni, județul Galați, cu punct de lucru în Galați. Oferă soluții integrate de energie verde — proiectare, montaj la nivel național, mentenanță și monitorizare sisteme fotovoltaice rezidențiale și comerciale, plus instalații electrice industriale, stații de transformare și iluminat public.",
    "founded": 2013,
    "employees": 14,
    "location": {
      "city": "Movileni",
      "county": "Galați",
      "address": "Movileni, Nr.21, Str. Principală, Cam. 3"
    },
    "contact": {
      "phone": "+40742356034",
      "email": "docerom@yahoo.ro",
      "website": "https://docerom.ro/"
    },
    "coverage": ["Galați"],
    "specializations": [],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 10883980, "profit": 1994680},
    "tags": ["on-grid", "monitorizare-inclusa", "mentenanta-inclusa", "experienta-10-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-25",
    "updatedAt": "2026-04-25",
    "anreMatch": null
  },
  {
    "id": "dandis-nuta",
    "slug": "dandis-nuta",
    "name": "Dandis Nuta",
    "cui": "RO6591976",
    "logo": "",
    "description": "Firmă fondată în 1994 în Vânători, județul Galați, care operează sub brandul InstallHouse — magazin online și instalator autorizat ANRE/AFM pentru sisteme fotovoltaice, încălzire și climatizare. Acoperă cu echipe de montaj sud-estul țării (Galați, Brăila, Tulcea, Vaslui, Bacău, Vrancea, Buzău, Constanța, Ialomița).",
    "founded": 1994,
    "employees": 33,
    "location": {
      "city": "Vânători",
      "county": "Galați",
      "address": "Str. Narciselor, Nr.20, Vânători"
    },
    "contact": {
      "phone": "+40758427891",
      "email": "info@installhouse.ro",
      "website": "https://www.installhouse.ro/"
    },
    "coverage": ["Galați", "Brăila", "Tulcea", "Vaslui", "Bacău", "Vrancea", "Buzău", "Constanța", "Ialomița"],
    "specializations": [],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 33428361, "profit": 3137701},
    "tags": ["on-grid", "mentenanta-inclusa", "experienta-20-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-25",
    "updatedAt": "2026-04-25",
    "anreMatch": null
  },
  {
    "id": "gex-electric",
    "slug": "gex-electric",
    "name": "GEX Electric",
    "cui": "RO16822822",
    "logo": "",
    "description": "Firmă fondată în 2004 în Galați, activă în proiectare instalații electrice și fotovoltaice, audit energetic și analize de eficiență pentru IMM și mari întreprinderi. A finalizat în 2025 o centrală fotovoltaică proprie de 500 kW în comuna Tudor Vladimirescu, finanțată prin PNRR.",
    "founded": 2004,
    "employees": 3,
    "location": {
      "city": "Galați",
      "county": "Galați",
      "address": "Str. G-ral Alexandru Cernat, Nr.77, Galați"
    },
    "contact": {
      "phone": "+40730678362",
      "email": "gurguiatugelu@yahoo.com",
      "website": "https://gexelectric.ro/"
    },
    "coverage": ["Galați"],
    "specializations": [],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 500, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 1868946, "profit": 1082949},
    "tags": ["on-grid", "experienta-20-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-25",
    "updatedAt": "2026-04-25",
    "anreMatch": null
  },
  {
    "id": "best-team-fotovoltaice",
    "slug": "best-team-fotovoltaice",
    "name": "Best Team Fotovoltaice",
    "cui": "RO46627114",
    "logo": "",
    "description": "Firmă fondată în 2022 în Bacău, parte din grupul Best Team care operează site-ul panourilefotovoltaice.ro alături de firma soră Best Team Assistance. Oferă sisteme fotovoltaice la cheie — consultanță, avizare, finanțare, proiectare, montaj și mentenanță, inclusiv prin programul Casa Verde.",
    "founded": 2022,
    "employees": 4,
    "location": {
      "city": "Bacău",
      "county": "Bacău",
      "address": "Str. Nicolae Bălcescu, Nr.1, Sc.C, Ap.121, Bacău"
    },
    "contact": {
      "phone": "+40730024724",
      "email": "office@panourilefotovoltaice.ro",
      "website": "https://panourilefotovoltaice.ro/"
    },
    "coverage": ["Bacău"],
    "specializations": [],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 450781, "profit": 29068},
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
