/* eslint-disable */
// Batch 2026-08-10 — 1 listare inbound prin formularul /listeaza-firma (NU pipeline discovery).
//
// AXIONET IOT S.A. (București): CUI 17858646 confirmat la ANAF prin targetare.ro —
// sediu Str. Traian Vasile nr. 76, Sector 1 (aceeași adresă ca pe xsolar.ro), stare
// „funcțiune", plătitor de TVA, înființată 2005 (brand Commander Systems, rebranduită
// Axionet în 2017). CAEN principal 6310 (IT&C): fotovoltaicele sunt divizia XSolar,
// nu obiectul principal de activitate — dar lucrările PV sunt documentate public.
//
// Website-ul din listare (xsolar.ro) e brandul PV al aceleiași entități, nu un site
// străin: footerul xsolar.ro semnează „AXIONET IOT SA", iar adresa și telefonul coincid.
//
// ANRE: coloana M din Sheet arată „not-found" doar pentru că lookup-ul filtrează după
// județ, iar listarea a declarat București. În registru firma e la Ciorogârla, Ilfov —
// atestat 18515, Tarif B, emis 09.08.2022, expiră 09.08.2027, stare „Atestat".
// De aceea anreMatch.judet = „Ilfov" (precedent: east-solar-electric, waldevar-energy).
//
// Financials: ANAF via targetare.ro. 2025 e un an slab (12,7M cifră de afaceri față de
// 25,6M în 2024, profit 29.040 lei) — cifrele intră ca atare, fără cosmetizare.
//
// Capacitate: minProjectKw rămâne 0 (nu declară un prag minim nicăieri), maxProjectKw
// = 700 kWp — cea mai mare centrală documentată public (IKEA Timișoara, dec. 2022,
// axionet.ro). Alte proiecte documentate: Mobexpert Militari 400 kWp, Altex Huși
// 400 kWp, Bravo International Fundulea 393 kWp, Eurial Invest 311 + 340 kWp.
// projectsCompleted rămâne 0: testimonialul ALTEX vorbește de 28 de centrale (9,7 MW)
// „instalate sau în curs de instalare", deci nu e o cifră de proiecte finalizate.
//
// Acoperire: județele în care are proiecte documentate (testimonial ALTEX/COMETEX +
// Bravo International + Eurial Invest), nu o listă declarativă.
const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'axionet-iot',
    slug: 'axionet-iot',
    name: 'Axionet IoT S.A.',
    cui: 'RO17858646', // plătitor de TVA, confirmat de API-ul targetare (VAT: true)
    // Logo: XSOLAR_logo_black.svg de pe xsolar.ro, convertit în PNG (varianta albă
    // de pe site e invizibilă pe cardurile albe).
    logo: '/logos/axionet-iot.png',
    description: 'Axionet IoT este o companie din București, înființată în 2005, care instalează centrale fotovoltaice comerciale și industriale sub brandul XSolar. Livrează proiecte la cheie: audit energetic, proiectare, montaj, punere în funcțiune și dosarul de prosumator (ATR, certificat de racordare), plus mentenanță și monitorizare. Portofoliul public cuprinde centrala de 700 kWp de la IKEA Timișoara, 400 kWp la Mobexpert Militari, rețeaua de magazine ALTEX (28 de centrale, circa 9,7 MW, potrivit clientului), hotelurile Kronwell și Qosmo, parcuri logistice P3 și unități de producție precum Bravo International (393 kWp, Fundulea). Pe lângă fotovoltaice, grupul operează platforma de încărcare pentru mașini electrice Polyfazer și soluții de telematică.',
    founded: 2005,
    employees: 18,
    location: {
      city: 'București',
      county: 'București',
      address: 'Str. Aviator Traian Vasile, Nr. 76, Sector 1'
    },
    contact: {
      phone: '+40743219810',
      email: 'mihai.patrana@axionet.ro',
      website: 'https://xsolar.ro'
    },
    coverage: [
      'București',
      'Ilfov',
      'Timiș',
      'Brașov',
      'Prahova',
      'Cluj',
      'Sibiu',
      'Maramureș',
      'Bistrița-Năsăud',
      'Suceava',
      'Botoșani',
      'Vaslui',
      'Galați',
      'Brăila',
      'Dâmbovița',
      'Olt',
      'Teleorman',
      'Gorj',
      'Caraș-Severin',
      'Călărași'
    ],
    specializations: [
      'hale-industriale',
      'retail',
      'parcuri-logistice',
      'cladiri-birouri',
      'hoteluri',
      'rezidential'
    ],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 700, projectsCompleted: 0 },
    financials: {
      year: 2025,
      revenue: 12734938,
      profit: 29040,
      history: [
        { year: 2021, revenue: 8264212, profit: 232417, employees: 9 },
        { year: 2022, revenue: 33119981, profit: 3286511, employees: 12 },
        { year: 2023, revenue: 34605247, profit: 3236607, employees: 14 },
        { year: 2024, revenue: 25632262, profit: 1076421, employees: 16 },
        { year: 2025, revenue: 12734938, profit: 29040, employees: 18 }
      ]
    },
    tags: [
      'pv-comercial',
      'pv-industrial',
      'EPC',
      'proiecte-mari',
      'prosumator',
      'mentenanta-pv',
      'statii-incarcare-ev',
      'acoperire-nationala',
      'experienta-20-ani'
    ],
    featured: false,
    verified: true,
    createdAt: '2026-08-10',
    updatedAt: '2026-08-10',
    segment: 'ambele',
    anreMatch: { societate: 'AXIONET IOT', judet: 'Ilfov' }
  }
];

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const existingCuis = new Set(data.companies.map(c => String(c.cui).replace(/^RO/, '')));
const toAdd = newCompanies.filter(c => !existingCuis.has(String(c.cui).replace(/^RO/, '')));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);
