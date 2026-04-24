const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    "id": "vivaro-solar-energy",
    "slug": "vivaro-solar-energy",
    "name": "Vivaro Solar Energy",
    "cui": "RO41973621",
    "logo": "",
    "description": "Firmă fondată în 2019 în Micești, județul Argeș, specializată în instalații electrice, sisteme fotovoltaice și automatizări comerciale și industriale. Portofoliul include proiecte între 12 kWp și 1,5 MWp (carport zonă industrială), cu instalații pentru ferme, clinici dentare și clienți industriali.",
    "founded": 2019,
    "employees": 18,
    "location": {
      "city": "Micești",
      "county": "Argeș",
      "address": "Sat Micești, Com. Micești, Nr.318"
    },
    "contact": {
      "phone": "+40751519652",
      "email": "tehnic@vivarosolar.ro",
      "website": "https://vivarosolar.ro/"
    },
    "coverage": ["Argeș"],
    "specializations": ["hale-industriale", "agricol"],
    "certifications": [],
    "capacity": {"minProjectKw": 12, "maxProjectKw": 1500, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 4247558, "profit": 79751},
    "tags": ["on-grid", "stocare", "monitorizare-inclusa"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-24",
    "updatedAt": "2026-04-24",
    "anreMatch": null
  },
  {
    "id": "network-connections-project",
    "slug": "network-connections-project",
    "name": "Network Connections Project",
    "cui": "RO31947250",
    "logo": "",
    "description": "Firmă fondată în 2013 în Pitești, Argeș, activând sub brandul DVL Group. Proiectează și execută linii electrice 0,4-20 kV și sisteme fotovoltaice, fiind instalator validat „Casa Verde Fotovoltaice 2023\". Dispune de punct de lucru DVL Green Parc în Ștefănești.",
    "founded": 2013,
    "employees": 9,
    "location": {
      "city": "Pitești",
      "county": "Argeș",
      "address": "Calea București, Nr.24"
    },
    "contact": {
      "phone": "+40722234584",
      "email": "georgedovlecel@yahoo.com",
      "website": "https://dvl-group.ro/"
    },
    "coverage": ["Argeș"],
    "specializations": [],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 3414995, "profit": 581142},
    "tags": ["on-grid", "experienta-10-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-24",
    "updatedAt": "2026-04-24",
    "anreMatch": null
  },
  {
    "id": "inbatesa-electric",
    "slug": "inbatesa-electric",
    "name": "Inbatesa Electric",
    "cui": "RO25545330",
    "logo": "",
    "description": "Firmă fondată în 2009 în Bucov, județul Prahova, activă în instalații electrice, curenți slabi și panouri fotovoltaice. Portofoliul de servicii acoperă și instalații sanitare, termice, ventilație și verificări PRAM.",
    "founded": 2009,
    "employees": 7,
    "location": {
      "city": "Bucov",
      "county": "Prahova",
      "address": "Sat Pleasa, Com. Bucov"
    },
    "contact": {
      "phone": "+40722859211",
      "email": "inbatesaelectric@hotmail.com",
      "website": "https://inbatesaelectric.ro/"
    },
    "coverage": ["Prahova"],
    "specializations": [],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 1291876, "profit": 203612},
    "tags": ["on-grid"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-24",
    "updatedAt": "2026-04-24",
    "anreMatch": null
  },
  {
    "id": "electric-instal-iasi",
    "slug": "electric-instal-iasi",
    "name": "Electric Instal",
    "cui": "RO13438020",
    "logo": "",
    "description": "Firmă din Iași fondată în 2000, specializată în instalații electrice și sisteme fotovoltaice. Oferă evaluare, proiectare, montaj și mentenanță panouri fotovoltaice, plus asistență pentru documentația de prosumator.",
    "founded": 2000,
    "employees": 34,
    "location": {
      "city": "Iași",
      "county": "Iași",
      "address": "Str. Cazangiilor, Nr.2a"
    },
    "contact": {
      "phone": "+40745396450",
      "email": "electricinstalsrl@yahoo.com",
      "website": "https://electricinstalsrl.ro/"
    },
    "coverage": ["Iași"],
    "specializations": [],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 10343736, "profit": 1085345},
    "tags": ["on-grid", "mentenanta-inclusa", "experienta-20-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-24",
    "updatedAt": "2026-04-24",
    "anreMatch": null
  },
  {
    "id": "lincas",
    "slug": "lincas",
    "name": "Lincas",
    "cui": "RO6267210",
    "logo": "",
    "description": "Firmă din Pașcani, județul Iași, fondată în 1994, activă în instalații electrice pentru construcții civile și industriale. Montează panouri fotovoltaice și sisteme solare on-grid și off-grid, inclusiv structuri de susținere, tablouri de distribuție și punere în funcțiune.",
    "founded": 1994,
    "employees": 40,
    "location": {
      "city": "Pașcani",
      "county": "Iași",
      "address": "Str. Vatra, Nr.84"
    },
    "contact": {
      "phone": "+40744799360",
      "email": "lincaspascani@yahoo.com",
      "website": "https://www.lincas.ro/"
    },
    "coverage": ["Iași"],
    "specializations": [],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 7276055, "profit": 500484},
    "tags": ["on-grid", "off-grid", "experienta-20-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-24",
    "updatedAt": "2026-04-24",
    "anreMatch": null
  },
  {
    "id": "retele-iasi",
    "slug": "retele-iasi",
    "name": "Retele Iasi",
    "cui": "RO36024515",
    "logo": "",
    "description": "Firmă fondată în 2016 în Valea Lupului, județul Iași. Oferă instalare panouri fotovoltaice, instalații electrice, audit energetic, verificări PRAM și sisteme de paratrăsnet.",
    "founded": 2016,
    "employees": 7,
    "location": {
      "city": "Valea Lupului",
      "county": "Iași",
      "address": "Fdc. Spiru Haret, Nr.1"
    },
    "contact": {
      "phone": "+40744668061",
      "email": "reteleiasi@gmail.com",
      "website": "https://retele-iasi.ro/"
    },
    "coverage": ["Iași"],
    "specializations": [],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 2528542, "profit": 553986},
    "tags": ["on-grid"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-24",
    "updatedAt": "2026-04-24",
    "anreMatch": null
  },
  {
    "id": "sky-energy-system",
    "slug": "sky-energy-system",
    "name": "Sky Energy System",
    "cui": "RO46087600",
    "logo": "",
    "description": "Firmă fondată în 2022 în Iași, specializată în proiectare și montaj sisteme fotovoltaice. Oferă soluții on-grid, off-grid și hibrid, acumulatori solari, pompe de căldură și servicii de mentenanță.",
    "founded": 2022,
    "employees": 1,
    "location": {
      "city": "Iași",
      "county": "Iași",
      "address": "Șos. Păcurari, Nr.157"
    },
    "contact": {
      "phone": "+40741191145",
      "email": "contact@solarenergy.ro",
      "website": "https://solarenergy.ro/"
    },
    "coverage": ["Iași"],
    "specializations": [],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 412949, "profit": -19600},
    "tags": ["on-grid", "off-grid", "hibrid", "stocare", "pompe-caldura", "mentenanta-inclusa"],
    "featured": false,
    "verified": false,
    "createdAt": "2026-04-24",
    "updatedAt": "2026-04-24",
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
