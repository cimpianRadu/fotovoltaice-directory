/* eslint-disable */
// Batch 2026-09-15 — 1 listare inbound prin formularul /listeaza-firma (NU pipeline discovery).
// Rândul 23 din tabul „Listări", status „Nou", depus azi 15.09.2026 de Bogdan (marketing).
//
// Rândul 19 (ALEXLIAN / SolarMount, Bihor) rămâne pe „Nou" din 26 august: execuție
// mecanică de parcuri la sol ca subcontractor, fără atestat ANRE. Decizia rămâne la user.
//
// ── IGF GRUP (CUI 40430724) ───────────────────────────────────────────────────
// ANAF (interogare directă 15.09.2026): înregistrată 16.01.2019, J08/157/2019, CAEN 4321
// (lucrări de instalații electrice), plătitoare de TVA din 31.03.2022, fără stare de
// inactivitate. NU e în RO e-Factura. Sediu: Str. Zizinului 119, Obiectiv nr. 8, sc. B,
// et. 3, birou 5, Brașov, cod 500407.
//
// SITE: igfgrup.ro publică în footer „S.C. IGF GRUP S.R.L., J8/157/2019, CUI RO 40430724",
// deci e site-ul aceleiași entități, nu sister site.
//
// ANRE: potrivire sigură. Registrul are „IGF GRUP", jud. Brasov, la aceeași adresă ca ANAF
// (Str. Zizinului nr 119 Obiectiv nr. 8 sc B et 3 dreapta birou 5) și cu același telefon
// ca formularul de listare (0725995962). Atestate ACTIVE:
//   15203 C1A* vizare periodică, emis 07.10.2019, expiră 21.08.2029
//   15204 C2A* vizare periodică, emis 07.10.2019, expiră 21.08.2029
//   22703 E1, emis 13.12.2024, expiră 13.12.2029
//   22704 E2, emis 13.12.2024, expiră 13.12.2029
// Retrase (expirate în 2024, înlocuite de vizările de mai sus): C1A, C2A, E1, E2.
// C1A/C2A = execuție instalații electrice până la 20 kV; E1/E2 = proiectare. Firma poate
// duce lucrarea de la proiect până la racordare, ceea ce se vede în portofoliu.
//
// AFM: NU apare în data/casa-verde-installers.json. Corect, e profil pur C&I.
// Fără tag `casa-verde`.
//
// PORTOFOLIU FOTOVOLTAIC (4 lucrări publicate, toate cu detalii tehnice și poze):
//   Arctic, uzina Ulmi (Dâmbovița), 2023 — CEF 1.503 kWp, design & build. Panouri Jinko
//     Tiger Pro 72HC, invertoare Huawei SUN2000-115KTL-M2, post trafo 2.500 kVA 20/0,4 kV,
//     rețea MT subterană + JT. Asta e ancora profilului: singura firmă din județ cu o
//     centrală de peste 1 MW documentată pe site cu echipamente numite.
//   Dexion Storage Solution, Râșnov (Brașov), 2023 — carport fotovoltaic hibrid, panouri
//     Yingli 410W, invertor Solax hibrid trifazat, baterii Solax LiFePO4, prize încărcare
//     mașini/biciclete/trotinete electrice. Design & build inclusiv autorizație de construire.
//   Fermă de vaci, Palos (Brașov), 2023 — 10 kWp, panouri Yingli 550W, Huawei hibrid 10 kW.
//   Jibert (Brașov), 2026 — soluție off-grid pentru pompe de apă.
// De aici min/max: 10 kW și 1.503 kW, ambele citate direct de pe paginile de proiect.
//
// projectsCompleted rămâne 0. Site-ul animă contoare „850+ proiecte de succes",
// „3.250+ panouri fotovoltaice instalate", „85+ angajați și colaboratori" (valorile reale
// sunt în `data-to`, le-am citit din HTML). Sunt cifre pe tot grupul și pe toate meseriile,
// nu pe fotovoltaic, și nu se pot verifica. Panourile pot fi convertite grosier în ~1,8 MW,
// ceea ce se potrivește cu Arctic plus restul, dar nu e o cifră pe care s-o afișăm.
//
// „14+ ani experiență" de pe site NU intră nicăieri: firma e din 2019, adică 7 ani.
// Portofoliul chiar are lucrări din 2014 (Sala Sporturilor Brașov) și 2018 (Ursus), deci
// experiența e reală, dar e a oamenilor și a grupului, nu a entității juridice listate.
// `founded` rămâne 2019, cel de la ANAF.
//
// GRUP: IGF Grup e membră a grupului MRJ, alături de IGF Security (pază), MRJ Energy
// (furnizor licențiat de energie), MRJ AG (antrepriză generală), MRJ Utilaje, EFAYNRO,
// Lara Glamping și CEF Carfil (producție de energie fotovoltaică). Intră în descriere
// ca apartenență, atât. Nu revendicăm capabilitățile celorlalte firme din grup.
//
// EMPLOYEES: 10, din bilanțul 2025 (listafirme.ro, bilanțuri MF). Site-ul zice „85+
// angajați și colaboratori", care e grupul plus subcontractorii. Punem cifra din bilanț,
// ca la toate celelalte firme.
//
// FINANCIALS: listafirme.ro. Saltul 2022 → 2023 (3,97M → 10,17M) e chiar anul Arctic.
//   2019: 549.778 / 129.095 / 9 ang.   2020: 2.019.098 / 129.992 / 8
//   2021: 2.880.304 / 1.730.390 / 6    2022: 3.968.915 / 1.296.183 / 6
//   2023: 10.170.754 / 135.200 / 7     2024: 10.697.659 / 1.752.069 / 12
//   2025: 11.405.586 / 1.751.605 / 10
// Păstrăm ultimii 5 ani în history, ca la restul firmelor.
//
// COVERAGE: Brașov, Covasna, Dâmbovița. Toate trei sunt locuri de lucru documentate pe
// site: Brașov (Râșnov, Palos, Jibert, Codlea, Holbav), Dâmbovița (Arctic Ulmi, lucrare
// fotovoltaică), Covasna (Lidl Întorsura Buzăului, lucrare electrică). Mai există un
// magazin Altex la Turda (Cluj), dar e o singură lucrare de instalații ca subcontractor,
// prea subțire pentru un județ întreg. Site-ul revendică „capacitate de lucru pe teritoriul
// României", fără listă de județe. Se lărgește după apel.
//
// SPECIALIZĂRI: `hale-industriale` (Arctic e uzină, Dexion e platformă industrială la
// Râșnov, plus halele din parcul Electroprecizia) și `agricol` (ferma de vaci din Palos,
// pompele de apă de la Jibert). Formularul cerea doar „hale-industriale". NU punem
// `parcuri-logistice`, deși lucrează masiv în parcul logistic Electroprecizia (Mapei,
// Ursus, Dräxlmaier, Dragon Star Curier): acolo au făcut instalații electrice, nu
// fotovoltaic, iar specializările de aici se citesc ca „unde montează panouri".
//
// SEGMENT: `comercial`. Site-ul are pagină de instalații electrice rezidențiale și
// vorbește de dosar de prosumator, dar toate cele 4 lucrări fotovoltaice publicate sunt
// C&I sau agricole. Formularul a bifat tot „comercial".
//
// ISO: badge-uri publicate în footer pentru 9001, 14001, 45001, 27001, 37001 și 50001.
// Certificarea ISO 50001 (managementul energiei) e anunțată și pe blog, pe 10 sept 2026.
// Certificatele nu au fost văzute, la fel ca la celelalte firme cu badge-uri ISO.
// ISO-37001 și ISO-50001 sunt valori noi în vocabular; `app/firme/[slug]/page.tsx` le
// randează ca atare (filtrează doar prefixul ANRE-).
//
// LOGO: IGF-Grup-Logo-01 de pe igfgrup.ro (PNG transparent, verde, lizibil pe card alb).
// Descărcat deja în public/logos/igf-grup.png.

