/**
 * Casa Verde residential discovery — SEPARATE pipeline from the ANRE one.
 *
 * Source: AFM "instalatori validați Casa Verde Fotovoltaice" list, mirrored
 * with CUI on fotovoltaiceromania.ro (CUI is embedded in each detail URL slug
 * and the JSON-LD ItemList). These are the firms authorized to install
 * RESIDENTIAL rooftop PV under the subsidy program — a different population
 * than the ANRE C2A/C1A commercial installers.
 *
 * Output: data/casa-verde-candidates.json + docs/casa-verde-candidates.md,
 * deduped against companies.json (by CUI) and data/anre-rejected.json.
 *
 * CLI: node scripts/casa-verde-discover.js
 *
 * No API credits used — pure scrape + dedup.
 */
const fs = require('fs');
const path = require('path');

const SOURCE = 'https://fotovoltaiceromania.ro/';
const ROOT = path.join(__dirname, '..');

const normCui = (c) => String(c || '').replace(/\D/g, '');

async function main() {
  const res = await fetch(SOURCE, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`fetch ${SOURCE} → ${res.status}`);
  const html = await res.text();

  // The detail-page slugs carry the CUI: /instalator/<slug>-<cui>. The full
  // list (521) lives in these hrefs; the JSON-LD only embeds a 20-row preview.
  // The display name is the anchor text: ...-<cui>">NAME<img ...
  const titleCase = (slug) =>
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).toUpperCase();
  const decode = (s) =>
    s.replace(/&amp;/g, '&').replace(/&#160;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

  // name map from anchor text (non-empty)
  const names = new Map();
  for (const m of html.matchAll(/instalator\/[a-z0-9-]+-(\d{6,9})">([^<]{2,})</g)) {
    if (!names.has(m[1])) names.set(m[1], decode(m[2]));
  }

  const byCui = new Map();
  for (const m of html.matchAll(/instalator\/([a-z0-9-]+)-(\d{6,9})/g)) {
    const [, slug, cui] = m;
    if (!byCui.has(cui)) {
      byCui.set(cui, {
        name: names.get(cui) || titleCase(slug),
        cui,
        slug,
        sourceUrl: `${SOURCE}instalator/${slug}-${cui}`,
      });
    }
  }

  // Dedup against existing directory + persisted rejections
  const companies = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/companies.json'), 'utf8')).companies;
  const existing = new Set(companies.map((c) => normCui(c.cui)));
  let rejected = new Set();
  try {
    const rej = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/anre-rejected.json'), 'utf8'));
    rejected = new Set((Array.isArray(rej) ? rej : rej.rejected || []).map((r) => normCui(r.cui)));
  } catch {}

  const all = [...byCui.values()];
  const fresh = all.filter((f) => !existing.has(f.cui) && !rejected.has(f.cui));

  // Full list (NOT deduped) — source for the public Casa Verde verification tool.
  // Slimmed to {cui, name} since that's all the verification needs.
  fs.writeFileSync(
    path.join(ROOT, 'data/casa-verde-installers.json'),
    JSON.stringify(all.map((f) => ({ cui: f.cui, name: f.name })), null, 2) + '\n'
  );

  // Fresh candidates (deduped) — for ADDING new firms to the directory.
  fs.writeFileSync(
    path.join(ROOT, 'data/casa-verde-candidates.json'),
    JSON.stringify(fresh, null, 2) + '\n'
  );

  const md = [
    '# Casa Verde — candidați instalatori rezidențiali',
    '',
    `Sursă: AFM Casa Verde Fotovoltaice (mirror cu CUI: fotovoltaiceromania.ro). Generat ${new Date().toISOString().slice(0, 10)}.`,
    '',
    `- Total instalatori în listă: **${all.length}**`,
    `- Deja în director: **${all.length - fresh.length}**`,
    `- Candidați fresh: **${fresh.length}**`,
    '',
    '| # | Firmă | CUI | Sursă |',
    '|---|---|---|---|',
    ...fresh.map((f, i) => `| ${i + 1} | ${f.name} | ${f.cui} | [link](${f.sourceUrl}) |`),
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'docs/casa-verde-candidates.md'), md + '\n');

  console.log(`[casa-verde-discover] ${all.length} instalatori în listă`);
  console.log(`  deja în director: ${all.length - fresh.length}`);
  console.log(`  candidați fresh:  ${fresh.length}`);
  console.log(`  → data/casa-verde-candidates.json + docs/casa-verde-candidates.md`);
}

main().catch((e) => { console.error(e); process.exit(1); });
