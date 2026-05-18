/* eslint-disable */
const fs = require('fs');
const path = require('path');

const newCompanies = [
  {
    id: 'datacor',
    slug: 'datacor',
    name: 'Datacor SRL',
    cui: 'RO14731272',
    logo: '/logos/datacor.png',
    description: 'Datacor este un integrator de soluții fondat în 2002 la Bistrița, organizat pe trei divizii: Datacor Green Energy (energie regenerabilă, instalare sisteme fotovoltaice și stocare), Datacor Connectivity (producție internă de conectică fibră optică în parcul industrial Bistrița-Sud) și Datacor Smart Homes. Pe partea electrică acoperă instalații de joasă și medie tensiune, datacenter, cablare structurată și sisteme de securitate, lucrând cu parteneri precum Honeywell, Vertiv, Corning și Datwyler. Compania a comunicat în decembrie 2025 livrarea unor proiecte de instalare sisteme fotovoltaice și stocare.',
    founded: 2002,
    employees: 134,
    location: {
      city: 'Bistrița',
      county: 'Bistrița-Năsăud',
      address: 'Loc. Viișoara, Mun. Bistrița, Str. Parc Industrial, Nr. 7'
    },
    contact: {
      phone: '+40724322931',
      email: 'contact@datacor.ro',
      website: 'https://datacor.ro/'
    },
    coverage: ['Bistrița-Năsăud'],
    specializations: ['hale-industriale', 'cladiri-birouri'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 74361564, profit: 10987417 },
    tags: ['pv-comercial', 'pv-industrial', 'stocare-baterii', 'on-grid', 'datacenter', 'cablare-structurata'],
    featured: false,
    verified: true,
    createdAt: '2026-05-18',
    updatedAt: '2026-05-18',
    anreMatch: { societate: 'DATACOR', judet: 'Bistrita-Nasaud' }
  },
  {
    id: 'electro-clip-map',
    slug: 'electro-clip-map',
    name: 'Electro Clip Map SRL',
    cui: 'RO36662440',
    logo: '/logos/electro-clip-map.png',
    description: 'Electro Clip Map este o firmă din Văleni-Lăpuș, județul Maramureș, înființată în 2016 și specializată în sisteme fotovoltaice — consultanță, proiectare și execuție pentru locuințe și afaceri. Oferă atât sisteme clasice pe acoperiș, cât și acoperișuri fotovoltaice integrate (panouri care înlocuiesc elementele de învelitoare). Pe pagina de prezentare comunică un total de aproximativ 2,3 MW instalați.',
    founded: 2016,
    employees: 20,
    location: {
      city: 'Văleni-Lăpuș',
      county: 'Maramureș',
      address: 'Sat Văleni-Lăpuș, Com. Coroieni, Str. Văleni-Lăpuș, Nr. 27'
    },
    contact: {
      phone: '+40765860666',
      email: 'electroclipmap@gmail.com',
      website: 'https://electroclip.ro/'
    },
    coverage: ['Maramureș'],
    specializations: [],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 8681283, profit: 1256512 },
    tags: ['pv-comercial', 'pv-rezidential', 'on-grid', 'acoperis-fotovoltaic'],
    featured: false,
    verified: true,
    createdAt: '2026-05-18',
    updatedAt: '2026-05-18',
    anreMatch: { societate: 'ELECTRO CLIP MAP', judet: 'Maramures' }
  },
  {
    id: 'electro-metering',
    slug: 'electro-metering',
    name: 'Electro Metering SRL',
    cui: 'RO42988183',
    logo: '/logos/electro-metering.png',
    description: 'Electro Metering este o firmă din Baia Mare, înființată în 2020, specializată în proiectarea și execuția instalațiilor electrice civile și industriale. Pe lângă instalare și mentenanță panouri fotovoltaice, execută branșamente aeriene și subterane (monofazate și trifazate), linii electrice 0,4–20 kV, posturi de transformare de medie tensiune și rețele de iluminat public. Sediul declarat pe site este pe Strada 8 Martie nr. 9, Baia Mare; sediul social ANRE este în satul Lăpușel, comuna Recea.',
    founded: 2020,
    employees: 6,
    location: {
      city: 'Lăpușel',
      county: 'Maramureș',
      address: 'Sat Lăpușel, Com. Recea, Str. Nucului, Nr. 9'
    },
    contact: {
      phone: '+40743887819',
      email: 'electrometering@gmail.com',
      website: 'https://electrometering.ro/'
    },
    coverage: ['Maramureș'],
    specializations: ['hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 1443915, profit: 266496 },
    tags: ['pv-comercial', 'pv-rezidential', 'on-grid', 'bransamente-electrice', 'medie-tensiune'],
    featured: false,
    verified: true,
    createdAt: '2026-05-18',
    updatedAt: '2026-05-18',
    anreMatch: { societate: 'ELECTRO METERING', judet: 'Maramures' }
  },
  {
    id: 'diacom-prestcom',
    slug: 'diacom-prestcom',
    name: 'Diacom Prestcom SRL',
    cui: 'RO8307982',
    logo: '/logos/diacom-prestcom.png',
    description: 'Diacom Prestcom este o firmă din Lupeni, județul Hunedoara, fondată în 1996 de Constantin Dicu. Oferă sisteme fotovoltaice off-grid și on-grid pentru consum propriu sau injectare în rețea a surplusului, execuție și mentenanță parcuri fotovoltaice, tablouri electrice și automatizări, instalații electrice interioare și exterioare, branșamente 0,23–0,4 kV, instalații 0,4–20 kV, prize de pământ și paratrăsnete, măsurători PRAM. Compania este listată ca instalator aprobat AFM în programul de sisteme fotovoltaice și activează în Valea Jiului de peste 30 de ani.',
    founded: 1996,
    employees: 47,
    location: {
      city: 'Lupeni',
      county: 'Hunedoara',
      address: 'Mun. Lupeni, Aleea Narciselor, Nr. 11'
    },
    contact: {
      phone: '+40737100800',
      email: 'office@diacom.ro',
      website: 'https://diacom.ro/'
    },
    coverage: ['Hunedoara'],
    specializations: ['hale-industriale', 'cladiri-birouri'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 12012596, profit: 1640571 },
    tags: ['pv-comercial', 'pv-rezidential', 'on-grid', 'off-grid', 'parcuri-fotovoltaice', 'mentenanta-pv', 'medie-tensiune'],
    featured: false,
    verified: true,
    createdAt: '2026-05-18',
    updatedAt: '2026-05-18',
    anreMatch: { societate: 'DIACOM PRESTCOM', judet: 'Hunedoara' }
  },
  {
    id: 'comp-sgs-electrogrup',
    slug: 'comp-sgs-electrogrup',
    name: 'Comp SGS Electrogrup SRL',
    cui: 'RO21766168',
    logo: '/logos/comp-sgs-electrogrup.png',
    description: 'Comp SGS Electrogrup este o firmă din Baia Mare, înființată în 2007, specializată în lucrări de instalații electrice — proiectare și execuție instalații interioare pentru construcții civile și industriale, branșamente aeriene și subterane, și instalații fotovoltaice pentru producerea de energie electrică. Acoperă pe lângă Baia Mare orașe din Maramureș precum Baia Sprie, Borșa, Cavnic, Sighetu Marmației, Târgu Lăpuș, Tăuții-Măgherăuș și Vișeu de Sus.',
    founded: 2007,
    employees: 14,
    location: {
      city: 'Baia Mare',
      county: 'Maramureș',
      address: 'Mun. Baia Mare, Bld. Unirii, Bl. 7, Ap. 56'
    },
    contact: {
      phone: '+40747500979',
      email: 'sgs.electrogrup@gmail.com',
      website: ''
    },
    coverage: ['Maramureș'],
    specializations: ['hale-industriale'],
    certifications: [],
    capacity: { minProjectKw: 0, maxProjectKw: 0, projectsCompleted: 0 },
    financials: { year: 2024, revenue: 5693967, profit: 873475 },
    tags: ['pv-comercial', 'pv-rezidential', 'on-grid', 'bransamente-electrice'],
    featured: false,
    verified: false,
    createdAt: '2026-05-18',
    updatedAt: '2026-05-18',
    anreMatch: { societate: 'COMP SGS ELECTROGRUP', judet: 'Maramures' }
  }
];

