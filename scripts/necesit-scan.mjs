#!/usr/bin/env node
/**
 * Scanează necesit.ro pe un județ și scoate firmele de fotovoltaice listate acolo.
 *
 * De ce există: necesit.ro e concurentul care ne bate la trafic, dar lista lui de
 * firme e publică. O firmă de acolo e fie un cumpărător dovedit de lead-uri
 * (are „Oferte trimise" + timp de răspuns), fie o firmă listată ca momeală SEO
 * sub care scrie „Nu colaborăm cu această companie" — adică apare în „Top 20
 * firme pentru panouri fotovoltaice <oraș>", dar cererile de pe pagina ei se duc
 * la concurenți. Ambele sunt liste de apeluri, cu pitch-uri diferite.
 *
 * Firmele care sunt deja în directorul nostru sunt marcate [ÎN DIRECTOR], ca să
 * se poată vedea dacă prezența pe necesit se corelează cu activitatea la noi.
 *
 * Usage:
 *   node scripts/necesit-scan.mjs Cluj
 *   node scripts/necesit-scan.mjs Dolj --json /tmp/dolj.json
 *   node scripts/necesit-scan.mjs "Bistrița-Năsăud" --all      # și non-PV
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// Orașele pe care necesit.ro le are ca pagini de listă, mapate la județ.
// Nu toate combinațiile oraș × serviciu există; cele lipsă dau 404 și se ignoră.
const CITIES = {
  'alba-iulia': 'Alba', alexandria: 'Teleorman', arad: 'Arad', bacau: 'Bacău',
  'baia-mare': 'Maramureș', barlad: 'Vaslui', bistrita: 'Bistrița-Năsăud',
  botosani: 'Botoșani', braila: 'Brăila', brasov: 'Brașov', bucuresti: 'București',
  buzau: 'Buzău', calarasi: 'Călărași', campina: 'Prahova', cluj: 'Cluj',
  constanta: 'Constanța', craiova: 'Dolj', dej: 'Cluj', deva: 'Hunedoara',
  'drobeta-turnu-severin': 'Mehedinți', focsani: 'Vrancea', galati: 'Galați',
  hunedoara: 'Hunedoara', iasi: 'Iași', lugoj: 'Timiș', medgidia: 'Constanța',
  medias: 'Sibiu', 'miercurea-ciuc': 'Harghita', navodari: 'Constanța',
  'odorheiu-secuiesc': 'Harghita', onesti: 'Bacău', oradea: 'Bihor',
  pascani: 'Iași', petrosani: 'Hunedoara', 'piatra-neamt': 'Neamț',
  pitesti: 'Argeș', ploiesti: 'Prahova', 'ramnicu-sarat': 'Buzău',
  'ramnicu-valcea': 'Vâlcea', reghin: 'Mureș', resita: 'Caraș-Severin',
  roman: 'Neamț', 'satu-mare': 'Satu Mare', 'sfantu-gheorghe': 'Covasna',
  sibiu: 'Sibiu', slatina: 'Olt', slobozia: 'Ialomița', suceava: 'Suceava',
  tecuci: 'Galați', timisoara: 'Timiș', tulcea: 'Tulcea', turda: 'Cluj',
  targoviste: 'Dâmbovița', 'targu-jiu': 'Gorj', 'targu-mures': 'Mureș',
  vaslui: 'Vaslui', voluntari: 'Ilfov', zalau: 'Sălaj',
};
const SERVICES = ['panouri-fotovoltaice', 'panouri-solare'];

// Clusterul solar: o firmă care oferă DOAR astea e PV pură, restul sunt generaliști
// (electricieni, termopane, uși de garaj) care fac fotovoltaice pe lângă.
const SOLAR = new Set([
  'panouri solare', 'panouri fotovoltaice', 'montaj panouri solare',
  'panou solar presurizat', 'panouri solare fotovoltaice',
]);

const strip = (s) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[țţ]/gi, 't')
    .replace(/[șş]/gi, 's').toLowerCase();
const norm = (s) =>
  strip(s).replace(/\b(s\.?c\.?|s\.?r\.?l\.?|s\.?a\.?|p\.?f\.?a\.?|srl|sa|pfa|ii|inc)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
const txt = (s) =>
  (s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;?/g, ' ').replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

/** „cu 3 luni în urmă" / „3 ani în urmă" → vechime în luni (pentru recență) */
function ageMonths(s) {
  const t = strip(s);
  const n = parseInt(t.match(/\d+/)?.[0] || (/\bo\b|\bun\b/.test(t) ? '1' : '0'), 10);
  if (/an/.test(t)) return n * 12;
  if (/lun/.test(t)) return n;
  if (/saptam|zi/.test(t)) return 0;
  return null;
}

