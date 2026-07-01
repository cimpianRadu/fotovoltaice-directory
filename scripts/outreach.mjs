// Local outreach routine. Reads the "Leads" and "Listări" tabs from the Google
// Sheet and emails the current backlog via Resend:
//   - each new lead: forward to up to 5 rotated firms (B), confirm to client (A)
//   - each new listing already live in companies.json + PV-verified: confirm (D)
// Idempotent via the "Email trimis" marker column (Leads col O, Listări col Q).
//
// SAFETY: dry-run by DEFAULT. It only sends when called with `--send`.
//   node scripts/outreach.mjs            # preview, no emails, no writes
//   node scripts/outreach.mjs --send     # actually send + mark rows
//
// Copy style: no em dashes. Runs on the laptop with .env.local, like the rest
// of the pipeline. No Vercel, no public endpoint.

import { readFileSync } from 'node:fs';
import { google } from 'googleapis';

// ── env + config ───────────────────────────────────────────────────────────
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const SEND = process.argv.includes('--send');
// Marks every currently-unprocessed row as done WITHOUT sending. Run this once
// after go-live so the backlog you already handled by hand is not re-emailed.
const BASELINE = process.argv.includes('--baseline');
const MAX_EMAILS = Number(process.env.OUTREACH_MAX_EMAILS) || 30;
const FIRMS_PER_LEAD = 5;

const SITE = 'https://instalatori-fotovoltaice.ro';
const REPLY_TO = 'contact@instalatori-fotovoltaice.ro';
const FROM = process.env.RESEND_FROM || 'Instalatori Fotovoltaice <onboarding@resend.dev>';
const LOGO_URL = `${SITE}/logo.png`;
const PHONE_DISPLAY = '0751 547 174';
const PHONE_TEL = '+40751547174';
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

// Reach stats for the listing email (D). From Umami/GSC, confirm before campaigns.
const STATS = { vizite: '~2.470', vizualizari: '~4.700', googlePct: '73%', aiVizite: '~65', firme: 179, judete: 34 };

const LEAD_EMAILED_COL = 'O', LEAD_EMAILED_IDX = 14;
const LISTING_EMAILED_COL = 'Q', LISTING_EMAILED_IDX = 16;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const companies = JSON.parse(readFileSync(new URL('../data/companies.json', import.meta.url), 'utf8')).companies;

