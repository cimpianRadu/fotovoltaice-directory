const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    "id": "cbm-elpro-instal",
    "slug": "cbm-elpro-instal",
    "name": "CBM Elpro Instal",
    "cui": "RO42464596",
    "logo": "",
    "description": "Firmă de instalații electrice din Dumbrăvița (Timiș), înființată în 2020. Proiectează și execută sisteme fotovoltaice pentru clienți industriali și municipali — printre referințe se numără centrale PV de 1 MWp și 0,67 MWp pentru stațiile de tratare a apei Aquatim (Stan Vidrighin și Urseni) și o centrală de 0,4 MW pentru SC Telco SA.",
    "founded": 2020,
    "employees": 2,
    "location": {
      "city": "Dumbrăvița",
      "county": "Timiș",
      "address": "Sat Dumbrăvița Com. Dumbrăvița, Str. Rembrandt, Nr.10a, Cam. 1, Ap.1"
    },
    "contact": {
      "phone": "+40720539212",
      "email": "cristian.bogdan@cbm-elproinstal.ro",
      "website": "https://cbm-elproinstal.ro/"
    },
    "coverage": ["Timiș"],
    "specializations": ["hale-industriale", "cladiri-birouri", "spitale"],
    "certifications": [],
    "capacity": { "minProjectKw": 400, "maxProjectKw": 1000, "projectsCompleted": 0 },
    "financials": { "year": 2024, "revenue": 3977304, "profit": 497173 },
    "tags": ["on-grid", "EPC", "mentenanță", "monitorizare", "proiectare"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  },
  {
    "id": "eltal-group",
    "slug": "eltal-group",
    "name": "Eltal Group",
    "cui": "RO14440400",
    "logo": "",
    "description": "Firmă de instalații electrice din Moșnița Nouă (Timiș), înființată în 2002, cu atestat ANRE C2A pentru lucrări de 0,4–20 kV și posturi de transformare. Execută branșamente, tablouri electrice, iluminat public, paratrăsnet și sisteme alternative de producere a energiei electrice, inclusiv sisteme fotovoltaice, pentru clienți comerciali, industriali și rezidențiali.",
    "founded": 2002,
    "employees": 12,
    "location": {
      "city": "Moșnița Nouă",
      "county": "Timiș",
      "address": "Sat Moșnița Nouă Com. Moșnița Nouă, Str. Telegrafului, Nr.8, Camera 1"
    },
    "contact": {
      "phone": "+40728326527",
      "email": "eltalgroup@yahoo.com",
      "website": "https://www.eltal.ro/"
    },
    "coverage": ["Timiș"],
    "specializations": [],
    "certifications": [],
    "capacity": { "minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0 },
    "financials": { "year": 2024, "revenue": 14159609, "profit": 5179849 },
    "tags": ["on-grid", "proiectare"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  },
  {
    "id": "melbo-instal",
    "slug": "melbo-instal",
    "name": "Melbo Instal",
    "cui": "RO26209486",
    "logo": "",
    "description": "Firmă de instalații electrice și automatizări din Giarmata (Timiș), înființată în 2009, cu peste 450 de proiecte finalizate și clienți precum IKEA Timișoara, Coca-Cola, Leroy Merlin și The Office Timișoara. Oferă soluții complete de instalații electrice de joasă și medie tensiune, sisteme fotovoltaice la cheie (panouri, invertoare, stocare) și sisteme de securitate, pentru spații industriale, retail și comerciale.",
    "founded": 2009,
    "employees": 43,
    "location": {
      "city": "Giarmata",
      "county": "Timiș",
      "address": "Sat Giarmata Com. Giarmata, Str. Muntele Mic, Nr.18"
    },
    "contact": {
      "phone": "+40722460482",
      "email": "mirel.borcovici@melboinstal.ro",
      "website": "https://melboinstal.ro/"
    },
    "coverage": ["Timiș"],
    "specializations": ["hale-industriale", "cladiri-birouri", "retail"],
    "certifications": ["ISO-9001"],
    "capacity": { "minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 450 },
    "financials": { "year": 2024, "revenue": 8956827, "profit": -683823 },
    "tags": ["on-grid", "hibrid", "stocare", "EPC", "mentenanță"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  },
  {
    "id": "abac-proiect-energie",
    "slug": "abac-proiect-energie",
    "name": "ABAC Proiect Energie",
    "cui": "RO16912291",
    "logo": "",
    "description": "Firmă de instalații electrice fondată în 2004 în Buftea (Ilfov), cu peste 30 de ani de experiență cumulată a echipei în proiectare și execuție rețele de distribuție joasă și medie tensiune. Proiectează și instalează sisteme fotovoltaice între 3 și 200 kWp, cu peste 700 kWp instalați pentru clienți persoane fizice și juridice. Oferă și stații de încărcare pentru vehicule electrice.",
    "founded": 2004,
    "employees": 37,
    "location": {
      "city": "Buftea",
      "county": "Ilfov",
      "address": "Str. Răsăritului, Nr. 38"
    },
    "contact": {
      "phone": "+40743055055",
      "email": "office@abacproiect.ro",
      "website": "https://abacproiect.ro/"
    },
    "coverage": ["Ilfov"],
    "specializations": [],
    "certifications": ["ISO-9001", "ISO-14001", "ISO-45001"],
    "capacity": { "minProjectKw": 3, "maxProjectKw": 200, "projectsCompleted": 0 },
    "financials": { "year": 2024, "revenue": 19855722, "profit": 1594323 },
    "tags": ["on-grid", "proiectare", "mentenanță", "statii-incarcare-ev"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  },
  {
    "id": "green-costal",
    "slug": "green-costal",
    "name": "Green Costal",
    "cui": "RO24980149",
    "logo": "",
    "description": "Firmă fondată în 2009 în Brănești (Ilfov), specializată în vânzarea și instalarea de sisteme fotovoltaice on-grid și hibride cu stocare, pompe de căldură și stații de încărcare pentru vehicule electrice. Portofoliul include proiecte comerciale precum LIMAROM 2000 (102 kWp), Atelierul Pescăresc (81 kWp) și UTI CFM (100 kWp hibrid cu 33 kWh stocare). Lucrează cu echipamente Victron Energy, SMA, Fronius, Sungrow, BYD și Pylontech.",
    "founded": 2009,
    "employees": 5,
    "location": {
      "city": "Brănești",
      "county": "Ilfov",
      "address": "Str. Grădinii, Nr. 6"
    },
    "contact": {
      "phone": "+40730330486",
      "email": "alexandru.costeniuc@greencostal.ro",
      "website": "https://greencostal.ro/"
    },
    "coverage": ["Ilfov"],
    "specializations": [],
    "certifications": [],
    "capacity": { "minProjectKw": 9, "maxProjectKw": 230, "projectsCompleted": 0 },
    "financials": { "year": 2024, "revenue": 4571197, "profit": 57460 },
    "tags": ["on-grid", "hibrid", "stocare", "monitorizare", "pompe-caldura", "statii-incarcare-ev"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  }
];

const companiesPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'));
const companies = data.companies;

const existingCuis = new Set(companies.map(c => c.cui));
const toAdd = newCompanies.filter(c => !existingCuis.has(c.cui));

if (toAdd.length === 0) {
  console.log('No new companies to add (all CUI-uri already exist)');
  process.exit(0);
}

companies.push(...toAdd);
fs.writeFileSync(companiesPath, JSON.stringify(data, null, 2) + '\n');

console.log(`Added ${toAdd.length} companies:`);
toAdd.forEach(c => console.log(`  - ${c.name} (${c.cui}) — ${c.location.city}, ${c.location.county}`));
console.log(`\nTotal companies: ${companies.length}`);