async function get(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'ro-RO,ro' } });
  if (!r.ok) return null;
  return r.text();
}

/** Localitatea reală a firmei, din JSON-LD (listarea o pune la orașul-umbrelă). */
function localities(html) {
  const map = new Map();
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const b = m[1];
    const url = b.match(/"url"\s*:\s*"[^"]*\/providers\/([a-z0-9-]+)"/);
    const loc = b.match(/"addressLocality"\s*:\s*"([^"]*)"/);
    if (url && loc && loc[1] !== 'None') map.set(url[1], loc[1]);
  }
  return map;
}

function parseCards(html, city) {
  const locs = localities(html);
  const out = [];
  for (const chunk of html.split('<div class="card">').slice(1)) {
    if (!chunk.includes('provider__heading')) continue;
    const head = chunk.match(/<h2 class="provider__name"><a href="\/providers\/([a-z0-9-]+)">([\s\S]*?)<\/a>/);
    if (!head) continue;
    const [, slug, rawName] = head;

    const f = {};
    for (const m of chunk.matchAll(
      /<div class="feature">\s*<div class="feature__visual">([\s\S]*?)<\/div>\s*<div class="feature__content">([\s\S]*?)<\/div>/g,
    )) {
      f[txt(m[2])] = txt(m[1]);
    }

    const reviewAges = [...chunk.matchAll(/<\/strong>,\s*([^<]+?)\s*<\/div>/g)]
      .map((m) => ageMonths(m[1]))
      .filter((n) => n !== null);

    const services = txt(chunk.match(/<strong>Servicii:<\/strong>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/)?.[1] || '')
      .replace(/\.$/, '')
      .split(',').map((s) => s.trim()).filter(Boolean);

    out.push({
      slug,
      name: txt(rawName),
      city,
      locality: locs.get(slug) || '',
      partner: !('Nu colaborăm cu această companie' in f),
      verified: 'Profesionist verificat' in f,
      award: Object.keys(f).find((k) => /Selecția clienților/.test(k)) || '',
      offers: f['Oferte trimise'] || '',
      years: f['Ani pe piață'] || '',
      employees: f['Număr angajați'] || '',
      responds: txt(chunk.match(/Răspunde în\s*<span[^>]*>([^<]+)<\/span>/)?.[1] || ''),
      rating: txt(chunk.match(/<div class="provider__rating">[\s\S]*?<div class="value">([\s\S]*?)<\/div>/)?.[1] || ''),
      reviews: Number(chunk.match(/<div class="total">\s*(\d+)\s*recenzi/)?.[1] || 0),
      lastReviewMonths: reviewAges.length ? Math.min(...reviewAges) : null,
      googleSourced: chunk.includes('google-icon.svg'),
      services,
      nonSolar: services.filter((s) => !SOLAR.has(strip(s).replace(/\s+/g, ' '))).length,
      url: `https://www.necesit.ro/providers/${slug}`,
    });
  }
  return out;
}

// ---- enrichment ----
// necesit.ro nu publică telefoane (ăsta e modelul lor de business), așa că le
// recuperăm din registrul ANRE, restrâns la județ. Potrivim doar exact sau pe
// TOATE tokenurile distinctive: potrivirea parțială dădea fals pozitive
// („Smart Project Arad" → „DANI & DAVID PROJECT", doar pe cuvântul „project"),
// iar un număr greșit într-o listă de apeluri e mai rău decât niciun număr.
const GENERIC = new Set([
  'panouri', 'solare', 'solar', 'fotovoltaice', 'fotovoltaic', 'energy', 'energie',
  'group', 'grup', 'company', 'romania', 'instal', 'proiect', 'project', 'sisteme',
  'system', 'systems', 'construct', 'tech', 'power', 'electric', 'service', 'servicii',
]);
const tokens = (s) => norm(s).split(' ').filter((t) => t.length > 3 && !GENERIC.has(t));

function loadAnre() {
  const raw = JSON.parse(readFileSync(path.join(ROOT, 'data/anre-atestate.json'), 'utf8'));
  const list = Array.isArray(raw) ? raw : Object.values(raw)[0];
  const byCounty = new Map();
  for (const e of list) {
    const k = strip(e.judet);
    if (!byCounty.has(k)) byCounty.set(k, []);
    byCounty.get(k).push(e);
  }
  return byCounty;
}

