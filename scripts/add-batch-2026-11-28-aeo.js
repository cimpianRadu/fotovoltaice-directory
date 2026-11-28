/* eslint-disable */
// Batch 2026-11-28 — firme pe care ChatGPT le recomandă (rularea AEO de 50 de întrebări, 28 nov),
// lipsă din director. Research: un agent, secvențial; CUI din anre-with-cui.json (corectat la 3),
// financiare din bilanțul ANAF (webservicesp.anaf.ro/bilant), targetare fără credite.
// Logo: gol (download-logos are nevoie de rețea; de rulat de pe laptop). URL-urile găsite sunt în
// docs/logo-urls-2026-11-28.json pe laptop.

const fs = require('fs');
const path = require('path');

const newCompanies = [
  // ── eSolar ──
  // ── ESOLAR / AMUR SOLAR ENERGY SRL (CUI 33108859), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „eSolar - Amur Solar Energy", Str. Aristide Demetriade 2, Timișoara, 0731973055, 2.130 recenzii, 4,9.
  // ATENȚIE: firma e în data/anre-rejected.json din 22.04.2026 („retailer de kit-uri... distribuitor, nu integrator EPC"),
  // respinsă când directorul era doar C&I. Dacă intră, scoate-o de acolo (altfel anre-discover o tot sare, nu e grav, dar e inconsecvent).
  // Site: esolar.ro (magazin CS-Cart) + casaverde.esolar.ro (pagini de prezentare). Footer/contact esolar.ro: „Sc Amur Solar Energy Srl,
  // C.U.I: RO33108859, Nr. Reg.Com.: J2014001101352", birouri Timișoara, Str. Demetriade 1-5 (în curte la FanCourier) și București,
  // Șos. Odăii nr. 93-101. Telefonul din Maps (0731973055) e pe site și în ANRE. Email info@esolar.ro (site).
  // Montaj, confirmat: casaverde.esolar.ro/Despre-Noi.html „Proiectăm și executăm instalații fotovoltaice la cheie, cu echipe proprii,
  // în toată țara"; produsul „Montaj sistem fotovoltaic" (esolar.ro/montaj-sistem-fotovoltaic.html): „Montaj/Manopera sistem fotovoltaic
  // on grid la cheie cu dosar prosumator inclus... contract încheiat între AMUR SOLAR ENERGY SRL și beneficiar". Garanție manoperă 5 ani,
  // monitorizare gratuită, mărcile din pagina de ofertă. Deci nu e doar magazin, dar CAEN principal e 4791 (comerț prin internet).
  // Fondare: 29.04.2014 (data-anre-with-cui.json: J2014001101352, dataInmatriculare 29/04/2014). „18 ani de experiență" (site) nu intră.
  // ANAF bilanț (28.11.2026), CAEN 4791: 2024 CA 37.146.193 / profit 5.544.760 / 15 sal.; 2025 CA 83.710.028 / profit 16.602.187 / 22 sal.
  // ANRE (snapshot): C1A nr. 17054 și C2A nr. 17055 (15.03.2021), „Atestat" până la 13.03.2031; B nr. 13995 retras. Sediu ANRE: Sat Belint
  // nr. 424, cam. 1, Timiș.
  // AFM: apare în casa-verde-installers.json (33108859); site-ul: „Am fost instalator validat în programul Casa Verde Fotovoltaice"
  // (sesiunea 2024). Tag `casa-verde`. (Notă: în aceeași listă există și „ESOLAR.RO - IDELLA SRL", CUI 14019941, altă firmă.)
  // LUCRĂRI DOCUMENTATE: niciuna cu kW și locație. Cifrele „peste 9.000 de sisteme montate / peste 80.000 kWp" sunt cumulate pentru
  // „echipe proprii și parteneri" în Italia, Germania, Spania, Belgia și România: NU intră. Tabelul de producție 3,3-11 kWp e din broșură.
  // capacity: 0/0/0. Stocul de invertoare „de la 750 W la 250 kW" nu e lucrare.
  // SEGMENT: `rezidential`. Broșura și pagina de ofertă sunt pentru „sisteme fotovoltaice rezidențiale"; nicio lucrare comercială
  // documentată, deși are C2A și pomenește „sisteme rezidențiale și comerciale" în cifra cumulată.
  // COVERAGE: toate cele 42 de județe (site: „echipe proprii în toată țara", „transport oriunde în țară, montaj"), precedent JTS Instal Construct.
  // Dacă preferi mai strâns: Timiș + București (birourile).
  // Tag `distribuitor-echipamente` + `magazin-online` pentru că grosul activității e magazinul online.
  // LOGO: esolar.ro/images/logos/11/www.esolar.ro_b52j-23_f7ko-9v_vzn1-ui.png (logo-ul din header).
  // SOR DE FIRMĂ: în data/anre-atestate.json mai există „ESOLAR.RO”/Timis, cu C1A+C2A atestate și același telefon (0731973055). Pare a fi „ESOLAR.RO - IDELLA SRL” (CUI 14019941), care apare și în casa-verde-installers.json. Fișa e pe AMUR SOLAR ENERGY, pentru că așa apar Maps-ul și footer-ul site-ului. De verificat dacă IDELLA trebuie exclusă din anre-discover, ca să nu reapară ca duplicat.
  {
    "id": "esolar",
    "slug": "esolar",
    "name": "eSolar",
    "cui": "RO33108859",
    "logo": "",
    "description": "eSolar este numele comercial al AMUR SOLAR ENERGY SRL, firmă înregistrată în 2014, cu sediul social în Belint, județul Timiș, și birouri și depozite în Timișoara și București. Vinde online echipamente fotovoltaice și execută sisteme fotovoltaice la cheie pentru case, on-grid, hibride și off-grid, cu baterii de stocare, cu echipe proprii și cu parteneri, în toată țara. Sistemul la cheie include panourile, invertorul, structura, smartmeter-ul, transportul, montajul, punerea în funcțiune și dosarul de prosumator, iar manopera are garanție de 5 ani. Pachetele sunt construite pe invertoare Deye, Huawei, Solis, Sungrow, Growatt, Fronius, Victron, SolarEdge, GoodWe și SMA, cu baterii BYD, Pylontech și altele. Deține atestate ANRE C1A și C2A, valabile până în martie 2031, și a fost instalator validat în programul Casa Verde Fotovoltaice, sesiunea 2024. Monitorizează gratuit sistemele montate. Magazinul online esolar.ro vinde și panouri solare termice, turbine eoliene mici și iluminat solar. Cifra de afaceri a crescut de la 37,15 milioane de lei în 2024 la 83,71 milioane de lei în 2025.",
    "founded": 2014,
    "employees": 22,
    "location": {
      "city": "Timișoara",
      "county": "Timiș",
      "address": "Str. Aristide Demetriade nr. 1/5 (birou și depozit). Sediu social: Sat Belint nr. 424, Com. Belinț, jud. Timiș. Birou București: Șos. Odăii nr. 93-101, Sector 1"
    },
    "contact": {
      "phone": "+40731973055",
      "email": "info@esolar.ro",
      "website": "https://www.esolar.ro"
    },
    "coverage": [
      "Alba",
      "Arad",
      "Argeș",
      "Bacău",
      "Bihor",
      "Bistrița-Năsăud",
      "Botoșani",
      "Brăila",
      "Brașov",
      "București",
      "Buzău",
      "Călărași",
      "Caraș-Severin",
      "Cluj",
      "Constanța",
      "Covasna",
      "Dâmbovița",
      "Dolj",
      "Galați",
      "Giurgiu",
      "Gorj",
      "Harghita",
      "Hunedoara",
      "Ialomița",
      "Iași",
      "Ilfov",
      "Maramureș",
      "Mehedinți",
      "Mureș",
      "Neamț",
      "Olt",
      "Prahova",
      "Sălaj",
      "Satu Mare",
      "Sibiu",
      "Suceava",
      "Teleorman",
      "Timiș",
      "Tulcea",
      "Vaslui",
      "Vâlcea",
      "Vrancea"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 83710028,
      "profit": 16602187,
      "history": [
        {
          "year": 2024,
          "revenue": 37146193,
          "profit": 5544760,
          "employees": 15
        },
        {
          "year": 2025,
          "revenue": 83710028,
          "profit": 16602187,
          "employees": 22
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "on-grid",
      "hibrid",
      "off-grid",
      "stocare-baterii",
      "prosumator",
      "casa-verde",
      "monitorizare-inclusa",
      "magazin-online",
      "distribuitor-echipamente",
      "acoperire-nationala"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "rezidential",
    "anreMatch": {
      "societate": "AMUR SOLAR ENERGY",
      "judet": "Timis"
    }
  },
  // ── PIA Energy ──
  // ── PIA ENERGY (CUI 47304553), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „PIA Energy", Calea Chișinăului, Iași, 0752384217, 560 recenzii, 5,0.
  // Site: piaenergy.ro. Fără CUI pe site; identitatea vine din potrivirea nume + telefon: ANRE „PIA ENERGY", Iasi, tel. 0752384217
  // (același cu site-ul și Maps) și registrul (listafirme/termene): PIA ENERGY S.R.L., CUI 47304553, J2022004591223, înființată
  // 13.12.2022, sediu Calea Chișinăului 29, Iași 700177 (aceeași stradă ca în Maps și footer-ul site-ului). Sediul din ANRE (Str. Grădinari
  // nr. 7, bl. A8-12) e mai vechi. Email: piaenergy.contact@gmail.com (footer site, singurul afișat).
  // ANAF bilanț (28.11.2026), CAEN 4322 (instalații sanitare/încălzire/aer condiționat, nu 4321): 2024 CA 3.734.545 / profit 706.075 / 10 sal.;
  // 2025 CA 13.923.350 / profit 2.017.290 / 17 sal.
  // ANRE (snapshot): B nr. 19377 (03.05.2023), „Atestat" până la 03.05.2028.
  // AFM: NU apare în casa-verde-installers.json; site-ul are pagina „Casa Verde Baterii 2026" („ne ocupăm noi de tot"), fără mențiune de
  // instalator validat. Fără tag `casa-verde`.
  // LUCRĂRI DOCUMENTATE (piaenergy.ro/proiecte):
  //   - Restaurant și sală de evenimente (poza „Kalipso", fără localitate pe pagină): 81 kW, 134 × 610 W (= 81,74 kWp)
  //   - 14 sisteme pe stațiile de autobuz smart din Tomești, Holboca, Comarna, Dobrovăț (jud. Iași), fără kW
  //   - Corabia Bistro, Ștrand Roman (jud. Neamț), fără kW
  // Cifre care NU intră: „5.700+ proiecte", „>20 MW instalați", „40 de angajați" (ANAF zice 17), „peste 4.500 de clienți" (se contrazic între ele).
  // capacity.maxProjectKw: 81 (restaurantul).
  // Mărci: logo-urile de pe homepage (Huawei, Deye, Solis, Sungrow, Sigenergy). ISO: niciunul pe site.
  // SEGMENT: `ambele` (pagina de servicii: „casa și afacerea ta", lucrări comerciale documentate). Specializări: doar `rezidential`; lucrările
  // comerciale sunt HoReCa și mobilier urban, care nu au id în specializations.json (restaurantul nu e nici `hoteluri`, nici `retail`).
  // COVERAGE: Iași, Neamț (lucrările documentate). Formularul are toate județele, dar asta nu e acoperire declarată.
  // Finanțare: pagini Grenke, AFIR, Casa Verde Baterii → `finantare-disponibila`.
  // LOGO: piaenergy.ro/wp-content/themes/piaenergy/img/logo-Pia-Energy.svg (SVG, trebuie convertit în PNG).
  {
    "id": "pia-energy",
    "slug": "pia-energy",
    "name": "PIA Energy",
    "cui": "RO47304553",
    "logo": "",
    "description": "PIA Energy este o firmă din Iași, înființată în decembrie 2022, care proiectează, montează și pune în funcțiune sisteme fotovoltaice complete sau extensii de sisteme existente, pentru case și firme. Se ocupă de avize și materiale, de montaj cu echipe proprii și de punerea în funcțiune, și deține atestat ANRE tip B, valabil până în mai 2028. Montează și baterii de stocare, pompe de căldură, aer condiționat și stații de încărcare pentru mașini electrice, iar după montaj oferă monitorizare și mentenanță. Lucrează cu invertoare Huawei, Deye, Solis, Sungrow și Sigenergy. Printre lucrările comerciale prezentate pe site se numără un sistem de 81 kW, cu 134 de panouri de 610 W, pentru un restaurant cu sală de evenimente, 14 sisteme fotovoltaice pe stațiile de autobuz smart din Tomești, Holboca, Comarna și Dobrovăț și sistemul de la Corabia Bistro, pe Ștrandul din Roman. Oferă finanțare prin Grenke și sprijin pentru dosarele Casa Verde Baterii și AFIR. Cifra de afaceri a crescut de la 3,73 milioane de lei în 2024 la 13,92 milioane de lei în 2025.",
    "founded": 2022,
    "employees": 17,
    "location": {
      "city": "Iași",
      "county": "Iași",
      "address": "Calea Chișinăului, Nr. 29, Iași 700177"
    },
    "contact": {
      "phone": "+40752384217",
      "email": "piaenergy.contact@gmail.com",
      "website": "https://piaenergy.ro"
    },
    "coverage": [
      "Iași",
      "Neamț"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 81,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 13923350,
      "profit": 2017290,
      "history": [
        {
          "year": 2024,
          "revenue": 3734545,
          "profit": 706075,
          "employees": 10
        },
        {
          "year": 2025,
          "revenue": 13923350,
          "profit": 2017290,
          "employees": 17
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "pv-comercial",
      "stocare-baterii",
      "pompe-caldura",
      "statii-incarcare-ev",
      "monitorizare-inclusa",
      "mentenanta-pv",
      "finantare-disponibila"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "ambele",
    "anreMatch": {
      "societate": "PIA ENERGY",
      "judet": "Iasi"
    }
  },
  // ── Solarlink ──
  // ── SOLARLINK / EARTHLINK SRL (CUI 22197648), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „Solarlink", București, 523 recenzii (input fără site/telefon). Site găsit prin căutare: solarlink.ro (Facebook
  // „Solarlink | București Sectorul 1"). Footer: „SOLARLINK™ este o marcă înregistrată a societății Earthlink SRL". Termeni și condiții:
  // „Earthlink SRL, sediul social în Intrarea Lacul Sarat, nr 2, Sector 1, București, CUI RO22197648, J23/1122/2021".
  // Registrul (listafirme/termene/targetare) dă însă sediul în Ostratu, Com. Corbeanca, Ilfov, Str. Școlii 40D, înființată 2007 — același cu
  // ANRE. Am pus Lacul Sărat ca adresă principală (birou, site + Maps București) și Ostratu ca sediu social.
  // Contact (site): 0791 757 565, office@solarlink.ro. ANRE are alt telefon (0722443377).
  // ANAF bilanț (28.11.2026): 2024 CAEN 6110 (telecomunicații prin cablu!) CA 21.660.911 / profit 3.046.540 / 20 sal.;
  // 2025 CAEN 4321, CA 32.355.473 / profit 3.516.640 / 19 sal. ATENȚIE: firma a avut ca obiect principal telecom până în 2024
  // (anemoscope: „integrating infrastructure, financing, technology, and renewable energy"), deci CA nu e 100% fotovoltaic.
  // ANRE (snapshot): EARTHLINK, Ilfov, B nr. 18301 (10.06.2022), „Atestat" până la 10.06.2027.
  // AFM: apare în casa-verde-installers.json („S.C. EARTHLINK S.R.L.", 22197648). Tag `casa-verde`.
  // LUCRĂRI DOCUMENTATE (solarlink.ro/sisteme-fotovoltaice-instalate-de-noi): 8 sisteme on-grid, câte un număr fără nume de client:
  // Ilfov 3,16 / 12,42 / 10,27 / 6,32; Prahova 15,80; Timiș 6,32 / 9,48 / 5,53. Unitatea afișată e „kWh" (cu icon de consum),
  // deci ambiguă: nu am pus maxProjectKw (0). Dacă e kWp (probabil), maxProjectKw = 16.
  // Cifre care NU intră: „15+ ani de experiență pentru echipa noastră", „25+ MW", „1000+ proiecte", „100+ capacitate lunară".
  // Tag `experienta-15-ani`: firma există din 2007 (19 ani), dar pe PV doar declarat „15+ ani echipa" — scoate-l dacă vrei strict.
  // SEGMENT: `rezidential`. Pagina „Comercial" e generică (hale, teren, parcări, documentație de finanțare), fără nicio lucrare comercială.
  // COVERAGE: București (birou), Ilfov (sediu + lucrări), Prahova, Timiș (lucrări din portofoliu).
  // Mărci: kituri Huawei și Sigenergy; panouri HJT (marca nu e numită pe homepage, Facebook pomenește Huasun G12R 450W); „importatori direcți".
  // LOGO: solarlink.ro/build/assets/solarlink_logo-b6fa45fc.png
  // anre-with-cui.json (snapshot mai vechi): J40/14626/2007, înmatriculată 01.08.2007, localitate „București Sectorul 1”; nr. actual J23/1122/2021 (Ilfov) arată mutarea sediului în Ilfov în 2021.
  {
    "id": "solarlink",
    "slug": "solarlink",
    "name": "Solarlink",
    "cui": "RO22197648",
    "logo": "",
    "description": "Solarlink este marca înregistrată a EARTHLINK SRL, firmă înființată în 2007, cu sediul social în Ostratu, comuna Corbeanca, județul Ilfov, și birou în Sectorul 1 din București. Dimensionează, proiectează, livrează, montează și pune în funcțiune sisteme fotovoltaice pentru case și firme, cu monitorizare și mentenanță după montaj, și se ocupă de certificatul de prosumator și de sporul de putere. Lucrează cu kituri Huawei și Sigenergy, cu baterii, backup și stații de încărcare pentru mașini electrice, și cu panouri HJT cu două fețe de sticlă, pe care le importă direct, împreună cu structurile de prindere. Portofoliul de pe site arată sisteme on-grid pentru case din Ilfov, Prahova și Timiș. Deține atestat ANRE tip B, valabil până în iunie 2027, și apare pe lista instalatorilor validați AFM pentru Casa Verde. Sistemele se pot plăti integral sau în rate. Cifra de afaceri a crescut de la 21,66 milioane de lei în 2024 la 32,36 milioane de lei în 2025.",
    "founded": 2007,
    "employees": 19,
    "location": {
      "city": "București",
      "county": "București",
      "address": "Intrarea Lacul Sărat, Nr. 2, Sector 1, București 010544. Sediu social: Str. Școlii nr. 40D, Ostratu, Com. Corbeanca, jud. Ilfov"
    },
    "contact": {
      "phone": "+40791757565",
      "email": "office@solarlink.ro",
      "website": "https://solarlink.ro"
    },
    "coverage": [
      "București",
      "Ilfov",
      "Prahova",
      "Timiș"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 32355473,
      "profit": 3516640,
      "history": [
        {
          "year": 2024,
          "revenue": 21660911,
          "profit": 3046540,
          "employees": 20
        },
        {
          "year": 2025,
          "revenue": 32355473,
          "profit": 3516640,
          "employees": 19
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "on-grid",
      "stocare-baterii",
      "statii-incarcare-ev",
      "prosumator",
      "casa-verde",
      "monitorizare-inclusa",
      "mentenanta-pv",
      "finantare-disponibila",
      "partener-huawei",
      "experienta-15-ani"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "rezidential",
    "anreMatch": {
      "societate": "EARTHLINK",
      "judet": "Ilfov"
    }
  },
  // ── Tritech Group ──
  // ── TRITECH GROUP SRL (CUI 16730842), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „Tritech Group", Constanța, 672 recenzii (input fără site/telefon).
  // CUI din data/anre-with-cui.json (TRITECH GROUP SRL, J2004007425132, înmatriculată 02.09.2004, Mun. Constanța), confirmat ANAF deni
  // „TRITECH GROUP SRL". Trei site-uri: tritech.ro (automatizări BFT/Portalp/Equinsa, titlul pomenește „sisteme fotovoltaice", meniul are
  // „Casa Verde Baterii"), tritech-sisteme.ro („Tritech Group vă oferă panouri fotovoltaice... produse în România, în fabrica de la Ovidiu...
  // Wattrom", „sistemele... pe care le furnizăm și le instalăm sunt on-grid și off-grid") și wattrom.ro (site-ul PV: rezidențial, comercial,
  // stocare, Casa Verde 2024, Electric Up 2024; footer „TRITECH GROUP activează ca producător pe piața energiei regenerabile",
  // tel +40241582242, office@wattrom.com, Str. Poporului 27, Constanța). Am pus wattrom.ro ca website (e site-ul PV) și logo-ul Tritech
  // (numele fișei e Tritech Group); dacă vrei brandul Wattrom, logo: cdn.prod.website-files.com/66d5cc33cce0635d7cee63cb/66d5ccb3bb2f0564b486862d_Wattrom_logo.png.
  // Montaj confirmat prin recenziile publicate pe wattrom.ro: „Am montat 2 kituri de 5kw cu firma Tritech din Constanta... Băieții care au
  // montat atât în Ialomița, cât și în Ilfov", „Sunt PROSUMATOR... prin Programul AFM 2023 realizat de către TRITECH GROUP CONSTANTA la 22.04.2024".
  // ANAF bilanț (28.11.2026): 2024 CAEN 4652 (comerț cu ridicata echipamente electronice) CA 37.771.878 / profit 4.526.861 / 30 sal.;
  // 2025 CAEN 4650 CA 69.411.820 / profit 3.993.062 / 28 sal. CA include distribuția de automatizări/parcări, nu e doar PV.
  // ANRE (snapshot): B nr. 13963 (17.12.2018), „Atestat" până la 13.12.2028. Sediu ANRE: Str. Poporului nr. 27, corp C1. Tel. ANRE 0735232223.
  // AFM: apare în casa-verde-installers.json („TRITECH GROUP S.R.L.", 16730842). Tag `casa-verde`.
  // LUCRĂRI DOCUMENTATE: niciuna cu kW și locație (doar recenziile: 2 × 5 kW în Ialomița și Ilfov). capacity 0/0/0.
  // SEGMENT: `rezidential`. Pagina „Soluții comerciale" e generică + Electric Up, fără nicio lucrare comercială. Tag `electric-up` (există în vocabular).
  // COVERAGE: Constanța (sediu), Ialomița și Ilfov (din recenzia publicată pe site). Sigur doar Constanța.
  // Tag `experienta-20-ani`: firma există din 2004, dar e vechimea firmei, nu neapărat pe PV (pagina PV e din 2019). Scoate-l dacă vrei strict.
  // ISO: niciunul găsit.
  {
    "id": "tritech-group",
    "slug": "tritech-group",
    "name": "Tritech Group",
    "cui": "RO16730842",
    "logo": "",
    "description": "Tritech Group este o firmă din Constanța, înființată în 2004, care produce panourile fotovoltaice Wattrom în fabrica de la Ovidiu, lângă Constanța, și furnizează și montează sisteme fotovoltaice on-grid și off-grid, cu baterii de stocare, pentru case și firme. Se ocupă de actele pentru statutul de prosumator și a montat sisteme prin programul Casa Verde Fotovoltaice al AFM, iar pentru firme pregătește proiecte pentru programul Electric Up. Deține atestat ANRE tip B, valabil până în decembrie 2028. Pe lângă fotovoltaice, Tritech Group este distribuitor de automatizări pentru porți și bariere BFT, uși automate Portalp, sisteme de parcare cu plată Equinsa, uși de garaj și sisteme de avertizare la incendiu, deci cifra de afaceri nu vine doar din fotovoltaice. Cifra de afaceri a crescut de la 37,77 milioane de lei în 2024 la 69,41 milioane de lei în 2025.",
    "founded": 2004,
    "employees": 28,
    "location": {
      "city": "Constanța",
      "county": "Constanța",
      "address": "Str. Poporului, Nr. 27, Corp C1, Constanța 900604"
    },
    "contact": {
      "phone": "+40241582242",
      "email": "office@wattrom.com",
      "website": "https://www.wattrom.ro"
    },
    "coverage": [
      "Constanța",
      "Ialomița",
      "Ilfov"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 69411820,
      "profit": 3993062,
      "history": [
        {
          "year": 2024,
          "revenue": 37771878,
          "profit": 4526861,
          "employees": 30
        },
        {
          "year": 2025,
          "revenue": 69411820,
          "profit": 3993062,
          "employees": 28
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "on-grid",
      "off-grid",
      "stocare-baterii",
      "prosumator",
      "casa-verde",
      "electric-up",
      "producator-echipamente",
      "distribuitor-echipamente",
      "experienta-20-ani"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "rezidential",
    "anreMatch": {
      "societate": "TRITECH GROUP",
      "judet": "Constanta"
    }
  },
  // ── Robert-SIM ──
  // ── ROBERT-SIM SRL (CUI 10488937), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „Robert-SIM", Iași, robertsim.ro, 456 recenzii, 4,6.
  // VERIFICARE EXPLICITĂ „montează sau doar vinde": MONTEAZĂ. Pagina robertsim.ro/sisteme-fotovoltaice-iasi: „Echipe proprii, montaj
  // profesionist. Sistemul tău este instalat de specialiștii noștri", pachete cu „Montaj la cheie: structură, protecții AC/DC, cablare,
  // monitorizare, punere în funcțiune, dosar prosumator", galerie „Vezi sisteme instalate de echipa RobertSim" (Bârnova, Valea Lupului,
  // Rediu, Breazu, Valea Adâncă, acoperiș și sol), 5 ani garanție manoperă. Site-ul e magazin Gomag, dar produsele vândute sunt aparate AC;
  // PV e doar ca serviciu cu montaj. „Parteneriatul cu SIMAI Group, importator oficial Solis și Dyness" = sursa echipamentelor.
  // Footer: „SC ROBERT-SIM SRL, J22/379/1998, RO10488937, str Fântânilor nr 35 bl B1 ap 44, Iași". ANAF deni: „ROBERT SIM SRL" (fără cratimă).
  // anre-with-cui.json: înmatriculată 02.04.1998. Contact site: 0744812981, mugurelh@yahoo.com (singurul email afișat). Tel. ANRE: 0763566671 / 0232270398.
  // ANAF bilanț (28.11.2026), CAEN 4321: 2024 CA 8.459.765 / profit 1.375.228 / 30 sal.; 2025 CA 9.983.796 / profit 2.109.501 / 29 sal.
  // Activitatea principală istorică e climatizarea (site, Facebook „Aer Conditionat si Ventilatie Iasi"), deci CA nu e doar PV.
  // ANRE (snapshot): Be nr. 18536 (17.08.2022 → 17.08.2027) și Bp nr. 19548 (11.05.2023 → 11.05.2028), ambele „Atestat". NU are B/C.
  // AFM: NU apare în casa-verde-installers.json. Fără tag `casa-verde`.
  // LUCRĂRI DOCUMENTATE: galeria are localitățile, fără kW. Recenziile de pe site: „sistem cu invertor Solis de 6 kW în Valea Lupului",
  // „Sistemul de 8 kW". Pachetele 6-15 kW sunt oferte-tip, nu lucrări. capacity 0/0/0 (dacă accepți recenziile ca lucrări: max 8).
  // Cifre care NU intră: „mii de proiecte", „peste 25 de ani" (pe instalații, nu pe PV).
  // SEGMENT: `rezidential` („Instalează un sistem fotovoltaic dimensionat pentru casa ta"), nimic comercial.
  // COVERAGE: Iași + județele Moldovei (site: „Suntem din Iași și instalăm sisteme fotovoltaice în zona Moldovei", „Lucrăm din Iași în județele
  // regiunii Moldova"). Am pus cele 8 județe ale regiunii istorice (Iași, Suceava, Botoșani, Neamț, Bacău, Vaslui, Vrancea, Galați); site-ul nu le
  // numește. Mai strâns: doar Iași (toate lucrările din galerie sunt din jud. Iași).
  // Tag `garantie-extinsa` pentru cei 5 ani pe manoperă; `experienta-20-ani` = vechimea firmei (1998), nu pe PV; scoate-l dacă vrei strict.
  // Mărci (logo-uri pe pagina PV): Huawei, BYD, Dyness, STELTEC, AIKO, Solis, Deye.
  // LOGO: gomagcdn.ro/domains/robertsim.ro/files/company/robertsim-valuri-varianta-13269.png
  {
    "id": "robert-sim",
    "slug": "robert-sim",
    "name": "Robert-SIM",
    "cui": "RO10488937",
    "logo": "",
    "description": "Robert-SIM (RobertSim) este o firmă de instalații din Iași, înființată în 1998, care montează aer condiționat și sisteme fotovoltaice la cheie pentru case din Iași și din restul Moldovei, cu echipe proprii. Pachetele de pe site merg de la 6 la 15 kW, monofazate și trifazate, cu invertoare hibride Solis sau Deye și cu sau fără baterii Dyness, STELTEC sau BYD, iar prețul include montajul, structura, protecțiile, monitorizarea, punerea în funcțiune și dosarul de prosumator. Montează pe acoperiș și la sol, adaugă baterii la sistemele existente și instalează stații de încărcare pentru mașini electrice. Galeria de lucrări arată sisteme din Bârnova, Valea Lupului, Rediu, Breazu și Valea Adâncă. Deține atestate ANRE Be și Bp, oferă 5 ani garanție pentru manoperă și plata în rate prin tbi bank. Cifra de afaceri a crescut de la 8,46 milioane de lei în 2024 la 9,98 milioane de lei în 2025, din care o parte vine din climatizare.",
    "founded": 1998,
    "employees": 29,
    "location": {
      "city": "Iași",
      "county": "Iași",
      "address": "Str. Fântânilor, Nr. 35, Bl. B1, Ap. 44, Iași"
    },
    "contact": {
      "phone": "+40744812981",
      "email": "mugurelh@yahoo.com",
      "website": "https://www.robertsim.ro"
    },
    "coverage": [
      "Iași",
      "Suceava",
      "Botoșani",
      "Neamț",
      "Bacău",
      "Vaslui",
      "Vrancea",
      "Galați"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 9983796,
      "profit": 2109501,
      "history": [
        {
          "year": 2024,
          "revenue": 8459765,
          "profit": 1375228,
          "employees": 30
        },
        {
          "year": 2025,
          "revenue": 9983796,
          "profit": 2109501,
          "employees": 29
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "hibrid",
      "stocare-baterii",
      "prosumator",
      "statii-incarcare-ev",
      "monitorizare-inclusa",
      "finantare-disponibila",
      "garantie-extinsa",
      "experienta-20-ani"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "rezidential",
    "anreMatch": {
      "societate": "ROBERT-SIM",
      "judet": "Iasi"
    }
  },
  // ── Siana Energie ──
  // ── SIANA ENERGIE / PAVILION INTERMED SRL (CUI 27242880), firmă nouă (AEO: recomandată de ChatGPT, citată și ca sursă în P7 „hală 50kW") ──
  // Google Maps: „Siana Energie", București, 419 recenzii (input fără site/telefon/ANRE). Site găsit prin Facebook: siana-energie.ro.
  // Footer: „Copyright © 2026 - PAVILION INTERMED S.R.L". ANRE: „PAVILION INTERMED", Bucuresti, B nr. 22102 (23.07.2024 → 23.07.2029), „Atestat";
  // sediu ANRE Str. Radu Boiangiu 8, Bl. 38 (alt sediu decât site-ul), tel. ANRE 0730860670.
  // CUI din anre-with-cui.json (27242880), confirmat ANAF deni „PAVILION INTERMED SRL". ATENȚIE: anre-with-cui.json are dataInmatriculare
  // 09.04.2019 (J2019004829403), dar termene/metricbiz/firme.ro dau înființare 02-04.08.2010 (CUI-ul 27xxxxxx e din 2010). Am pus founded 2010;
  // deci câmpul dataInmatriculare din anre-with-cui.json NU e mereu data înființării (pare data ultimei reînmatriculări).
  // Contact (site): 0731 131 133, office@siana-energie.ro, Str. Teodosie Rudeanu nr. 63, Sector 1. Link-ul Facebook din footer duce la
  // „truscaimobilare" (greșit pe site), pagina reală e facebook.com/sianaenergie.
  // ANAF bilanț (28.11.2026), CAEN 4321: 2024 CA 2.780.928 / profit 407.772 / 1 sal.; 2025 CA 11.682.303 / profit 200.110 / 3 sal.
  // (3 salariați la 11,7 mil. lei: montajul e probabil făcut și cu colaboratori; site-ul și Facebook vorbesc de „4 echipe de montaj".)
  // AFM: apare în casa-verde-installers.json („SC PAVILION INTERMED SRL"). Tag `casa-verde`.
  // LUCRĂRI DOCUMENTATE (homepage, „Lucrările noastre anterioare"):
  //   - 120 kW trifazat, Craiova: 2 × Deye 50 kW + tablou anti-insularizare, 200 × Aiko 600 W
  //   - 60 kW trifazat, Slatina: Huawei 50 kW, 100 × Aiko 600 W
  //   - 20 kW trifazat, Craiova: Deye 20 kW, 36 × Canadian Solar 555 W, baterie V-TAC 10,24 kWh
  //   - 10 kW trifazat, Tulcea: Deye 10 kW, 16 × Aiko 600 W
  //   Fără tipul clientului la 120/60 kW. Instagram: „INDUSTRIAL în Chiajna, Ilfov" (reel, fără kW) — nu e pe site.
  // capacity.maxProjectKw: 120 (Craiova).
  // Cifre care NU intră: „peste 1500 de invertoare montate", „peste 20.000 kW instalați", „426 recenzii Google".
  // SEGMENT: `ambele` (site: „rezidențial, comercial și industrial", pagina „Companii", lucrări de 60 și 120 kW). Specializări doar
  // `rezidential`: lucrările mari nu au tipul clientului, deci nu pot pune `hale-industriale` fără să ghicesc.
  // COVERAGE: București (sediu), Ilfov (Facebook: lucrări în Ilfov, Chiajna), Dolj, Olt, Tulcea (lucrări de pe site).
  // Finanțare: pagina „Finanțare panouri fotovoltaice" + Casa Verde → `finantare-disponibila`. „Plata la montaj - fără avans" (meta).
  // LOGO: siana-energie.ro/wp-content/uploads/2025/02/siana-energie.svg (SVG, de convertit).
  {
    "id": "siana-energie",
    "slug": "siana-energie",
    "name": "Siana Energie",
    "cui": "RO27242880",
    "logo": "",
    "description": "Siana Energie este marca sub care lucrează PAVILION INTERMED SRL, firmă înființată în 2010, cu sediul în Sectorul 1 din București, care vinde și montează sisteme fotovoltaice pentru case, firme și clienți industriali. Face proiectarea 3D, montajul și punerea în funcțiune cu echipe proprii și întocmește dosarul de prosumator, iar montajul are garanție de 2 ani. Lucrează cu invertoare Deye, Huawei, Solis și Sungrow și cu panouri Canadian Solar, Aiko, Longi și Trina, montează baterii de stocare și stații de încărcare pentru mașini electrice. Printre lucrările prezentate pe site se numără un sistem trifazat de 120 kW în Craiova, cu două invertoare Deye de 50 kW și 200 de panouri Aiko de 600 W, unul de 60 kW în Slatina, cu invertor Huawei de 50 kW, un sistem hibrid de 20 kW cu baterie în Craiova și unul de 10 kW în Tulcea. Deține atestat ANRE tip B, valabil până în iulie 2029, și apare pe lista instalatorilor validați AFM pentru Casa Verde. Cifra de afaceri a crescut de la 2,78 milioane de lei în 2024 la 11,68 milioane de lei în 2025.",
    "founded": 2010,
    "employees": 3,
    "location": {
      "city": "București",
      "county": "București",
      "address": "Str. Teodosie Rudeanu, Nr. 63, Sector 1, București"
    },
    "contact": {
      "phone": "+40731131133",
      "email": "office@siana-energie.ro",
      "website": "https://siana-energie.ro"
    },
    "coverage": [
      "București",
      "Ilfov",
      "Dolj",
      "Olt",
      "Tulcea"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 120,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 11682303,
      "profit": 200110,
      "history": [
        {
          "year": 2024,
          "revenue": 2780928,
          "profit": 407772,
          "employees": 1
        },
        {
          "year": 2025,
          "revenue": 11682303,
          "profit": 200110,
          "employees": 3
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "pv-comercial",
      "hibrid",
      "stocare-baterii",
      "statii-incarcare-ev",
      "prosumator",
      "casa-verde",
      "proiectare",
      "finantare-disponibila",
      "proiecte-mari"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "ambele",
    "anreMatch": {
      "societate": "PAVILION INTERMED",
      "judet": "Bucuresti"
    }
  },
  // ── Trevora Electric ──
  // ── TREVORA ELECTRIC SRL (CUI 37130530), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „Trevora Electric", DN 15D, Str. Păișești, Bascov, Argeș, 0770703326, 323 recenzii, 5,0.
  // Footer trevora.ro: „TREVORA ELECTRIC S.R.L., CUI RO37130530, J2017000348032, Jud. Argeș, Sat Bascov, Com. Bascov, Str. Păișești DN nr. 9C",
  // 0748 961 004 (= ANRE), office@trevora.ro. Pagina trevora.ro/montaj-fotovoltaice-arges are 0770 703 326 (= Maps) și trevoraelectric@gmail.com.
  // Am pus telefonul din Maps/pagina de montaj. anre-with-cui.json: înmatriculată 01.03.2017.
  // NUME: ANAF 2024 deni „FAST ELECTRIC EXPERT SRL", ANAF 2025 „TREVORA ELECTRIC SRL" → redenumită (Facebook-ul e încă facebook.com/fastelectricexpert).
  // AFM: apare în casa-verde-installers.json ca „S.C FAST ELECTRIC EXPERT S.R.L" (37130530). Recenzie pe site: „prin programul casa verde 2024". Tag `casa-verde`.
  // ANAF bilanț (28.11.2026), CAEN 4321: 2024 CA 8.581.209 / profit 61.711 / 31 sal.; 2025 CA 36.457.680 / profit 1.758.044 / 33 sal.
  // ANRE (snapshot curent data/anre-atestate.json): C1A nr. 24550 și C2A nr. 24551 (22.05.2026 → 22.05.2031) „Atestat"; B nr. 18979 „Retras".
  // (anre-with-cui.json are încă doar B-ul — snapshot mai vechi.)
  // Montaj: pagina de montaj: „Instalăm sisteme fotovoltaice complete pentru spații rezidențiale și comerciale din Argeș, cu echipă certificată ANRE",
  // „Montaj cu echipe proprii", galerie „Instalări recente... montajele rezidențiale realizate de echipa Trevora Electric în județul Argeș"
  // (9 poze, fără kW/localitate). Homepage: „distribuitor panouri fotovoltaice în toată România", magazin online WooCommerce.
  // LUCRĂRI DOCUMENTATE: niciuna cu kW. Kiturile 3,18-29,68 kWp sunt oferte-tip. capacity 0/0/0.
  // Cifre care NU intră: „200+ montaje în Argeș", „kituri de până la 500 kWp", „Lider în domeniul instalațiilor electrice în județul Argeș".
  // SEGMENT: `rezidential`. Kiturile mari au etichete „hală · pensiune · depozit", dar nicio lucrare comercială documentată.
  // COVERAGE: Argeș (montajul e explicit doar în Argeș; livrarea de echipamente e națională).
  // LOGO: trevora.ro/wp-content/uploads/2025/12/logo-trevora-resized.png
  {
    "id": "trevora-electric",
    "slug": "trevora-electric",
    "name": "Trevora Electric",
    "cui": "RO37130530",
    "logo": "",
    "description": "Trevora Electric (fostă Fast Electric Expert) este o firmă de instalații electrice din Bascov, lângă Pitești, înființată în 2017, care distribuie echipamente fotovoltaice în toată țara printr-un magazin online și montează sisteme fotovoltaice la cheie în județul Argeș, cu echipe proprii. Kiturile cu montaj inclus merg de la 3 la aproape 30 kWp, monofazate și trifazate, cu invertoare hibride Deye, panouri Longi și baterii Deye sau Dyness, iar la cerere lucrează și cu invertoare Huawei, Sungrow și SolarEdge. Prețul include structura, cablurile, protecțiile, împământarea, punerea în funcțiune și dosarul de prosumator, cu avizul tehnic de racordare și schimbarea contorului, iar manopera are garanție de 5 ani. A montat sisteme prin programul Casa Verde Fotovoltaice. Deține atestate ANRE C1A și C2A, emise în mai 2026, și oferă plata în rate. Cifra de afaceri a crescut de la 8,58 milioane de lei în 2024 la 36,46 milioane de lei în 2025, din care o parte importantă vine din vânzarea de echipamente.",
    "founded": 2017,
    "employees": 33,
    "location": {
      "city": "Bascov",
      "county": "Argeș",
      "address": "Sat Bascov, Str. Păișești DN, Nr. 9C, Com. Bascov"
    },
    "contact": {
      "phone": "+40770703326",
      "email": "office@trevora.ro",
      "website": "https://trevora.ro"
    },
    "coverage": [
      "Argeș"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 36457680,
      "profit": 1758044,
      "history": [
        {
          "year": 2024,
          "revenue": 8581209,
          "profit": 61711,
          "employees": 31
        },
        {
          "year": 2025,
          "revenue": 36457680,
          "profit": 1758044,
          "employees": 33
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "on-grid",
      "hibrid",
      "stocare-baterii",
      "prosumator",
      "casa-verde",
      "monitorizare-inclusa",
      "finantare-disponibila",
      "magazin-online",
      "distribuitor-echipamente"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "rezidential",
    "anreMatch": {
      "societate": "TREVORA ELECTRIC",
      "judet": "Arges"
    }
  },
  // ── ERA Energy ──
  // ── ERA ENERGY SRL (CUI 49745556), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „ERA Energy", București, 263 recenzii (input fără site/telefon). Site găsit prin căutare: eraenergy.ro (Next.js).
  // Footer eraenergy.ro: „ERA ENERGY SRL, CUI RO49745556, Bd. Timișoara nr. 104A, Sector 6, București", 0766 943 228, contact@eraenergy.ro.
  // Registrul: J2024005242409, înmatriculată 12.03.2024 (anre-with-cui.json), sediu social Str. Hrisovului 2-4, Sector 1 (listafirme);
  // ANRE are Str. Vestei nr. 18, Sector 1 și tel. 0766225215. Am pus adresa de pe site (Bd. Timișoara 104A = adresa din Cylex/Maps).
  // ANAF bilanț (28.11.2026), CAEN 4321: 2024 CA 2.632.576 / profit 431.819 / 2 sal.; 2025 CA 9.028.649 / profit 145.825 / 6 sal.
  // ANRE (snapshot): B nr. 22252 (22.08.2024 → 22.08.2029), „Atestat" (și pe site: „ANRE atestat nr. 22252 / 22.08.2024").
  // AFM: NU apare în casa-verde-installers.json; site-ul are o pagină „Casa Verde" (informativă), fără validare documentată. Fără tag `casa-verde`.
  // Despre noi: „echipa noastră internă — fără subcontractori", „în toată România".
  // LUCRĂRI DOCUMENTATE (eraenergy.ro/portofoliu, „41 proiecte prezentate, 1.370 kWp în total, 19 cu stocare"), toate cu Canadian Solar 460 W:
  //   - 200 kWp Buzău (435 panouri) · 150 kWp Popești-Leordeni (327) · 100 kWp Tunari (216) · 80 kWp București (174) · 65 kWp Ostratu (142)
  //   - 60 kWp + 200 kWh stocare Frumușani, CL · 60 kWp Chitila · 50 kWp Chitila · 50 kWp Otopeni
  //   - 50 kWp Unirea, DJ — „Magazin La Doi Pași" (→ `retail`)
  //   - 40 kWp + 50 kWh Craiova · 40 kWp + 30 kWh Mizil · 30 kWp + 50 kWh Târgoviște — etichetat „Agricol" (→ `agricol`)
  //   - 30 kWp Focșani · 28 kWp Ciorogârla · 25 kWp + 30 kWh Constanța · 25 kWp Brezoaele · 20 kWp (Berceni, Lungulețu, București S4)
  //   - 18 kWp Buzău · 15 kWp (Crevedia, Giurgiu, București, Călărași, Grația TR) · 12 kWp (Bragadiru, Buftea, Prahova)
  //   - 10 kWp (Berceni, Mogoșoaia, Bragadiru, Giurgiu) · 8 kWp (Craiova, Pitești, Corbeanca, Brașov, Buzău) · 6 kWp (Otopeni, Craiova, Lipovu)
  // capacity: min 6, max 200 (din portofoliu). projectsCompleted 0 (41 sunt „prezentate", nu totalul).
  // Cifre care NU intră: „peste 1.000 de sisteme montate" / „407+ sisteme montate" (se contrazic pe aceeași pagină), „ISO Certificat calitate" (fără standard → nimic în certifications).
  // SEGMENT: `ambele`; specializări `rezidential`, `retail` (magazinul), `agricol` (lucrarea etichetată Agricol). Lucrările de 100-200 kWp nu au tipul clientului, deci nu `hale-industriale`.
  // COVERAGE: județele cu lucrări din portofoliu (13). Site-ul zice „în toată România", nu am pus 42.
  // Tag `fonduri-europene`: „finanțare AFIR, PNRR și alte fonduri nerambursabile" pe pagina de firme/ferme.
  // LOGO: eraenergy.ro/images/logo-white.png — e varianta ALBĂ (pentru header închis), trebuie recolorată sau căutată o variantă închisă.
  {
    "id": "era-energy",
    "slug": "era-energy",
    "name": "ERA Energy",
    "cui": "RO49745556",
    "logo": "",
    "description": "ERA Energy este o firmă din București, înființată în 2024, care proiectează și montează sisteme fotovoltaice la cheie pentru case, firme și ferme, cu echipă proprie de instalare, fără subcontractori. Lucrează cu panouri Canadian Solar și invertoare hibride Deye, cu baterii LiFePO4, și include dosarul de prosumator. Portofoliul de pe site are 41 de lucrări documentate, cu puterea și localitatea fiecăreia, dintre care 19 cu stocare: cea mai mare este un sistem de 200 kWp cu 435 de panouri în Buzău, urmat de unul de 150 kWp în Popești-Leordeni, unul de 100 kWp în Tunari și unul de 60 kWp cu 200 kWh de stocare în Frumușani, județul Călărași. Printre lucrări se numără și un sistem de 50 kWp pentru magazinul La Doi Pași din Unirea, județul Dolj, și unul agricol de 30 kWp cu 50 kWh de stocare lângă Târgoviște, iar cele mai multe sisteme pentru case au între 6 și 20 kWp, în București, Ilfov, Dâmbovița, Dolj și alte județe. Pentru firme și ferme oferă și consultanță pentru finanțare AFIR, PNRR și alte fonduri nerambursabile. Deține atestat ANRE tip B, valabil până în august 2029. Cifra de afaceri a crescut de la 2,63 milioane de lei în 2024 la 9,03 milioane de lei în 2025.",
    "founded": 2024,
    "employees": 6,
    "location": {
      "city": "București",
      "county": "București",
      "address": "Bd. Timișoara, Nr. 104A, Sector 6, București"
    },
    "contact": {
      "phone": "+40766943228",
      "email": "contact@eraenergy.ro",
      "website": "https://eraenergy.ro"
    },
    "coverage": [
      "București",
      "Ilfov",
      "Dâmbovița",
      "Dolj",
      "Buzău",
      "Călărași",
      "Giurgiu",
      "Prahova",
      "Vrancea",
      "Constanța",
      "Teleorman",
      "Argeș",
      "Brașov"
    ],
    "specializations": [
      "rezidential",
      "retail",
      "agricol"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 6,
      "maxProjectKw": 200,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 9028649,
      "profit": 145825,
      "history": [
        {
          "year": 2024,
          "revenue": 2632576,
          "profit": 431819,
          "employees": 2
        },
        {
          "year": 2025,
          "revenue": 9028649,
          "profit": 145825,
          "employees": 6
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "pv-comercial",
      "hibrid",
      "stocare-baterii",
      "prosumator",
      "proiectare",
      "fonduri-europene",
      "portofoliu-documentat",
      "proiecte-mari"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "ambele",
    "anreMatch": {
      "societate": "ERA ENERGY",
      "judet": "Bucuresti"
    }
  },
  // ── SolarEM ──
  // ── SOLAREM / SEMGRUP SRL (CUI 29710839), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „SolarEM", 179 recenzii (input fără locație/site/ANRE). Site găsit prin căutare: solarem.ro, Oradea (Instagram/Facebook
  // „Solarem | Oradea"); site-ul afișează „171 reviews" Google prin Trustindex, deci e aceeași fișă Maps.
  // Site: „SEMGRUP SRL; Str. Ogorului Nr. 28B, Oradea, Bihor", +40 775 680 043, solar@solarem.ro (contact, termeni, GDPR). CUI-ul nu e pe site.
  // CUI din anre-with-cui.json (SEMGRUP S.R.L., J2012000183056, înmatriculată 14.02.2012, Oradea) și listafirme („SEMGRUP SRL, CUI 29710839, Oradea, 2012").
  // ATENȚIE NUME: ANAF 2024 deni „TRIGO VOLT INDUSTRY SRL" (CAEN 4321), ANAF 2025 deni „SEMGRUP SRL" (CAEN 4100 construcții) → redenumită în 2025.
  // ANAF bilanț (28.11.2026): 2024 CA 735.347 / profit 275.929 / 1 sal.; 2025 CA 6.480.989 / profit 160.702 / 6 sal.
  // ANRE (snapshot): SEMGRUP, Bihor, B nr. 23467 (18.07.2025 → 18.07.2030), „Atestat". Sediu ANRE Str. Doina nr. 34, Bl. D76; tel. ANRE 0753 761 756.
  // AFM: NU apare în casa-verde-installers.json (nici ca Trigo Volt). Site-ul are „Ghid/Pachete Casa Verde Baterii", fără validare documentată. Fără tag `casa-verde`.
  // LUCRĂRI DOCUMENTATE (homepage + solarem.ro/proiecte/<slug>): Oradea 200 kW · Vărăști, GR 150 kW · Cluj 80 kW · Oradea 9 kW ·
  // Săldăbagiu de Munte, BH 6 kW · Oradea 6 kW. Fără tipul clientului și fără mărci pe pagină (Solis/Dyness apar doar în numele unei imagini → nu le-am pus).
  // capacity: min 6, max 200.
  // Cifre care NU intră: „Peste 10 ani de experiență", „Peste 2000 de proiecte realizate" (firma are CAEN PV/activitate relevantă abia din 2024-2025 după ANAF).
  // SEGMENT: `ambele` („locuințe și afaceri", lucrări de 80-200 kW). Specializări doar `rezidential` (lucrările mari fără tipul clientului).
  // COVERAGE: Bihor, Cluj, Giurgiu (din lucrări). Site-ul nu declară arie.
  // DE VERIFICAT LA APEL: istoria brandului SolarEM înainte de 2024 (alt CUI?) și dacă lucrările de 150-200 kW sunt ale acestei firme.
  // LOGO: solarem.ro/wp-content/uploads/2026/03/Logo-SolarEM-4r-scaled.png
  {
    "id": "solarem",
    "slug": "solarem",
    "name": "SolarEM",
    "cui": "RO29710839",
    "logo": "",
    "description": "SolarEM este marca sub care lucrează SEMGRUP SRL, firmă din Oradea, înregistrată în 2012, care proiectează și montează sisteme fotovoltaice pentru locuințe și afaceri, cu echipe proprii de montaj. Se ocupă de consultanță, proiectare, autorizații, montaj și punere în funcțiune, ghidează clientul prin dosarul de prosumator și oferă service și mentenanță după montaj. Montează și baterii de stocare și stații de încărcare pentru mașini electrice, are pachete pentru programul Casa Verde Baterii și oferă finanțare în rate. Printre lucrările prezentate pe site se numără un sistem de 200 kW în Oradea, unul de 150 kW în Vărăști, județul Giurgiu, și unul de 80 kW în Cluj, alături de sisteme de 6 și 9 kW pentru case din Oradea și Săldăbagiu de Munte. Deține atestat ANRE tip B, emis în iulie 2025. Cifra de afaceri a ajuns la 6,48 milioane de lei în 2025, de la 0,74 milioane în 2024.",
    "founded": 2012,
    "employees": 6,
    "location": {
      "city": "Oradea",
      "county": "Bihor",
      "address": "Str. Ogorului, Nr. 28B, Oradea"
    },
    "contact": {
      "phone": "+40775680043",
      "email": "solar@solarem.ro",
      "website": "https://solarem.ro"
    },
    "coverage": [
      "Bihor",
      "Cluj",
      "Giurgiu"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 6,
      "maxProjectKw": 200,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 6480989,
      "profit": 160702,
      "history": [
        {
          "year": 2024,
          "revenue": 735347,
          "profit": 275929,
          "employees": 1
        },
        {
          "year": 2025,
          "revenue": 6480989,
          "profit": 160702,
          "employees": 6
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "pv-comercial",
      "stocare-baterii",
      "statii-incarcare-ev",
      "prosumator",
      "proiectare",
      "mentenanta-pv",
      "finantare-disponibila",
      "proiecte-mari"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "ambele",
    "anreMatch": {
      "societate": "SEMGRUP",
      "judet": "Bihor"
    }
  },
  // ── Valoris ──
  // ── VALORIS SRL (CUI 8859138), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „Valoris", Vâlcea, 171 recenzii (input fără site/telefon).
  // ATENȚIE CUI: data/anre-with-cui.json leagă „VALORIS"/Valcea de CUI 151208, dar acela e VALORIS SRL din Câmpulung, Argeș (J03/1110/1992) —
  // potrivire greșită pe nume. CUI-ul corect e 8859138: listafirme/risco/targetare „VALORIS SRL, Str. Râureni 266, Râmnicu Vâlcea", același sediu ca ANRE
  // și site-ul, și același CUI ca în casa-verde-installers.json („VALORIS SRL", 8859138). ANAF deni „VALORIS SRL", CAEN 4321. De corectat în anre-with-cui.json.
  // Site: valoris-electrice.ro (și valoriselectric.ro, magazin valorismag.ro). Contact: Str. Râureni nr. 266, Râmnicu Vâlcea, +40 250 732 227,
  // +40 350 732 227, info@valoris-electrice.ro; magazine în Râmnicu Vâlcea și Horezu. Istoric pe site: „20 ani / 1996" (founded 1996 din site; CUI-ul
  // 8859138 e compatibil cu 1996).
  // ANAF bilanț (28.11.2026), CAEN 4321: 2024 CA 53.176.374 / profit 1.591.188 / 53 sal.; 2025 CA 48.189.253 / profit 758.278 / 52 sal.
  // Activitatea principală: import/distribuție materiale electrice + execuție lucrări electrice. PV e o linie de servicii, nu grosul CA.
  // ANRE (snapshot): C1A nr. 12636 și C2A nr. 12637 (12.06.2017, vizare periodică → 12.04.2027), „Atestat". Tel. ANRE 0250732227 / 0721299711.
  // AFM: apare în casa-verde-installers.json. Tag `casa-verde`.
  // Montaj PV confirmat: pagina „Panouri fotovoltaice": „asigurăm instalarea profesională și punem sistemul fotovoltaic în funcțiune",
  // „Noi ne ocupăm de tot: furnizare elemente componente..., montaj complet la locația beneficiarului, punere în funcțiune, certificate de garanție, mentenanță".
  // Pagina e generică, fără mărci, fără sisteme tipizate.
  // LUCRĂRI DOCUMENTATE: niciuna (doar 6 poze fără descriere pe pagina PV). capacity 0/0/0.
  // Certificate (pagina certificate.html): doar „Atestat ANRE 2012/2016/2021", fără ISO.
  // SEGMENT: `rezidential` (textul PV vorbește de „fiecare casă", „bugetul gospodăriei"). Firma face și lucrări electrice industriale, dar nicio lucrare PV comercială.
  // COVERAGE: Vâlcea.
  // Tag `experienta-20-ani` (din 1996, pe instalații electrice, nu pe PV).
  // LOGO: valoris-electrice.ro/assets/img/logo.png
  {
    "id": "valoris",
    "slug": "valoris",
    "name": "Valoris",
    "cui": "RO8859138",
    "logo": "",
    "description": "Valoris este o firmă de instalații electrice din Râmnicu Vâlcea, activă din 1996, care importă, distribuie și vinde materiale electrice prin magazine proprii și execută lucrări electrice, inclusiv proiectare, tablouri electrice, automatizări și sisteme de securitate. Pentru fotovoltaice, furnizează componentele, adică invertorul, panourile, structura, cablajul și tablourile electrice, face montajul complet la locația clientului, punerea în funcțiune și mentenanța ulterioară. Apare pe lista instalatorilor validați AFM pentru programul Casa Verde. Deține atestate ANRE C1A și C2A, cu vizare periodică până în aprilie 2027. Cifra de afaceri a fost de 53,18 milioane de lei în 2024 și de 48,19 milioane de lei în 2025, cea mai mare parte din distribuția de materiale electrice și din lucrările electrice generale, nu doar din fotovoltaice.",
    "founded": 1996,
    "employees": 52,
    "location": {
      "city": "Râmnicu Vâlcea",
      "county": "Vâlcea",
      "address": "Str. Râureni, Nr. 266, Râmnicu Vâlcea 240475"
    },
    "contact": {
      "phone": "+40250732227",
      "email": "info@valoris-electrice.ro",
      "website": "https://www.valoris-electrice.ro"
    },
    "coverage": [
      "Vâlcea"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 48189253,
      "profit": 758278,
      "history": [
        {
          "year": 2024,
          "revenue": 53176374,
          "profit": 1591188,
          "employees": 53
        },
        {
          "year": 2025,
          "revenue": 48189253,
          "profit": 758278,
          "employees": 52
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "casa-verde",
      "mentenanta-pv",
      "proiectare",
      "instalatii-electrice",
      "distribuitor-echipamente",
      "experienta-20-ani"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "rezidential",
    "anreMatch": {
      "societate": "VALORIS",
      "judet": "Valcea"
    }
  },
  // ── PanoSol Energy ──
  // ── PANOSOL ENERGY SRL (CUI 47818902), firmă nouă (AEO: recomandată de ChatGPT), verified: false ──
  // Google Maps: „PanoSol Energy", Ilfov, 162 recenzii (input fără site/telefon). Site: panosolenergy.ro (fără CUI pe site; „Design by holbanconsulting").
  // Identitate: tel. site 0760920420 = tel. ANRE „PANOSOL ENERGY"/Ilfov. CUI din anre-with-cui.json (PANOSOL ENERGY S.R.L., J2023001774235,
  // înmatriculată 15.03.2023, Sat Fundeni, Com. Dobroești). ANAF 2025 deni „PANASOL ENERGY SRL" (cu A, probabil greșeală de scriere la ANAF/bilanț).
  // ANAF bilanț (28.11.2026): 2024 fără bilanț depus (răspuns gol); 2025 CAEN 4322, CA 465.800 / profit 125.404 / 0 salariați.
  // → verified: false (CA sub 500.000).
  // ANRE (snapshot curent data/anre-atestate.json): B nr. 24795 (22.07.2026 → 22.07.2031), „Atestat". (anre-with-cui.json are încă rândul
  // vechi „Inregistrare" fără număr — snapshot depășit.)
  // AFM: NU apare în casa-verde-installers.json, deși site-ul scrie „Suntem autorizați ANRE și AFM" și are pagini Casa Verde 2025/2026. Fără tag `casa-verde`.
  // LUCRĂRI DOCUMENTATE: niciuna (portofoliu doar cu poze, fără kW/localitate). Kiturile 5-20 kW sunt oferte-tip. capacity 0/0/0.
  // Cifre care NU intră și sunt suspecte: „1.393+ sisteme instalate", „18.534+ kW instalați", „2.316+ clienți", „4+ ani de experiență" (firma e din 2023),
  // „peste 1500 de invertoare montate" / „20.000 kW instalați" — ultima formulare e identică cu textul de pe siana-energie.ro. Nu se potrivesc cu
  // 0 salariați și CA 0,47 mil. lei. De lămurit la apel cine montează efectiv.
  // SEGMENT: `rezidential` (are pagină „pentru companii" și un kit Huawei 6 kW „companii", dar nicio lucrare comercială).
  // COVERAGE: Ilfov (sediu) + București (alăturat; site-ul zice „în toată țara", fără județe numite). Strict: doar Ilfov.
  // LOGO: panosolenergy.ro/wp-content/uploads/2026/07/cropped-cropped-Blue_Orange_Solarcell_Solar_Energy_Logo_3.webp (webp, de convertit).
  {
    "id": "panosol-energy",
    "slug": "panosol-energy",
    "name": "PanoSol Energy",
    "cui": "RO47818902",
    "logo": "",
    "description": "PanoSol Energy este o firmă din Fundeni, comuna Dobroești, județul Ilfov, înființată în 2023, care vinde și montează sisteme fotovoltaice pentru persoane fizice, companii și instituții. Kiturile de pe site sunt hibride, monofazate și trifazate, de la 5 la 20 kW, cu invertoare Deye sau Huawei și baterii Deye, Dah Solar și altele, iar montajul, punerea în funcțiune și dosarul de prosumator sunt incluse. Oferă și curățarea și mentenanța panourilor, preluarea sistemelor montate de alți instalatori, plata în rate prin TBI și are un magazin online cu panouri, invertoare și baterii. Deține atestat ANRE tip B, emis în iulie 2026. Cifra de afaceri a fost de 0,47 milioane de lei în 2025.",
    "founded": 2023,
    "employees": 0,
    "location": {
      "city": "Fundeni",
      "county": "Ilfov",
      "address": "Str. Cireșului, Nr. 16C, Ap. B8, Fundeni, Com. Dobroești"
    },
    "contact": {
      "phone": "+40760920420",
      "email": "contact@panosolenergy.ro",
      "website": "https://panosolenergy.ro"
    },
    "coverage": [
      "Ilfov",
      "București"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 465800,
      "profit": 125404,
      "history": [
        {
          "year": 2025,
          "revenue": 465800,
          "profit": 125404,
          "employees": 0
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "hibrid",
      "stocare-baterii",
      "prosumator",
      "mentenanta-pv",
      "finantare-disponibila",
      "magazin-online"
    ],
    "featured": false,
    "verified": false,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "rezidential",
    "anreMatch": {
      "societate": "PANOSOL ENERGY",
      "judet": "Ilfov"
    }
  },
  // ── Solar West ──
  // ── SOLAR WEST / SOLARWEST SRL (CUI 40518053), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „Solar West", 157 recenzii (input fără locație/site). Site găsit prin căutare: solarwest.ro, Dumbrăvița (Facebook „SolarWest -
  // Sisteme Fotovoltaice | Dumbravita": „Importator sisteme fotovoltaice, autorizati ANRE si AFM"). Site fără CUI; adresa (Str. W. A. Mozart 24,
  // Dumbrăvița) și mobilul 0799355566 coincid cu ANRE „SOLARWEST"/Timis și listafirme (SOLARWEST SRL, CUI 40518053). Contact site: 0316 306 851,
  // 0799 355 566, oferte@solarwest.ro. Am pus mobilul (= ANRE și site). anre-with-cui.json: J2019000559353, înmatriculată 29.01.2019.
  // ANAF bilanț (28.11.2026), CAEN 4321: 2024 CA 411.893 / profit 201.865 / 1 sal.; 2025 CA 985.678 / profit 488.656 / 1 sal.
  // ANRE (snapshot): B nr. 23241 (03.06.2025 → 03.06.2030), „Atestat". Nu are atestat mai vechi în registru, deși lucrările de pe site sunt din 2023
  // (probabil executate cu un partener atestat; de întrebat).
  // AFM: NU apare în casa-verde-installers.json. Portofoliul are 12 lucrări cu titlul „AFM Casa Verde sistem fotovoltaic ... kW" și Facebook
  // zice „autorizați ANRE și AFM", dar fără confirmare din lista AFM → fără tag `casa-verde` (de adăugat dacă Radu confirmă).
  // LUCRĂRI DOCUMENTATE (solarwest.ro/portfolio):
  //   - 300 kW, Canadian Solar + 3 × Huawei 100 kW, sediul CNAIR – CESTRIN, București, 10.10.2023 („clientul deține calitatea de prosumator") → `cladiri-birouri`
  //   - 100 kWp + stație de încărcare 2 × 22 kW, Lugoj (TM), prin Electric Up, 21.02.2023
  //   - industriale/comerciale fără detalii citite: 12 kW Caransebeș, „Kids Park", 20 kW spălătorie, „Moon", 20 kW, 30 kW
  //   - rezidențiale „AFM Casa Verde": 6 kW Dumbrăvița (×5), 6 kW Moșnița Nouă (×2), 12 kW Moșnița Nouă, 6 kW Satchinez, 6 kW Topolovățu Mare,
  //     10 kW Dumbrăvița, 10 kW Teregova (CS), 10 kW Plugova (CS)
  // capacity: min 6, max 300.
  // SEGMENT: `ambele`. Specializări: `rezidential`, `cladiri-birouri` (sediul CNAIR – CESTRIN). Spălătoria/Kids Park nu au id potrivit (nu `retail`).
  // COVERAGE: Timiș, Caraș-Severin (lucrări), București (CNAIR). Site: „vestul României".
  // Mărci: Canadian Solar, Huawei (din lucrări). „Importator" doar pe Facebook → nu am pus `distribuitor-echipamente`.
  // LOGO: solarwest.ro/wp-content/uploads/2022/09/Logo-SolarWest-Landscape2.png
  {
    "id": "solar-west",
    "slug": "solar-west",
    "name": "Solar West",
    "cui": "RO40518053",
    "logo": "",
    "description": "Solar West (SOLARWEST SRL) este o firmă din Dumbrăvița, lângă Timișoara, înființată în 2019, care oferă consultanță, ofertare, montaj, dosar de prosumator și mentenanță pentru sisteme fotovoltaice destinate locuințelor și firmelor din vestul țării. Portofoliul de pe site include un sistem de 300 kW cu panouri Canadian Solar și trei invertoare Huawei de 100 kW la sediul CNAIR - CESTRIN din București, unul de 100 kWp cu două stații de încărcare de 22 kW pentru mașini electrice, făcut prin programul Electric Up în Lugoj, și sisteme comerciale de 20 și 30 kW, inclusiv pentru o spălătorie. Pentru case, site-ul prezintă sisteme de 6, 10 și 12 kW făcute prin programul Casa Verde în Dumbrăvița, Moșnița Nouă, Satchinez și Topolovățu Mare, din județul Timiș, și în Teregova și Plugova, din Caraș-Severin. Deține atestat ANRE tip B, valabil până în iunie 2030, și oferă finanțare în rate. Cifra de afaceri a crescut de la 0,41 milioane de lei în 2024 la 0,99 milioane de lei în 2025.",
    "founded": 2019,
    "employees": 1,
    "location": {
      "city": "Dumbrăvița",
      "county": "Timiș",
      "address": "Str. Wolfgang Amadeus Mozart, Nr. 24, Dumbrăvița 307160"
    },
    "contact": {
      "phone": "+40799355566",
      "email": "oferte@solarwest.ro",
      "website": "https://solarwest.ro"
    },
    "coverage": [
      "Timiș",
      "Caraș-Severin",
      "București"
    ],
    "specializations": [
      "rezidential",
      "cladiri-birouri"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 6,
      "maxProjectKw": 300,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 985678,
      "profit": 488656,
      "history": [
        {
          "year": 2024,
          "revenue": 411893,
          "profit": 201865,
          "employees": 1
        },
        {
          "year": 2025,
          "revenue": 985678,
          "profit": 488656,
          "employees": 1
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "pv-comercial",
      "prosumator",
      "mentenanta-pv",
      "statii-incarcare-ev",
      "electric-up",
      "finantare-disponibila",
      "proiecte-mari",
      "portofoliu-documentat"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "ambele",
    "anreMatch": {
      "societate": "SOLARWEST",
      "judet": "Timis"
    }
  },
  // ── GIS Energy ──
  // ── GIS ENERGY SRL (CUI 36601516), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „GIS Energy", 132 recenzii (input fără locație/site). Site găsit prin căutare: gisenergy.ro (Instagram/Facebook „GiS Energy | Oradea").
  // Site fără CUI; contact: Str. Făcliei nr. 89, Corp A, Oradea, +40 762 336 333, +40 725 350 505 (= tel. ANRE), office@gisenergy.ro.
  // Registrul: GIS ENERGY S.R.L., J2016001837057, înmatriculată 05.10.2016 (anre-with-cui.json), sediu Str. Lanului 68, Sântandrei (listafirme, = ANRE).
  // ANAF deni „GIS ENERGY SRL", CAEN 4321. SICAP: furnizare în achiziții publice (martie 2025).
  // ANAF bilanț (28.11.2026): 2024 CA 7.963.990 / profit 1.837.070 / 8 sal.; 2025 CA 18.571.040 / profit 3.354.438 / 20 sal.
  // ANRE (snapshot curent): C1A nr. 23392 și C2A nr. 23393 (30.06.2025 → 30.06.2030), „Atestat"; B nr. 21073 (2023) „Retras".
  // AFM: NU apare în casa-verde-installers.json; are subdomeniul casaverde.gisenergy.ro (ofertă), fără validare documentată. Fără tag `casa-verde`.
  // LUCRĂRI DOCUMENTATE (gisenergy.ro/portfolio/<slug>, toate on-grid, Jinko Tiger Neo + Huawei):
  //   - Vlasar Agro SRL, Bicaci (BH), 2024: 200,1 kW, 348 × 575 W bifaciale → `agricol`
  //   - Brutăria Wolf, Buteni (AR), 2023: 162,45 kW, 342 × 475 W → `hale-industriale` (producție)
  //   - Marmorex Trafic Stone SRL, Leș (BH), 2023: 140,12 kW, 295 × 475 W → `hale-industriale` (prelucrare piatră)
  //   - Vest Grup Soluții, Oradea, 2024: 24,7 kW, 52 × 475 W
  //   - rezidențiale fără kW citite: Oradea, Oșorhei, Borș
  // capacity.maxProjectKw: 200 (Vlasar Agro, 200,1 kW).
  // ISO: homepage are imagini cu „9001" și „14001" (alt text / nume de fișier), fără certificat, organism sau valabilitate → NU le-am pus în
  // certifications. De cerut certificatele dacă vrei să le adaugi.
  // Cifre care NU intră: „Peste 13 ani de experiență combinată în industrie".
  // SEGMENT: `ambele`. COVERAGE: Bihor, Arad (lucrări). LOGO: gisenergy.ro/wp-content/uploads/2024/03/logo-negru.png (varianta închisă).
  {
    "id": "gis-energy",
    "slug": "gis-energy",
    "name": "GIS Energy",
    "cui": "RO36601516",
    "logo": "",
    "description": "GIS Energy este o firmă înființată în 2016, cu sediul social în Sântandrei și birou în Oradea, județul Bihor, care proiectează și montează sisteme fotovoltaice pentru case, firme și ferme și oferă mentenanță și service după instalare. Pe site prezintă lucrări comerciale on-grid cu panouri Jinko Tiger Neo și invertoare Huawei: un sistem de 200,1 kW pentru Vlasar Agro în Bicaci, județul Bihor, în 2024, unul de 162,45 kW pentru Brutăria Wolf în Buteni, județul Arad, în 2023, unul de 140,12 kW pentru Marmorex Trafic Stone în Leș, județul Bihor, în 2023, și unul de 24,7 kW pentru Vest Grup Soluții în Oradea, plus sisteme rezidențiale în Oradea, Oșorhei și Borș. Oferă consultanță pentru finanțarea IMM-urilor și are o pagină dedicată programului Casa Verde. Deține atestate ANRE C1A și C2A, emise în iunie 2025. Cifra de afaceri a crescut de la 7,96 milioane de lei în 2024 la 18,57 milioane de lei în 2025.",
    "founded": 2016,
    "employees": 20,
    "location": {
      "city": "Oradea",
      "county": "Bihor",
      "address": "Str. Făcliei, Nr. 89, Corp A, Oradea. Sediu social: Str. Lanului nr. 68, Sântandrei, jud. Bihor"
    },
    "contact": {
      "phone": "+40725350505",
      "email": "office@gisenergy.ro",
      "website": "https://gisenergy.ro"
    },
    "coverage": [
      "Bihor",
      "Arad"
    ],
    "specializations": [
      "rezidential",
      "hale-industriale",
      "agricol"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 200,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 18571040,
      "profit": 3354438,
      "history": [
        {
          "year": 2024,
          "revenue": 7963990,
          "profit": 1837070,
          "employees": 8
        },
        {
          "year": 2025,
          "revenue": 18571040,
          "profit": 3354438,
          "employees": 20
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "pv-comercial",
      "pv-industrial",
      "on-grid",
      "mentenanta-pv",
      "finantare-disponibila",
      "proiecte-mari",
      "portofoliu-documentat"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "ambele",
    "anreMatch": {
      "societate": "GIS ENERGY",
      "judet": "Bihor"
    }
  },
  // ── Elektrosmart Electric ──
  // ── ELEKTROSMART ELECTRIC SRL (CUI 42888290), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „Elektrosmart", Galați, 125 recenzii (input fără site). Site găsit prin căutare: elektrosmart.ro (Facebook: „Firmă autorizată cu sediul
  // în localitatea LIEȘTI, executăm instalații fotovoltaice prin programul CASA VERDE"). Footer: „S.C. ELEKTROSMART ELECTRIC S.R.L.", fără CUI.
  // Contact (site): 021 555 8161, 0744 216 401, WhatsApp 0743 580 328 (= tel. ANRE și Cylex), office@elektrosmart.ro; adrese: Drumul de Centură 3B, Galați
  // și Str. Mircea Eliade 29A, Liești. Sediul social (ANRE / listafirme): Str. George Coșbuc nr. 31, Liești. Am pus mobilul 0743580328 (= ANRE și WhatsApp de pe site).
  // anre-with-cui.json: J2020000884176, înmatriculată 07.08.2020. ANAF deni „ELEKTROSMART ELECTRIC SRL", CAEN 4321.
  // ANAF bilanț (28.11.2026): 2024 CA 3.168.761 / profit 730.079 / 5 sal.; 2025 CA 9.217.747 / profit 1.704.007 / 8 sal.
  // ANRE (snapshot): B nr. 18112 (05.04.2022 → 05.04.2027), „Atestat".
  // AFM: apare în casa-verde-installers.json („ELEKTROSMART ELECTRIC S.R.L", 42888290). Tag `casa-verde`.
  // LUCRĂRI DOCUMENTATE (elektrosmart.ro/proiect/<slug>):
  //   - On-grid 200 kW, Râmnicu Sărat (BZ): 216 × JA Solar 460 W + 180 × JA Solar 545 W, 4 × Huawei 50KTL, tablouri cu descărcătoare DC și releu
  //     anti-insularizare (fără tipul clientului, fără an)
  //   - On-grid 10 kW, Cotoroaia (GL) · On-grid 9 kW, Smârdan (GL)
  // capacity: min 9, max 200.
  // Pagina de montaj: „pentru casă", „pentru companii", „pentru industrii" — serviciu complet (proiectare, dosar prosumator, furnizare, montaj).
  // Mărci: logo-urile de pe homepage (SolarEdge, SMA, Fronius, Huawei, Sungrow, Dyness, Solis; Loxone pentru smart home).
  // SEGMENT: `ambele`; specializări doar `rezidential` (lucrarea de 200 kW nu are tipul clientului).
  // COVERAGE: Galați, Buzău (lucrări). LOGO: elektrosmart.ro/wp-content/uploads/2025/10/logo-elektrosmart.svg (SVG, de convertit).
  {
    "id": "elektrosmart-electric",
    "slug": "elektrosmart-electric",
    "name": "Elektrosmart Electric",
    "cui": "RO42888290",
    "logo": "",
    "description": "Elektrosmart Electric este o firmă de instalații electrice din Liești, județul Galați, înființată în 2020, cu un punct de lucru în Galați, care proiectează și montează sisteme fotovoltaice pentru case, firme și clienți industriali, cu dosarul de prosumator inclus. A montat sisteme prin programul Casa Verde Fotovoltaice și are pagini dedicate programelor Casa Verde Baterii și RePowerEU. Pe site prezintă un sistem on-grid de 200 kW în Râmnicu Sărat, județul Buzău, cu patru invertoare Huawei de 50 kW și panouri JA Solar, și sisteme on-grid de 10 kW în Cotoroaia și de 9 kW în Smârdan, județul Galați. Lucrează cu invertoare SolarEdge, SMA, Fronius, Huawei, Sungrow și Solis și cu baterii Dyness. Pe lângă fotovoltaice, face instalații electrice interioare, verificări PRAM, pompe de căldură și sisteme smart home Loxone și are un magazin online. Deține atestat ANRE tip B, valabil până în aprilie 2027. Cifra de afaceri a crescut de la 3,17 milioane de lei în 2024 la 9,22 milioane de lei în 2025.",
    "founded": 2020,
    "employees": 8,
    "location": {
      "city": "Liești",
      "county": "Galați",
      "address": "Str. George Coșbuc, Nr. 31, Liești. Puncte de lucru: Str. Mircea Eliade nr. 29A, Liești; Drumul de Centură nr. 3B, Galați"
    },
    "contact": {
      "phone": "+40743580328",
      "email": "office@elektrosmart.ro",
      "website": "https://www.elektrosmart.ro"
    },
    "coverage": [
      "Galați",
      "Buzău"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 9,
      "maxProjectKw": 200,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 9217747,
      "profit": 1704007,
      "history": [
        {
          "year": 2024,
          "revenue": 3168761,
          "profit": 730079,
          "employees": 5
        },
        {
          "year": 2025,
          "revenue": 9217747,
          "profit": 1704007,
          "employees": 8
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "pv-comercial",
      "on-grid",
      "prosumator",
      "casa-verde",
      "proiectare",
      "instalatii-electrice",
      "pompe-caldura",
      "magazin-online",
      "proiecte-mari"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "ambele",
    "anreMatch": {
      "societate": "ELEKTROSMART ELECTRIC",
      "judet": "Galati"
    }
  },
  // ── AA Tehnic ──
  // ── AA TEHNIC SRL (CUI 20314822), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „AA Tehnic", Dolj, 121 recenzii (input fără site). Site găsit prin căutare: aatehnic.ro (Facebook „AA Tehnic Fotovoltaice Craiova").
  // Site: „SC AA Tehnic SRL, Craiova", +40 757 056 979, office@aatehnic.ro; fără CUI. ANRE: „AA TEHNIC"/Dolj, str. Ioan Slavici nr. 8, Craiova,
  // tel. 0745625265 / 0351407487 (panourifotovoltaice123 dă același 0745 625 265 la aceeași adresă). Am pus telefonul de pe site.
  // anre-with-cui.json: J16/2430/2006, înmatriculată 29.12.2006, Mun. Craiova. ANAF deni „SC AA TEHNIC SRL", CAEN 4321.
  // ANAF bilanț (28.11.2026): 2024 CA 4.246.461 / profit 856.402 / 9 sal.; 2025 CA 7.834.683 / profit 791.644 / 11 sal.
  // CA include și curenți slabi/siguranță (IDSAI, CCTV, cablare), nu doar PV.
  // ANRE (snapshot): B nr. 19211 (24.03.2023 → 24.03.2028), „Atestat".
  // AFM: apare în casa-verde-installers.json („AA TEHNIC SRL"). Tag `casa-verde`.
  // Huawei: aatehnic.ro/instalator-certificat-huawei: „AA TEHNIC este recunoscută ca Certified Installer în programul Huawei FusionSolar" (cu imagine de certificat) → `partener-huawei`.
  // Homepage: „17 ani experiență în curenți tari și slabi", „peste 10 ani în energie regenerabilă (primele sisteme montate în 2013)" → `experienta-10-ani`.
  // LUCRĂRI DOCUMENTATE: doar două pe homepage, 3 kW Dăbuleni și 3 kW Craiova. capacity.maxProjectKw: 3 (precedent Elon: max din lucrări documentate,
  // chiar mici). Pagina „Comercial" (afaceri, depozite, hale) e generică, fără lucrări.
  // SEGMENT: `rezidential`. COVERAGE: Dolj (site: „Oltenia"; nu am extins la Gorj/Mehedinți/Olt/Vâlcea fără lucrări acolo).
  // Mărci (homepage): Huawei, Growatt, Jinko, Canadian Solar, Dah Solar. ISO: niciunul.
  // LOGO: aatehnic.ro/wp-content/uploads/2024/09/aatehnic-logo.jpg (JPG, probabil cu fundal).
  {
    "id": "aa-tehnic",
    "slug": "aa-tehnic",
    "name": "AA Tehnic",
    "cui": "RO20314822",
    "logo": "",
    "description": "AA Tehnic este o firmă de instalații electrice din Craiova, înființată în 2006, care montează sisteme fotovoltaice pentru case și firme din Oltenia, primele din 2013. Se ocupă de dosarul de prosumator și de împământarea sistemelor, a montat sisteme prin programul Casa Verde Fotovoltaice și este instalator certificat în programul Huawei FusionSolar. Lucrează cu invertoare Huawei și Growatt și cu panouri Jinko, Canadian Solar și Dah Solar, iar pe site prezintă sisteme de 3 kW în Dăbuleni și în Craiova. Pe lângă fotovoltaice, proiectează și execută instalații electrice de joasă tensiune, sisteme de detecție a incendiilor, paratrăsnete, iluminat de urgență, alarme, control acces, supraveghere video, cablare structurată, smart home și BMS. Deține atestat ANRE tip B, valabil până în martie 2028. Cifra de afaceri a crescut de la 4,25 milioane de lei în 2024 la 7,83 milioane de lei în 2025.",
    "founded": 2006,
    "employees": 11,
    "location": {
      "city": "Craiova",
      "county": "Dolj",
      "address": "Str. Ioan Slavici, Nr. 8, Craiova 200716"
    },
    "contact": {
      "phone": "+40757056979",
      "email": "office@aatehnic.ro",
      "website": "https://aatehnic.ro"
    },
    "coverage": [
      "Dolj"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 3,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 7834683,
      "profit": 791644,
      "history": [
        {
          "year": 2024,
          "revenue": 4246461,
          "profit": 856402,
          "employees": 9
        },
        {
          "year": 2025,
          "revenue": 7834683,
          "profit": 791644,
          "employees": 11
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "prosumator",
      "casa-verde",
      "partener-huawei",
      "instalatii-electrice",
      "detectie-incendiu",
      "sisteme-securitate",
      "curenti-slabi",
      "experienta-10-ani"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "rezidential",
    "anreMatch": {
      "societate": "AA TEHNIC",
      "judet": "Dolj"
    }
  },
  // ── Euro House ──
  // ── EURO HOUSE SRL (CUI 15240931), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „SC Euro House SRL", Fundătura Hărmanului nr. 3, Brașov, euro-house.ro, 0268331111, 112 recenzii, 4,5.
  // euro-house.ro face redirect la profyheat.com (site-ul actual, titlu „EURO HOUSE – Sisteme fotovoltaice, încălzire în pardoseală, degivrare").
  // Footer/termeni: „SC Euro House SRL, CUI 15240931, J2003000353088, Str. Fundătura Hărmanului nr. 3, 500240 Brașov", +40 268 331 111 (= Maps = ANRE),
  // 0730 040 065, sales@profyheat.com. Am pus website profyheat.com (euro-house.ro doar redirecționează).
  // ATENȚIE CUI: data/anre-with-cui.json leagă „EURO HOUSE"/Brasov de CUI 16364237, dar acela e EURO HOUSE SRL din Bacău (J04/764/2004) și nu are
  // bilanț 2025 la ANAF — potrivire greșită pe nume. CUI-ul corect e 15240931 (footer site, ANAF deni „EURO HOUSE SRL", casa-verde-installers.json
  // „SC EURO HOUSE SRL"). De corectat în anre-with-cui.json.
  // ANAF bilanț (28.11.2026), CAEN 4321: 2024 CA 9.730.963 / profit 1.482.785 / 12 sal.; 2025 CA 15.507.683 / profit 2.643.365 / 11 sal.
  // ANRE (snapshot): B nr. 14405 (04.04.2019, vizare periodică → 04.04.2029), „Atestat".
  // AFM: apare în casa-verde-installers.json; homepage: „instalator validat AFM în toate edițiile Casa Verde". Tag `casa-verde`.
  // LUCRĂRI DOCUMENTATE (homepage + profyheat.com/imagini), fără localitate: case — hibrid 18 kW, on-grid 10 kW, hibrid 14 kW, hibrid 20 kW,
  // on-grid 12,6 kW (terasă), on-grid 22,5 kW (țiglă); C&I — on-grid 207 kW „industrial", PV C&I 200 kW, PV C&I 83 kW; stocare C&I 160, 192 (×3),
  // 215, 522 kWh. capacity: min 10, max 207. Galeria: „montate de echipa noastră în toată România".
  // SEGMENT: `ambele`; `hale-industriale` din „On-grid 207 kW industrial" (fără numele clientului). COVERAGE: Brașov (sediu); lucrările nu au localitate.
  // Founded 2003 (J2003..., site „Din 2003") → `experienta-20-ani`.
  // Mărci: Sofar (principal), Huawei, Sungrow, Trina, Canadian Solar; EV chargers Sofar/Sungrow în magazin → `statii-incarcare-ev`.
  // LOGO: profyheat.com/wp-content/uploads/2026/11/logo-eurohouse.svg (SVG, de convertit).
  {
    "id": "euro-house",
    "slug": "euro-house",
    "name": "Euro House",
    "cui": "RO15240931",
    "logo": "",
    "description": "Euro House este o firmă din Brașov, înființată în 2003, care vinde și montează kituri fotovoltaice la cheie, cu montaj și dosar de prosumator incluse, pentru case și firme, și sisteme de stocare pentru clienți comerciali și industriali. Lucrează cu invertoare și baterii Sofar, Huawei și Sungrow și cu panouri Trina Solar și Canadian Solar. Pe site prezintă sisteme pentru case de 10, 12,6, 14, 18, 20 și 22,5 kW, on-grid și hibride, un sistem on-grid industrial de 207 kW și unul comercial de 200 kW, precum și sisteme de stocare comerciale și industriale de 160 până la 522 kWh. Spune că a fost instalator validat AFM în toate edițiile programului Casa Verde și apare pe lista instalatorilor validați. Oferă și revizii pentru sisteme existente, protecție anti-păsări și, separat de fotovoltaice, încălzire în pardoseală, cabluri de degivrare și generatoare, prin magazinul online ProfyHeat. Deține atestat ANRE tip B, cu vizare periodică până în aprilie 2029. Cifra de afaceri a crescut de la 9,73 milioane de lei în 2024 la 15,51 milioane de lei în 2025.",
    "founded": 2003,
    "employees": 11,
    "location": {
      "city": "Brașov",
      "county": "Brașov",
      "address": "Fundătura Hărmanului, Nr. 3, Brașov 500240"
    },
    "contact": {
      "phone": "+40268331111",
      "email": "sales@profyheat.com",
      "website": "https://profyheat.com"
    },
    "coverage": [
      "Brașov"
    ],
    "specializations": [
      "rezidential",
      "hale-industriale"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 10,
      "maxProjectKw": 207,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 15507683,
      "profit": 2643365,
      "history": [
        {
          "year": 2024,
          "revenue": 9730963,
          "profit": 1482785,
          "employees": 12
        },
        {
          "year": 2025,
          "revenue": 15507683,
          "profit": 2643365,
          "employees": 11
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "pv-comercial",
      "pv-industrial",
      "on-grid",
      "hibrid",
      "stocare-baterii",
      "prosumator",
      "casa-verde",
      "mentenanta-pv",
      "statii-incarcare-ev",
      "magazin-online",
      "proiecte-mari",
      "experienta-20-ani"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "ambele",
    "anreMatch": {
      "societate": "EURO HOUSE",
      "judet": "Brasov"
    }
  },
  // ── Custom Energy ──
  // ── CUSTOM ENERGY / CUSTOM TECHNOLOGIES SRL (CUI 24881439), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „Custom Technologies", Bd. Chimiei 2, Iași, customenergy.ro, 0747543784, 96 recenzii, 4,9.
  // Footer: „SC CUSTOM TECHNOLOGIES SRL, C.I.F.: RO24881439, J2008003680225"; showroom Bd. Chimiei nr. 2, Iași; 0747 543 784 (= Maps = ANRE), office@customenergy.ro.
  // anre-with-cui.json: înmatriculată 17.12.2008. ANAF deni „CUSTOM TECHNOLOGIES SRL", CAEN 4674 (comerț cu ridicata echipamente sanitare/încălzire).
  // ANAF bilanț (28.11.2026): 2024 CA 9.446.728 / profit 1.825.111 / 9 sal.; 2025 CA 18.697.142 / profit 2.662.293 / 9 sal.
  // Site-ul vinde și centrale pe peleți (distribuitor Domusa Teknik, domusateknik.ro), ventilație, aspiratoare centralizate → CA nu e doar PV.
  // ANRE (snapshot): B nr. 19397 (04.05.2023 → 04.05.2028), „Atestat".
  // AFM: apare în casa-verde-installers.json („CUSTOM TECHNOLOGIES SRL"). Pagina PV are oferta Casa Verde 2024 și lucrări Casa Verde 2023. Tag `casa-verde`.
  // Montaj confirmat (customenergy.ro/produse/panouri-fotovoltaice): „Montăm doar prin echipe specializate proprii. Fără intermediari sau colaboratori",
  // „Asigurăm livrarea și montajul echipamentelor în 2 săptămâni, cu propriile echipe și utilaje", proiectare cu software (zăpadă, vânt, structural, umbre).
  // „Am luat decizia să lucrăm cu invertoare Huawei" → `partener-huawei` (nu e parteneriat oficial declarat; scoate-l dacă vrei strict).
  // LUCRĂRI DOCUMENTATE (toate jud. Iași): on-grid Huawei + Longi — 10,35 kWp Valea Ursului (23 × 450 W) · 7,28 kWp Păun · 7,12 kWp Holboca ·
  // 5,98 kWp Breazu · 5,52 kWp Iași · 5,4 kWp Cercu-Bârnova · 4,6 kWp Iași · 3,15 kWp Valea Adâncă; hibride — 9 kWp (la sol/carport),
  // 7,5 kWp (15 × Longi 500 W, Huawei 6 kW, prosumator din 22.02.2024), 6,24 kWp (Deye 12 kW, țiglă ceramică), 5,2 kWp (la sol, Huawei 4 kW),
  // 5 + 6 kW Casa Verde în Valea Adâncă. capacity: min 3, max 10 (10,35 kWp).
  // Pachetele 6-20 kWp cu prețuri sunt oferte-tip. Cifre care NU intră: „sute de familii", „prezent de 18 ani pe piața locală".
  // SEGMENT: `rezidential` (pagina pomenește și „business fizic", fără lucrări). COVERAGE: Iași (site: „Iași și județele alăturate", hartă Moldova, fără județe numite).
  // Tag `experienta-15-ani`: firma din 2008 (instalații), PV probabil din ~2022. `finantare-disponibila`: „le poți achita în rate".
  // LOGO: customenergy.ro/images/Sigla_completa.png
  // NUME: Maps și ANRE zic „Custom Technologies"; site-ul și brandul de PV sunt „Custom Energy". Am pus name „Custom Energy" / slug custom-energy;
  // dacă preferi numele din Maps: „Custom Technologies" / custom-technologies.
  {
    "id": "custom-energy",
    "slug": "custom-energy",
    "name": "Custom Energy",
    "cui": "RO24881439",
    "logo": "",
    "description": "Custom Energy este brandul CUSTOM TECHNOLOGIES SRL, firmă din Iași înființată în 2008, cu showroom pe Bulevardul Chimiei, care vinde și montează sisteme de încălzire, ventilație cu recuperare de căldură, pompe de căldură, smart home și sisteme fotovoltaice la cheie pentru case din Iași și din județele alăturate. Montajul fotovoltaic se face doar cu echipe proprii, după o proiectare cu software specializat, cu teste de zăpadă și vânt, calcule structurale și simulare de umbrire, iar prețul include echipamentele, tabloul BMPM, montajul, punerea în funcțiune și dosarul de prosumator. Lucrează în principal cu invertoare Huawei, Sungrow și Deye și cu panouri Longi, pe acoperiș sau pe structuri la sol. Pe site prezintă lucrări documentate de la 3,15 la 10,35 kWp, între care un sistem on-grid de 10,35 kWp în Valea Ursului, unul de 7,28 kWp în satul Păun, unul de 7,12 kWp în Holboca, sisteme hibride de 9 și 7,5 kWp și două sisteme Casa Verde în Valea Adâncă. Apare pe lista instalatorilor validați AFM și deține atestat ANRE tip B, valabil până în mai 2028. Cifra de afaceri a crescut de la 9,45 milioane de lei în 2024 la 18,70 milioane de lei în 2025, din care o parte vine din distribuția de echipamente de încălzire.",
    "founded": 2008,
    "employees": 9,
    "location": {
      "city": "Iași",
      "county": "Iași",
      "address": "Bd. Chimiei, Nr. 2, Bl. C1, parter, Iași 700291"
    },
    "contact": {
      "phone": "+40747543784",
      "email": "office@customenergy.ro",
      "website": "https://customenergy.ro"
    },
    "coverage": [
      "Iași"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 3,
      "maxProjectKw": 10,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 18697142,
      "profit": 2662293,
      "history": [
        {
          "year": 2024,
          "revenue": 9446728,
          "profit": 1825111,
          "employees": 9
        },
        {
          "year": 2025,
          "revenue": 18697142,
          "profit": 2662293,
          "employees": 9
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "on-grid",
      "hibrid",
      "stocare-baterii",
      "prosumator",
      "casa-verde",
      "proiectare",
      "mentenanta-pv",
      "monitorizare-inclusa",
      "pompe-caldura",
      "partener-huawei",
      "finantare-disponibila",
      "experienta-15-ani"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "rezidential",
    "anreMatch": {
      "societate": "CUSTOM TECHNOLOGIES",
      "judet": "Iasi"
    }
  },
  // ── Ferma de Energie ──
  // ── FERMA DE ENERGIE SRL (CUI 46772050), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „Ferma De Energie", Calea Circumvalațiunii 2, Timișoara, fermadenergie.ro, 0773313971, 95 recenzii, 5,0.
  // Site: „FERMA DE ENERGIE SRL, CUI RO46772050, Str. Hărniciei nr. 3, sc. C, et. 2, ap. 11, Timișoara" (= ANRE). Vânzări 0773 313 971 (= Maps),
  // tehnic 0728 232 233, office@fermadenergie.ro. Adresa din Maps (Calea Circumvalațiunii 2) nu apare pe site; am pus sediul.
  // anre-with-cui.json: J2022004181352, înmatriculată 02.09.2022. ANAF deni „FERMA DE ENERGIE SRL", CAEN 4321.
  // ANAF bilanț (28.11.2026): 2024 CA 3.393.184 / profit 592.658 / 3 sal.; 2025 CA 7.302.778 / profit 628.247 / 7 sal.
  // ANRE (snapshot): „FERMA DE ENERGIE " (CU SPAȚIU LA FINAL), Timis, B nr. 18977 (19.01.2023 → 19.01.2028), „Atestat". anreMatch păstrează spațiul.
  // AFM: apare în casa-verde-installers.json („SC FERMA DE ENERGIE SRL"); site-ul: „AFM Instalator validat Casa Verde Fotovoltaice, lista oficială,
  // sesiunea 2024", cu link la PDF-ul AFM. Tag `casa-verde`.
  // Montaj: „Tehnicienii noștri autorizați montează curat și la termen", „Dosarul de prosumator și racordarea sunt treaba noastră", „pe case, pe hale și pe câmp".
  // LUCRĂRI DOCUMENTATE (homepage #lucrari, 30 cu kW + localitate, fără tipul clientului): Cavaran 90,1 kW · Timișoara 90 kW · Moșnița Nouă 40,5 kW ·
  // Timișoara 34,1 kW · Hațeg 20,2 kWp · Biled 15,2 · Arad 14,1 · Sânnicolau Mare 12,4 · Sânmartinu Maghiar 12,1 · Bagara 11,1 · Timișoara 10,3 ·
  // Buteni, Cugir, Sânmihaiu German, Petroman 10,1 · Timișoara 9,6 · Moșnița Veche 8,2 · Timișoara 8,2 · Moșnița Nouă 7,8 / 7,2 · Ghizela 7,6 ·
  // Hodoș, Utvin, Zorile 6,2 · Timișoara, Livada, Uivar, Beregsău Mare 6,1 · Sântana 5,1 · Moșnița Veche 4 kWp. capacity: min 4, max 90 (90,1 kW).
  // Presă: Euronews/Permis de Antreprenor (interviu Cristian Murărescu), expozant RoEnergy Timișoara 2026.
  // SEGMENT: `ambele` (hale + lucrări de 34-90 kW); specializări doar `rezidential` (lucrările mari fără tipul clientului).
  // COVERAGE: Timiș, Arad, Hunedoara (Hațeg), Caraș-Severin (Cavaran, Zorile), Alba (Cugir) — din lucrări. Site: „din Banat până la Marea Neagră", „în toată țara".
  // Bagara: nu am identificat județul, nu schimbă lista. Mărci: nenumite pe homepage.
  // LOGO: fermadenergie.ro/marca/logo.svg (SVG, de convertit).
  {
    "id": "ferma-de-energie",
    "slug": "ferma-de-energie",
    "name": "Ferma de Energie",
    "cui": "RO46772050",
    "logo": "",
    "description": "Ferma de Energie este o firmă din Timișoara, înființată în 2022, care montează sisteme fotovoltaice cu invertor și baterii pe case, pe hale și la sol, cu tehnicieni proprii, și se ocupă de dosarul de prosumator și de racordare. A fost instalator validat AFM în programul Casa Verde Fotovoltaice, sesiunea 2024, și oferă monitorizare și suport după montaj. Portofoliul de pe site are peste 30 de lucrări cu puterea și localitatea fiecăreia, cele mai mari fiind sistemele de 90,1 kW din Cavaran și de 90 kW din Timișoara, urmate de unul de 40,5 kW în Moșnița Nouă, unul de 34,1 kW în Timișoara și unul de 20,2 kWp în Hațeg, iar cele mai multe sisteme pentru case au între 4 și 15 kWp, în județele Timiș și Arad și până la Cugir. Deține atestat ANRE tip B, valabil până în ianuarie 2028. Cifra de afaceri a crescut de la 3,39 milioane de lei în 2024 la 7,30 milioane de lei în 2025.",
    "founded": 2022,
    "employees": 7,
    "location": {
      "city": "Timișoara",
      "county": "Timiș",
      "address": "Str. Hărniciei, Nr. 3, Sc. C, Et. 2, Ap. 11, Timișoara"
    },
    "contact": {
      "phone": "+40773313971",
      "email": "office@fermadenergie.ro",
      "website": "https://fermadenergie.ro"
    },
    "coverage": [
      "Timiș",
      "Arad",
      "Hunedoara",
      "Caraș-Severin",
      "Alba"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 4,
      "maxProjectKw": 90,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 7302778,
      "profit": 628247,
      "history": [
        {
          "year": 2024,
          "revenue": 3393184,
          "profit": 592658,
          "employees": 3
        },
        {
          "year": 2025,
          "revenue": 7302778,
          "profit": 628247,
          "employees": 7
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "pv-comercial",
      "stocare-baterii",
      "prosumator",
      "casa-verde",
      "monitorizare-inclusa",
      "portofoliu-documentat"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "ambele",
    "anreMatch": {
      "societate": "FERMA DE ENERGIE ",
      "judet": "Timis"
    }
  },
  // ── Regenergy ──
  // ── REGENERGY SRL (CUI 43079092), firmă nouă (AEO: recomandată de ChatGPT) ──
  // Google Maps: „Regenergy", Bacău, 93 recenzii (input fără site). Site găsit prin căutare: regenergy.ro („Panouri fotovoltaice Bacău - REGENERGY SRL").
  // Site fără CUI; contact: +40 724 228 484, +40 724 227 474, office@regenergy.ro; pagina proiectului de finanțare („Beneficiar: S.C. REGENERGY S.R.L.",
  // 24.04.2024 → 08.12.2025) dă și 0751.910.506 = telefonul din ANRE „REGENERGY"/Bacau → identitate confirmată prin telefon.
  // ATENȚIE CUI: data/anre-with-cui.json leagă „REGENERGY"/Bacau de CUI 27459944 (J04/810/2010), dar firma aceea e RADIATĂ (firme-on-line.ro:
  // „REGENERGY SRL (Radiată)") și nu are bilanțuri 2024/2025 la ANAF. Firma activă din Bacău cu același nume e REGENERGY SRL, CUI 43079092,
  // J04/1224/2020, înființată 22.09.2020, sediu Str. Chimiei 2, Bacău (listafirme), CAEN 4321, ANAF deni „REGENERGY S.R.L.". Atestatul ANRE e din
  // 02.05.2023, deci aparține firmei active. De corectat în anre-with-cui.json. (Sediul ANRE, Str. Miron Costin 33, bl. 33, e probabil sediul vechi.)
  // ANAF bilanț (28.11.2026): 2024 CA 3.553.145 / profit 756.392 / 6 sal.; 2025 CA 8.059.445 / profit 1.419.739 / 8 sal.
  // ANRE (snapshot): B nr. 19342 (02.05.2023 → 02.05.2028), „Atestat".
  // AFM: NU apare în casa-verde-installers.json (nici pe un CUI, nici pe celălalt). Fără tag `casa-verde`.
  // Site: homepage descrie sisteme ON-GRID, OFF-GRID (cu baterii) și hibride, „Mentenanță post-vânzare"; servicii: sisteme fotovoltaice, eoliene,
  // stații de încărcare EV, smart home, joasă tensiune, proiectare și consultanță, tablouri și automatizări; magazin cu panouri DAH. Facebook:
  // „Prețuri începând de la 21.980 lei (TVA inclus)". Site-ul e vechi (pagini din 2018-2023) și subțire: portofoliu fără detalii, fără mărci, fără arie.
  // LUCRĂRI DOCUMENTATE: niciuna. capacity 0/0/0.
  // SEGMENT: `rezidential` (implicit, fără lucrări; Facebook are și postări pentru firme). COVERAGE: Bacău.
  // LOGO: regenergy.ro/wp-content/uploads/2023/07/Sigla-noua.png
  {
    "id": "regenergy",
    "slug": "regenergy",
    "name": "Regenergy",
    "cui": "RO43079092",
    "logo": "",
    "description": "Regenergy este o firmă de instalații electrice din Bacău, înființată în 2020, care montează sisteme fotovoltaice on-grid, off-grid cu baterii și hibride, cu mentenanță după montaj. Mai face proiectare și consultanță, sisteme de joasă tensiune, tablouri electrice și automatizări, stații de încărcare pentru mașini electrice, sisteme smart home și sisteme eoliene mici, și are un magazin online cu echipamente. Între 2024 și 2025 a derulat un proiect de investiții pentru modernizarea microîntreprinderii. Deține atestat ANRE tip B, valabil până în mai 2028. Cifra de afaceri a crescut de la 3,55 milioane de lei în 2024 la 8,06 milioane de lei în 2025.",
    "founded": 2020,
    "employees": 8,
    "location": {
      "city": "Bacău",
      "county": "Bacău",
      "address": "Str. Chimiei, Nr. 2, Bacău 600286"
    },
    "contact": {
      "phone": "+40751910506",
      "email": "office@regenergy.ro",
      "website": "https://www.regenergy.ro"
    },
    "coverage": [
      "Bacău"
    ],
    "specializations": [
      "rezidential"
    ],
    "certifications": [],
    "capacity": {
      "minProjectKw": 0,
      "maxProjectKw": 0,
      "projectsCompleted": 0
    },
    "financials": {
      "year": 2025,
      "revenue": 8059445,
      "profit": 1419739,
      "history": [
        {
          "year": 2024,
          "revenue": 3553145,
          "profit": 756392,
          "employees": 6
        },
        {
          "year": 2025,
          "revenue": 8059445,
          "profit": 1419739,
          "employees": 8
        }
      ]
    },
    "tags": [
      "pv-rezidential",
      "on-grid",
      "off-grid",
      "hibrid",
      "stocare-baterii",
      "mentenanta-pv",
      "proiectare",
      "statii-incarcare-ev",
      "instalatii-electrice",
      "magazin-online"
    ],
    "featured": false,
    "verified": true,
    "createdAt": "2026-11-28",
    "updatedAt": "2026-11-28",
    "segment": "rezidential",
    "anreMatch": {
      "societate": "REGENERGY",
      "judet": "Bacau"
    }
  },
];

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const existingCuis = new Set(data.companies.map(c => String(c.cui).replace(/^RO/, '')));
const existingSlugs = new Set(data.companies.map(c => c.slug));
const toAdd = newCompanies.filter(c => !existingCuis.has(String(c.cui).replace(/^RO/, '')) && !existingSlugs.has(c.slug));
data.companies.push(...toAdd);
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2) + '\n');
console.log('Added', toAdd.length, 'companies. Total:', data.companies.length);
