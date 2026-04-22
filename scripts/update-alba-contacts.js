#!/usr/bin/env node
/**
 * One-off: patch the 5 Alba firms with website + corrected contacts found by user.
 * After running, re-run download-logos.mjs + company-tools.js validate.
 */
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const d = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const updates = {
  'solar-prod-ecoinvent': {
    contact: {
      phone: '+40725325992',
      email: 'contact@solarprodecoinvent.ro',
      website: 'https://solarprodecoinvent.ro/',
    },
    description:
      'Firmă din comuna Horea (județul Alba) înființată în 2022, atestată ANRE cu certificări C1A și C2A. Oferă consultanță, proiectare și execuție sisteme fotovoltaice pentru clienți rezidențiali și industriali, precum și lucrări de instalații electrice. Cifra de afaceri: 5,11M RON (2024), 9 angajați.',
    specializations: ['hale-industriale'],
    verified: true,
    updatedAt: '2026-04-22',
  },
  'ted-electro': {
    contact: {
      phone: '+40752555000',
      email: 'tedelectroalba@gmail.com',
      website: 'https://tedelectro.ro/',
    },
    description:
      'Firmă din Alba Iulia înființată în 2022, atestată ANRE cu certificări C1A și C2A. Execută lucrări de instalații electrice rezidențiale, comerciale și industriale — branșamente, tablouri electrice, verificări și mentenanță în județele Alba, Sibiu și Hunedoara. Cifra de afaceri: 2,60M RON (2024), 10 angajați.',
    specializations: ['hale-industriale', 'cladiri-birouri'],
    verified: true,
    updatedAt: '2026-04-22',
  },
  'electroalba-electris': {
    contact: {
      phone: '+40746784180',
      email: 'office@electroalbaelectris.ro',
      website: 'https://www.electroalbaelectris.ro/',
    },
    description:
      'Firmă din Alba Iulia înființată în 2021, atestată ANRE cu certificări C1A și C2A. Specializată în proiectarea și execuția instalațiilor electrice pentru construcții civile, industriale și infrastructură: rețele de joasă și medie tensiune, iluminat public, paratrăsnete, branșamente aeriene și subterane, posturi de transformare. Cifra de afaceri: 1,35M RON (2024), 7 angajați.',
    specializations: ['hale-industriale', 'cladiri-birouri'],
    verified: true,
    updatedAt: '2026-04-22',
  },
  'electrotimeia': {
    contact: {
      phone: '+40741104586',
      email: 'electrotimeia@yahoo.com',
      website: 'https://electrotimeia.ro/',
    },
    description:
      'Firmă din Sebeș (județul Alba) înființată în 2005, atestată ANRE cu certificare C2A. Execută lucrări de instalații electrice și branșamente la rețeaua de distribuție. Cifra de afaceri: 7,48M RON (2024), 18 angajați.',
    specializations: ['hale-industriale'],
    verified: true,
    updatedAt: '2026-04-22',
  },
  'tobimar-group': {
    contact: {
      phone: '+40258818191',
      email: 'office@tobimar.ro',
      website: 'https://www.tobimar.ro/',
    },
    description:
      'Firmă din Vințu de Jos (județul Alba) înființată în 2007, atestată ANRE cu certificare C2A. Distribuitor național de materiale electrice, corpuri de iluminat (arhitectural, industrial, stradal), panouri fotovoltaice, stații de încărcare EV și soluții smart building. Fabrică de tablouri electrice în Parcul Industrial Drâmbar. Cifra de afaceri: 20,55M RON (2024), 17 angajați.',
    specializations: ['hale-industriale', 'cladiri-birouri', 'retail'],
    verified: true,
    updatedAt: '2026-04-22',
  },
};

let count = 0;
for (const [slug, patch] of Object.entries(updates)) {
  const c = d.companies.find((x) => x.slug === slug);
  if (!c) {
    console.warn(`  ! missing slug: ${slug}`);
    continue;
  }
  Object.assign(c, patch);
  count++;
  console.log(`  ✓ ${slug} — site ${patch.contact.website}`);
}

fs.writeFileSync(dataPath, JSON.stringify(d, null, 2) + '\n');
console.log(`\nUpdated ${count} firms. Re-run download-logos + validate.`);
