/* eslint-disable */
// Batch 2026-11-24 — listare inbound prin formularul /listeaza-firma.
//
// ── NEXUM ENERGY / NEXUM RENEWABLES SRL (CUI 50002253), listare nouă ────────
// Rândurile 33-35 din „Listări", 22.11.2026 (formularul trimis de trei ori în 5 minute; al
// treilea are alt telefon, 0771961791, numărul de WhatsApp de pe site, restul identic).
// George Liviu Ionescu (administrator), contact@nexumenergy.ro, nexumenergy.ro.
// Formular: „hale-industriale", segment „ambele", județ Giurgiu.
// Radu (24 nov, la telefon): sunt parteneri oficiali GoodWe și folosesc doar produse GoodWe;
// vrea să apară pe fișă. Site-ul confirmă: „Instalator certificat GoodWe · GoodHeat",
// „GoodWe PLUS+ Silver Installer". Panourile sunt Trina sau Longi (GoodWe = invertoare,
// baterii, stații de încărcare, pompe de căldură GoodHeat).
// ANAF (24.11.2026): NEXUM RENEWABLES S.R.L., J2024000423528, înregistrată 24.04.2024,
// CAEN 4321, plătitoare de TVA, activă. Sediu: Str. Argeșului nr. 28B, Bolintin-Vale, Giurgiu.
// Punct de lucru (site): Str. Nerva Traian nr. 3, City Business Center, Sector 3, București.
// ANRE (snapshot): E1 nr. 23322 și C2A nr. 23323, ambele din 23.06.2025, valabile până în
// 23.06.2030, „Atestat". Telefonul din registru: 0763736442.
// AFM: nu apare în casa-verde-installers.json. Site-ul are pachete pentru programul AFM de
// baterii (nov 2026), dar fără validare AFM documentată, deci fără tag `casa-verde`.
// ISO (pagina „Despre noi", cu PDF): 9001/14001/45001/27001, RS Cert, nr. xx/RSC02667/0001/RO,
// valabile până la 9 mai 2027.
// LUCRĂRI DOCUMENTATE: niciuna pe site (fără portofoliu). Exemplul de 10,34 kWp din
// Bolintin-Vale e o simulare PVGIS, „locuința din exemplu este ilustrativă".
// capacity: 0/0 (feedback-capacity-from-documented-works-not-packages). De întrebat la apel:
// cea mai mare lucrare făcută.
// SEGMENT: `ambele`, `rezidential` + `hale-industriale`, ca în formular. Fără lucrare
// comercială documentată (precedentul Elon ar zice `rezidential`), dar site-ul are pagini
// dedicate pentru C&I: EPC, BESS GoodWe BAT-C / ESA 125 kW, studii de fezabilitate, DTAC,
// ready-to-build, iar atestatele E1 + C2A acoperă mai mult decât rezidențialul.
// COVERAGE: București, Giurgiu (sediul și punctul de lucru). Alte județe nu sunt numite.
// FINANCIALS (ANAF bilanț): 2024 CA 203.903 / profit 101.245 / 1 sal.;
// 2025 CA 786.533 / profit 489.701 / 1 sal.
// Cifre care NU intră: „5,0 din 5 pe Google, din 11 recenzii" (se schimbă), prețurile pachetelor.
// LOGO: nexumenergy.ro/sigla/nexum-energy-negru.png (655×600 RGBA, negru pe transparent).

const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'nexum-energy',
    slug: 'nexum-energy',
    name: 'Nexum Energy',
    cui: 'RO50002253',
    logo: '/logos/nexum-energy.png',
    description:
      'Nexum Energy (NEXUM RENEWABLES SRL) este o firmă înființată în 2024, cu sediul social în Bolintin-Vale, județul Giurgiu, și punct de lucru în City Business Center, Sector 3, București. Este partener oficial GoodWe, cu statutul GoodWe PLUS+ Silver Installer, și lucrează exclusiv cu echipamente GoodWe: invertoare hibride, baterii Lynx și ESA, stații de încărcare HCA și pompe de căldură GoodHeat R290, iar panourile sunt Trina sau Longi. Deține atestate ANRE de tip E1 și C2A, emise în iunie 2025, și execută lucrările cu echipe proprii. Pentru firme și hale proiectează și execută centrale fotovoltaice în regim EPC, cu stocare GoodWe BAT-C de 61 până la 261 kWh sau ESA de 125 kW / 261 kWh, și pregătește documentația: studii de fezabilitate și de soluție, proiecte tehnice și DTAC, certificate de urbanism, avize și autorizații. Pentru case montează sisteme on-grid, hibride și off-grid, baterii pentru prosumatori și sisteme de balcon, întocmește dosarul de prosumator și pregătește dosarele pentru programul AFM de stocare. Oferă mentenanță programată pentru invertoare GoodWe și Huawei și plata în rate prin tbi bank. Are certificări ISO 9001, 14001, 45001 și 27001, valabile până în mai 2027. Cifra de afaceri a ajuns la 0,79 milioane de lei în 2025, de la 0,20 milioane în 2024.',
    founded: 2024,
    employees: 1,
    location: {
      city: 'Bolintin-Vale',
      county: 'Giurgiu',
      address: 'Str. Argeșului, Nr. 28B. Punct de lucru: Str. Nerva Traian nr. 3, City Business Center, Sector 3, București'
    },
    contact: {
      phone: '+40771961791',
      email: 'contact@nexumenergy.ro',
      website: 'https://nexumenergy.ro'
    },
    coverage: ['București', 'Giurgiu'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: ['ISO-9001', 'ISO-14001', 'ISO-45001', 'ISO-27001'],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: {
      year: 2025,
      revenue: 786533,
      profit: 489701,
      history: [
        { year: 2024, revenue: 203903, profit: 101245, employees: 1 },
        { year: 2025, revenue: 786533, profit: 489701, employees: 1 }
      ]
    },
    tags: [
      'partener-goodwe',
      'pv-rezidential',
      'pv-comercial',
      'on-grid',
      'hibrid',
      'off-grid',
      'stocare-baterii',
      'EPC',
      'proiectare',
      'statii-incarcare-ev',
      'pompe-caldura',
      'prosumator',
      'mentenanta-pv',
      'finantare-disponibila',
      'magazin-online'
    ],
    featured: false,
    verified: true,
    createdAt: '2026-11-24',
    updatedAt: '2026-11-24',
    segment: 'ambele',
    anreMatch: { societate: 'NEXUM RENEWABLES', judet: 'Giurgiu' }
  }
];

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const existingCuis = new Set(data.companies.map(c => String(c.cui).replace(/^RO/, '')));
const toAdd = newCompanies.filter(c => !existingCuis.has(String(c.cui).replace(/^RO/, '')));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);
