// Health check pentru contul clientului (23 oct 2026): paginile se încarcă, un
// link de intrare greșit nu deschide nimic, ofertele nu ies fără acces, click-urile
// pe cereri ajung în Neon, iar notițele clientului se salvează și se șterg de tot.
// Sigur pe producție: nu trimite emailuri și șterge rândurile pe care le scrie.
//
// Usage: node scripts/e2e-cont.mjs           (testează https://instalatori-fotovoltaice.ro)
//        TARGET_URL=http://localhost:3000 node scripts/e2e-cont.mjs
// Scrie un JSON la final și iese cu 1 dacă pică ceva. Îl rulează și scripts/e2e.mjs.

import { createHmac } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';
import { neon } from '@neondatabase/serverless';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = (process.env.TARGET_URL || 'https://instalatori-fotovoltaice.ro').replace(/\/$/, '');

function envValue(key) {
  if (process.env[key]) return process.env[key];
  const line = readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n').find((l) => l.startsWith(`${key}=`));
  return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, '');
}

const databaseUrl = () => envValue('DATABASE_URL');

const tests = [];
async function check(id, name, fn) {
  const start = Date.now();
  try {
    const error = (await fn()) || null;
    tests.push({ id, name, ms: Date.now() - start, error, pass: !error });
  } catch (err) {
    tests.push({ id, name, ms: Date.now() - start, error: String(err?.message || err), pass: false });
  }
}

await check('cont', 'Pagina „Contul meu” (/cont)', async () => {
  const res = await fetch(`${TARGET}/cont`);
  const body = await res.text();
  if (res.status !== 200) return `HTTP ${res.status}`;
  return body.includes('Contul meu') ? null : 'nu apare „Contul meu”';
});

await check('cerere-fara-acces', 'Cererea fără acces cere intrarea, nu arată date', async () => {
  const res = await fetch(`${TARGET}/cont/cerere/2020-01-01T00:00:00.000Z`);
  const body = await res.text();
  if (res.status !== 200) return `HTTP ${res.status}`;
  return body.includes('Intrați în cont') ? null : 'nu cere intrarea';
});

await check('link-gresit', 'Un link de intrare falsificat nu deschide contul', async () => {
  const res = await fetch(`${TARGET}/cont/intrare?t=e2e-falsificat`, { redirect: 'manual' });
  const loc = res.headers.get('location') || '';
  if (res.status < 300 || res.status >= 400) return `HTTP ${res.status}`;
  if (res.headers.get('set-cookie')?.includes('cont_session')) return 'a pus sesiune';
  return loc.includes('/cont?eroare=link') ? null : `redirect spre ${loc}`;
});

await check('cod-email-invalid', 'Codul nu pleacă spre o adresă invalidă', async () => {
  const res = await fetch(`${TARGET}/api/cont/cod`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nu-e-email' }),
  });
  return res.status === 400 ? null : `HTTP ${res.status}`;
});

await check('oferta-fara-acces', 'Un fișier de ofertă nu iese fără acces', async () => {
  const res = await fetch(`${TARGET}/api/cont/oferta?id=999999999&f=0`);
  return res.status === 404 ? null : `HTTP ${res.status}`;
});

await check('click', 'Click-ul pe o cerere ajunge în Neon (o dată pe zi)', async () => {
  // O cerere care nu există, folosită doar de test; rândurile ei se șterg la final.
  const leadId = '2020-01-01T00:00:00.000Z';
  const send = () =>
    fetch(`${TARGET}/api/cereri/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'e2e-cont' },
      body: JSON.stringify({ leadId, kind: 'vreau' }),
    });
  const [a, b] = [await send(), await send()];
  if (a.status !== 204 || b.status !== 204) return `HTTP ${a.status}/${b.status}`;
  const sql = neon(databaseUrl());
  const rows = await sql`SELECT count(*)::int AS n FROM lead_clicks WHERE lead_id = ${leadId}`;
  await sql`DELETE FROM lead_clicks WHERE lead_id = ${leadId}`;
  const n = rows[0].n;
  return n === 1 ? null : `${n} rânduri în loc de 1`;
});

await check('eveniment', 'Evenimentul „blocul văzut” ajunge în Neon', async () => {
  const leadId = '2020-01-01T00:00:00.000Z';
  const res = await fetch(`${TARGET}/api/cont/eveniment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leadId, event: 'cta_vazut' }),
  });
  if (res.status !== 204) return `HTTP ${res.status}`;
  const sql = neon(databaseUrl());
  const rows = await sql`SELECT count(*)::int AS n FROM client_events WHERE lead_id = ${leadId} AND event = 'cta_vazut'`;
  await sql`DELETE FROM client_events WHERE lead_id = ${leadId}`;
  return rows[0].n >= 1 ? null : 'evenimentul nu s-a salvat';
});

// ---------------------------------------------------------------------------
// Notițele clientului (3 nov 2026), prin rutele adevărate: o cerere și o
// revendicare de test în Sheets, o sesiune semnată, apoi POST și DELETE. Revendicarea
// n-are email de firmă, deci niciun cron n-are cui să scrie în secundele cât există.