// ── email templates (branded shell shared by all) ──────────────────────────
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function wrap(bodyHtml) {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;margin:0;padding:24px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a5f"><tr><td style="padding:16px 24px">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td valign="middle" style="padding-right:12px"><div style="width:44px;height:44px;background:#fff;border-radius:8px;text-align:center;line-height:44px"><img src="${LOGO_URL}" width="32" height="32" alt="Instalatori Fotovoltaice" style="vertical-align:middle"></div></td>
      <td valign="middle"><div style="color:#fff;font-size:16px;font-weight:600;line-height:1.2">Instalatori Fotovoltaice</div><div style="color:#f59e0b;font-size:12px;line-height:1.4">Firme de panouri fotovoltaice din România</div></td>
    </tr></table>
  </td></tr></table>
  <div style="height:3px;background:#f59e0b"></div>
  <div style="padding:22px 24px;font-size:14px;color:#374151;line-height:1.7">${bodyHtml}
    <p style="margin:16px 0 0;color:#6b7280;font-size:13px">Pentru orice întrebare, dați reply la acest email sau ne contactați la <a href="mailto:${REPLY_TO}" style="color:#1e3a5f">${REPLY_TO}</a> ori la telefon <a href="tel:${PHONE_TEL}" style="color:#1e3a5f">${PHONE_DISPLAY}</a>.</p>
  </div>
  <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.6">
    <div style="color:#1e3a5f;font-weight:600;font-size:13px;margin-bottom:2px">Instalatori Fotovoltaice România</div>
    <a href="${SITE}" style="color:#1e3a5f">instalatori-fotovoltaice.ro</a><br>
    <a href="mailto:${REPLY_TO}" style="color:#1e3a5f">${REPLY_TO}</a> · tel. <a href="tel:${PHONE_TEL}" style="color:#1e3a5f">${PHONE_DISPLAY}</a>
  </div>
</div></body></html>`;
}

// Map the form's raw project-type value to a human phrase; "altele" (other)
// carries no info, so it collapses to a plain "sistem fotovoltaic".
const PROJECT_LABELS = {
  'hala-industriala': 'hală industrială', 'cladire-birouri': 'clădire de birouri',
  'parc-logistic': 'parc logistic', 'agricol': 'proiect agricol', 'retail': 'spațiu retail',
  'hotel': 'hotel / pensiune', 'institutie': 'instituție publică',
  'casa-individuala': 'casă individuală', 'vila': 'vilă', 'casa-vacanta': 'casă de vacanță',
  'apartament': 'apartament / bloc',
};
function projectPhrase(tip) {
  const l = PROJECT_LABELS[tip];
  return l ? `sistem fotovoltaic pentru ${l}` : 'sistem fotovoltaic';
}

function describeLead(lead) {
  const base = projectPhrase(lead.tipProiect);
  const power = lead.putere ? `, ${lead.putere} kW` : '';
  return `${base}${power}${lead.judet ? `, județ ${lead.judet}` : ''}`;
}

function leadClientEmail(lead) {
  const nume = lead.numeContact ? `, ${esc(lead.numeContact)}` : '';
  return {
    subject: `Am primit cererea ta de ofertă${lead.judet ? ` (${esc(lead.judet)})` : ''}`,
    html: wrap(`<p>Bună ziua${nume},</p>
<p>Vă mulțumim pentru cererea trimisă prin instalatori-fotovoltaice.ro. Am înregistrat solicitarea: <strong>${esc(describeLead(lead))}</strong>.</p>
<p>Am transmis cererea către câțiva instalatori atestați ANRE din zona dvs. Cei interesați vă vor contacta în curând cu oferte.</p>
<p>Zi bună,</p>`),
  };
}

function leadFirmEmail(lead) {
  const tip = lead.segment === 'rezidential' ? 'client rezidențial (casă)' : 'client comercial (firmă)';
  const extra = lead.mesaj ? `<p style="color:#6b7280">Detalii de la client: „${esc(lead.mesaj)}"</p>` : '';
  return {
    subject: `Cerere de ofertă potrivită${lead.judet ? ` (${esc(lead.judet)})` : ''}`,
    html: wrap(`<p>Bună ziua,</p>
<p>Am primit prin platforma instalatori-fotovoltaice.ro o cerere care se potrivește cu tipul de lucrări pe care le faceți:</p>
<ul style="padding-left:18px"><li><strong>Lucrare:</strong> ${esc(describeLead(lead))}</li><li><strong>Tip client:</strong> ${esc(tip)}</li></ul>
${extra}
<p>Dacă vă interesează, <strong>răspundeți la acest email</strong> și vă punem în legătură directă cu clientul pentru ofertă.</p>
<p>Zi bună,</p>`),
  };
}

function listingConfirmEmail(listing, slug) {
  const nume = listing.numeContact ? `, ${esc(listing.numeContact)}` : '';
  return {
    subject: `${esc(listing.numeFirma)} este pe instalatori-fotovoltaice.ro`,
    html: wrap(`<p>Bună ziua${nume},</p>
<p>Vă confirmăm că <strong>${esc(listing.numeFirma)}</strong> este listată pe instalatori-fotovoltaice.ro. Profilul este public și gratuit:<br>
<a href="${SITE}/firme/${slug}" style="color:#2563eb">instalatori-fotovoltaice.ro/firme/${slug}</a></p>
<p>Câteva cifre despre unde ajunge profilul:</p>
<ul style="padding-left:18px">
  <li><strong>${STATS.vizite} vizite, ${STATS.vizualizari} vizualizări</strong> luna aceasta</li>
  <li><strong>${STATS.googlePct} vin din căutări Google</strong>, oameni care caută activ instalatori</li>
  <li>Suntem citați de asistenți AI (ChatGPT, Claude, Gemini), ~${STATS.aiVizite} vizite luna aceasta</li>
  <li>${STATS.firme} firme, ${STATS.judete} județe acoperite</li>
</ul>
<p>Dacă vreți vizibilitate mai mare, avem trei opțiuni:</p>
<p style="margin:6px 0"><strong>1. Premium</strong> (79 €/lună): prezență premium pe toată platforma, plus profil complet.<br>
<strong>2. Slot în bannerul promo</strong> (19 €/lună): în colțul din dreapta-jos, pe toate paginile.<br>
<strong>3. Studiu de caz</strong> (preț la cerere): scriem împreună un articol despre un proiect de-al vostru, publicat pe site.</p>
<p>Lucrăm și la o funcție prin care firmele primesc direct cererile de ofertă din zona lor.</p>
<p>Zi bună,</p>`),
  };
}