function loadAfm() {
  try {
    const raw = JSON.parse(readFileSync(path.join(ROOT, 'data/casa-verde-installers.json'), 'utf8'));
    const list = Array.isArray(raw) ? raw : Object.values(raw)[0];
    return new Set(list.map((e) => norm(e.name)));
  } catch {
    return new Set();
  }
}

/** Primul număr utilizabil dintr-un câmp ANRE („0722 348102,0257218282 0257 218282"). */
function firstPhone(raw) {
  // Câmpul ANRE e liber: „0722 348102,0257218282 0257 218282". Spargem pe
  // separatori, nu pe spații — altfel „0722 348102" se rupe în două și rămâne
  // fixul în locul mobilului.
  for (const chunk of (raw || '').split(/[,;/]+/)) {
    const d = chunk.replace(/\D/g, '');
    if (d.length >= 10) return d.slice(0, 10);
  }
  return '';
}

function enrich(firm, anreByCounty, afm) {
  const pool = anreByCounty.get(strip(firm.county)) || [];
  const nn = norm(firm.name);
  let hit = pool.find((e) => norm(e.societate) === nn);
  let how = hit ? 'exact' : '';
  if (!hit) {
    const tk = tokens(firm.name);
    if (tk.length) {
      hit = pool.find((e) => { const en = norm(e.societate); return tk.every((t) => en.includes(t)); });
      how = hit ? 'token' : '';
    }
  }
  return {
    ...firm,
    phone: hit ? firstPhone(hit.telefon) : '',
    anreName: hit ? hit.societate : '',
    anreMatch: how,
    anreActive: hit ? (hit.certificates || []).some((c) => c.stare === 'Atestat') : false,
    afm: afm.has(nn),
  };
}

