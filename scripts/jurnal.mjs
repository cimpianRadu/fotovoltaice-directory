#!/usr/bin/env node
/**
 * Jurnalul din /admin/azi (tabelele `jurnal_note`, `jurnal_digest` și
 * `jurnal_task` din Neon, migrațiile 009 și 010). Îl folosește rutina de seară
 * `jurnal-digest-instalatori`: citește notele zilei, scrie digestul, pune
 * taskurile pe zilele următoare și le bifează pe cele pe care notele spun că
 * le-ai făcut.
 *
 *   node scripts/jurnal.mjs pending [--today]
 *     Zilele din ultimele 7 cu note și fără digest, sau cu note scrise după
 *     digest. Ziua de azi intră doar după ora 20 (România), ca o rulare de
 *     dimineață să nu facă digestul unei zile abia începute; `--today` o ia oricum.
 *     Tipărește JSON: { today, days: [{ day, notes, digest }], openTasks: [...] }.
 *
 *   node scripts/jurnal.mjs show 2026-10-26
 *     Notele unei zile, digestul și taskurile scoase de el, JSON.
 *
 *   node scripts/jurnal.mjs save 2026-10-26 < digest.md
 *     Salvează (sau rescrie) digestul zilei din stdin, cu numărul de note de acum.
 *
 *   node scripts/jurnal.mjs tasks 2026-10-26 < taskuri.json
 *     Taskurile scoase de digestul zilei: [{ "due": "2026-10-27", "text": "..." }].
 *     La o rescriere le înlocuiește pe cele de data trecută, dar nu pe cele
 *     bifate sau editate între timp.
 *
 *   node scripts/jurnal.mjs done 12 15
 *     Bifează taskurile deschise cu id-urile date.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const line = readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL lipsește din mediu și din .env.local.');
  return line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
}

const sql = neon(databaseUrl());

function bucharest(at = new Date()) {
  return {
    day: at.toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' }),
    hour: Number(at.toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Europe/Bucharest' })),
  };
}

function time(at) {
  return new Date(at).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bucharest' });
}

async function notesOf(day) {
  const rows = await sql`
    SELECT id, at, text, subject_kind, subject_id, subject_label, subject_meta, edited_at
    FROM jurnal_note WHERE day = ${day} ORDER BY at
  `;
  return rows.map((r) => ({
    id: r.id,
    ora: time(r.at),
    text: r.text,
    subiect: r.subject_kind
      ? { tip: r.subject_kind, id: r.subject_id, nume: r.subject_label, ...(r.subject_meta ?? {}) }
      : null,
    editata: r.edited_at ? time(r.edited_at) : null,
  }));
}

async function openTasks() {
  const rows = await sql`
    SELECT id, due::text AS due, text, source, source_day::text AS source_day
    FROM jurnal_task WHERE done_at IS NULL ORDER BY due, id
  `;
  return rows.map((r) => ({ id: r.id, due: r.due, text: r.text, sursa: r.source, dinDigestulDe: r.source_day }));
}

async function readStdin() {
  let body = '';
  for await (const chunk of process.stdin) body += chunk;
  return body.trim();
}

async function digestOf(day) {
  const [r] = await sql`SELECT created_at, notes, body FROM jurnal_digest WHERE day = ${day}`;
  return r ? { createdAt: new Date(r.created_at).toISOString(), notes: r.notes, body: r.body } : null;
}

const [cmd, arg] = process.argv.slice(2);

if (cmd === 'pending') {
  const now = bucharest();
  const withToday = process.argv.includes('--today') || now.hour >= 20;
  const rows = await sql`
    SELECT n.day::text AS day, count(*)::int AS n, max(greatest(n.at, coalesce(n.edited_at, n.at))) AS last_write,
           d.created_at AS digest_at, d.notes AS digest_notes
    FROM jurnal_note n LEFT JOIN jurnal_digest d ON d.day = n.day
    WHERE n.day > (now() AT TIME ZONE 'Europe/Bucharest')::date - 7
    GROUP BY n.day, d.created_at, d.notes
    ORDER BY n.day
  `;
  const due = rows.filter(
    (r) =>
      (withToday || r.day < now.day) &&
      (!r.digest_at || new Date(r.last_write) > new Date(r.digest_at) || r.n !== r.digest_notes),
  );
  const out = [];
  for (const r of due) {
    out.push({
      day: r.day,
      notes: await notesOf(r.day),
      digest: r.digest_at ? { createdAt: new Date(r.digest_at).toISOString(), notes: r.digest_notes } : null,
    });
  }
  console.log(JSON.stringify({ today: now.day, days: out, openTasks: await openTasks() }, null, 2));
} else if (cmd === 'show' && DAY_RE.test(arg ?? '')) {
  const tasks = await sql`
    SELECT id, due::text AS due, text, done_at FROM jurnal_task WHERE source_day = ${arg} ORDER BY due, id
  `;
  console.log(
    JSON.stringify({ day: arg, notes: await notesOf(arg), digest: await digestOf(arg), tasks }, null, 2),
  );
} else if (cmd === 'tasks' && DAY_RE.test(arg ?? '')) {
  const list = JSON.parse((await readStdin()) || '[]');
  if (!Array.isArray(list)) throw new Error('Taskurile vin ca listă JSON: [{ "due": "AAAA-LL-ZZ", "text": "..." }].');
  const bad = list.filter((t) => !DAY_RE.test(t?.due ?? '') || !String(t?.text ?? '').trim());
  if (bad.length) throw new Error(`Taskuri fără dată sau text: ${JSON.stringify(bad)}`);
  const removed = await sql`
    DELETE FROM jurnal_task
    WHERE source = 'digest' AND source_day = ${arg} AND done_at IS NULL AND edited_at IS NULL
    RETURNING id
  `;
  for (const t of list) {
    await sql`
      INSERT INTO jurnal_task (due, text, source, source_day)
      VALUES (${t.due}, ${String(t.text).trim().slice(0, 1000)}, 'digest', ${arg})
    `;
  }
  console.log(`Taskuri din digestul de ${arg}: ${list.length} puse${removed.length ? `, ${removed.length} vechi înlocuite` : ''}.`);
} else if (cmd === 'done' && process.argv.length > 3) {
  const ids = process.argv.slice(3).map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const rows = await sql`
    UPDATE jurnal_task SET done_at = now() WHERE id = ANY(${ids}) AND done_at IS NULL RETURNING id, text
  `;
  for (const r of rows) console.log(`bifat #${r.id}: ${r.text}`);
  console.log(`${rows.length} din ${ids.length} bifate.`);
} else if (cmd === 'save' && DAY_RE.test(arg ?? '')) {
  const body = await readStdin();
  if (!body) {
    console.error('Digest gol: nimic salvat.');
    process.exit(1);
  }
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM jurnal_note WHERE day = ${arg}`;
  await sql`
    INSERT INTO jurnal_digest (day, notes, body) VALUES (${arg}, ${n}, ${body})
    ON CONFLICT (day) DO UPDATE SET notes = EXCLUDED.notes, body = EXCLUDED.body, created_at = now()
  `;
  console.log(`Digest salvat pentru ${arg} (${n} note).`);
} else {
  console.error(
    'Folosire: node scripts/jurnal.mjs pending [--today] | show ZI | save ZI < digest.md | tasks ZI < taskuri.json | done ID...',
  );
  process.exit(1);
}
