import Link from 'next/link';
import { getE2eRun, getE2eRuns, type E2eResult, type E2eRun, type E2eStatus } from '@/lib/e2e-runs';

export const dynamic = 'force-dynamic';

/**
 * Rezultatele testelor E2E (scripts/e2e.mjs): paginile publice, calculatoarele,
 * cele 3 formulare și baza de date. Rulează duminica dimineața din rutina de
 * sănătate și oricând cu `npm run e2e`; fiecare rulare se salvează în Neon.
 * Până pe 23 oct 2026 rezultatele ajungeau doar în emailul rutinei.
 */

const REPO = 'https://github.com/cimpianRadu/fotovoltaice-directory';
const PROD = 'https://instalatori-fotovoltaice.ro';
const HISTORY_RUNS = 20;

const SUITE_LABELS: Record<string, string> = {
  pagini: 'Pagini publice',
  calculatoare: 'Calculatoare',
  formulare: 'Formulare',
  baza: 'Baza de date',
};

const TRIGGER_LABELS: Record<string, string> = {
  manual: 'manual',
  rutina: 'rutina de duminică',
  deploy: 'după deploy',
};

const when = (iso: string) =>
  new Date(iso).toLocaleString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const seconds = (run: E2eRun) => Math.round((Date.parse(run.finishedAt) - Date.parse(run.startedAt)) / 1000);
