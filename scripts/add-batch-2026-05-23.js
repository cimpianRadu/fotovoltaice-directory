/* eslint-disable */
const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'gersoltech',
    slug: 'gersoltech',
    name: 'Gersoltech S.R.L.',
    cui: 'RO35935542',
    description: 'Gersoltech, sub brandul Electro Solar Expert, este o firmă din Tomești, județul Harghita, înființată în 2016 și specializată în instalarea de panouri fotovoltaice. Oferă sisteme rezidențiale (montaj panouri fotovoltaice pentru case), soluții comerciale și industriale, mentenanță și consultanță energetică. Compania declară pe site peste 500 de instalații realizate în 8 ani și este instalator validat în programul Casa Verde Fotovoltaice.',
    founded: 2016,
    employees: 11,
    location: {
      city: 'Tomești',
      county: 'Harghita',
      address: 'Sat Tomești Com. Tomești, Tomești, Nr.695/a'
    },
    contact: {
      phone: '+40742618496',
      email: 'office@electrosolarexpert.ro',
      website: 'https://electrosolarexpert.ro/'
    },
    coverage: ['Harghita'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 6052186, profit: 673904 },
    tags: ['pv-rezidential', 'casa-verde', 'on-grid'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'solarx-smart-energy',
    slug: 'solarx-smart-energy',
    name: 'Solarx Smart Energy S.R.L.',
    cui: 'RO42903799',
    description: 'Solarx Smart Energy este o firmă din Târgu Jiu, județul Gorj, înființată în 2020, specializată în sisteme fotovoltaice și soluții energetice complete pentru clienți rezidențiali și comerciali. Oferă proiectare, montaj și soluții complete de producere a energiei din surse solare.',
    founded: 2020,
    employees: 25,
    location: {
      city: 'Târgu Jiu',
      county: 'Gorj',
      address: 'Mun. Târgu Jiu, Bld. Constantin Brancusi, Nr.11-13, Camera 1, Et.2'
    },
    contact: {
      phone: '',
      email: '',
      website: 'https://solarx.ro/'
    },
    coverage: ['Gorj'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 10414395, profit: 145588 },
    tags: ['pv-rezidential', 'casa-verde'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'jts-instal-construct',
    slug: 'jts-instal-construct',
    name: 'J.T.S Instal Construct S.R.L.',
    cui: 'RO43112865',
    description: 'J.T.S Instal Construct, sub brandul JTS Solar, este o firmă din comuna Merișani, județul Argeș, înființată în 2020. Comercializează și asigură montajul de panouri fotovoltaice, invertoare și baterii de stocare pentru clienți rezidențiali, oferind sisteme on-grid, off-grid și hibride, precum și sisteme de monitorizare. Participă la programul Casa Verde cu pachete dedicate locuințelor și declară pe site peste 25.000 de panouri montate și peste 1.100 de clienți.',
    founded: 2020,
    employees: 22,
    location: {
      city: 'Borlești',
      county: 'Argeș',
      address: 'Sat Borlești Com. Merișani, Nr.167'
    },
    contact: {
      phone: '+40215551775',
      email: 'contact@jtssolar.ro',
      website: 'https://www.jtssolar.ro/'
    },
    coverage: ['Argeș'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 11105532, profit: 502737 },
    tags: ['pv-rezidential', 'casa-verde', 'on-grid', 'off-grid', 'stocare-baterii'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'cosmic-electric-power',
    slug: 'cosmic-electric-power',
    name: 'Cosmic Electric Power S.R.L.',
    cui: 'RO45813267',
    description: 'Cosmic Electric Power, sub brandul Sisteme Solare, este o firmă din comuna Turcinești, județul Gorj, înființată în 2022, specializată în sisteme fotovoltaice monofazate, trifazate și hibride pentru clienți rezidențiali și comerciali. Pe lângă panouri fotovoltaice instalează pompe de căldură și stații de încărcare pentru mașini electrice. Participă la programul Casa Verde și declară pe site peste 600 de sisteme instalate în 2023-2024, acoperind zona Craiova, Târgu Jiu, Slatina și Drobeta-Turnu Severin.',
    founded: 2022,
    employees: 6,
    location: {
      city: 'Turcinești',
      county: 'Gorj',
      address: 'Sat Turcinești Com. Turcinești, Str. Grigore Geamanu, Nr.27'
    },
    contact: {
      phone: '+40759495461',
      email: 'office@sisteme-solare.ro',
      website: 'https://sisteme-solare.ro/'
    },
    coverage: ['Gorj', 'Dolj', 'Olt', 'Mehedinți'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 11540697, profit: 3399615 },
    tags: ['pv-rezidential', 'casa-verde', 'pompe-caldura', 'statii-incarcare-ev'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'idna-power',
    slug: 'idna-power',
    name: 'Idna Power S.R.L.',
    cui: 'RO39361744',
    description: 'Idna Power, sub brandul iDNA Solar Power, este o firmă din comuna Gologanu, județul Vrancea, înființată în 2018, specializată în sisteme fotovoltaice și instalații electrice. Oferă montaj panouri fotovoltaice pentru locuințe și firme, instalații electrice civile și industriale, audituri energetice și automatizări.',
    founded: 2018,
    employees: 13,
    location: {
      city: 'Gologanu',
      county: 'Vrancea',
      address: 'Sat Gologanu Com. Gologanu, Str. Liliacului, Nr.23'
    },
    contact: {
      phone: '+40744555445',
      email: 'office@idnapower.ro',
      website: 'https://idnasolarpower.ro/'
    },
    coverage: ['Vrancea'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 11798045, profit: 2004754 },
    tags: ['pv-rezidential', 'casa-verde', 'on-grid'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'sun-power-systems',
    slug: 'sun-power-systems',
    name: 'Sun Power Systems S.R.L.',
    cui: 'RO43751869',
    description: 'Sun Power Systems, sub brandul Energie Eco, este o firmă din Alba Iulia, înființată în 2021, specializată în sisteme fotovoltaice pentru clienți rezidențiali și comerciali. Oferă sisteme on-grid hibride cu stocare în baterii, sisteme off-grid pentru case, cabane și pensiuni, unități de stocare cu acumulatori litiu-ion și AGM, invertoare și regulatoare, precum și monitorizare online.',
    founded: 2021,
    employees: 4,
    location: {
      city: 'Alba Iulia',
      county: 'Alba',
      address: 'Mun. Alba Iulia, Str. Baba Novac, Nr.1a'
    },
    contact: {
      phone: '+40745871270',
      email: 'hang.adrian@energie-eco.eu',
      website: 'https://energie-eco.ro/'
    },
    coverage: ['Alba'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 14025180, profit: 644958 },
    tags: ['pv-rezidential', 'casa-verde', 'on-grid', 'off-grid', 'stocare-baterii'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'villex',
    slug: 'villex',
    name: 'Villex S.R.L.',
    cui: 'RO14349915',
    description: 'Villex este o firmă din Târgu Secuiesc, județul Covasna, înființată în 2001, specializată în instalații fotovoltaice pentru clienți rezidențiali și industriali. Oferă consultanță și dimensionare sistem, proiectare, execuție la cheie, măsurători prize de pământ, lucrări de branșare și sporiri de putere, întocmirea documentației de prosumator și mentenanță.',
    founded: 2001,
    employees: 30,
    location: {
      city: 'Târgu Secuiesc',
      county: 'Covasna',
      address: 'Mun. Târgu Secuiesc, Str. Turoczi Mozes, Nr.10'
    },
    contact: {
      phone: '+40720845539',
      email: 'office@villex.ro',
      website: 'https://villex.ro/'
    },
    coverage: ['Covasna'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 10827092, profit: 544775 },
    tags: ['pv-rezidential', 'casa-verde', 'on-grid', 'prosumator'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'ceramica-stil',
    slug: 'ceramica-stil',
    name: 'Ceramica Stil S.R.L.',
    cui: 'RO29317296',
    description: 'Ceramica Stil, sub brandul Domotec, este o firmă din comuna Marginea, județul Suceava, înființată în 2011, care realizează instalații fotovoltaice complete. Pe lângă sisteme fotovoltaice oferă pompe de căldură (MAXA) și instalații electrice de joasă tensiune (0,4 kV). Participă la programul Casa Verde Fotovoltaice.',
    founded: 2011,
    employees: 7,
    location: {
      city: 'Marginea',
      county: 'Suceava',
      address: 'Sat Marginea Com. Marginea, Str. Digului, Nr.4'
    },
    contact: {
      phone: '+40756520718',
      email: 'fotovoltaice@domotec.ro',
      website: 'https://www.domotec.ro/'
    },
    coverage: ['Suceava'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 5863711, profit: 375522 },
    tags: ['pv-rezidential', 'casa-verde', 'pompe-caldura'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'fair-play-serban',
    slug: 'fair-play-serban',
    name: 'Fair Play Șerban S.R.L.',
    cui: 'RO4009886',
    description: 'Fair Play Șerban este o firmă din Arad, înființată în 1993, specializată în instalații electrice și fotovoltaice. Oferă instalații electrice rezidențiale și industriale, branșamente monofazate și trifazate, linii de joasă și medie tensiune, automatizări, posturi de transformare și sisteme fotovoltaice. Participă la programul Casa Verde cu soluții pentru locuințe.',
    founded: 1993,
    employees: 36,
    location: {
      city: 'Arad',
      county: 'Arad',
      address: 'Mun. Arad, Str. Petru Rares, Nr.13-15'
    },
    contact: {
      phone: '+40722348102',
      email: 'contact@fairplayserban.ro',
      website: 'https://www.fairplayserban.ro/'
    },
    coverage: ['Arad'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 14192246, profit: 1259935 },
    tags: ['pv-rezidential', 'casa-verde', 'on-grid', 'medie-tensiune'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'en-rg-etic',
    slug: 'en-rg-etic',
    name: 'En-Rg-Etic S.R.L.',
    cui: 'RO25708569',
    description: 'En-RG-etic, sub brandul RGE, este o firmă din Târgu Mureș, înființată în 2009, specializată în soluții fotovoltaice pentru clienți rezidențiali și comerciali. Realizează sisteme fotovoltaice rezidențiale prin programul Casa Verde (AFM), parcuri solare, stații de încărcare pentru vehicule electrice, sisteme alternative de încălzire electrică, lucrări de construcții și rețele electrice, iluminat public și instalații de împământare.',
    founded: 2009,
    employees: 20,
    location: {
      city: 'Târgu Mureș',
      county: 'Mureș',
      address: 'Mun. Târgu Mureș, Str. Mureșeni, Nr.50'
    },
    contact: {
      phone: '+40365882975',
      email: 'office@rge.ro',
      website: 'https://rge.ro/'
    },
    coverage: ['Mureș'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 8394315, profit: 682908 },
    tags: ['pv-rezidential', 'casa-verde', 'parcuri-fotovoltaice', 'statii-incarcare-ev'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'b2b-synergy',
    slug: 'b2b-synergy',
    name: 'B2B Synergy S.R.L.',
    cui: 'RO40780380',
    description: 'B2B Synergy este o firmă din comuna Sântana de Mureș, județul Mureș, înființată în 2019, specializată în sisteme fotovoltaice pentru mediul rezidențial și pentru mediul business. Oferă proiectare și instalare, având în portofoliu și proiecte pentru clienți industriali.',
    founded: 2019,
    employees: 26,
    location: {
      city: 'Sântana de Mureș',
      county: 'Mureș',
      address: 'Sat Sântana De Mureș Com. Sântana De Mureș, Str. Lalelelor, Nr.10'
    },
    contact: {
      phone: '+40722883118',
      email: 'office@b2bsynergy.ro',
      website: 'https://b2bsynergy.ro/'
    },
    coverage: ['Mureș'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 28012121, profit: 5571044 },
    tags: ['pv-rezidential', 'casa-verde', 'on-grid'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'samgec',
    slug: 'samgec',
    name: 'Samgec S.R.L.',
    cui: 'RO6593861',
    description: 'Samgec este o firmă din Satu Mare, înființată în 1994, care realizează lucrări de construcții și instalații, incluzând sisteme fotovoltaice și pompe de căldură pentru clienți rezidențiali. Oferă construcții de clădiri rezidențiale și blocuri, instalații de încălzire centrală, sanitare și electrice, încălzire în pardoseală, sisteme solare și fotovoltaice. Participă la programul Casa Verde.',
    founded: 1994,
    employees: 35,
    location: {
      city: 'Satu Mare',
      county: 'Satu Mare',
      address: 'Mun. Satu Mare, Bld. Lucian Blaga, Nr.85a'
    },
    contact: {
      phone: '',
      email: '',
      website: 'https://samgec.ro/'
    },
    coverage: ['Satu Mare'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 11815511, profit: 3329644 },
    tags: ['pv-rezidential', 'casa-verde', 'pompe-caldura'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'eldac-grup',
    slug: 'eldac-grup',
    name: 'Eldac Grup S.R.L.',
    cui: 'RO830519',
    description: 'Eldac Grup este o firmă din Vaslui, înființată în 1992, instalator validat AFM pentru panouri fotovoltaice de uz casnic și industriale în programul Casa Verde Fotovoltaice. Pe lângă sisteme fotovoltaice rezidențiale și industriale oferă tâmplărie PVC-AL și instalații electrice complete. Compania declară pe site aproximativ 1.000 de sisteme instalate prin programele Casa Verde (2019, 2021, 2023).',
    founded: 1992,
    employees: 10,
    location: {
      city: 'Vaslui',
      county: 'Vaslui',
      address: 'Mun. Vaslui, Str. Toma Caragiu, Nr.4'
    },
    contact: {
      phone: '+40720960123',
      email: 'eldacgrup@yahoo.com',
      website: 'https://eldac.ro/'
    },
    coverage: ['Vaslui'],
    specializations: ['rezidential', 'hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2025, revenue: 16977866, profit: 1715486 },
    tags: ['pv-rezidential', 'casa-verde'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'electroprest',
    slug: 'electroprest',
    name: 'Electroprest S.R.L.',
    cui: 'RO8997912',
    description: 'Electroprest este o firmă din Bacău, înființată în 1996, înscrisă în programul de validare a instalatorilor de sisteme fotovoltaice. Oferă instalarea de sisteme fotovoltaice prin programe de finanțare de mediu, instalații electrice interioare pentru spații rezidențiale și comerciale, branșamente standard și nestandard până la 110 kV, măsurători prize de pământ (PRAM) și servicii de proiectare. Deține certificările ISO 9001, ISO 14001, OHSAS 18001 și SA 8000.',
    founded: 1996,
    employees: 41,
    location: {
      city: 'Bacău',
      county: 'Bacău',
      address: 'Mun. Bacău, Str. 9 Mai, Nr.15, Bl.15, Sc.a, Et.p, Ap.2'
    },
    contact: {
      phone: '+40733667304',
      email: 'office@electro-prest.ro',
      website: 'https://electro-prest.ro/'
    },
    coverage: ['Bacău'],
    specializations: ['rezidential', 'cladiri-birouri'],
    certifications: ['ISO-9001', 'ISO-14001'],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 11690676, profit: 1675945 },
    tags: ['pv-rezidential', 'casa-verde', 'medie-tensiune'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  },
  {
    id: 'kami-roof-construct',
    slug: 'kami-roof-construct',
    name: 'Kami Roof Construct S.R.L.',
    cui: 'RO3100462',
    description: 'Kami Roof Construct, sub brandul Kamiroof, este o firmă din Târnăveni, județul Mureș, înființată în 1993, producător de învelitori metalice și instalator fotovoltaic. Prin divizia Kami Green Energy oferă soluții fotovoltaice complete pentru locuințe și spații comerciale — proiectare, instalare, punere în funcțiune și întocmirea documentației de prosumator. Realizează și sisteme de acoperiș (țiglă metalică, tablă cutată, jgheaburi) și garduri metalice.',
    founded: 1993,
    employees: 15,
    location: {
      city: 'Târnăveni',
      county: 'Mureș',
      address: 'Mun. Târnăveni, Str. Avram Iancu, Nr.144'
    },
    contact: {
      phone: '+40733141012',
      email: 'contact@kamiroof.ro',
      website: 'https://www.kamiroof.ro/'
    },
    coverage: ['Mureș'],
    specializations: ['rezidential'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 8816517, profit: 654195 },
    tags: ['pv-rezidential', 'casa-verde', 'prosumator'],
    featured: false,
    verified: true,
    createdAt: '2026-05-23',
    updatedAt: '2026-05-23',
    segment: 'rezidential'
  }
];

const rejected = [
  { societate: 'INIC SRL', judet: 'Arges', cui: '150784', reason: 'inicinstal.ro este un magazin online / showroom (webshop) care comercializează componente PV, pompe de căldură, climatizare și articole sanitare — nu instalator turnkey. Model e-commerce, fără serviciu de montaj propriu evidențiat.' },
  { societate: 'ANDU LAU GRUP SRL', judet: 'Gorj', cui: '35135515', reason: 'anduelectric.ro este magazin de materiale electrice (distribuitor/retailer) care vinde sisteme fotovoltaice complete ca produse — nu oferă serviciu de instalare. Webshop, nu installer.' },
  { societate: 'AXA INDUSTRIES SRL', judet: 'Neamt', cui: '34115730', reason: 'greenindustries.ro este webshop/distribuitor de pompe de căldură, panouri și echipamente de încălzire/climatizare. Servicii limitate la vânzare + livrare; nu se oferă montaj.' },
  { societate: 'AMPER PROIECT SRL', judet: 'Bihor', cui: '15526497', reason: 'amperproiect.ro prezintă doar proiectare și execuție instalații electrice (tablouri, rețele) — niciun serviciu fotovoltaic/panouri solare/rezidențial pe site. CAEN 7112 inginerie.' },
  { societate: 'TRI EM SERV SRL', judet: 'Maramures', cui: '19835401', reason: 'triemserv.ro este focusat pe rețele electrice de joasă/medie/înaltă tensiune (până la 110 kV), stații și posturi de transformare pentru clienți industriali — niciun serviciu fotovoltaic rezidențial pe site.' },
  { societate: 'EUROELECTRIC SRL', judet: 'Hunedoara', cui: '15193562', reason: 'euroelectric.ro oferă instalații electrice industriale JT/MT, tablouri, automatizări și stații de încărcare EV — nicio mențiune de panouri fotovoltaice/solar/rezidențial. Focus infrastructură electrică industrială.' },
  { societate: 'ELECTRO-CONSULT CARAS SRL', judet: 'Caras-Severin', cui: '8433921', reason: 'electroconsultcaras.ro prezintă doar branșamente, linii electrice aeriene/subterane, posturi de transformare și consultanță energetică — niciun serviciu fotovoltaic/solar/rezidențial pe site.' },
  { societate: 'ROMANOR SRL', judet: 'Calarasi', cui: '1917665', reason: 'romanor.eu este firmă HVAC/termică/sanitară; panourile solare apar marginal, iar proiectele listate sunt comerciale/industriale (centrale termice). Fără focus rezidențial PV; activitate principală instalații termo-sanitare.' },
  { societate: 'INSTAL GROUP SRL', judet: 'Arad', cui: '8898978', reason: 'instalgroup.ro este focusat pe instalații termice, sanitare, electrice, gaze naturale și sisteme de stingere/detecție incendiu — niciun serviciu fotovoltaic/solar pe site.' }
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
