import Link from 'next/link';
import Markdown from '@/components/ui/Markdown';
import { addDays, bucharestDay } from '@/lib/daily-agenda';
import {
  getJournalDay,
  getLatestJournalDigest,
  getOpenTasks,
  type JournalEntry,
  type JournalTask,
} from '@/lib/jurnal';
import JournalPanel from './JournalPanel';
import TasksPanel from './TasksPanel';

// Pagina zilei din 26 oct 2026: jurnalul și taskurile, nimic din Sheets. Radu:
// „eu voiam un jurnal, să fie the main thing”. Listele deduse din Sheets (firme
// de sunat, cereri de calificat...) sunt pe /admin/azi/liste.

export const dynamic = 'force-dynamic';

function fmtLongDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function fmtDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

function fmtTime(at: string): string {
  return new Date(at).toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Bucharest',
  });
}

// Ca în /admin/firme: momentul „acum" vine dintr-un helper de modul, nu din
// corpul componentei (regula react-hooks/purity).
function nowMs(): number {
  return Date.now();
}

export default async function AziPage() {
  const today = bucharestDay(nowMs());

  // Neon: dacă baza nu răspunde, pagina se deschide oricum, goală, cu eroarea în log.
  const [journal, tasks, digest] = await Promise.all([
    getJournalDay(today).catch((err): JournalEntry[] => {
      console.error('[azi] jurnal', err);
      return [];
    }),
    getOpenTasks(today).catch((err): JournalTask[] => {
      console.error('[azi] taskuri', err);
      return [];
    }),
    getLatestJournalDigest(today).catch((err) => {
      console.error('[azi] digest', err);
      return null;
    }),
  ]);

  const digestTitle = !digest
    ? ''
    : digest.day === today
      ? 'Digestul de azi'
      : digest.day === addDays(today, -1)
        ? 'Digestul de aseară'
        : `Ultimul digest, de ${fmtDay(digest.day)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold capitalize text-slate-900">{fmtLongDay(today)}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Scrie în jurnal ce faci și ce ai de făcut. Seara fac digestul zilei și îți pun taskurile pe mâine
          și poimâine.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start">
        <div className="min-w-0">
          <JournalPanel initial={journal} main />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
          <TasksPanel today={today} initial={tasks} />

          {digest ? (
            <details open className="rounded-2xl border border-slate-200 bg-white px-5 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                {digestTitle}
                <span className="font-normal text-slate-400">
                  {' '}
                  · {digest.notes} {digest.notes === 1 ? 'notă' : 'note'}, scris la {fmtTime(digest.createdAt)}
                </span>
              </summary>
              <div className="pt-1 [&_h3:first-child]:mt-2">
                <Markdown content={digest.body} />
              </div>
            </details>
          ) : (
            <p className="px-1 text-xs text-slate-400">
              Digestul îl fac seara, la 20:30, din ce scrii în jurnal: ce s-a întâmplat și taskurile pe zilele
              următoare.
            </p>
          )}

          <Link
            href="/admin/azi/liste"
            className="block rounded-2xl border border-dashed border-slate-300 px-5 py-3 text-xs text-slate-500 hover:border-slate-400 hover:text-slate-900"
          >
            Liste din date: firme cu follow-up restant, cereri fără status, clienți de întrebat →
          </Link>
        </aside>
      </div>
    </div>
  );
}