// ---- scan ----
async function scanCounty(judet, anreByCounty, afm) {
  const cities = Object.entries(CITIES).filter(([, j]) => strip(j) === strip(judet)).map(([c]) => c);
  const bySlug = new Map();
  for (const city of cities) {
    for (const svc of SERVICES) {
      const html = await get(`https://www.necesit.ro/${svc}/${city}`);
      if (!html) continue;
      for (const p of parseCards(html, city)) {
        const prev = bySlug.get(p.slug);
        // paginile diferă între servicii — păstrăm varianta cu cele mai multe semnale
        if (!prev || (p.offers ? 1 : 0) + (p.responds ? 1 : 0) > (prev.offers ? 1 : 0) + (prev.responds ? 1 : 0)) {
          bySlug.set(p.slug, { ...prev, ...p, cities: [...new Set([...(prev?.cities || []), city])] });
        } else {
          prev.cities = [...new Set([...prev.cities, city])];
        }
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  // aceeași firmă poate avea mai multe profiluri (fișa ei + unul importat din Google)
  const score = (p) => (p.offers ? 2 : 0) + (p.responds ? 2 : 0) + (p.verified ? 1 : 0) +
    (p.partner ? 1 : 0) + (p.reviews ? 1 : 0) + (p.locality ? 1 : 0);
  const merged = new Map();
  for (const p of bySlug.values()) {
    const k = norm(p.name);
    const prev = merged.get(k);
    if (!prev) { merged.set(k, { ...p, dupes: [] }); continue; }
    const [keep, drop] = score(p) > score(prev) ? [p, prev] : [prev, p];
    merged.set(k, { ...keep, dupes: [...(prev.dupes || []), ...(p.dupes || []), drop.url] });
  }

  return [...merged.values()]
    .map((p) => ({ ...p, county: judet, pvOnly: p.nonSolar === 0 }))
    .map((p) => enrich(p, anreByCounty, afm));
}

// ---- main ----
const args = process.argv.slice(2);
const BUILD = args.includes('--build');
const ALL = args.includes('--all');
const jsonOut = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;
const judet = args.find((a) => !a.startsWith('--') && a !== jsonOut);
const COUNTIES = [...new Set(Object.values(CITIES))].sort();
const anreByCounty = loadAnre();
const afm = loadAfm();
const isSolar = (p) => p.services.some((x) => SOLAR.has(strip(x).replace(/\s+/g, ' ')));

if (BUILD) {
  // Setul național folosit de /admin/crm pentru potrivirile de pe necesit.
  const firms = [];
  for (const j of COUNTIES) {
    const rows = (await scanCounty(j, anreByCounty, afm)).filter(isSolar);
    firms.push(...rows);
    console.log(`${j.padEnd(18)} ${String(rows.length).padStart(3)} firme · ${rows.filter((r) => r.phone).length} cu telefon · ${rows.filter((r) => r.afm).length} AFM`);
  }
  const out = path.join(ROOT, 'data/necesit-firms.json');
  writeFileSync(out, JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'necesit.ro',
    counties: COUNTIES,
    firms,
  }, null, 2));
  console.log(`\n${firms.length} firme · ${firms.filter((f) => f.phone).length} cu telefon (${Math.round(100 * firms.filter((f) => f.phone).length / firms.length)}%) · ${firms.filter((f) => f.afm).length} validate AFM · ${firms.filter((f) => f.partner && (f.offers || f.responds)).length} parteneri activi`);
  console.log(`→ ${out}`);
  process.exit(0);
}

if (!judet) {
  console.error('Usage: node scripts/necesit-scan.mjs <Județ> [--all] [--json <path>]');
  console.error('       node scripts/necesit-scan.mjs --build   # data/necesit-firms.json, toate județele');
  console.error('Județe:', COUNTIES.join(', '));
  process.exit(1);
}
if (!COUNTIES.some((j) => strip(j) === strip(judet))) {
  console.error(`Necesit.ro nu are pagini de oraș pentru „${judet}".`);
  console.error('Județe acoperite:', COUNTIES.join(', '));
  process.exit(1);
}

let rows = await scanCounty(judet, anreByCounty, afm);
if (!ALL) rows = rows.filter(isSolar);

const companies = JSON.parse(readFileSync(path.join(ROOT, 'data/companies.json'), 'utf8')).companies;
const dir = new Map(companies.map((c) => [norm(c.name), c]));
rows = rows.map((p) => {
  const hit = dir.get(norm(p.name));
  return { ...p, inDirectory: !!hit, directorySlug: hit?.slug || '' };
});

const activity = (p) =>
  (p.offers ? parseInt(p.offers, 10) || 0 : 0) / 100 + (p.responds ? 3 : 0) + (p.verified ? 2 : 0) +
  (p.lastReviewMonths !== null && p.lastReviewMonths <= 12 ? 2 : 0);
const sort = (a, b) => activity(b) - activity(a) || b.reviews - a.reviews;
const partners = rows.filter((p) => p.partner && (p.offers || p.responds || p.verified)).sort(sort);
const bait = rows.filter((p) => !p.partner).sort(sort);
const unclear = rows.filter((p) => p.partner && !(p.offers || p.responds || p.verified)).sort(sort);

const line = (p) => {
  const tags = [
    p.afm && 'AFM Casa Verde (rezidențial)',
    p.pvOnly ? 'PV pur' : `+${p.nonSolar} alte servicii`,
    p.offers && `${p.offers} oferte`,
    p.responds && `răspunde ${p.responds}`,
    p.employees && `${p.employees} ang.`,
    p.years && `${p.years} ani`,
    p.rating && `${p.rating}★ (${p.reviews})`,
    p.lastReviewMonths !== null && `ultima recenzie acum ${p.lastReviewMonths} luni`,
    p.award,
    p.googleSourced && 'profil din Google',
    p.dupes?.length && `${p.dupes.length} profil dublat`,
  ].filter(Boolean);
  const tel = p.phone ? `${p.phone}${p.anreActive ? '' : ' (atestat ANRE inactiv)'}` : 'fără telefon';
  return `  ${p.inDirectory ? '[ÎN DIRECTOR] ' : ''}${p.name}${p.locality ? ` — ${p.locality}` : ''}\n    ${tel}${p.anreName && norm(p.anreName) !== norm(p.name) ? ` · ANRE: ${p.anreName}` : ''}\n    ${tags.join(' · ')}\n    ${p.url}`;
};

console.log(`\n=== necesit.ro · ${judet} ===`);
console.log(`${rows.length} firme cu profil de fotovoltaice · ${rows.filter((r) => r.phone).length} cu telefon recuperat din ANRE\n`);
console.log(`--- A) PARTENERI ACTIVI (${partners.length}) — plătesc pentru cereri, model deja validat`);
partners.forEach((p) => console.log(line(p)));
console.log(`\n--- B) „NU COLABORĂM CU ACEASTĂ COMPANIE" (${bait.length}) — listate ca momeală SEO, cererile lor pleacă la alții`);
bait.forEach((p) => console.log(line(p)));
console.log(`\n--- C) FĂRĂ SEMNAL CLAR (${unclear.length})`);
unclear.forEach((p) => console.log(line(p)));

if (jsonOut) {
  writeFileSync(jsonOut, JSON.stringify({ judet, scannedAt: new Date().toISOString(), rows }, null, 2));
  console.log(`\nJSON → ${jsonOut}`);
}