const targetLabel = (t: string) => (t === PROD ? 'producție' : t.replace(/^https?:\/\//, ''));
const testKey = (r: Pick<E2eResult, 'suite' | 'name'>) => `${r.suite}::${r.name}`;
const ALL_SUITES = Object.keys(SUITE_LABELS);
const suitesOf = (run: E2eRun) => [...new Set(run.results.map((r) => r.suite))];

/** „doar pagini publice, baza de date" când rularea n-a cuprins toate suitele. */
function partialNote(run: E2eRun): string {
  const ran = suitesOf(run);
  if (ALL_SUITES.every((s) => ran.includes(s))) return '';
  return ` · doar ${ran.map((s) => (SUITE_LABELS[s] ?? s).toLowerCase()).join(', ')}`;
}

const DOT: Record<E2eStatus | 'none', string> = {
  pass: 'bg-emerald-500',
  fail: 'bg-red-500',
  skip: 'bg-slate-300',
  none: 'bg-slate-100',
};

function StatusIcon({ status }: { status: E2eStatus }) {
  if (status === 'pass') return <span className="font-bold text-emerald-600">✓</span>;
  if (status === 'fail') return <span className="font-bold text-red-600">✗</span>;
  return <span className="text-slate-400">–</span>;
}

function Commit({ sha }: { sha: string | null }) {
  if (!sha) return <span className="text-slate-400">—</span>;
  return (
    <a href={`${REPO}/commit/${sha}`} className="font-mono text-xs underline hover:no-underline" target="_blank" rel="noreferrer">
      {sha.slice(0, 7)}
    </a>
  );
}

interface Props {
  searchParams: Promise<{ run?: string }>;
}

export default async function TestePage({ searchParams }: Props) {
  const { run: runParam } = await searchParams;

  let runs: E2eRun[] = [];
  let selected: E2eRun | null = null;
  let dbError = '';
  try {
    runs = await getE2eRuns(30);
    const wanted = Number(runParam);
    selected = Number.isInteger(wanted) && wanted > 0 ? (runs.find((r) => r.id === wanted) ?? (await getE2eRun(wanted))) : (runs[0] ?? null);
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const latest = runs[0];

  // Istoricul pe fiecare test: ultimele rulări, cea mai nouă în stânga.
  const history = runs.slice(0, HISTORY_RUNS);
  const testNames = new Map<string, { suite: string; name: string }>();
  for (const r of history) for (const t of r.results) if (!testNames.has(testKey(t))) testNames.set(testKey(t), t);
  const statusIn = (r: E2eRun, key: string): E2eStatus | 'none' => r.results.find((t) => testKey(t) === key)?.status ?? 'none';

  const suites = selected ? suitesOf(selected) : [];

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Teste E2E</h1>
        <p className="text-xs text-slate-400">
          rulează cu <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-500">npm run e2e</code>
        </p>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Un browser adevărat deschide site-ul și verifică paginile publice, cifrele din calculatoare, cele 3 formulare
        (trimise cu adrese de test, apoi șterse din Sheets) și baza de date. Rulează duminica dimineața și oricând
        pornești testele de mână.
      </p>

      {dbError && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Baza de date nu răspunde ({dbError}).
        </p>
      )}

      {!dbError && !latest && (
        <p className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Nicio rulare încă. Pornește testele cu <code>npm run e2e</code>.
        </p>
      )}

      {latest && (
        <div
          className={`mt-5 rounded-xl border px-5 py-4 ${
            latest.failed ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
          }`}
        >
          <p className={`text-lg font-bold ${latest.failed ? 'text-red-800' : 'text-emerald-800'}`}>
            {latest.failed
              ? `${latest.failed} ${latest.failed === 1 ? 'test picat' : 'teste picate'} din ${latest.passed + latest.failed}`
              : `Toate cele ${latest.passed} teste trec`}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Ultima rulare: {when(latest.startedAt)} · {targetLabel(latest.target)} ·{' '}
            {TRIGGER_LABELS[latest.trigger] ?? latest.trigger} · commit <Commit sha={latest.gitSha} /> · {seconds(latest)} s
            {partialNote(latest)}
          </p>
          {latest.failed > 0 && (
            <ul className="mt-2 space-y-0.5 text-sm text-red-800">
              {latest.results
                .filter((r) => r.status === 'fail')
                .map((r) => (
                  <li key={testKey(r)}>
                    ✗ <span className="font-medium">{r.name}</span>
                    <span className="text-red-700/80"> ({SUITE_LABELS[r.suite] ?? r.suite}): {r.error}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {history.length > 1 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-900">Istoric pe fiecare test</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Ultimele {history.length} rulări, cea mai nouă în stânga. Un test care alternează verde și roșu e instabil,
            nu neapărat stricat.
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-xs">
              <tbody>
                {[...testNames.entries()].map(([key, t]) => (
                  <tr key={key} className="border-b border-slate-100 last:border-0">
                    <td className="whitespace-nowrap px-3 py-1.5 text-slate-700">
                      <span className="text-slate-400">{SUITE_LABELS[t.suite] ?? t.suite} · </span>
                      {t.name}
                    </td>
                    <td className="w-full px-3 py-1.5">
                      <div className="flex gap-1">
                        {history.map((r) => (
                          <Link
                            key={r.id}
                            href={`/admin/teste?run=${r.id}`}
                            title={`#${r.id} · ${when(r.startedAt)}`}
                            className={`h-3 w-3 rounded-sm ${DOT[statusIn(r, key)]}`}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selected && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-900">
            Rularea #{selected.id} · {when(selected.startedAt)}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {targetLabel(selected.target)} · {TRIGGER_LABELS[selected.trigger] ?? selected.trigger} · commit{' '}
            <Commit sha={selected.gitSha} /> · {selected.passed} trecute, {selected.failed} picate · {seconds(selected)} s
            {partialNote(selected)}
          </p>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {suites.map((suite) => {
              const tests = selected.results.filter((r) => r.suite === suite);
              const bad = tests.filter((r) => r.status === 'fail').length;
              return (
                <div key={suite} className="rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-baseline justify-between border-b border-slate-100 px-4 py-2">
                    <h3 className="text-sm font-semibold text-slate-900">{SUITE_LABELS[suite] ?? suite}</h3>
                    <span className={`text-xs ${bad ? 'font-semibold text-red-600' : 'text-emerald-700'}`}>
                      {tests.length - bad}/{tests.length}
                    </span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {tests.map((t) => (
                      <li key={testKey(t)} className="px-4 py-2 text-sm">
                        <div className="flex items-baseline gap-2">
                          <StatusIcon status={t.status} />
                          <span className="text-slate-800">{t.name}</span>
                          {t.ms !== null && (
                            <span className="ml-auto text-[11px] tabular-nums text-slate-400">
                              {(t.ms / 1000).toFixed(1)} s
                            </span>
                          )}
                        </div>
                        {t.error && <p className="ml-5 mt-0.5 text-xs text-red-700">{t.error}</p>}
                        {t.details && Object.keys(t.details).length > 0 && (
                          <details className="ml-5 mt-1">
                            <summary className="cursor-pointer text-[11px] text-slate-400 hover:text-slate-600">detalii</summary>
                            <pre className="mt-1 overflow-x-auto rounded bg-slate-50 p-2 text-[11px] text-slate-600">
                              {JSON.stringify(t.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {runs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-slate-900">Rulări</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Când</th>
                  <th className="px-3 py-2 font-medium">Unde</th>
                  <th className="px-3 py-2 font-medium">Pornită</th>
                  <th className="px-3 py-2 font-medium">Commit</th>
                  <th className="px-3 py-2 text-right font-medium">Rezultat</th>
                  <th className="px-3 py-2 text-right font-medium">Durată</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-slate-100 last:border-0 ${r.id === selected?.id ? 'bg-slate-50' : ''}`}
                  >
                    <td className="px-3 py-1.5">
                      <Link href={`/admin/teste?run=${r.id}`} className="underline hover:no-underline">
                        {r.id}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-1.5 text-slate-700">{when(r.startedAt)}</td>
                    <td className="px-3 py-1.5 text-slate-600">{targetLabel(r.target)}</td>
                    <td className="px-3 py-1.5 text-slate-600">{TRIGGER_LABELS[r.trigger] ?? r.trigger}</td>
                    <td className="px-3 py-1.5">
                      <Commit sha={r.gitSha} />
                    </td>
                    <td className={`px-3 py-1.5 text-right tabular-nums ${r.failed ? 'font-semibold text-red-600' : 'text-emerald-700'}`}>
                      {r.failed ? `${r.failed} picate` : `${r.passed} trec`}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">{seconds(r)} s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
