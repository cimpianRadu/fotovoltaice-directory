const fs = require('fs');
const path = require('path');

// Batch 2026-05-01 — Suceava + Buzau + Neamt, ANRE C1A/C2A
// Researched 5 firme. Yield 4/5 (80%).
// Rejected: ELECTRICAL TEHNOLOGY (CUI 31509455) — webshop e-commerce de componente
// electrice, "Servicii Instalatii Electrice" doar link în meniu fără pagină dedicată.
// Nu e installer turnkey, e distribuitor produse PV.
// VOLTER: CAEN 4664 (wholesale) este flag fals — în realitate e firmă mixtă
// proiectare-execuție tablouri electrice + instalații PV industriale, cu ANRE C1A/C2A
// active și exporturi în 5 țări UE. Dual-business dar PV installation real (referință
// expresă în homepage: "instalarea și punerea în funcțiune a sistemelor fotovoltaice").
// LUCRIS SERV: PV este 1 din 9 servicii dar are linie tel dedicată Casa Verde + ISO
// 9001/14001/45001 + 20+ ani experiență — pass cu honest framing.
const newCompanies = [
  {
    "id": "volter",
    "slug": "volter",
    "name": "Volter",
    "cui": "RO22524553",
    "logo": "",
    "description": "Firmă fondată în 2007 în Gura Humorului, Suceava, cu activitate dublă: proiectare și producție de tablouri electrice industriale și instalare sisteme fotovoltaice. Echipa execută soluții complete pentru proiecte de energie regenerabilă, de la consultanță și documentație până la instalare și punere în funcțiune. Distribuitor autorizat Schneider, Siemens, Phoenix Contact, Eaton, cu exporturi în Spania, Franța, Belgia, Germania și Polonia.",
    "founded": 2007,
    "employees": 35,
    "location": {
      "city": "Gura Humorului",
      "county": "Suceava",
      "address": "Bld. Bucovina, Nr.97, Gura Humorului, Jud. Suceava"
    },
    "contact": {
      "phone": "+40230234200",
      "email": "office@volter.ro",
      "website": "https://volter.ro/"
    },
    "coverage": ["Suceava", "Botoșani", "Iași", "Neamț"],
    "specializations": ["hale-industriale"],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 21925295, "profit": 1554677},
    "tags": ["on-grid", "experienta-15-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-05-01",
    "updatedAt": "2026-05-01",
    "anreMatch": {
      "societate": "VOLTER",
      "judet": "Suceava"
    }
  },
  {
    "id": "electro-ana-luiza",
    "slug": "electro-ana-luiza",
    "name": "Electro Ana Luiza",
    "cui": "RO34298727",
    "logo": "",
    "description": "Firmă fondată în 2015 în Pogoanele, județul Buzău, specializată în instalații electrice și sisteme fotovoltaice pentru clienți rezidențiali și industriali. Servicii incluse: proiectare și execuție rețele electrice, sisteme fotovoltaice, iluminat, instalații curenți slabi (TV, internet, alarmă), tablouri electrice și intervenții 24/7. Echipă de electricieni autorizați ANRE.",
    "founded": 2015,
    "employees": 25,
    "location": {
      "city": "Pogoanele",
      "county": "Buzău",
      "address": "Str. Tudor Vladimirescu, Nr.63, Pogoanele, Jud. Buzău"
    },
    "contact": {
      "phone": "+40723648102",
      "email": "electroanaluiza@yahoo.com",
      "website": "https://www.electro-ana.ro/"
    },
    "coverage": ["Buzău", "Brăila", "Ialomița"],
    "specializations": ["hale-industriale"],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 9169711, "profit": 902005},
    "tags": ["on-grid", "experienta-10-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-05-01",
    "updatedAt": "2026-05-01",
    "anreMatch": {
      "societate": "ELECTRO ANA LUIZA",
      "judet": "Buzau"
    }
  },
  {
    "id": "elborar-serv",
    "slug": "elborar-serv",
    "name": "Elborar Serv",
    "cui": "RO18201082",
    "logo": "",
    "description": "Firmă fondată în 2005 în Bodești, județul Neamț, cu peste 19 ani de experiență în instalații electrice și sisteme fotovoltaice. Acoperă o gamă variată de servicii: branșamente electrice, rețele de joasă și medie tensiune, instalații rezidențiale și industriale, smart home, panouri fotovoltaice, verificări PRAM și automatizări porți. Portofoliu cu peste 2.900 de proiecte finalizate.",
    "founded": 2005,
    "employees": 14,
    "location": {
      "city": "Bodești",
      "county": "Neamț",
      "address": "Sat Oslobeni, Com. Bodești, Jud. Neamț"
    },
    "contact": {
      "phone": "+40744702791",
      "email": "office@elborarserv.ro",
      "website": "https://www.elborarserv.ro/"
    },
    "coverage": ["Neamț", "Bacău", "Iași"],
    "specializations": ["hale-industriale"],
    "certifications": [],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 3551380, "profit": 262262},
    "tags": ["on-grid", "experienta-15-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-05-01",
    "updatedAt": "2026-05-01",
    "anreMatch": {
      "societate": "ELBORAR SERV",
      "judet": "Neamt"
    }
  },
  {
    "id": "lucris-serv",
    "slug": "lucris-serv",
    "name": "Lucris Serv",
    "cui": "RO9998240",
    "logo": "",
    "description": "Firmă fondată în 1997 în Negrești, județul Neamț, cu peste 25 de ani de experiență ca antreprenor electric. Oferă proiectare, execuție și mentenanță pentru instalații electrice, rețele de joasă și medie tensiune, iluminat public/arhitectural, branșamente, sisteme de împământare, automatizări KNX și panouri fotovoltaice. Partener Casa Verde cu linie dedicată pentru sisteme fotovoltaice rezidențiale și comerciale.",
    "founded": 1997,
    "employees": 16,
    "location": {
      "city": "Negrești",
      "county": "Neamț",
      "address": "Sat Negrești, Com. Negrești, Str. Mănăstirea Horaița, Nr.62, Jud. Neamț"
    },
    "contact": {
      "phone": "+40751587441",
      "email": "office@lucrisserv.ro",
      "website": "https://lucrisserv.ro/"
    },
    "coverage": ["Neamț", "Iași", "Bacău", "Suceava"],
    "specializations": ["hale-industriale"],
    "certifications": ["ISO-9001", "ISO-14001", "ISO-45001"],
    "capacity": {"minProjectKw": 0, "maxProjectKw": 0, "projectsCompleted": 0},
    "financials": {"year": 2024, "revenue": 8821693, "profit": 1609787},
    "tags": ["on-grid", "casa-verde", "experienta-20-ani"],
    "featured": false,
    "verified": true,
    "createdAt": "2026-05-01",
    "updatedAt": "2026-05-01",
    "anreMatch": {
      "societate": "LUCRIS SERV",
      "judet": "Neamt"
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
