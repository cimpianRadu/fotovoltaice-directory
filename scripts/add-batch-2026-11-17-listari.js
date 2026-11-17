/* eslint-disable */
// Batch 2026-11-17 — 2 listări inbound prin formularul /listeaza-firma + actualizarea KarmEnergy.
//
// ── KARMENERGY / CROMO SEMPER AUTOMATIC (CUI 17512803), actualizare ─────────
// Rândul 32 din „Listări", 13.11.2026, Carmen Florentina Adam (manager), formular retrimis cu
// „sisteme rezidențiale, comerciale și industriale". Radu (17 nov): vor să apară că fac și hale
// industriale; rămân listați ca KarmEnergy, punctul de lucru rămâne Constanța; colaborăm deja
// (cererea Ionescu, câștigată în oct).
// karmenergy.ro/portofoliul-de-lucrari (citit 17.11.2026), lucrări documentate cu poze și date:
//   - Crama Gabai: 22 kWp on-grid
//   - Apartamente de vacanță ALIZ, Eforie Nord: 20,02 kWp on-grid, 44 × Hyundai 455 Wp, Fronius Symo 20 kW
//   - Magazin alimentar, Poarta Albă: 11 kWp hibrid
//   - Luminița, com. Corbu: 10 kWp hibrid (rezidențial)
// Nicio hală industrială documentată: `hale-industriale` intră la cererea firmei, prin Radu.
// `hoteluri` (apartamentele ALIZ) și `retail` (magazinul din Poarta Albă) au lucrări în spate.
// Cifre de pe site/formular care NU intră: „peste 5.000 de lucrări" (site) vs „peste 500 de
// sisteme" (formular), se contrazic.
// capacity.maxProjectKw: 22 (Crama Gabai).
//
// ── ELON SYSTEM SOLUTIONS (CUI 47259991), listare nouă ─────────────────────
// Rândul 31 din „Listări", 05.11.2026, Robert Males (administrator), 0742279937,
// contact@elonsolutions.ro, elonsolutions.ro. Formular: „hale-industriale", segment „ambele".
// ANAF (17.11.2026): ELON SYSTEM SOLUTIONS S.R.L., J2022004521226, înregistrată 29.11.2022,
// CAEN 4321, plătitoare de TVA din 01.01.2023, activă. Sediu: Str. Mitropolit Varlaam nr. 15,
// Bl. P1, Iași. Site-ul are în footer „© 2026 ELON SYSTEM SOLUTIONS SRL", același telefon și email.
// ANRE (snapshot): atestat tip B nr. 19221 din 24.03.2023, valabil până în 24.03.2028.
// AFM: apare în data/casa-verde-installers.json; o recenzie Google de pe site pomenește
// Casa Verde 2024. Tag `casa-verde`.
// LUCRĂRI DOCUMENTATE: una singură, 5,94 kWp în Valea Ursului (Iași), noiembrie 2026, Solis 6 kW
// monofazat + 11 × Longi 540 W, structură Mini Rail pe tablă. Kitul standard de pe site: 5,46 kW
// Huawei SUN2000-5KTL-L1 + Jinko 455 W, structură K2. O recenzie pomenește montaj la sol.
// SEGMENT: `rezidential`, deși formularul zice „ambele"/„hale-industriale". Site-ul are opțiunea
// „Fotovoltaic pentru firmă" și „instalații electrice de uz casnic și industrial", dar nicio
// lucrare comercială. Precedent Sun Bit (28 oct). Se schimbă dacă la telefon dau o lucrare.
// COVERAGE: Iași. Site-ul zice „ne deplasăm în orice loc din țară", fără județe numite.
// FINANCIALS (ANAF bilanț): 2023 CA 111.591 / pierdere 73.456 / 1 sal.; 2024 CA 169.689 /
// pierdere 27.373 / 1 sal.; 2025 CA 340.714 / profit 102.814 / 1 sal.
// LOGO: elonsolutions.ro/pics/elon-logo.png (347×150 RGBA), decupat; textul „ELON" era alb
// (pentru header închis), recolorat în gri închis #374151 ca să se vadă pe fond alb.
//
// ── PANOURI CLUJ (CUI 47797680), listare nouă ──────────────────────────────
// Rândul 33 din „Listări", 15.11.2026, Daniel Szomboti (administrator), 0774334433,
// contact@panouricluj.ro, panouricluj.ro. Formular: „hale-industriale", segment „ambele".
// ANAF (17.11.2026): PANOURICLUJ S.R.L., J2023001175128, înregistrată 13.03.2023, CAEN 4321,
// plătitoare de TVA din 01.08.2023, activă. Sediu: Str. Cuza Vodă nr. 48, Florești. Punct de
// lucru (site): Hala M7, Calea Baciului 2-4, Cluj-Napoca. Footerul site-ului are CUI-ul.
// ANRE (snapshot): C1A nr. 22370 (17.09.2024) atestat; C2A nr. 25015 și A3 nr. 25014
// (28.08.2026) „Atestat (la semnat)"; B nr. 19509 și Be nr. 22369 „Retras".
// AFM: nu apare în casa-verde-installers.json.
// LUCRĂRI DOCUMENTATE (blog, fiecare cu articol):
//   - Seră de tomate bio, Căpușu Mare (Cluj): 5 × Deye hibrid 80 kW HV = 400 kW, nov 2026
//   - Fabrică de prelucrare a lemnului, Lunca Ilvei (Bistrița-Năsăud): Huawei 230 kWp, mai 2026
//   - Fabrica de brânzeturi De Colțești: sistem Victron cu stocare (500 kW în articol)
//   - case: Deye 12 kW trifazat + Pytes 15 kWh, carport, montaj la sol Solis + 10 kWh, off-grid
// Cifre care NU intră: „peste 530/400 de sisteme", „225 de recenzii", ISO 9001 (neverificat),
// „experiență cumulată de peste 10 ani" (firma e din 2023).
// capacity.maxProjectKw: 400 (sera din Căpușu Mare, puterea invertoarelor; kWp nescris).
// COVERAGE: Cluj, Alba, Bistrița-Năsăud, Sălaj (pagina „Despre noi").
// FINANCIALS (ANAF bilanț): 2023 CA 1.294.745 / pierdere 16.139 / 3 sal.; 2024 CA 3.324.685 /
// pierdere 769.691 / 5 sal.; 2025 CA 7.811.552 / profit 836.143 / 12 sal.
// LOGO: panouricluj.ro/wp-content/uploads/2025/01/Logo-panouri-cluj.png, decupat la 379×378.

