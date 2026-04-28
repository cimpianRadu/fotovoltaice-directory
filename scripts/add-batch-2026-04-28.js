const fs = require('fs');
const path = require('path');

// Batch 2026-04-28 — Arad, ANRE C1A/C2A
// Researched 9 firme (ELECON PLUS exclus prin PV gate FAIL anterior).
// Yield: 2/9 (22%) — restul 7 fără website și fără content PV verificabil online.
// Rejected: CONSTRUCT BUSINESS ELECTRIC TEAM, ELECTRO IMED 2012, ENERGO-PROIECT,
// MIBU ELECTRIC, ELECTRO FARIO, ELTRI TECH, MATCOMPANY (toate fără PV evidence).
const newCompanies = [
  {
    "id": "ambra-service",
    "slug": "ambra-service",
    "name": "Ambra Service",
    "cui": "RO14452634",
    "logo": "",
    "description": "Firmă fondată în 2002 în Socodor, județul Arad, divizie românească a grupului italian Delta. Oferă servicii integrate de instalații electrice industriale, termice, climatizare, ventilație, sanitare și energie regenerabilă (panouri fotovoltaice). Firmă certificată ISO, cu portofoliu de proiecte industriale derulate în Arad și Timiș.",
    "founded": 2002,
    "employees": 49,
    "location": {
      "city": "Socodor",
      "county": "Arad",
      "address": "Jud. Arad, Com. Socodor, Nr.fn"
    },
    "contact": {
      "phone": "+40721056729",
      "email": "office@ambraservice.ro",
      "website": "https://ambraservice.ro/"
    },
    "coverage": ["Arad", "Timiș"],
    "specializations": ["hale-industriale"],
    "certifications": ["ISO-9001"],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 20398360, "profit": 3272557},
    "tags": ["on-grid", "experienta-20-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-28",
    "updatedAt": "2026-04-28",
    "anreMatch": {
      "societate": "AMBRA SERVICE",
      "judet": "Arad"
    }
  },
  {
    "id": "precon-electric",
    "slug": "precon-electric",
    "name": "Precon Electric",
    "cui": "RO14870335",
    "logo": "",
    "description": "Firmă fondată în 2002 în Parcul Industrial UTA 1 din Arad, specializată în proiectare și execuție instalații electrice industriale, automatizări, retail/hospitality și sisteme fotovoltaice rezidențiale și industriale. Partener autorizat pentru programul Casa Verde, cu peste 20 de ani de experiență în zona Banatului. Lucrează cu echipamente Schneider Electric, Siemens, ABB, Eaton, Legrand.",
    "founded": 2002,
    "employees": 15,
    "location": {
      "city": "Arad",
      "county": "Arad",
      "address": "Str. Poetului, Nr.1C, Hala 25-26, Parc Industrial UTA 1, Arad"
    },
    "contact": {
      "phone": "+40740072694",
      "email": "office@precon-electric.ro",
      "website": "https://precon-electric.ro/"
    },
    "coverage": ["Arad", "Timiș"],
    "specializations": ["hale-industriale", "retail", "hoteluri"],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 5098540, "profit": 389809},
    "tags": ["on-grid", "off-grid", "casa-verde", "experienta-20-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-28",
    "updatedAt": "2026-04-28",
    "anreMatch": {
      "societate": "PRECON ELECTRIC",
      "judet": "Arad"
    }
  }
];

const filePath = path.join(__dirname, '..', 'data', 'companies.json');
const raw = fs.readFileSync(filePath, 'utf8');
const json = JSON.parse(raw);
const existing = new Set(json.companies.map(c => c.cui));
const existingIds = new Set(json.companies.map(c => c.id));

let added = 0;
for (const c of newCompanies) {
  if (existing.has(c.cui)) {
    console.log(`skip (duplicate CUI): ${c.name} ${c.cui}`);
    continue;
  }
  if (existingIds.has(c.id)) {
    console.log(`skip (duplicate ID): ${c.name} ${c.id}`);
    continue;
  }
  json.companies.push(c);
  added++;
  console.log(`+ ${c.name} (${c.cui})`);
}

fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
console.log(`\nAdded ${added} companies. Total: ${json.companies.length}`);
