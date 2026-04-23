const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    "id": "solari-electric-energy",
    "slug": "solari-electric-energy",
    "name": "Solari Electric Energy",
    "cui": "RO47367268",
    "logo": "",
    "description": "Firmă din Constanța fondată în 2022, autorizată ANRE pentru proiectare și execuție de instalații electrice, oferind sisteme fotovoltaice la cheie, pompe de căldură, stații de încărcare EV, sisteme de iluminat smart și supraveghere video pentru clienți rezidențiali, comerciali și instituții publice.",
    "founded": 2022,
    "employees": 1,
    "location": {
      "city": "Constanța",
      "county": "Constanța",
      "address": "Int. Nordului, Nr. 10, Garaj"
    },
    "contact": {
      "phone": "+40739774560",
      "email": "office@solari.ro",
      "website": "https://solari.ro/"
    },
    "coverage": ["Constanța"],
    "specializations": [],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2024,
      "revenue": 142530,
      "profit": 36626
    },
    "tags": ["on-grid", "pompe-caldura", "statii-incarcare-ev"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-23",
    "updatedAt": "2026-04-23",
    "anreMatch": null
  },
  {
    "id": "solar-service",
    "slug": "solar-service",
    "name": "Solar - Service",
    "cui": "RO27413092",
    "logo": "",
    "description": "Firmă din Timișoara fondată în 2010, specializată în proiectare, montaj și mentenanță de sisteme fotovoltaice on-grid și off-grid, panouri solare termice, sisteme hibride (solar + eolian) și aplicații agricole (irigații, ferme). Portofoliu cu proiecte documentate în județele Timiș, Bihor, Prahova, Olt, Bacău, Satu Mare, Vâlcea și Vrancea.",
    "founded": 2010,
    "employees": 0,
    "location": {
      "city": "Timișoara",
      "county": "Timiș",
      "address": "Str. Oglinzilor, Nr. 25, Bl. 32, Sc. B, Ap. 1"
    },
    "contact": {
      "phone": "+40720996713",
      "email": "info@solar-service.ro",
      "website": "https://www.solar-service.ro/"
    },
    "coverage": ["Timiș", "Bihor", "Prahova", "Olt", "Bacău", "Satu Mare", "Vâlcea", "Vrancea"],
    "specializations": ["agricol"],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2024,
      "revenue": 0,
      "profit": 0
    },
    "tags": ["on-grid", "off-grid", "hibrid", "agricol"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-23",
    "updatedAt": "2026-04-23",
    "anreMatch": null
  },
  {
    "id": "electrogal-solutions",
    "slug": "electrogal-solutions",
    "name": "Electrogal Solutions",
    "cui": "RO44119080",
    "logo": "",
    "description": "Firmă din Oradea fondată în 2021, autorizată ANRE, activă în branșamente electrice, instalații rezidențiale și industriale, montaj panouri fotovoltaice, iluminat public și sisteme de securitate. Deservește Bihor — Oradea, Aleșd, Marghita, Beiuș.",
    "founded": 2021,
    "employees": 14,
    "location": {
      "city": "Oradea",
      "county": "Bihor",
      "address": "Str. Sovata, Nr. 33, Bl. PB11, Et. 2, Ap. 11"
    },
    "contact": {
      "phone": "+40756385538",
      "email": "electrogalsolutions@gmail.com",
      "website": "https://electrogalsolutions.com/"
    },
    "coverage": ["Bihor"],
    "specializations": [],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2024,
      "revenue": 2295593,
      "profit": 505364
    },
    "tags": [],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-23",
    "updatedAt": "2026-04-23",
    "anreMatch": null
  },
  {
    "id": "energetic-montrel",
    "slug": "energetic-montrel",
    "name": "Energetic Montrel",
    "cui": "RO26011941",
    "logo": "",
    "description": "Firmă din Nojorid (Bihor) fondată în 2009, specializată în proiectarea și montajul panourilor fotovoltaice, instalații electrice pentru clădiri rezidențiale și industriale, termografie și soluții de stocare cu baterii (RePower EU). Deservește întreg județul Bihor.",
    "founded": 2009,
    "employees": 13,
    "location": {
      "city": "Nojorid",
      "county": "Bihor",
      "address": "Sat Paușa, Com. Nojorid, Nr. 66"
    },
    "contact": {
      "phone": "+40730504182",
      "email": "suciuemr@yahoo.com",
      "website": "https://energeticmontrel.ro/"
    },
    "coverage": ["Bihor"],
    "specializations": [],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2024,
      "revenue": 6757812,
      "profit": 780970
    },
    "tags": ["stocare", "experienta-10-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-23",
    "updatedAt": "2026-04-23",
    "anreMatch": null
  },
  {
    "id": "energoteh-proiect",
    "slug": "energoteh-proiect",
    "name": "Energoteh Proiect",
    "cui": "RO26741440",
    "logo": "",
    "description": "Firmă de inginerie și consultanță tehnică din Oradea (CAEN 7112), fondată în 2010, atestată ANRE C1A și C2A, cu peste 25 de ani experiență cumulată. Oferă proiectare și execuție de sisteme fotovoltaice (pe acoperiș și la sol), lucrări electrice de medie tensiune (1-20 kV) și joasă tensiune, mentenanță, monitorizare, studii de fezabilitate și documentații complete.",
    "founded": 2010,
    "employees": 10,
    "location": {
      "city": "Oradea",
      "county": "Bihor",
      "address": "Str. Mircea Eliade, Nr. 45"
    },
    "contact": {
      "phone": "+40731879285",
      "email": "stefan.barabas@energotehproiect.ro",
      "website": "https://www.energotehproiect.ro/"
    },
    "coverage": ["Bihor"],
    "specializations": [],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2024,
      "revenue": 4919037,
      "profit": 465188
    },
    "tags": ["monitorizare-inclusa", "experienta-10-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-23",
    "updatedAt": "2026-04-23",
    "anreMatch": null
  },
  {
    "id": "ovinstal-electric",
    "slug": "ovinstal-electric",
    "name": "Ovinstal Electric",
    "cui": "RO28433799",
    "logo": "",
    "description": "Firmă din Oradea fondată în 2011, activă în instalații electrice și sisteme fotovoltaice pentru clienți comerciali și industriali. Oferă proiectare și montaj PV pe acoperișuri, la sol, carport și suporturi mobile, plus rețele electrice și posturi de transformare. Acoperă zona Oradea și nord-vestul României.",
    "founded": 2011,
    "employees": 26,
    "location": {
      "city": "Oradea",
      "county": "Bihor",
      "address": "Str. Ceyrat, Nr. 35A, Parter, Bl. WR6, Ap. S3"
    },
    "contact": {
      "phone": "+40743954660",
      "email": "ovinstal_electric@yahoo.com",
      "website": "https://ovinstalelectric.ro/"
    },
    "coverage": ["Bihor"],
    "specializations": ["hale-industriale"],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2024,
      "revenue": 11556008,
      "profit": 1810556
    },
    "tags": ["on-grid", "experienta-10-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-23",
    "updatedAt": "2026-04-23",
    "anreMatch": null
  },
  {
    "id": "hiqual-electro",
    "slug": "hiqual-electro",
    "name": "Hiqual Electro",
    "cui": "RO35125112",
    "logo": "",
    "description": "Firmă din Oradea fondată în 2015, atestată ANRE pentru lucrări electrice de joasă și medie tensiune, cu proiecte majore în hale industriale (8.000–44.000 mp), parcuri logistice, retail (Carrefour, Profi, FedEx) și un parc fotovoltaic de 3 MW (9.600 panouri) la Lotus Center Oradea. Certificată ISO 9001.",
    "founded": 2015,
    "employees": 16,
    "location": {
      "city": "Oradea",
      "county": "Bihor",
      "address": "Str. Transilvaniei, Nr. 16, Bl. U1, Sc. A, Ap. 35"
    },
    "contact": {
      "phone": "+40744767879",
      "email": "office@hql.ro",
      "website": "https://hiqualelectro.ro/"
    },
    "coverage": ["Bihor", "Cluj", "Timiș", "Hunedoara"],
    "specializations": ["hale-industriale", "parcuri-logistice", "retail"],
    "certifications": ["ISO-9001"],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 3000,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2024,
      "revenue": 9017701,
      "profit": 2357757
    },
    "tags": ["on-grid", "PV comercial"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-23",
    "updatedAt": "2026-04-23",
    "anreMatch": null
  }
];

const companiesPath = path.join(__dirname, '..', 'data', 'companies.json');
const raw = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
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