const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'elon-system-solutions',
    slug: 'elon-system-solutions',
    name: 'Elon System Solutions',
    cui: 'RO47259991',
    logo: '/logos/elon-system-solutions.png',
    description:
      'Elon System Solutions (ELON Solutions) este o firmă din Iași, înființată în 2022, care proiectează, montează și pune în funcțiune sisteme fotovoltaice, mai ales pentru case. Deține atestat ANRE tip B și a montat sisteme prin programul Casa Verde Fotovoltaice, sesiunea 2024. Kitul standard de pe site are 5,46 kW, cu invertor Huawei și panouri Jinko Solar pe structură K2 pentru acoperiș înclinat, iar cea mai recentă lucrare prezentată are 5,94 kWp, cu invertor Solis și panouri Longi, în Valea Ursului, județul Iași. Montează pe acoperiș și la sol și se ocupă de dosarul de prosumator. Pe lângă fotovoltaice, face instalații electrice pentru locuințe și spații industriale, verificări periodice și mentenanță. Cifra de afaceri a ajuns la 0,34 milioane de lei în 2025, de la 0,17 milioane în 2024.',
    founded: 2022,
    employees: 1,
    location: {
      city: 'Iași',
      county: 'Iași',
      address: 'Str. Mitropolit Varlaam, Nr. 15'
    },
    contact: {
      phone: '+40742279937',
      email: 'contact@elonsolutions.ro',
      website: 'https://elonsolutions.ro'
    },
    coverage: ['Iași'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 6, projectsCompleted: 0 },
    financials: {
      year: 2025,
      revenue: 340714,
      profit: 102814,
      history: [
        { year: 2023, revenue: 111591, profit: -73456, employees: 1 },
        { year: 2024, revenue: 169689, profit: -27373, employees: 1 },
        { year: 2025, revenue: 340714, profit: 102814, employees: 1 }
      ]
    },
    tags: [
      'pv-rezidential',
      'on-grid',
      'casa-verde',
      'prosumator',
      'instalatii-electrice',
      'mentenanta-pv'
    ],
    featured: false,
    verified: true,
    createdAt: '2026-11-17',
    updatedAt: '2026-11-17',
    segment: 'rezidential',
    anreMatch: { societate: 'ELON SYSTEM SOLUTIONS', judet: 'Iasi' }
  },
  {
    id: 'panouri-cluj',
    slug: 'panouri-cluj',
    name: 'Panouri Cluj',
    cui: 'RO47797680',
    logo: '/logos/panouri-cluj.png',
    description:
      'Panouri Cluj (PANOURICLUJ SRL) este o firmă înființată în 2023, cu sediul social în Florești și punct de lucru în Hala M7 de pe Calea Baciului din Cluj-Napoca, care proiectează și montează la cheie sisteme fotovoltaice on-grid, hibride și off-grid, cu echipe proprii. Lucrează atât pentru case, cât și pentru firme, ferme și fabrici. Printre lucrările comerciale prezentate se numără o seră de tomate bio din Căpușu Mare, cu cinci invertoare hibride Deye de 80 kW și stocare de înaltă tensiune, un sistem Huawei de 230 kWp la o fabrică de prelucrare a lemnului din Lunca Ilvei și un sistem Victron cu stocare la o fabrică de brânzeturi. La case montează pe acoperiș ceramic, metalic sau plat, la sol și pe carporturi, cu invertoare Deye, Huawei, Victron Energy și Fronius și baterii LiFePO4. Depune gratuit dosarul de prosumator, montează stații de încărcare pentru mașini electrice și oferă plata în rate. Lucrează în principal în județul Cluj și în Alba, Bistrița-Năsăud și Sălaj. Cifra de afaceri a ajuns la 7,8 milioane de lei în 2025, cu 12 angajați, de la 3,3 milioane în 2024.',
    founded: 2023,
    employees: 12,
    location: {
      city: 'Cluj-Napoca',
      county: 'Cluj',
      address: 'Hala M7, Calea Baciului 2-4 (punct de lucru). Sediu social: Str. Cuza Vodă, Nr. 48, Florești, jud. Cluj'
    },
    contact: {
      phone: '+40774334433',
      email: 'contact@panouricluj.ro',
      website: 'https://panouricluj.ro'
    },
    coverage: ['Cluj', 'Alba', 'Bistrița-Năsăud', 'Sălaj'],
    specializations: ['rezidential', 'hale-industriale', 'agricol'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 400, projectsCompleted: 0 },
    financials: {
      year: 2025,
      revenue: 7811552,
      profit: 836143,
      history: [
        { year: 2023, revenue: 1294745, profit: -16139, employees: 3 },
        { year: 2024, revenue: 3324685, profit: -769691, employees: 5 },
        { year: 2025, revenue: 7811552, profit: 836143, employees: 12 }
      ]
    },
    tags: [
      'pv-rezidential',
      'pv-comercial',
      'pv-industrial',
      'on-grid',
      'hibrid',
      'off-grid',
      'stocare-baterii',
      'prosumator',
      'statii-incarcare-ev',
      'finantare-disponibila',
      'magazin-online',
      'proiecte-mari'
    ],
    featured: false,
    verified: true,
    createdAt: '2026-11-17',
    updatedAt: '2026-11-17',
    segment: 'ambele',
    anreMatch: { societate: 'PANOURICLUJ', judet: 'Cluj' }
  }
];

