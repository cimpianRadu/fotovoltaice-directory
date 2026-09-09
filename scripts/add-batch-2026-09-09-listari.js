/* eslint-disable */
// Batch 2026-09-09 — 2 listări inbound prin formularul /listeaza-firma (NU pipeline discovery).
// Rândurile 21 și 22 din tabul „Listări", ambele pe status „Nou".
//
// A treia listare rămasă pe „Nou" (ALEXLIAN S.R.L. / SolarMount, Bihor) NU intră aici:
// face doar execuție mecanică de parcuri la sol ca subcontractor pentru EPC, nu are
// atestat ANRE și nu se încadrează în nicio specializare din data/specializations.json.
// Decizia rămâne la user.
//
// ── SOLANUM (CUI 11021688) ────────────────────────────────────────────────────
// ANAF (interogare directă 09.09.2026): înregistrată din 30.09.1998, J35/982/1998,
// plătitoare de TVA din 1998, în RO e-Factura din 01.02.2024, fără stare de inactivitate.
// CAEN principal 4321 (lucrări de instalații electrice), locul 3 în Top Afaceri România
// pe 4321 în Moșnița Nouă.
//
// SITE: solanum.ro confirmă CUI RO11021688 și J35/982/1998 în pagina de termeni, deci
// site-ul e al aceleiași entități (nu sister site).
//
// ANRE: atestat 18335, Tarif B, emis 21.06.2022, expiră 21.06.2027, stare „Atestat",
// pe „SOLANUM", județul Timis. Potrivirea e sigură: adresa din registru (Str. Rodnei nr 5,
// cam 1, cp 307285, Moșnița Nouă) e identică cu sediul social de la ANAF.
//
// AFM: apare pe lista oficială de instalatori validați Casa Verde Fotovoltaice
// (data/casa-verde-installers.json, CUI 11021688), deci badge-ul Casa Verde e real,
// nu doar o revendicare de pe site. Tag-ul `casa-verde` intră ca atare.
//
// JUDEȚ / ORAȘ: sediul social e în Moșnița Nouă, dar punctul de lucru și adresa publicată
// pe pagina de contact sunt în Timișoara (Str. Stan Vidrighin 18). Firma s-a listat singură
// ca „companie din Timișoara". Ambele sunt în Timiș, deci location.county nu e ambiguu.
//
// FINANCIALS: listafirme.ro (bilanțuri MF), pentru că API-ul targetare.ro răspunde
// 403 „Subscription Error - API requests exceeded". Creșterea e reală și susținută:
// 334k (2021) → 3,13M (2022) → 4,77M (2023) → 6,33M (2024) → 10,66M (2025), de la
// 1 la 30 de angajați. Anul în care sare cifra coincide cu anul atestatului ANRE.
//
// CAPACITATE: min/max/projectsCompleted rămân 0. Site-ul revendică „100MW+ instalați",
// „600+ clienți", „500+ proiecte" și publică lucrări de referință în Germania (Magdeburg
// 16 MW, Bad Waldsee 8,7 MW, Dunningen 750 kW). Cu 30 de angajați, la acele parcuri au
// fost aproape sigur subcontractor, nu EPC, iar site-ul nu spune care a fost rolul lor.
// A pune 16.000 kW în maxProjectKw ar afișa pe card „până la 16.000 kW", ceea ce nu se
// susține. Rămân 0 până la o confirmare telefonică.
//
// COVERAGE: doar „Timiș". Formularul spune „piața din România și cea internațională",
// dar nu numește județe, iar site-ul nu are pagină de acoperire. Se lărgește după apel.
//
// SPECIALIZĂRI: „rezidential" (Casa Verde 2023/2024, dosar prosumator) și
// „hale-industriale" (referințele din Timișoara sunt la Printzone, hală de producție
// publicitară în Moșnița Veche, și la Valeram, 30 kW fiecare). Formularul cerea
// „parcuri-logistice", dar nu există nicio lucrare publicată pe un parc logistic.
//
// ISO-9001: badge publicat în footer-ul propriu (iso-9001.webp), la fel ca la celelalte
// 27 de firme din director cu ISO-9001. Certificatul nu a fost văzut.
//
// LOGO: logo-dark.png de pe solanum.ro (PNG transparent, text portocaliu + navy, lizibil
// pe cardurile albe).
//
// ── MOLDOVAN ECOSERV (CUI 39615770) ───────────────────────────────────────────
// ANAF (interogare directă 09.09.2026): înregistrată din 12.07.2018, J06/801/2018,
// NEPLĂTITOARE de TVA, nu e în RO e-Factura, fără stare de inactivitate.
//
// CAEN: 5610 (restaurante) la ANAF, 4711 preponderent la listafirme (comerț cu amănuntul).
// Firmă rurală mixtă: magazin + lucrări de instalații. Precedent identic ca tratament:
// karmenergy (4120) și axionet-iot. Ce contează e atestatul ANRE, care e real.
//
// ANRE: atestat 19267, Tarif B, emis 03.04.2023, expiră 03.04.2028, stare „Atestat",
// pe „MOLDOVAN ECOSERV", județul Bistrita-Nasaud. Potrivire sigură: registrul are
// aceeași localitate (Mocod, nr. 250) și același telefon (0752975215) ca ANAF și ca
// formularul de listare.
//
// „PESTE 15 ANI EXPERIENȚĂ" din formular NU intră nicăieri: firma e din 2018, iar
// profilul de pe daibau.ro spune „8+ ani experiență". Cei 15 ani sunt ai omului, nu
// ai firmei, și nu avem cum să-i verificăm.
//
// WEBSITE: căutat direct, nu dedus. Nu are site propriu; prezența online e profilul
// daibau.ro/executant/moldovan_ecoserv_srl (notă 9,8/10, echipă de 3, răspuns în 24h).
// Fără website nu descărcăm favicon, deci câmpul `logo` lipsește complet (altfel
// next/image dă 400 pe un fișier inexistent).
//
// FINANCIALS: listafirme.ro. Microîntreprindere: 379.769 lei cifră de afaceri și
// 54.284 lei profit în 2025, cu 1 salariat. Sub pragul de TVA, ceea ce se potrivește
// cu bilanțul.
//
// SPECIALIZĂRI / SEGMENT: doar „rezidential". Formularul cerea „cladiri-birouri", dar
// nu există nicio lucrare publicată pe o clădire de birouri, iar cererile de pe profilul
// daibau sunt rezidențiale. Se lărgește dacă apelul arată altceva.
//
// AFM: NU apare pe lista de instalatori validați Casa Verde, deci fără tag `casa-verde`.
//
// JUDEȚ: Bistrița-Năsăud avea o singură firmă în director (datacor). Aceasta e a doua.
const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'solanum',
    slug: 'solanum',
    name: 'Solanum',
    cui: 'RO11021688', // plătitor de TVA din 30.09.1998, confirmat la ANAF
    logo: '/logos/solanum.png',
    description:
      'Solanum este o firmă din județul Timiș, înființată în 1998, cu sediul social în Moșnița Nouă și punct de lucru în Timișoara. Proiectează, instalează, pune în funcțiune și întreține sisteme fotovoltaice pentru locuințe, firme și hale de producție, cu montaj pe acoperiș, pe structuri tip carport și pe spații deschise. Deține atestat ANRE tip B nr. 18335, emis în iunie 2022 și valabil până în iunie 2027, și lucrează cu echipe proprii de montaj, plus ingineri electricieni care se ocupă de verificarea instalațiilor, configurarea echipamentelor și punerea în funcțiune. Este instalator validat AFM și a montat sisteme în programele Casa Verde Fotovoltaice 2023 și 2024, întocmind și dosarul de prosumator. Printre lucrările de referință publicate pe site sunt parcuri fotovoltaice în Germania (Magdeburg 16 MW, Bad Waldsee 8,7 MW, Dunningen 750 kW) și sisteme pe clădiri în Timișoara, la Printzone și Valeram, de câte 30 kW. Cifra de afaceri a crescut de la 3,1 milioane de lei în 2022 la 10,7 milioane de lei în 2025, cu 30 de angajați.',
    founded: 1998,
    employees: 30,
    location: {
      city: 'Timișoara',
      county: 'Timiș',
      address:
        'Str. Stan Vidrighin, Nr. 18, Timișoara 300571 (punct de lucru). Sediu social: Sat Moșnița Nouă, Com. Moșnița Nouă, Str. Rodnei, Nr. 5, jud. Timiș'
    },
    contact: {
      phone: '+40773839066',
      email: 'office@solanum.ro',
      website: 'https://solanum.ro'
    },
    coverage: ['Timiș'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: ['ISO-9001'],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: {
      year: 2025,
      revenue: 10664995,
      profit: 1130339,
      history: [
        { year: 2021, revenue: 334297, profit: -1353, employees: 1 },
        { year: 2022, revenue: 3131989, profit: 431699, employees: 6 },
        { year: 2023, revenue: 4766550, profit: 295188, employees: 19 },
        { year: 2024, revenue: 6334703, profit: 705981, employees: 18 },
        { year: 2025, revenue: 10664995, profit: 1130339, employees: 30 }
      ]
    },
    tags: [
      'pv-rezidential',
      'pv-comercial',
      'casa-verde',
      'prosumator',
      'proiectare',
      'mentenanta-pv',
      'parcuri-fotovoltaice'
    ],
    featured: false,
    verified: true,
    createdAt: '2026-09-09',
    updatedAt: '2026-09-09',
    segment: 'ambele',
    anreMatch: { societate: 'SOLANUM', judet: 'Timis' }
  },
  {
    id: 'moldovan-ecoserv',
    slug: 'moldovan-ecoserv',
    name: 'Moldovan Ecoserv',
    cui: '39615770', // neplătitoare de TVA, deci fără prefix RO
    description:
      'Moldovan Ecoserv este o firmă din Mocod, comuna Nimigea, județul Bistrița-Năsăud, înființată în 2018. Se ocupă de proiectarea și execuția instalațiilor electrice de joasă tensiune, a instalațiilor termice și sanitare și a sistemelor fotovoltaice. Deține atestat ANRE tip B nr. 19267, emis în aprilie 2023 și valabil până în aprilie 2028, pentru instalații de 0,4 kV. Este o echipă mică, de trei oameni, care acoperă zona Bistrița-Năsăud și montează în principal sisteme pentru locuințe. Pe platforma daibau.ro, de unde își ia o parte din lucrări, are nota 9,8 din 10 și marcajul de răspuns în 24 de ore.',
    founded: 2018,
    employees: 1,
    location: {
      city: 'Mocod',
      county: 'Bistrița-Năsăud',
      address: 'Sat Mocod, Com. Nimigea, Nr. 250, 427184'
    },
    contact: {
      phone: '+40752975215',
      email: 'electroinstalmoldovan@gmail.com',
      website: ''
    },
    coverage: ['Bistrița-Năsăud'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: {
      year: 2025,
      revenue: 379769,
      profit: 54284,
      history: [
        { year: 2021, revenue: 103560, profit: 26352, employees: 1 },
        { year: 2022, revenue: 24470, profit: -5913 },
        { year: 2023, revenue: 95712, profit: 21022, employees: 1 },
        { year: 2024, revenue: 132245, profit: 57039, employees: 1 },
        { year: 2025, revenue: 379769, profit: 54284, employees: 1 }
      ]
    },
    tags: ['pv-rezidential', 'proiectare', 'certificare-anre'],
    featured: false,
    verified: true,
    createdAt: '2026-09-09',
    updatedAt: '2026-09-09',
    segment: 'rezidential',
    anreMatch: { societate: 'MOLDOVAN ECOSERV ', judet: 'Bistrita-Nasaud' }
  }
];

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const existingCuis = new Set(data.companies.map(c => String(c.cui).replace(/^RO/, '')));
const toAdd = newCompanies.filter(c => !existingCuis.has(String(c.cui).replace(/^RO/, '')));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);
