import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const data = JSON.parse(readFileSync('data/companies.json', 'utf-8'));
const logosDir = join('public', 'logos');

if (!existsSync(logosDir)) mkdirSync(logosDir, { recursive: true });

const results = { success: [], failed: [] };

async function downloadLogo(company) {
  const slug = company.slug;
  const outPath = join(logosDir, `${slug}.png`);

  // Skip if already exists
  if (existsSync(outPath)) {
    results.success.push({ slug, source: 'existing' });
    return;
  }

  const domain = new URL(company.contact.website).hostname.replace('www.', '');

  // Try Google Favicon API (most reliable, 128px)
  const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  try {
    const res = await fetch(googleUrl, { signal: AbortSignal.timeout(10000) });
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      // Check it's not the default globe icon (very small, ~726 bytes for the default)
      if (buffer.length > 1000) {
        writeFileSync(outPath, buffer);
        results.success.push({ slug, source: 'google-favicon', size: buffer.length });
        return;
      }
    }
  } catch (e) {
    // continue to next method
  }

  // Try Clearbit logo API
  const clearbitUrl = `https://logo.clearbit.com/${domain}`;
  try {
    const res = await fetch(clearbitUrl, {
      signal: AbortSignal.timeout(10000),
      redirect: 'follow'
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('image')) {
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length > 500) {
          writeFileSync(outPath, buffer);
          results.success.push({ slug, source: 'clearbit', size: buffer.length });
          return;
        }
      }
    }
  } catch (e) {
    // continue
  }

  results.failed.push({ slug, name: company.name, website: company.contact.website });
}

// Process in batches of 5
const companies = data.companies;
for (let i = 0; i < companies.length; i += 5) {
  const batch = companies.slice(i, i + 5);
  await Promise.all(batch.map(c => downloadLogo(c)));
  console.log(`Progress: ${Math.min(i + 5, companies.length)}/${companies.length}`);
}

console.log('\n=== RESULTS ===');
console.log(`✓ Downloaded: ${results.success.length}`);
console.log(`✗ Failed: ${results.failed.length}`);

if (results.failed.length > 0) {
  console.log('\nFailed companies (need manual download):');
  results.failed.forEach(f => {
    console.log(`  - ${f.name} (${f.slug}) → ${f.website}`);
  });
}

if (results.success.length > 0) {
  console.log('\nSuccessful downloads:');
  results.success.forEach(s => {
    console.log(`  ✓ ${s.slug} (${s.source}${s.size ? `, ${(s.size/1024).toFixed(1)}KB` : ''})`);
  });
}