const karmUpdate = {
  description:
    'KarmEnergy este brandul comercial al Cromo Semper Automatic SRL, firmă înregistrată în 2005, cu sediul social în Pitești (Argeș) și punct de lucru în Constanța. Proiectează și instalează sisteme fotovoltaice on-grid, hibride și off-grid pentru locuințe, firme și hale industriale, de la analiza consumului și dimensionare până la montaj, punere în funcțiune, monitorizare și mentenanță. Printre lucrările comerciale prezentate se numără un sistem on-grid de 22 kWp la Crama Gabai, unul de 20 kWp cu invertor Fronius pentru un complex de apartamente de vacanță din Eforie Nord și un sistem hibrid de 11 kWp pentru un magazin alimentar din Poarta Albă. Deține atestat ANRE tip B nr. 18022 din 07.03.2022, pentru instalații de 0,4 kV, și a fost instalator validat în programul Casa Verde Fotovoltaice, sesiunea 2022 (contract 214/RF). Montajul la cheie se face în principal în Constanța și Tulcea, iar în Călărași, Ialomița și Brăila în funcție de proiect. Operează și un magazin online cu panouri, invertoare Victron, Fronius, Sungrow și Solis, baterii, structuri de prindere și kituri complete, livrate în toată țara.',
  specializations: ['rezidential', 'hale-industriale', 'hoteluri', 'retail'],
  capacity: { minProjectKw: 0, maxProjectKw: 22, projectsCompleted: 0 },
  addTags: ['pv-comercial'],
  updatedAt: '2026-11-17'
};

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const karm = data.companies.find(c => c.slug === 'karmenergy');
if (!karm) throw new Error('karmenergy lipsește');
karm.description = karmUpdate.description;
karm.specializations = karmUpdate.specializations;
karm.capacity = karmUpdate.capacity;
for (const t of karmUpdate.addTags) if (!karm.tags.includes(t)) karm.tags.splice(1, 0, t);
karm.updatedAt = karmUpdate.updatedAt;
console.log('Updated karmenergy');

const existingCuis = new Set(data.companies.map(c => String(c.cui).replace(/^RO/, '')));
const toAdd = newCompanies.filter(c => !existingCuis.has(String(c.cui).replace(/^RO/, '')));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);
