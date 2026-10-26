import type { TimelineItem, TimelineKind } from './timeline';
import { fmtDateTime, fmtDay } from './shared';

// Cronologia unei cereri, desenată la fel în fișă și în modalul din listă.
// Fără hook-uri și fără date de server, ca să meargă în ambele.

const KIND_DOT: Record<TimelineKind, string> = {
  intrare: 'bg-slate-900',
  firma: 'bg-indigo-500',
  client: 'bg-emerald-500',
  email: 'bg-sky-400',
  stare: 'bg-amber-500',
  nota: 'bg-slate-300',
  vizita: 'bg-violet-400',
};

const KIND_LABEL: Record<TimelineKind, string> = {
  intrare: 'Intrare',
  firma: 'Firmă',
  client: 'Client',
  email: 'Email',
  stare: 'Stare',
  nota: 'Notă',
  vizita: 'Vizită',
};

export default function TimelineList({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative space-y-3 border-l border-slate-200 pl-4">
      {items.map((t, i) => (
        <li key={`${t.at}-${i}`} className="relative">
          <span
            className={`absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full ring-2 ring-white ${KIND_DOT[t.kind]}`}
          />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-xs whitespace-nowrap text-slate-400 tabular-nums">
              {t.dayOnly ? fmtDay(t.at) : fmtDateTime(t.at)}
            </span>
            <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
              {KIND_LABEL[t.kind]}
            </span>
          </div>
          <div className="text-sm text-slate-800">{t.title}</div>
          {/* Notele sunt mesajele lăsate de cineva: se citesc, nu se ghicesc din titlu. */}
          {t.detail &&
            (t.kind === 'nota' ? (
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs whitespace-pre-line text-slate-700">
                {t.detail}
              </p>
            ) : (
              <div className="text-xs whitespace-pre-line text-slate-500">{t.detail}</div>
            ))}
        </li>
      ))}
    </ol>
  );
}
