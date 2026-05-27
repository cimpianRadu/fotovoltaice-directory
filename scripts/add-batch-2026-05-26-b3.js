/* eslint-disable */
const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'freelux-electric',
    slug: 'freelux-electric',
    name: 'Freelux Electric S.R.L.',
    cui: 'RO28171329',
    description: 'Freelux Electric (brand LuxElectric) este o firmă din Cârligi, comuna Ștefan cel Mare, județul Neamț, înființată în 2011 și specializată în soluții și echipamente electrice. Oferă instalare de sisteme fotovoltaice (inclusiv off-grid) pentru clienți rezidențiali, alături de automatizări industriale și tablouri electrice de comandă. Sediul comercial este în Piatra Neamț.',
    founded: 2011,
    employees: 5,
    location: {
      city: 'Cârligi',
      county: 'Neamț',
      address: 'Jud. Neamț, Sat Cârligi Com. Ștefan Cel Mare, Nr. 149'
    },
    contact: {
      phone: '+40737009195',
      email: 'office@luxelectric.ro',
      website: 'https://luxelectric.ro/'
    },
    coverage: ['Neamț'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 1929604, profit: 172115 },
    tags: ['pv-rezidential', 'casa-verde', 'off-grid'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'media-ringer',
    slug: 'media-ringer',
    name: 'Media Ringer S.R.L.',
    cui: 'RO10668237',
    description: 'Media Ringer (brand Centrale Sibiu) este o firmă din Sibiu, înființată în 1998, specializată în instalații termice și de climatizare. Oferă sisteme fotovoltaice pentru locuințe în cadrul programului Casa Verde Fotovoltaice, alături de pompe de căldură, centrale termice (gaz și electrice), boilere și sisteme de aer condiționat. Se adresează în principal clienților rezidențiali.',
    founded: 1998,
    employees: 9,
    location: {
      city: 'Sibiu',
      county: 'Sibiu',
      address: 'Jud. Sibiu, Mun. Sibiu, Aleea Biruinței, Nr. 6, Ap. 5'
    },
    contact: {
      phone: '',
      email: '',
      website: 'https://centralesibiu.ro/'
    },
    coverage: ['Sibiu'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 2722391, profit: 230050 },
    tags: ['pv-rezidential', 'casa-verde', 'pompe-caldura'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'solardoktor',
    slug: 'solardoktor',
    name: 'Solardoktor S.R.L.',
    cui: 'RO35711596',
    description: 'Solardoktor este o firmă din Odorheiu Secuiesc, județul Harghita, înființată în 2016, specializată în sisteme solare și electrice. Oferă consultanță, proiectare, instalare și autorizare pentru sisteme fotovoltaice rezidențiale și industriale — panouri, invertoare, sisteme de montaj și componente electrice — precum și stații de încărcare pentru vehicule electrice.',
    founded: 2016,
    employees: 8,
    location: {
      city: 'Odorheiu Secuiesc',
      county: 'Harghita',
      address: 'Jud. Harghita, Mun. Odorheiu Secuiesc, Str. Pietroasa, Nr. 24, Ap. 5'
    },
    contact: {
      phone: '+40752060064',
      email: 'info@solardoktor.ro',
      website: 'https://solardoktor.ro/'
    },
    coverage: ['Harghita'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 3237120, profit: 219594 },
    tags: ['pv-rezidential', 'casa-verde', 'on-grid', 'statii-incarcare'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'control-point',
    slug: 'control-point',
    name: 'Control Point S.R.L.',
    cui: 'RO17987306',
    description: 'Control Point este o firmă din Brașov, înființată în 2005, specializată în automatizări industriale și instalații electrice (partener oficial VALMET Automation în sectorul energetic și industrial). Prin oferta Solar Point furnizează soluții complete la cheie pentru sisteme fotovoltaice pentru gospodării, retail și industrie, fiind instalator validat AFM în programul Casa Verde Fotovoltaice.',
    founded: 2005,
    employees: 6,
    location: {
      city: 'Brașov',
      county: 'Brașov',
      address: 'Jud. Brașov, Mun. Brașov, Str. Ecaterina Teodoroiu, Nr. 44'
    },
    contact: {
      phone: '+40741157200',
      email: 'office@control-point.ro',
      website: 'https://www.control-point.ro/'
    },
    coverage: ['Brașov'],
    specializations: ['rezidential', 'retail', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 3617703, profit: 681391 },
    tags: ['pv-rezidential', 'casa-verde', 'automatizari'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'stromline-professionals',
    slug: 'stromline-professionals',
    name: 'Stromline Professionals S.R.L.',
    cui: 'RO33819649',
    description: 'Stromline Professionals este o firmă din Brașov, înființată în 2014, specializată în sisteme fotovoltaice pentru clienți rezidențiali. Instalează panouri solare, invertoare și sisteme de stocare cu baterii, livrând sisteme complete la cheie. Este instalator validat în programul Casa Verde Fotovoltaice 2024.',
    founded: 2014,
    employees: 3,
    location: {
      city: 'Brașov',
      county: 'Brașov',
      address: 'Jud. Brașov, Mun. Brașov, Str. Zizinului, Nr. 110, Birou, Et. 1'
    },
    contact: {
      phone: '+40734882793',
      email: 'office@stromline.ro',
      website: 'https://stromline.ro/'
    },
    coverage: ['Brașov'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 3789832, profit: 119818 },
    tags: ['pv-rezidential', 'casa-verde', 'stocare-baterii', 'on-grid'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'electro-term-instal',
    slug: 'electro-term-instal',
    name: 'Electro Term Instal S.R.L.',
    cui: 'RO35881639',
    description: 'Electro Term Instal este o firmă din Călinești, județul Maramureș, înființată în 2016, specializată în sisteme fotovoltaice on-grid și hibride pentru clienți rezidențiali și comerciali. Oferă dimensionare, proiectare și instalare de sisteme fotovoltaice, asistență la dosarul de prosumator, instalații electrice civile și industriale, precum și suport tehnic și service.',
    founded: 2016,
    employees: 6,
    location: {
      city: 'Călinești',
      county: 'Maramureș',
      address: 'Jud. Maramureș, Sat Călinești Com. Călinești, Nr. 148'
    },
    contact: {
      phone: '+40755818090',
      email: '',
      website: 'https://electroterminstal.ro/'
    },
    coverage: ['Maramureș'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 3794823, profit: 254414 },
    tags: ['pv-rezidential', 'casa-verde', 'on-grid'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'hoiura-electro-construct',
    slug: 'hoiura-electro-construct',
    name: 'Hoiura Electro Construct S.R.L.',
    cui: 'RO16149867',
    description: 'Hoiura Electro Construct este o firmă din București (sediu operațional în Cernica, Ilfov), înființată în 2004, care oferă soluții complete de energie regenerabilă pentru sectoarele rezidențial, comercial și industrial. Instalează sisteme fotovoltaice, posturi de transformare, branșamente și instalații electrice, stații de încărcare pentru vehicule electrice și sisteme de detecție incendiu.',
    founded: 2004,
    employees: 11,
    location: {
      city: 'București',
      county: 'București',
      address: 'Municipiul București, Sector 3, Str. Sold. Ghiță Șerban, Nr. 55, Mansardă, Ap. 36'
    },
    contact: {
      phone: '+40219916',
      email: 'office@hoiura.ro',
      website: 'https://hoiura.ro/'
    },
    coverage: ['București', 'Ilfov'],
    specializations: ['rezidential', 'hale-industriale', 'cladiri-birouri'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 4363256, profit: 458635 },
    tags: ['pv-rezidential', 'casa-verde', 'on-grid', 'statii-incarcare', 'bransamente-electrice'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'mlm-instal-2006',
    slug: 'mlm-instal-2006',
    name: 'MLM Instal 2006 S.R.L.',
    cui: 'RO19060704',
    description: 'MLM Instal 2006 este o firmă din Târnăveni, județul Mureș, înființată în 2006, specializată în instalații termice, sanitare și de gaz, cu o linie dedicată de sisteme fotovoltaice pentru clienți rezidențiali. Oferă proiectare, execuție și service pentru sisteme fotovoltaice, instalații de încălzire, climatizare și irigații, deținând autorizare ANRE tip B.',
    founded: 2006,
    employees: 19,
    location: {
      city: 'Târnăveni',
      county: 'Mureș',
      address: 'Jud. Mureș, Mun. Târnăveni, Str. Avram Iancu, Nr. 9'
    },
    contact: {
      phone: '+40742165103',
      email: 'office@mlminstal.ro',
      website: 'https://www.mlminstal.ro/'
    },
    coverage: ['Mureș'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 4626606, profit: 282291 },
    tags: ['pv-rezidential', 'casa-verde'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'rosolar-termo-energy',
    slug: 'rosolar-termo-energy',
    name: 'Rosolar Termo Energy S.R.L.',
    cui: 'RO36146156',
    description: 'Rosolar Termo Energy este o firmă din Pitești, județul Argeș, înființată în 2016, specializată în sisteme fotovoltaice pentru clienți rezidențiali. Instalează panouri solare, sisteme de stocare cu baterii și echipamente termice (centrale, pompe de căldură, sisteme de încălzire și răcire).',
    founded: 2016,
    employees: 8,
    location: {
      city: 'Pitești',
      county: 'Argeș',
      address: 'Jud. Argeș, Mun. Pitești, Str. Sfânta Vineri, Nr. 41, Bl. VG, Sc. A, Ap. 1'
    },
    contact: {
      phone: '+40735174748',
      email: 'office@rosolar.ro',
      website: 'https://rosolar.ro/'
    },
    coverage: ['Argeș'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 4770419, profit: 956147 },
    tags: ['pv-rezidential', 'casa-verde', 'stocare-baterii', 'pompe-caldura'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'potcontrol-instal',
    slug: 'potcontrol-instal',
    name: 'Potcontrol Instal S.R.L.',
    cui: 'RO26478140',
    description: 'Potcontrol Instal este o firmă din Făgăraș, județul Brașov, înființată în 2010, specializată în instalații de climatizare, încălzire și energie regenerabilă. Oferă sisteme fotovoltaice pentru clienți rezidențiali, fiind instalator validat Casa Verde 2024, alături de pompe de căldură, panouri solar-termice, centrale termice și sisteme de aer condiționat.',
    founded: 2010,
    employees: 8,
    location: {
      city: 'Făgăraș',
      county: 'Brașov',
      address: 'Jud. Brașov, Mun. Făgăraș, Str. Vasile Alecsandri, Bl. 1, Sc. A, Ap. 1'
    },
    contact: {
      phone: '+40720235637',
      email: 'office@potcontrol.ro',
      website: 'https://potcontrol.ro/'
    },
    coverage: ['Brașov'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 4811474, profit: 418427 },
    tags: ['pv-rezidential', 'casa-verde', 'pompe-caldura'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'pamasa-construct',
    slug: 'pamasa-construct',
    name: 'Pamasa Construct S.R.L.',
    cui: 'RO20549462',
    description: 'Pamasa Construct (brand SolarPlus) este o firmă din Timișoara, înființată în 2007, specializată în sisteme fotovoltaice la cheie pentru clienți rezidențiali, comerciali și industriali. Instalează panouri solare, microinvertoare și baterii (parteneri Enphase, Tesla, Fronius, Victron, SMA), gestionează dosarul de prosumator și programul Casa Verde, și oferă electricieni autorizați ANRE. Comunică peste 500 de sisteme instalate.',
    founded: 2007,
    employees: 3,
    location: {
      city: 'Timișoara',
      county: 'Timiș',
      address: 'Jud. Timiș, Mun. Timișoara, Str. Ion Vidu, Nr. 5, Ap. 2, Camera 3'
    },
    contact: {
      phone: '+40735205537',
      email: '',
      website: 'https://solarplus.ro/'
    },
    coverage: ['Timiș'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 4869312, profit: 318099 },
    tags: ['pv-rezidential', 'casa-verde', 'stocare-baterii', 'on-grid'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'fotopan',
    slug: 'fotopan',
    name: 'Fotopan S.R.L.',
    cui: 'RO41954018',
    description: 'Fotopan este o firmă din Salonta, județul Bihor, înființată în 2019, specializată în sisteme fotovoltaice pentru clienți rezidențiali și industriali. Oferă evaluare, configurare, instalare și mentenanță, lucrând cu panouri Jinko și invertoare Fronius.',
    founded: 2019,
    employees: 7,
    location: {
      city: 'Salonta',
      county: 'Bihor',
      address: 'Jud. Bihor, Mun. Salonta, Str. Mihail Eminescu, Nr. 9, Camera 2'
    },
    contact: {
      phone: '',
      email: 'office@fotopan.ro',
      website: 'https://fotopan.ro/'
    },
    coverage: ['Bihor'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 5653345, profit: 835708 },
    tags: ['pv-rezidential', 'casa-verde', 'mentenanta-pv'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'dragos-instal-trust',
    slug: 'dragos-instal-trust',
    name: 'Dragoș Instal Trust S.R.L.',
    cui: 'RO35042289',
    description: 'Dragoș Instal Trust (brand PanouSolar, sediu comercial Deva) este o firmă din Șoimuș, județul Hunedoara, înființată în 2015, specializată în instalarea de panouri fotovoltaice pentru clienți rezidențiali. Montează sisteme pe acoperiș, pe structuri la sol sau alte amplasamente potrivite, cu racordare electrică și conformitate la normele de siguranță.',
    founded: 2015,
    employees: 8,
    location: {
      city: 'Șoimuș',
      county: 'Hunedoara',
      address: 'Jud. Hunedoara, Sat Șoimuș Com. Șoimuș, Nr. 154'
    },
    contact: {
      phone: '+40722533290',
      email: '',
      website: 'https://panousolar.ro/'
    },
    coverage: ['Hunedoara'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 5690829, profit: 2339037 },
    tags: ['pv-rezidential', 'casa-verde'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'spectrum-energy-solution',
    slug: 'spectrum-energy-solution',
    name: 'Spectrum Energy Solution S.R.L.',
    cui: 'RO45863796',
    description: 'Spectrum Energy Solution este o firmă din Slatina, județul Olt, înființată în 2022, specializată în sisteme fotovoltaice pentru clienți rezidențiali, comerciali și industriali. Oferă instalare și mentenanță sisteme fotovoltaice, instalații electrice, automatizări industriale, sisteme de medie tensiune și iluminat eficient. Comunică peste 500 de sisteme fotovoltaice realizate.',
    founded: 2022,
    employees: 19,
    location: {
      city: 'Slatina',
      county: 'Olt',
      address: 'Jud. Olt, Mun. Slatina, Str. Constructorului, Nr. 3, Corp C6, C13'
    },
    contact: {
      phone: '+40773727357',
      email: 'contact@spectrumenergy.ro',
      website: 'https://www.spectrum-energy.ro/'
    },
    coverage: ['Olt'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 5908983, profit: 569641 },
    tags: ['pv-rezidential', 'casa-verde', 'mentenanta-pv', 'medie-tensiune'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'net-conf',
    slug: 'net-conf',
    name: 'Net Conf S.R.L.',
    cui: 'RO17347730',
    description: 'Net Conf este o firmă din Târgu Mureș, înființată în 2005, cu peste 18 ani de activitate în domeniul electric. Are ca obiect proiectarea, execuția și întreținerea instalațiilor electrice și a sistemelor fotovoltaice pentru clienți rezidențiali, alături de sisteme de supraveghere video, control acces, antiefracție, detecție incendiu, rețele de date și instalații de paratrăsnet.',
    founded: 2005,
    employees: 15,
    location: {
      city: 'Târgu Mureș',
      county: 'Mureș',
      address: 'Jud. Mureș, Mun. Târgu Mureș, Str. Dr. Knopfler Vilmos, Nr. 7, Ap. I'
    },
    contact: {
      phone: '+40365455440',
      email: 'office@netconf.ro',
      website: 'https://netconf.ro/'
    },
    coverage: ['Mureș'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 6378354, profit: 1226234 },
    tags: ['pv-rezidential', 'casa-verde'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'general-electric-bacau',
    slug: 'general-electric-bacau',
    name: 'General Electric S.R.L.',
    cui: 'RO6834960',
    description: 'General Electric este o firmă din Bacău, înființată în 1995, instalator autorizat de panouri fotovoltaice. Realizează sisteme fotovoltaice pentru clienți rezidențiali în cadrul programului Casa Verde Fotovoltaice, alături de lucrări de proiectare și construcții de instalații electrice.',
    founded: 1995,
    employees: 39,
    location: {
      city: 'Bacău',
      county: 'Bacău',
      address: 'Jud. Bacău, Mun. Bacău, Cal. Moldovei, Nr. 197'
    },
    contact: {
      phone: '+40748291131',
      email: 'office@general-electric.ro',
      website: 'https://www.general-electric.ro/'
    },
    coverage: ['Bacău'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 7154132, profit: 313130 },
    tags: ['pv-rezidential', 'casa-verde'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  },
  {
    id: 'smart-house-color',
    slug: 'smart-house-color',
    name: 'Smart House Color S.R.L.',
    cui: 'RO37283429',
    description: 'Smart House Color (brand Smart Sun) este o firmă din Arad, înființată în 2017, una dintre companiile regionale importante în domeniul fotovoltaic. Oferă soluții complete de proiectare, montaj și mentenanță pentru sisteme și parcuri fotovoltaice — pentru clienți rezidențiali, comerciali și industriali.',
    founded: 2017,
    employees: 24,
    location: {
      city: 'Arad',
      county: 'Arad',
      address: 'Jud. Arad, Mun. Arad, Str. Smochinului, Nr. 12'
    },
    contact: {
      phone: '+40770791976',
      email: 'smarthousecolor@gmail.com',
      website: 'https://smart-sun.ro/'
    },
    coverage: ['Arad'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 34491887, profit: 12139533 },
    tags: ['pv-rezidential', 'casa-verde', 'parcuri-fotovoltaice', 'mentenanta-pv'],
    featured: false,
    verified: true,
    createdAt: '2026-05-26',
    updatedAt: '2026-05-26',
    segment: 'rezidential'
  }
];

const rejected = [
  { societate: 'KARDYNAL INTSERV OFFICE SRL', judet: 'Prahova', cui: '31508441', reason: 'Site-ul kindustrial.ro (CUI confirmat în footer) prezintă exclusiv automatizări industriale, instalații electrice, măsurători PRAM și mentenanță predictivă/termografie — niciun serviciu fotovoltaic sau rezidențial.' },
  { societate: 'ELECTROVALI SRL', judet: 'Salaj', cui: '18752774', reason: 'electrovali.eu este producător de echipamente de automatizare industrială (tablouri electrice, sisteme pneumatice/hidraulice, soluții la cheie PLC) pentru clienți ca Michelin și Tenaris. Deține doar autorizație ANRE tip B, dar nu oferă servicii de instalare fotovoltaice.' },
  { societate: 'NOUVELLES ENERGIES ROUMANIE SRL', judet: 'Prahova', cui: '40683573', reason: 'ner-energy.ro (CUI confirmat în footer) se prezintă ca distribuitor/furnizor de echipamente fotovoltaice și birou de proiectare, fără servicii de montaj la cheie pentru locuințe și fără mențiune Casa Verde — pattern distribuitor B2B, nu instalator.' },
  { societate: 'ARMINCO BMC SRL', judet: 'Mures', cui: '28841925', reason: 'armincobmc.ro distribuie sisteme de aer condiționat (Midea, Alizee, Samsung) — comerciant en-gros de climatizare, fără niciun serviciu sau produs fotovoltaic.' },
  { societate: 'LINKIT SOLUTIONS SRL', judet: 'Hunedoara', cui: '37446240', reason: 'Website-ul din registru (octacore.ro) aparține unei firme de sisteme IT și securitate (supraveghere video, alarme, control acces, detecție incendiu, rețele de date) — niciun serviciu fotovoltaic.' },
  { societate: 'DIAMSES SRL', judet: 'Galati', cui: '4821343', reason: 'electric-diamses.ro este antreprenor electric industrial (rețele 0,4–20 kV, instalații civile/industriale, iluminat public, branșamente) — niciun serviciu sau mențiune fotovoltaice/panouri solare pe site.' },
  { societate: 'HONEY VOLT SRL', judet: 'Buzau', cui: '24491134', reason: 'Website-ul din registru (ecoheat.ro) aparține unui furnizor de combustibil solid (peleți și brichete pentru sobe/centrale) — site nepotrivit firmei și fără legătură cu fotovoltaice.' }
];

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const existingCuis = new Set(data.companies.map(c => c.cui));
const toAdd = newCompanies.filter(c => !existingCuis.has(c.cui));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);

const rejectedPath = path.join(__dirname, '..', 'data', 'anre-rejected.json');
const existingRejected = JSON.parse(fs.readFileSync(rejectedPath, 'utf8'));
const rejectedKeys = new Set(existingRejected.map(r => `${r.cui}|${r.societate}`));
const newRejected = rejected.filter(r => !rejectedKeys.has(`${r.cui}|${r.societate}`));
existingRejected.push(...newRejected);
fs.writeFileSync(rejectedPath, JSON.stringify(existingRejected, null, 2) + '\n');
console.log('Added', newRejected.length, 'rejections. Total:', existingRejected.length);