// ── firm matching (coverage + segment + email, fair rotation) ──────────────
function normCounty(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}
function segmentFits(firmSeg, leadSeg) {
  const seg = firmSeg || 'comercial';
  if (seg === 'ambele') return true;
  return leadSeg === 'rezidential' ? seg === 'rezidential' : seg === 'comercial';
}
function pickFirms(judet, leadSeg, lastContacted, limit = FIRMS_PER_LEAD) {
  const target = normCounty(judet);
  if (!target) return [];
  const cands = companies.filter((c) => {
    if (!c.contact?.email) return false;
    if (!segmentFits(c.segment, leadSeg)) return false;
    return (c.coverage || []).some((cov) => normCounty(cov) === target) ||
      (c.location?.county ? normCounty(c.location.county) === target : false);
  });
  cands.sort((a, b) => (lastContacted.get(a.id) || 0) - (lastContacted.get(b.id) || 0));
  return cands.slice(0, limit).map((c) => ({ id: c.id, name: c.name, email: c.contact.email }));
}
function normCui(s) { return String(s || '').toUpperCase().replace(/[^0-9]/g, ''); }

// ── Google Sheets ──────────────────────────────────────────────────────────
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

async function readRows(tab) {
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${tab}!A:Z` });
  return res.data.values || [];
}
async function markCell(tab, cell, value) {
  await sheets.spreadsheets.values.update({ spreadsheetId: SPREADSHEET_ID, range: `${tab}!${cell}`, valueInputOption: 'RAW', requestBody: { values: [[value]] } });
}
async function ensureLogTab() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  if (!(meta.data.sheets || []).some((s) => s.properties?.title === 'LogOutreach')) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId: SPREADSHEET_ID, requestBody: { requests: [{ addSheet: { properties: { title: 'LogOutreach' } } }] } });
  }
}
async function appendLog(entries) {
  if (!entries.length) return;
  await ensureLogTab();
  const now = new Date().toISOString();
  await sheets.spreadsheets.values.append({ spreadsheetId: SPREADSHEET_ID, range: 'LogOutreach!A:A', valueInputOption: 'RAW', requestBody: { values: entries.map((e) => [now, String(e.leadRow), e.firmId, e.firmEmail]) } });
}
async function firmLastContacted() {
  const map = new Map();
  let rows = [];
  try { rows = await readRows('LogOutreach'); } catch { return map; }
  for (const r of rows) {
    const t = Date.parse(r[0] || ''); const id = r[2] || '';
    if (id && Number.isFinite(t)) map.set(id, Math.max(map.get(id) || 0, t));
  }
  return map;
}
const isDateRow = (r) => Number.isFinite(Date.parse(r[0] || ''));

async function getUnprocessedLeads() {
  const rows = await readRows('Leads');
  const out = [];
  rows.forEach((r, i) => {
    if (!isDateRow(r) || (r[LEAD_EMAILED_IDX] || '').trim()) return;
    out.push({ row: i + 1, lead: { timestamp: r[0], numeCompanie: r[1] || '', numeContact: r[2] || '', email: r[3] || '', telefon: r[4] || '', tipProiect: r[5] || '', judet: r[6] || '', suprafata: r[7] || '', putere: r[8] || '', mesaj: r[9] || '', segment: r[13] || 'comercial' } });
  });
  return out;
}
async function getUnprocessedListings() {
  const rows = await readRows('Listări');
  const out = [];
  rows.forEach((r, i) => {
    if (!isDateRow(r) || (r[LISTING_EMAILED_IDX] || '').trim()) return;
    out.push({ row: i + 1, listing: { timestamp: r[0], numeFirma: r[1] || '', cui: r[2] || '', numeContact: r[3] || '', email: r[5] || '', judet: r[7] || '', anreStatus: r[12] || '', segment: r[15] || 'comercial' } });
  });
  return out;
}

// ── send ───────────────────────────────────────────────────────────────────
async function send(to, subject, html) {
  if (!SEND) { console.log(`   [dry] ar trimite → ${to}  „${subject}"`); return true; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, reply_to: REPLY_TO }),
  });
  if (res.ok) { console.log(`   ✓ trimis → ${to}  „${subject}"`); return true; }
  console.log(`   ✗ EȘEC → ${to}  [${res.status}] ${(await res.text()).slice(0, 140)}`); return false;
}