const NOTE_EMAIL = 'routine-test-notite@example.com';
const NOTE_FIRM = 'ROUTINE TEST Notite';
const NOTE_PREFIX = 'e2e-notita-';
const OTHER_LEAD = '2020-01-01T00:00:00.000Z';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Aceeași semnătură ca lib/portal-auth: sesiunea de client a unei adrese de test. */
function clientSession(email) {
  const body = Buffer.from(JSON.stringify({ kind: 'client-session', email, exp: Date.now() + 3_600_000 })).toString('base64url');
  const sig = createHmac('sha256', envValue('PORTAL_SECRET')).update(body).digest('hex');
  return `cont_session=${body}.${sig}`;
}

function noteApi(method, cookie, payload) {
  return fetch(`${TARGET}/api/cont/notita`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(payload),
  });
}

function sheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: envValue('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
      private_key: envValue('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return { sheets: google.sheets({ version: 'v4', auth }), id: envValue('GOOGLE_SHEETS_SPREADSHEET_ID') };
}

/** Șterge rândurile de test, inclusiv cele rămase dintr-o rulare oprită la jumătate. */
async function removeNoteFixtures(leadId) {
  const { sheets, id } = sheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: id, fields: 'sheets.properties(title,sheetId)' });
  const sheetIdByTitle = Object.fromEntries(meta.data.sheets.map((s) => [s.properties.title, s.properties.sheetId]));
  for (const [tab, col, value] of [['Revendicări', 2, NOTE_FIRM], ['Leads', 3, NOTE_EMAIL]]) {
    const got = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${tab}!A:D` });
    const rows = (got.data.values ?? []).flatMap((row, i) => (row[col] === value ? [i] : [])).reverse();
    if (rows.length) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: id,
        requestBody: {
          requests: rows.map((i) => ({
            deleteDimension: { range: { sheetId: sheetIdByTitle[tab], dimension: 'ROWS', startIndex: i, endIndex: i + 1 } },
          })),
        },
      });
    }
  }
  const sql = neon(databaseUrl());
  await sql`DELETE FROM client_firm_notes WHERE nota LIKE ${`${NOTE_PREFIX}%`}`;
  await sql`DELETE FROM client_events WHERE lead_id = ${leadId} OR props->>'nota' LIKE ${`${NOTE_PREFIX}%`}`;
  await sql`DELETE FROM client_lead_views WHERE lead_id = ${leadId}`;
}

await check('notita-fara-acces', 'Fără sesiune, nimeni nu adaugă și nu șterge notițe', async () => {
  const post = await noteApi('POST', null, { leadId: OTHER_LEAD, claimTs: OTHER_LEAD, nota: `${NOTE_PREFIX}fara-acces` });
  const del = await noteApi('DELETE', null, { leadId: OTHER_LEAD, id: 1 });
  return post.status === 401 && del.status === 401 ? null : `HTTP ${post.status}/${del.status}`;
});

// Sheets are nevoie de ora lui proprie pe fiecare rând (cheia din coloana A).
const noteLeadId = new Date().toISOString();
const noteClaimTs = new Date(Date.now() + 1).toISOString();
const noteText = `${NOTE_PREFIX}${Date.now()}`;
const notePagePath = `${TARGET}/cont/cerere/${encodeURIComponent(noteLeadId)}`;
let noteId = null;

try {
  const sql = neon(databaseUrl());
  const owner = clientSession(NOTE_EMAIL);
  const stranger = clientSession('routine-test-alt-client@example.com');
  const notePage = (cookie) => fetch(notePagePath, { headers: { Cookie: cookie } }).then((r) => r.text());

  await check('notita-salvata', 'Notița clientului se salvează prin rută, cu evenimentul ei', async () => {
    const { sheets, id } = sheetsClient();
    const append = (tab, row) =>
      sheets.spreadsheets.values.append({
        spreadsheetId: id,
        range: `${tab}!A:A`,
        valueInputOption: 'RAW',
        requestBody: { values: [row] },
      });
    await append('Leads', [noteLeadId, '', 'ROUTINE TEST', NOTE_EMAIL, '0712345678', '', 'Cluj', '', '6', '', 'e2e-cont']);
    await append('Revendicări', [noteClaimTs, noteLeadId, NOTE_FIRM, 'ROUTINE TEST', '0712345678', 'Nou', '', 'manual', '', '', '', '', noteClaimTs]);

    // Serverul ține citirile din Sheets 5 secunde, deci rândurile noi apar cu întârziere.
    let res;
    for (let attempt = 0; attempt < 4; attempt++) {
      await wait(6_000);
      res = await noteApi('POST', owner, { leadId: noteLeadId, claimTs: noteClaimTs, nota: noteText });
      if (res.status !== 401 && res.status !== 404) break;
    }
    if (res.status !== 200) return `HTTP ${res.status}: ${await res.text()}`;
    noteId = (await res.json()).note?.id ?? null;
    if (!noteId) return 'răspunsul nu are id-ul notiței';
    const [row] = await sql`SELECT lead_id, claim_ts, nota FROM client_firm_notes WHERE id = ${noteId}`;
    if (!row) return 'rândul nu e în client_firm_notes';
    if (row.lead_id !== noteLeadId || row.claim_ts !== noteClaimTs || row.nota !== noteText) return 'rândul salvat nu corespunde';
    const events = await sql`SELECT 1 FROM client_events WHERE lead_id = ${noteLeadId} AND event = 'notita_firma'`;
    return events.length === 1 ? null : `${events.length} evenimente în loc de 1`;
  });

  await check('notita-pe-pagina', 'Clientul vede caseta și notița pe pagina cererii', async () => {
    if (!noteId) return 'notița nu s-a salvat';
    const body = await notePage(owner);
    if (!body.includes('Notițele dumneavoastră despre această firmă')) return 'caseta nu apare';
    return body.includes(noteText) ? null : 'notița nu apare în istoric';
  });

  await check('notita-alt-client', 'Alt client nu vede, nu adaugă și nu șterge notița', async () => {
    if (!noteId) return 'notița nu s-a salvat';
    const post = await noteApi('POST', stranger, { leadId: noteLeadId, claimTs: noteClaimTs, nota: `${NOTE_PREFIX}strain` });
    const del = await noteApi('DELETE', stranger, { leadId: noteLeadId, id: noteId });
    if (post.status !== 401 || del.status !== 401) return `HTTP ${post.status}/${del.status}`;
    if ((await notePage(stranger)).includes(noteText)) return 'alt client vede notița';
    const rows = await sql`SELECT id FROM client_firm_notes WHERE lead_id = ${noteLeadId}`;
    return rows.length === 1 && rows[0].id === noteId ? null : `${rows.length} notițe pe cerere în loc de 1`;
  });

  await check('notita-alta-cerere', 'Clientul nu poate șterge o notiță de pe altă cerere', async () => {
    const [{ id }] = await sql`
      INSERT INTO client_firm_notes (lead_id, claim_ts, nota)
      VALUES (${OTHER_LEAD}, ${OTHER_LEAD}, ${`${NOTE_PREFIX}alta-cerere`})
      RETURNING id
    `;
    const res = await noteApi('DELETE', owner, { leadId: noteLeadId, id });
    if (res.status !== 404) return `HTTP ${res.status}`;
    const rows = await sql`SELECT 1 FROM client_firm_notes WHERE id = ${id}`;
    return rows.length === 1 ? null : 'notița de pe cealaltă cerere a dispărut';
  });

  await check('notita-stearsa', 'Notița ștearsă dispare de tot: pagină, tabel și eveniment', async () => {
    if (!noteId) return 'notița nu s-a salvat';
    const res = await noteApi('DELETE', owner, { leadId: noteLeadId, id: noteId });
    if (res.status !== 200) return `HTTP ${res.status}: ${await res.text()}`;
    const rows = await sql`SELECT 1 FROM client_firm_notes WHERE id = ${noteId}`;
    if (rows.length) return 'rândul a rămas în client_firm_notes';
    const events = await sql`SELECT 1 FROM client_events WHERE lead_id = ${noteLeadId} AND props->>'nota' = ${noteText}`;
    if (events.length) return 'textul a rămas în client_events, deci și în /admin/cont-client';
    return (await notePage(owner)).includes(noteText) ? 'notița apare încă pe pagină' : null;
  });
} finally {
  await check('notita-curatenie', 'Rândurile de test ale notițelor sunt șterse', async () => {
    await removeNoteFixtures(noteLeadId);
    const sql = neon(databaseUrl());
    const [{ n }] = await sql`SELECT count(*)::int AS n FROM client_firm_notes WHERE nota LIKE ${`${NOTE_PREFIX}%`}`;
    return n === 0 ? null : `${n} notițe de test rămase`;
  });
}

await check('notita-firma-nu-vede', 'Codul firmelor nu citește notițele clientului (verificare pe sursă)', async () => {
  // Doar fișierele de mai jos au voie să atingă notițele. Una nouă aici se verifică de mână.
  const allowed = new Set([
    'lib/client-account.ts',
    'lib/client-events.ts',
    'app/admin/cont-client/ClientCards.tsx',
    'app/api/cont/notita/route.ts',
    'components/cont/AccountLeadView.tsx',
  ]);
  const files = ['app', 'lib', 'components'].flatMap((dir) =>
    readdirSync(path.join(ROOT, dir), { recursive: true }).map((f) => path.join(dir, String(f))),
  );
  const bad = [];
  for (const file of files.filter((f) => /\.tsx?$/.test(f))) {
    const source = readFileSync(path.join(ROOT, file), 'utf8');
    if (/client_firm_notes|notita_firma|\/api\/cont\/notita/.test(source) && !allowed.has(file)) bad.push(file);
    if (/portal/i.test(file) && /loadAccountLead|firmNotes\(/.test(source)) bad.push(file);
  }
  return bad.length ? `fișiere neașteptate: ${bad.join(', ')}` : null;
});

const allPass = tests.every((t) => t.pass);
console.log(JSON.stringify({ target: TARGET, allPass, tests }, null, 2));
process.exit(allPass ? 0 : 1);