const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'igf-grup',
    slug: 'igf-grup',
    name: 'IGF Grup',
    cui: 'RO40430724',
    logo: '/logos/igf-grup.png',
    description:
      'IGF Grup este o firmă din Brașov, înființată în 2019, care proiectează și execută instalații electrice de joasă și medie tensiune, sisteme fotovoltaice, stații de încărcare pentru vehicule electrice și instalații de curenți slabi. Deține atestatele ANRE de execuție C1A și C2A (nr. 15203 și 15204, valabile până în august 2029) și atestatele de proiectare E1 și E2 (nr. 22703 și 22704, valabile până în decembrie 2029), deci poate duce o lucrare de la proiect până la racordare. Cea mai mare lucrare fotovoltaică publicată este centrala de 1.503 kWp de la uzina Arctic din Ulmi, județul Dâmbovița, executată în 2023 în regim design and build, împreună cu postul de transformare de 2.500 kVA și rețeaua de medie tensiune aferentă. Tot în 2023 a montat un carport fotovoltaic hibrid, cu baterii și prize de încărcare pentru mașini și biciclete electrice, la Dexion în Râșnov, și un sistem de 10 kWp pentru o fermă de vaci din Palos. În zona de instalații electrice are lucrări la halele din parcul logistic Electroprecizia (Mapei, Ursus, Dräxlmaier, Dragon Star Curier), la magazine Lidl și Altex și la benzinării MOL și OMV. Sistemul de management este certificat ISO 9001, 14001, 45001, 27001, 37001 și 50001. Cifra de afaceri a crescut de la 2,9 milioane de lei în 2021 la 11,4 milioane de lei în 2025, cu 10 angajați. Face parte din grupul de companii MRJ.',
    founded: 2019,
    employees: 10,
    location: {
      city: 'Brașov',
      county: 'Brașov',
      address: 'Str. Zizinului, Nr. 119, Obiectiv nr. 8, Sc. B, Et. 3, Birou 5, Brașov 500407'
    },
    contact: {
      phone: '+40725995962',
      email: 'contact@igfgrup.ro',
      website: 'https://igfgrup.ro'
    },
    coverage: ['Brașov', 'Covasna', 'Dâmbovița'],
    specializations: ['hale-industriale', 'agricol'],
    certifications: [
      'ISO-9001',
      'ISO-14001',
      'ISO-45001',
      'ISO-27001',
      'ISO-37001',
      'ISO-50001'
    ],
    capacity: { minProjectKw: 10, maxProjectKw: 1503, projectsCompleted: 0 },
    financials: {
      year: 2025,
      revenue: 11405586,
      profit: 1751605,
      history: [
        { year: 2021, revenue: 2880304, profit: 1730390, employees: 6 },
        { year: 2022, revenue: 3968915, profit: 1296183, employees: 6 },
        { year: 2023, revenue: 10170754, profit: 135200, employees: 7 },
        { year: 2024, revenue: 10697659, profit: 1752069, employees: 12 },
        { year: 2025, revenue: 11405586, profit: 1751605, employees: 10 }
      ]
    },
    tags: [
      'pv-comercial',
      'pv-industrial',
      'EPC',
      'proiectare',
      'medie-tensiune',
      'bransamente-electrice',
      'statii-incarcare-ev',
      'stocare',
      'agricol',
      'atestari-anre-multiple',
      'curenti-slabi',
      'proiecte-mari'
    ],
    featured: false,
    verified: true,
    createdAt: '2026-09-15',
    updatedAt: '2026-09-15',
    segment: 'comercial',
    anreMatch: { societate: 'IGF GRUP', judet: 'Brasov' }
  }
];

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const existingCuis = new Set(data.companies.map(c => String(c.cui).replace(/^RO/, '')));
const toAdd = newCompanies.filter(c => !existingCuis.has(String(c.cui).replace(/^RO/, '')));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);
