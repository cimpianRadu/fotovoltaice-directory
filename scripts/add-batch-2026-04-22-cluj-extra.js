const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    "id": "electrobild",
    "slug": "electrobild",
    "name": "Electrobild",
    "cui": "RO19315344",
    "logo": "",
    "description": "Firmă de lucrări de instalații electrice (CAEN 4321) din Gherla, Cluj. Certificată ANRE C1A și C2A — autorizată pentru proiectare și execuție instalații electrice joasă și medie tensiune.",
    "founded": 2006,
    "employees": 5,
    "location": {
      "city": "Gherla",
      "county": "Cluj",
      "address": "Str. Gîrlei, Nr. 10/A"
    },
    "contact": {
      "phone": "+40744975857",
      "email": "electrobild@yahoo.com",
      "website": ""
    },
    "coverage": ["Cluj"],
    "specializations": [],
    "certifications": [],
    "capacity": { "minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0 },
    "financials": { "revenue2024": 915195, "profit2024": 1823, "currency": "RON" },
    "services": ["proiectare", "instalare"],
    "verified": false,
    "featured": false,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  },
  {
    "id": "flm-teo-electric",
    "slug": "flm-teo-electric",
    "name": "FLM Teo Electric",
    "cui": "RO43932245",
    "logo": "",
    "description": "Firmă de lucrări de instalații electrice (CAEN 4321) din Gilău, Cluj. Certificată ANRE C1A și C2A — autorizată pentru proiectare și execuție instalații electrice joasă și medie tensiune.",
    "founded": 2021,
    "employees": 3,
    "location": {
      "city": "Gilău",
      "county": "Cluj",
      "address": "Sat Someșu Rece, Com. Gilău, Str. Sub Cetate, Nr. 31"
    },
    "contact": {
      "phone": "+40745556294",
      "email": "",
      "website": ""
    },
    "coverage": ["Cluj"],
    "specializations": [],
    "certifications": [],
    "capacity": { "minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0 },
    "financials": { "revenue2024": 1209166, "profit2024": 346873, "currency": "RON" },
    "services": ["proiectare", "instalare"],
    "verified": false,
    "featured": false,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
    "anreMatch": null
  },
  {
    "id": "electrostrat",
    "slug": "electrostrat",
    "name": "Electrostrat",
    "cui": "RO48172493",
    "logo": "",
    "description": "Firmă de lucrări de instalații electrice (CAEN 4321) din Cluj-Napoca. Certificată ANRE C1A și C2A — autorizată pentru proiectare și execuție instalații electrice joasă și medie tensiune.",
    "founded": 2023,
    "employees": 3,
    "location": {
      "city": "Cluj-Napoca",
      "county": "Cluj",
      "address": "Str. Frunzișului, Nr. 35, Parter"
    },
    "contact": {
      "phone": "+40732468929",
      "email": "",
      "website": ""
    },
    "coverage": ["Cluj"],
    "specializations": [],
    "certifications": [],
    "capacity": { "minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0 },
    "financials": { "revenue2024": 555118, "profit2024": 225710, "currency": "RON" },
    "services": ["proiectare", "instalare"],
    "verified": false,
    "featured": false,
    "createdAt": "2026-04-22",
    "updatedAt": "2026-04-22",
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
