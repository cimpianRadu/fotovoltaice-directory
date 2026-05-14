/* eslint-disable */
const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    "id": "energy-house-construct",
    "slug": "energy-house-construct",
    "name": "Energy House Construct SRL",
    "cui": "RO45766955",
    "logo": "/logos/energy-house-construct.png",
    "description": "Firmă fondată în 2022 în satul Vulpuești (com. Mihăești), Vâlcea, specializată în instalații electrice de joasă și medie tensiune și sisteme fotovoltaice. Oferă proiectare, dimensionare, furnizare și instalare pentru sisteme PV, branșamente electrice monofazate și trifazate (aeriene și subterane), precum și posturi de transformare. Lucrările sunt executate de electricieni autorizați ANRE, cu acoperire în regiunea Oltenia.",
    "founded": 2022,
    "employees": 12,
    "location": {
      "city": "Vulpuești, com. Mihăești",
      "county": "Vâlcea",
      "address": "Sat Vulpuești, Com. Mihăești, Jud. Vâlcea"
    },
    "contact": {
      "phone": "+40749999149",
      "email": "office@energy-house.ro",
      "website": "https://energy-house.ro/"
    },
    "coverage": ["Vâlcea"],
    "specializations": [],
    "certifications": [],
    "capacity": { "minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0 },
    "financials": { "year": 2024, "revenue": 3511051, "profit": 537637 },
    "tags": ["pv-comercial", "pv-rezidential", "proiectare", "on-grid"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-05-08",
    "updatedAt": "2026-05-08",
    "anreMatch": null
  },
  {
    "id": "alinadi-electric",
    "slug": "alinadi-electric",
    "name": "Alinadi Electric SRL",
    "cui": "RO32834276",
    "logo": "/logos/alinadi-electric.png",
    "description": "Firmă fondată în 2014 în Bălcești, Vâlcea, specializată în sisteme fotovoltaice rezidențiale și comerciale, instalații electrice interioare/exterioare și rețele electrice de joasă și medie tensiune. Execută branșamente, posturi de transformare, verificări PRAM, sisteme de paratrăsnet, iluminat stradal și prize de pământ. Portofoliul include lucrări pentru locuințe, hale, școli, spitale, spații comerciale, blocuri și hoteluri, cu autorizare ANRE pentru proiectare și execuție.",
    "founded": 2014,
    "employees": 11,
    "location": {
      "city": "Bălcești",
      "county": "Vâlcea",
      "address": "Ors. Bălcești, Str. Ecaterina Teodoroiu, Nr.48, Jud. Vâlcea"
    },
    "contact": {
      "phone": "+40764397543",
      "email": "contact@alinadielectric.ro",
      "website": "https://alinadielectric.ro/"
    },
    "coverage": ["Vâlcea"],
    "specializations": ["hale-industriale", "scoli", "spitale", "hoteluri", "retail"],
    "certifications": [],
    "capacity": { "minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0 },
    "financials": { "year": 2024, "revenue": 5980383, "profit": 1513437 },
    "tags": ["pv-comercial", "pv-rezidential", "pv-industrial", "proiectare", "on-grid"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-05-08",
    "updatedAt": "2026-05-08",
    "anreMatch": null
  },
  {
    "id": "electromen",
    "slug": "electromen",
    "name": "Electromen SRL",
    "cui": "RO21589848",
    "logo": "/logos/electromen.png",
    "description": "Firmă fondată în 2007 în Căpleni, Satu Mare, specializată în lucrări de instalații electrice și sisteme fotovoltaice. Portofoliul include parcuri solare (Căpleni, Carei) și proiecte industriale precum hala Continental și SC Ardealul SA, cu echipe interne pentru execuție și punere în funcțiune. Cu 42 de angajați, acoperă proiecte de scară industrială și comercială.",
    "founded": 2007,
    "employees": 42,
    "location": {
      "city": "Căpleni",
      "county": "Satu Mare",
      "address": "Sat Căpleni, Com. Căpleni, Nr.486, Jud. Satu Mare"
    },
    "contact": {
      "phone": "+40784261025",
      "email": "office@electromen.ro",
      "website": "https://www.electromen.ro/"
    },
    "coverage": ["Satu Mare"],
    "specializations": ["hale-industriale", "parcuri-logistice"],
    "certifications": [],
    "capacity": { "minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0 },
    "financials": { "year": 2024, "revenue": 29725674, "profit": 6978981 },
    "tags": ["pv-comercial", "pv-industrial", "on-grid", "proiectare"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-05-08",
    "updatedAt": "2026-05-08",
    "anreMatch": null
  },
  {
    "id": "smart-electrical-solutions",
    "slug": "smart-electrical-solutions",
    "name": "Smart Electrical Solutions SRL",
    "cui": "RO16753080",
    "logo": "/logos/smart-electrical-solutions.png",
    "description": "Firmă fondată în 2004 în Satu Mare, specializată în instalarea de sisteme fotovoltaice, pompe de căldură și aparate de aer condiționat. Operează cu acoperire națională prin echipe interne și parteneri autorizați, cu o capacitate declarată de montaj de până la 7 sisteme fotovoltaice pe zi. Participă la programul Casa Verde din 2019 și oferă suport complet pentru documentație și avizare, atât pentru clienți rezidențiali, cât și comerciali.",
    "founded": 2004,
    "employees": 40,
    "location": {
      "city": "Satu Mare",
      "county": "Satu Mare",
      "address": "Mun. Satu Mare, Str. Grigore Ureche, Nr.71/a, Jud. Satu Mare"
    },
    "contact": {
      "phone": "+40769035372",
      "email": "office@sescompany.ro",
      "website": "https://sescompany.ro/"
    },
    "coverage": ["Satu Mare"],
    "specializations": [],
    "certifications": [],
    "capacity": { "minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0 },
    "financials": { "year": 2024, "revenue": 11802286, "profit": 0 },
    "tags": ["pv-comercial", "pv-rezidential", "on-grid", "casa-verde", "experienta-20-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-05-08",
    "updatedAt": "2026-05-08",
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
