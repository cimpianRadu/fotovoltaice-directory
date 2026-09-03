#!/usr/bin/env node
import { existsSync, readFileSync, statSync, unlinkSync } from 'fs';
import sharp from 'sharp';

const slug = process.argv[2];
const prompt = process.argv[3];
if (!slug || !prompt) {
  console.error('Usage: node gen-hero-image.mjs <slug> "<prompt>"');
  process.exit(1);
}

const mcp = JSON.parse(readFileSync('.mcp.json', 'utf8'));
const KEY = mcp.mcpServers['nano-banana-2'].env.GEMINI_API_KEY;
const MODEL = mcp.mcpServers['nano-banana-2'].env.NANOBANANA_MODEL || 'gemini-2.5-flash-image';

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
const body = {
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    responseModalities: ['IMAGE'],
    imageConfig: { aspectRatio: '16:9' },
  },
};

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error('HTTP', res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
const parts = data?.candidates?.[0]?.content?.parts || [];
const imgPart = parts.find((p) => p.inlineData?.data);
if (!imgPart) {
  console.error('No image in response:', JSON.stringify(data, null, 2).slice(0, 800));
  process.exit(1);
}

/**
 * nano-banana întoarce PNG de 2752x1536, în jur de 3 MB. Scris așa pe disc,
 * fiecare hero costă megabytes de Fast Origin Transfer pe Vercel: optimizatorul
 * `/_next/image` aduce sursa întreagă de la origine la fiecare variantă
 * generată. 56 de hero-uri au epuizat cei 10 GB din planul gratuit.
 *
 * Deci reîncodăm înainte de scriere. JPEG, nu WebP, pentru că același fișier
 * alimentează și `og:image`, iar preview-urile de linkuri (Facebook) nu tratează
 * WebP consecvent. Vizitatorul primește oricum AVIF/WebP, transcodat la edge.
 *
 * Aceleași valori ca în scripts/optimize-hero-images.mjs. Dacă le schimbi
 * acolo, schimbă-le și aici.
 */
const LATIME = 2000;
const CALITATE = 82;

const buf = Buffer.from(imgPart.inlineData.data, 'base64');
const out = `public/images/guides/${slug}.jpg`;

await sharp(buf)
  .resize({ width: LATIME, withoutEnlargement: true })
  .jpeg({ quality: CALITATE, mozjpeg: true })
  .toFile(out);

// `getHeroImage()` caută în ordinea webp, png, jpg. O rămășiță de la o
// generare anterioară ar fi servită în locul imaginii noi, în tăcere.
for (const ext of ['png', 'webp']) {
  const vechi = `public/images/guides/${slug}.${ext}`;
  if (existsSync(vechi)) {
    unlinkSync(vechi);
    console.log(`Removed stale ${vechi}`);
  }
}

console.log(
  `Wrote ${out} (${(statSync(out).size / 1024).toFixed(0)} KB, from ${(buf.length / 1048576).toFixed(2)} MB raw)`
);