const rejected = [
  { societate: 'AET LUXINSTAL', judet: 'Salaj', cui: '31527664', reason: 'Site webnode generalist (aet-instal.webnode.ro) prezintă doar servicii generale de electrician — nicio mențiune fotovoltaice/panouri/solar pe pagini. Facebook există dar fără content PV vizibil. Firmă mică (8 emp), profil rural Sălaj.' },
  { societate: 'ALEX INSTAL SYSTEM', judet: 'Bistrita-Nasaud', cui: '41710609', reason: 'Niciun website declarat; căutările au returnat doar registre (termene, risco, targetare, infoquick) — fără site propriu, fără Facebook, fără content PV online verificabil.' },
  { societate: 'BERAR COMPLEX', judet: 'Salaj', cui: '44756040', reason: 'Niciun website declarat; căutările au returnat doar registre + un singur contract SICAP. Fără site, fără Facebook, fără content PV online (Berar Septimiu de la Solar Electro este altă firmă, fără legătură).' },
  { societate: 'BLUE PREST ELECTRIC', judet: 'Maramures', cui: '44792700', reason: 'Niciun website, niciun telefon și niciun email declarate; căutările au returnat doar registre (verificarefirma). Zero amprentă online care să confirme activitate PV.' },
  { societate: 'CALIN RAUL ELECTROROM', judet: 'Maramures', cui: '37625181', reason: 'Niciun website declarat; căutările au returnat doar registre (infoquick, risco, termene, totalfirme). Fără site propriu, fără Facebook, fără content PV online — confuzie posibilă cu Electro Călin sau Electro Term Instal (firme diferite).' },
  { societate: 'DELTIC-INSTAL', judet: 'Bistrita-Nasaud', cui: '12747302', reason: 'Niciun website propriu; profilul daibau.ro enumeră doar branșamente electrice, instalații JT/MT, iluminat exterior/interior și măsurători PRAM — fotovoltaice absente complet din serviciile listate.' },
  { societate: 'EL CONSTRUCT', judet: 'Salaj', cui: '13605900', reason: 'Site propriu elconstruct.ro listează doar electrice clasice (construcții civile/industriale/agricole, alimentare, instalații curenți slabi, iluminat public) — niciun serviciu fotovoltaic pe site. Apare ca instalator AFM dar fără PV pe homepage/servicii.' }
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
