#!/usr/bin/env node
/**
 * Rulează testele E2E și salvează rezultatul în Neon (tabelul `e2e_runs`), de unde
 * îl arată /admin/teste. Fiecare suită e un script separat, care se poate rula și
 * singur și scrie un JSON la final:
 *
 *   pagini        scripts/e2e-pages.mjs        doar citește
 *   calculatoare  scripts/e2e-calculators.mjs  doar citește
 *   formulare     scripts/e2e-forms.mjs        trimite cele 3 formulare cu emailuri
 *                                              „routine-test-” și își șterge rândurile din Sheets
 *   baza          aici                         Neon răspunde, migrațiile sunt aplicate,
 *                                              lista Țintă există
 *
 * Suita „baza” verifică baza din .env.local, care e aceeași cu cea din producție.
 *
 *   npm run e2e                                    toate, pe producție
 *   npm run e2e -- --suite pagini,baza             doar unele
 *   TARGET_URL=http://localhost:3000 npm run e2e   pe serverul local
 *   --trigger manual|rutina|deploy (implicit manual) · --no-save · --json
 *
 * Iese cu 1 dacă pică ceva. Cu --json scrie la final toată rularea ca JSON
 * (o folosește rutina de duminică pentru email).
 */
import { execFile } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { neon } from '@neondatabase/serverless';

const run = promisify(execFile);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = (process.env.TARGET_URL || 'https://instalatori-fotovoltaice.ro').replace(/\/$/, '');
const IS_PROD = TARGET === 'https://instalatori-fotovoltaice.ro';
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const option = (name) => {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
};
const TRIGGER = option('--trigger') || 'manual';
const ALL_SUITES = ['pagini', 'calculatoare', 'formulare', 'baza'];
const SUITES = option('--suite') ? option('--suite').split(',') : ALL_SUITES;
// Câte rulări păstrăm. Una are câțiva KB.
const KEEP = 300;

for (const s of SUITES) if (!ALL_SUITES.includes(s)) throw new Error(`Suită necunoscută: ${s} (sunt: ${ALL_SUITES.join(', ')})`);

