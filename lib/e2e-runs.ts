// Rulările testelor E2E, din tabelul `e2e_runs` din Neon, scris de
// `scripts/e2e.mjs`. Le arată /admin/teste.

import 'server-only';
import { db } from './db';

export type E2eStatus = 'pass' | 'fail' | 'skip';

export interface E2eResult {
  suite: string;
  name: string;
  status: E2eStatus;
  ms: number | null;
  error: string | null;
  details: Record<string, unknown> | null;
}

export interface E2eRun {
  id: number;
  startedAt: string;
  finishedAt: string;
  target: string;
  trigger: string;
  gitSha: string | null;
  passed: number;
  failed: number;
  skipped: number;
  results: E2eResult[];
}

type Row = Record<string, unknown>;

function toRun(r: Row): E2eRun {
  return {
    id: Number(r.id),
    startedAt: new Date(r.started_at as string).toISOString(),
    finishedAt: new Date(r.finished_at as string).toISOString(),
    target: String(r.target),
    trigger: String(r.trigger),
    gitSha: (r.git_sha as string | null) ?? null,
    passed: Number(r.passed),
    failed: Number(r.failed),
    skipped: Number(r.skipped),
    results: (r.results as E2eResult[]) ?? [],
  };
}

/** Ultimele rulări, cea mai nouă prima. */
export async function getE2eRuns(limit = 30): Promise<E2eRun[]> {
  const rows = await db()`
    SELECT id, started_at, finished_at, target, trigger, git_sha, passed, failed, skipped, results
    FROM e2e_runs ORDER BY started_at DESC LIMIT ${limit}
  `;
  return rows.map(toRun);
}

export async function getE2eRun(id: number): Promise<E2eRun | null> {
  const rows = await db()`
    SELECT id, started_at, finished_at, target, trigger, git_sha, passed, failed, skipped, results
    FROM e2e_runs WHERE id = ${id}
  `;
  return rows[0] ? toRun(rows[0]) : null;
}
