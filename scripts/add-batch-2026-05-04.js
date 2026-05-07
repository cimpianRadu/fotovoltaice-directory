/* eslint-disable */
const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    "id": "domarex-94",
    "slug": "domarex-94",
    "name": "Domarex '94 SRL",
    "cui": "RO6363471",
    "logo": "/logos/domarex-94.png",
    "description": "Firmă fondată în 1994 în Călărași, cu capital 100% românesc și autorizație ANRE din 2001. Oferă proiectare și execuție pentru sisteme fotovoltaice rezidențiale, industriale și parcuri fotovoltaice, stații de încărcare auto electrice, rețele electrice de joasă și medie tensiune (0,4 kV–20 kV) și branșamente electrice. Peste 30 de ani de experiență ca antreprenor electric.",
    "founded": 1994,
    "employees": 63,
    "location": {
      "city": "Cuza Vodă",
      "county": "Călărași",
      "address": "Sat Cuza Vodă, Com. Cuza Vodă, Jud. Călărași"
    },
    "contact": {
      "phone": "+40723563532",
      "email": "office@domarex94.ro",
      "website": "https://www.domarex94.ro/"
    },
    "coverage": ["Călărași"],
    "specializations": ["hale-industriale"],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 30046246, "profit": 5109913},
    "tags": ["pv-comercial", "pv-industrial", "on-grid", "experienta-20-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-05-04",
    "updatedAt": "2026-05-04",
    "anreMatch": null
  },
  {
    "id": "electrica-racord-instal",
    "slug": "electrica-racord-instal",
    "name": "Electrica Racord Instal SRL",
    "cui": "RO32621960",
    "logo": "/logos/electrica-racord-instal.png",
    "description": "Firmă fondată în 2013 în București, specializată în lucrări electrice complexe și sisteme fotovoltaice. Oferă consultanță tehnică, dimensionare, proiectare și autorizare, instalare, punere în funcțiune și mentenanță pentru sisteme fotovoltaice, inclusiv consiliere prosumator. Portofoliu cu proiecte în Constanța, Ilfov și Giurgiu pentru clienți din sectoare diverse: portuar, minier, sportiv, hotelier, telecomunicații și administrație publică. Oferă și stații de încărcare auto electrice.",
    "founded": 2013,
    "employees": 34,
    "location": {
      "city": "București",
      "county": "București",
      "address": "Str. Gorovei Artur Nr. 31, Sector 5, București"
    },
    "contact": {
      "phone": "+40744483214",
      "email": "licitatii@electrica-racordinstal.ro",
      "website": "https://www.electrica-racordinstal.ro/"
    },
    "coverage": ["București", "Ilfov", "Constanța", "Giurgiu"],
    "specializations": ["hale-industriale", "hoteluri"],
    "certifications": ["ISO-9001", "ISO-14001", "ISO-45001"],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 26593189, "profit": 3133726},
    "tags": ["pv-comercial", "pv-industrial", "prosumator", "on-grid", "mentenanta"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-05-04",
    "updatedAt": "2026-05-04",
    "anreMatch": null
  },
  {
    "id": "enesco-services",
    "slug": "enesco-services",
    "name": "Enesco Services SRL",
    "cui": "RO40530596",
    "logo": "/logos/enesco-services.png",
    "description": "Firmă fondată în 2019 în București, cu rădăcini în Enesco Italia (activă din 1998). Oferă sisteme fotovoltaice on-grid, off-grid și hibride, sisteme solare termice, audit energetic, consultanță energetică și monitorizare online pentru birouri, clădiri industriale, clădiri publice și rezidențe. Acoperă și soluții de stocare cu baterii.",
    "founded": 2019,
    "employees": 3,
    "location": {
      "city": "București",
      "county": "București",
      "address": "Calea Plevnei Nr. 139, Corp C, Sector 6, București"
    },
    "contact": {
      "phone": "+40749774985",
      "email": "info@enesco.ro",
      "website": "https://enesco.ro/"
    },
    "coverage": ["București", "Ilfov"],
    "specializations": ["cladiri-birouri", "hale-industriale"],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 1715488, "profit": -715880},
    "tags": ["pv-comercial", "on-grid", "off-grid", "baterii", "audit-energetic"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-05-04",
    "updatedAt": "2026-05-04",
    "anreMatch": null
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