// ── main ─────────────────────────────────────────────────────────────────
async function main() {
  if (!process.env.RESEND_API_KEY) { console.error('RESEND_API_KEY lipsește din .env.local'); process.exit(2); }
  console.log(SEND ? '=== OUTREACH — MOD TRIMITERE ===\n' : '=== OUTREACH — DRY RUN (fără trimitere; adaugă --send ca să trimită) ===\n');

  const publishedByCui = new Map();
  for (const c of companies) if (c.cui) publishedByCui.set(normCui(c.cui), c.slug);

  const [leads, listings, lastContacted] = await Promise.all([getUnprocessedLeads(), getUnprocessedListings(), firmLastContacted()]);
  console.log(`Neprocesate: ${leads.length} leaduri, ${listings.length} listări. Cap: ${MAX_EMAILS} emailuri/rulare.\n`);

  if (BASELINE) {
    const stamp = `baseline ${new Date().toISOString()}`;
    for (const { row } of leads) await markCell('Leads', `${LEAD_EMAILED_COL}${row}`, stamp);
    for (const { row } of listings) await markCell('Listări', `${LISTING_EMAILED_COL}${row}`, stamp);
    console.log(`Baseline: marcat ${leads.length} leaduri + ${listings.length} listări ca procesate.`);
    console.log('De acum rutina tratează doar submisiile NOI. Nimic nu se retrimite.');
    return;
  }

  let sent = 0;
  const stats = { leadsA: 0, leadsB: 0, listingsD: 0, noFirms: 0, skipped: 0, failed: 0 };

  for (const { row, lead } of leads) {
    if (sent >= MAX_EMAILS) { console.log('(cap atins, mă opresc)'); break; }
    if (!lead.email) { stats.skipped++; continue; }
    const firms = pickFirms(lead.judet, lead.segment, lastContacted);
    if (!firms.length) { stats.noFirms++; console.log(`LEAD rând ${row} (${lead.judet}/${lead.segment}): 0 firme potrivite → LAS pentru manual`); continue; }

    console.log(`LEAD rând ${row} (${lead.judet}/${lead.segment}) → ${firms.length} firme: ${firms.map((f) => f.id).join(', ')}`);
    const firmMsg = leadFirmEmail(lead);
    const contacted = [];
    for (const f of firms) {
      const ok = await send(f.email, firmMsg.subject, firmMsg.html);
      if (ok) { sent++; stats.leadsB++; contacted.push({ leadRow: row, firmId: f.id, firmEmail: f.email }); lastContacted.set(f.id, Date.now()); } else { stats.failed++; }
      if (SEND) await sleep(500);
    }
    const clientMsg = leadClientEmail(lead);
    const ok = await send(lead.email, clientMsg.subject, clientMsg.html);
    if (ok) { sent++; stats.leadsA++; } else { stats.failed++; }
    if (SEND) { if (contacted.length) await appendLog(contacted); await markCell('Leads', `${LEAD_EMAILED_COL}${row}`, new Date().toISOString()); await sleep(500); }
  }

  for (const { row, listing } of listings) {
    if (sent >= MAX_EMAILS) { console.log('(cap atins, mă opresc)'); break; }
    const slug = publishedByCui.get(normCui(listing.cui));
    if (!slug || listing.anreStatus !== 'verified-pv' || !listing.email) {
      stats.skipped++;
      console.log(`LISTARE rând ${row} (${listing.numeFirma}): ${!slug ? 'nepublicată în companies.json' : listing.anreStatus !== 'verified-pv' ? 'nu e verified-pv' : 'fără email'} → skip`);
      continue;
    }
    console.log(`LISTARE rând ${row} (${listing.numeFirma}) → confirmare D`);
    const msg = listingConfirmEmail(listing, slug);
    const ok = await send(listing.email, msg.subject, msg.html);
    if (ok) { sent++; stats.listingsD++; if (SEND) await markCell('Listări', `${LISTING_EMAILED_COL}${row}`, new Date().toISOString()); } else { stats.failed++; }
    if (SEND) await sleep(500);
  }

  console.log(`\n=== ${SEND ? 'TRIMIS' : 'DRY RUN'}: ${sent} emailuri ===`);
  console.log(JSON.stringify(stats));
  if (!SEND) console.log('\nCa să trimiți efectiv: node scripts/outreach.mjs --send');
}

main().catch((e) => { console.error('EROARE:', e.message); process.exit(1); });
