// Sends a plain-text report email via Resend (same provider as the site).
// Subject = argv[2]; body = stdin (plain text, rendered as <pre>).
// Recipient defaults to radu.cimpian94@gmail.com (override with NOTIFY_EMAIL).
// Reads RESEND_API_KEY / RESEND_FROM from .env.local. Exit codes:
//   0 = sent, 1 = Resend API error, 2 = RESEND_API_KEY missing (caller should fall back).
//
// Usage: echo "raport..." | node scripts/notify-email.mjs "Subiect email"

import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '');

const key = get('RESEND_API_KEY') || process.env.RESEND_API_KEY;
const to = process.env.NOTIFY_EMAIL || 'radu.cimpian94@gmail.com';
const from = get('RESEND_FROM') || process.env.RESEND_FROM || 'Instalatori Fotovoltaice <onboarding@resend.dev>';
const subject = process.argv[2] || 'Raport rutină formulare';

let body = '';
for await (const chunk of process.stdin) body += chunk;
body = body.trim() || '(fără conținut)';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const html = `<div style="font-family:system-ui,sans-serif"><pre style="font-family:ui-monospace,SFMono-Regular,monospace;font-size:13px;line-height:1.5;white-space:pre-wrap;word-break:break-word">${esc(body)}</pre></div>`;

if (!key) {
  console.error('RESEND_API_KEY missing — email NOT sent. Add it to .env.local.');
  process.exit(2);
}

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ from, to: [to], subject, html }),
});

if (!res.ok) {
  console.error(`Resend ${res.status}: ${await res.text().catch(() => '')}`);
  process.exit(1);
}
console.log(`Email trimis către ${to}: "${subject}"`);
