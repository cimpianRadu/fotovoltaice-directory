#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

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

const buf = Buffer.from(imgPart.inlineData.data, 'base64');
const out = `public/images/guides/${slug}.png`;
writeFileSync(out, buf);
console.log(`Wrote ${out} (${buf.length} bytes)`);