function env(key) {
  if (process.env[key]) return process.env[key];
  const line = readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${key}=`));
  return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, '');
}

/** Rulează un script de suită și îi citește JSON-ul de la final, chiar dacă iese cu 1. */
async function runScript(file) {
  let stdout = '';
  try {
    ({ stdout } = await run(process.execPath, [path.join(ROOT, 'scripts', file)], {
      cwd: ROOT,
      env: { ...process.env, TARGET_URL: TARGET },
      maxBuffer: 20 * 1024 * 1024,
      timeout: 10 * 60 * 1000,
    }));
  } catch (err) {
    stdout = err.stdout || '';
    if (!stdout.trim()) throw new Error((err.stderr || err.message || String(err)).trim().split('\n').slice(-3).join(' '));
  }
  // JSON-ul e scris indentat, deci acolada lui de început e singura de la început de rând.
  const at = stdout.lastIndexOf('\n{');
  return JSON.parse(at === -1 ? stdout : stdout.slice(at + 1));
}

const status = (pass) => (pass ? 'pass' : 'fail');

const SUITE_RUNNERS = {
  async pagini() {
    const out = await runScript('e2e-pages.mjs');
    return out.pages.map((t) => ({
      name: t.name,
      status: status(t.pass),
      ms: t.ms,
      error: t.error || null,
      details: { path: t.path, ...(t.details || {}), ...(t.jsErrors?.length ? { jsErrors: t.jsErrors } : {}) },
    }));
  },

  async calculatoare() {
    const out = await runScript('e2e-calculators.mjs');
    return out.calculators.map((c) => {
      const failed = Object.entries(c.failedChecks || {});
      return {
        name: c.calculator,
        status: status(c.pass),
        ms: null,
        error: c.error || (failed.length ? `${failed.length} verificări greșite: ${failed.map(([k]) => k).join(', ')}` : null),
        details: failed.length ? { failedChecks: c.failedChecks } : null,
      };
    });
  },

  async formulare() {
    const out = await runScript('e2e-forms.mjs');
    const tests = out.forms.map((f) => ({
      name: f.form,
      status: status(f.pass),
      ms: null,
      error:
        f.error ||
        (f.apiStatus && (f.apiStatus < 200 || f.apiStatus >= 300) ? `API a răspuns ${f.apiStatus}` : null) ||
        (f.sheetFound === false ? 'rândul nu a apărut în Sheets' : null),
      details: { apiStatus: f.apiStatus, sheetFound: f.sheetFound, cleanedRows: f.cleanedRows, apiBody: f.apiBody || undefined },
    }));
    tests.push({
      name: 'Rândurile de test șterse din Sheets',
      status: status(!out.cleanupError),
      ms: null,
      error: out.cleanupError || null,
      details: null,
    });
    return tests;
  },

  async baza() {
    const sql = neon(env('DATABASE_URL'));
    const tests = [];
    const check = async (name, fn) => {
      const start = Date.now();
      try {
        const { error = null, details = null } = (await fn()) || {};
        tests.push({ name, status: status(!error), ms: Date.now() - start, error, details });
      } catch (err) {
        tests.push({ name, status: 'fail', ms: Date.now() - start, error: String(err?.message || err), details: null });
      }
    };
    await check('Neon răspunde', async () => {
      await sql`SELECT 1`;
    });
    await check('Migrațiile sunt aplicate', async () => {
      const files = readdirSync(path.join(ROOT, 'db/migrations')).filter((f) => f.endsWith('.sql'));
      const applied = new Set((await sql`SELECT name FROM schema_migrations`).map((r) => r.name));
      const missing = files.filter((f) => !applied.has(f));
      return { error: missing.length ? `neaplicate: ${missing.join(', ')}` : null, details: { aplicate: applied.size } };
    });
    await check('Lista Țintă există', async () => {
      const [row] = await sql`
        SELECT generated_at, jsonb_array_length(firms) AS n FROM tinta_snapshots ORDER BY generated_at DESC LIMIT 1
      `;
      if (!row) return { error: 'tabelul tinta_snapshots e gol' };
      return { error: row.n > 0 ? null : 'ultima generare nu are firme', details: { firme: row.n, generata: row.generated_at } };
    });
    return tests;
  },
};

/** Commitul testat: cel din producție (Vercel CLI, dacă e logat) sau HEAD-ul local. */
async function gitSha() {
  try {
    if (IS_PROD) {
      const project = JSON.parse(readFileSync(path.join(ROOT, '.vercel/project.json'), 'utf8'));
      const { stdout } = await run(
        'vercel',
        ['api', `/v6/deployments?projectId=${project.projectId}&teamId=${project.orgId}&target=production&state=READY&limit=1`, '--method', 'GET'],
        { cwd: ROOT, timeout: 20000 },
      );
      return JSON.parse(stdout).deployments?.[0]?.meta?.githubCommitSha?.slice(0, 7) || null;
    }
    const { stdout } = await run('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT });
    return stdout.trim();
  } catch {
    return null;
  }
}

const startedAt = new Date();
const shaPromise = gitSha();
const results = [];
for (const suite of SUITES) {
  const start = Date.now();
  try {
    for (const t of await SUITE_RUNNERS[suite]()) results.push({ suite, ...t });
  } catch (err) {
    // O suită care nu pornește deloc (Playwright lipsă, site căzut) e tot un eșec vizibil.
    results.push({ suite, name: 'Suita nu a putut rula', status: 'fail', ms: Date.now() - start, error: String(err?.message || err), details: null });
  }
  if (!flag('--json')) {
    const mine = results.filter((r) => r.suite === suite);
    const bad = mine.filter((r) => r.status === 'fail');
    console.log(`${bad.length ? '✗' : '✓'} ${suite}: ${mine.length - bad.length}/${mine.length} (${Math.round((Date.now() - start) / 1000)}s)`);
    for (const r of bad) console.log(`    ✗ ${r.name}: ${r.error}`);
  }
}
const finishedAt = new Date();
const count = (s) => results.filter((r) => r.status === s).length;
const summary = {
  startedAt: startedAt.toISOString(),
  finishedAt: finishedAt.toISOString(),
  target: TARGET,
  trigger: TRIGGER,
  gitSha: await shaPromise,
  passed: count('pass'),
  failed: count('fail'),
  skipped: count('skip'),
  results,
};

if (!flag('--no-save')) {
  try {
    const sql = neon(env('DATABASE_URL'));
    const [row] = await sql`
      INSERT INTO e2e_runs (started_at, finished_at, target, trigger, git_sha, passed, failed, skipped, results)
      VALUES (${summary.startedAt}, ${summary.finishedAt}, ${TARGET}, ${TRIGGER}, ${summary.gitSha},
              ${summary.passed}, ${summary.failed}, ${summary.skipped}, ${JSON.stringify(results)}::jsonb)
      RETURNING id
    `;
    await sql`DELETE FROM e2e_runs WHERE id NOT IN (SELECT id FROM e2e_runs ORDER BY started_at DESC LIMIT ${KEEP})`;
    summary.runId = row.id;
  } catch (err) {
    summary.saveError = String(err?.message || err);
  }
}

if (flag('--json')) console.log(JSON.stringify(summary, null, 2));
else {
  console.log(`\n${summary.failed ? '✗' : '✓'} ${summary.passed} trecute, ${summary.failed} picate · ${TARGET}`);
  if (summary.runId) console.log(`→ /admin/teste?run=${summary.runId}`);
  if (summary.saveError) console.log(`! Rularea NU s-a salvat în Neon: ${summary.saveError}`);
}
process.exit(summary.failed ? 1 : 0);
