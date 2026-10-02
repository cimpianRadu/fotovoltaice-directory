import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import sponsorsData from '@/data/sponsors.json';
import {
  addMonths,
  ctr,
  getSponsorMonthReport,
  lastCompletedMonth,
  monthLabel,
  monthParam,
  parseMonthParam,
  reportToMarkdown,
  type Totals,
} from '@/lib/sponsor-report';
import { ErrorBanner } from '../../../page';
import ReportActions from './ReportActions';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ luna?: string }>;

type SponsorEntry = {
  slug: string;
  name: string;
  location?: string;
  run?: { start: string; days: number };
};

const SPONSORS = sponsorsData.sponsors as SponsorEntry[];

const AUDIENCE_LABELS = {
  client: 'Clienți (caută instalator)',
  instalator: 'Instalatori (caută de lucru)',
} as const;

/** Luna dinaintea primei zile plătite nu se compară — vezi `prevBeforeStart`. */
function PrevCell({ value, before }: { value: number | null; before: boolean }) {
  if (before) return <span className="text-slate-400 italic">nu era activ</span>;
  return <Num value={value} />;
}

/** O cifră lipsă se scrie, nu se rotunjește la zero. */
function Num({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-400 italic">nedisponibil</span>;
  return <>{value.toLocaleString('ro-RO')}</>;
}

/** Titlu de secțiune cu numărul în bulina amber a brandului. */
function SectionTitle({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2.5 text-sm font-semibold text-secondary-dark uppercase tracking-wider">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
        {n}
      </span>
      {children}
    </h3>
  );
}

function Delta({ current, prev }: { current: number | null; prev: number | null }) {
  if (current === null || prev === null || prev === 0) return null;
  const pct = Math.round(((current - prev) / prev) * 100);
  if (pct === 0) return <span className="text-slate-400 text-xs ml-2">=</span>;
  return (
    <span
      className={`text-xs ml-2 ${pct > 0 ? 'text-emerald-600' : 'text-slate-500'}`}
    >
      {pct > 0 ? '+' : ''}
      {pct}%
    </span>
  );
}

export default async function RaportSponsorPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const sponsor = SPONSORS.find((s) => s.slug === slug);
  if (!sponsor) notFound();

  const month = parseMonthParam(sp.luna);
  const report = await getSponsorMonthReport(slug, month, { runStart: sponsor.run?.start });
  const markdown = reportToMarkdown(report, sponsor.name);

  const prevMonth = addMonths(month, -1);
  const nextMonth = addMonths(month, 1);
  const now = new Date();
  const isFuture =
    nextMonth.year > now.getFullYear() ||
    (nextMonth.year === now.getFullYear() && nextMonth.month > now.getMonth() + 1);
  const isCurrentMonth =
    month.year === now.getFullYear() && month.month === now.getMonth() + 1;

  const t = report.totals;
  const p = report.prevTotals;

  const SUMMARY: { label: string; key: keyof Totals }[] = [
    { label: 'Afișări ale slotului', key: 'imp' },
    { label: 'Clicuri către site', key: 'clicks' },
    { label: 'Apeluri telefonice', key: 'calls' },
    { label: 'Mesaje WhatsApp', key: 'wa' },
    { label: 'Clicuri Facebook', key: 'social' },
  ];

  const rate = t ? ctr(t) : null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <Link
            href="/admin/analytics/sponsori"
            className="text-xs text-slate-500 hover:text-slate-900"
          >
            ← Sponsori &amp; Parteneri
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">
            Raport lunar · {sponsor.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Doar cifrele acestui partener. De trimis până în ziua 10 a lunii următoare.
          </p>
        </div>
        <ReportActions markdown={markdown} />
      </div>

      <div className="flex items-center gap-2 print:hidden">
        <Link
          href={`/admin/analytics/sponsori/raport/${slug}?luna=${monthParam(prevMonth)}`}
          className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          ← {monthLabel(prevMonth)}
        </Link>
        <span className="px-3 py-1.5 text-xs rounded-md bg-slate-900 text-white capitalize">
          {report.monthLabel}
        </span>
        {!isFuture && (
          <Link
            href={`/admin/analytics/sponsori/raport/${slug}?luna=${monthParam(nextMonth)}`}
            className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            {monthLabel(nextMonth)} →
          </Link>
        )}
        <Link
          href={`/admin/analytics/sponsori/raport/${slug}?luna=${monthParam(lastCompletedMonth())}`}
          className="ml-auto text-xs text-slate-500 hover:text-slate-900 underline"
        >
          ultima lună încheiată
        </Link>
      </div>

      {report.errors.length > 0 && <ErrorBanner errors={report.errors} />}

      {isCurrentMonth && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 print:hidden">
          Luna curentă e incompletă — cifrele cresc până la 1 ale lunii viitoare. Raportul
          contractual se trimite pe luna încheiată.
        </div>
      )}

      {/* Foaia care ajunge la partener. De la aici în jos, totul e vizibil și la print. */}
      {/* printColorAdjust: fără el, Chrome scoate fundalurile (banda amber, bulinele)
          din PDF. */}
      <div
        className="bg-white border border-slate-200 rounded-lg overflow-hidden print:border-0 print:rounded-none"
        style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
      >
        <div className="h-1.5 bg-primary" />
        <div className="p-6 space-y-8 print:px-0">
          <div className="flex items-center justify-between gap-4 pb-5 border-b-2 border-secondary">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="" width={44} height={44} className="w-11 h-11" />
              <div>
                <div className="text-lg font-bold text-secondary-dark leading-tight">
                  Instalatori Fotovoltaice
                </div>
                <div className="text-xs text-slate-500">instalatori-fotovoltaice.ro</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary-dark">
                Raport partener
              </div>
              <div className="text-sm font-medium text-secondary-dark capitalize">
                {report.monthLabel}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-secondary-dark">
              Raport lunar — {sponsor.name}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Perioada {new Date(report.startAt).toLocaleDateString('ro-RO')} –{' '}
              {new Date(report.endAt).toLocaleDateString('ro-RO')}
            </p>
          </div>

          {/* 1. Pe scurt */}
          <section className="space-y-3">
            <SectionTitle n={1}>Pe scurt</SectionTitle>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-secondary-light border-b-2 border-secondary/20">
                <tr>
                  <th className="text-left py-2 font-medium">Indicator</th>
                  <th className="text-right py-2 font-medium capitalize">{report.monthLabel}</th>
                  <th className="text-right py-2 font-medium capitalize">
                    {report.prevMonthLabel}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SUMMARY.map((row) => (
                  <tr key={row.key}>
                    <td className="py-2 text-slate-700">{row.label}</td>
                    <td className="py-2 text-right tabular-nums">
                      <Num value={t ? t[row.key] : null} />
                      <Delta current={t ? t[row.key] : null} prev={p ? p[row.key] : null} />
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-500">
                      <PrevCell value={p ? p[row.key] : null} before={report.prevBeforeStart} />
                    </td>
                  </tr>
                ))}
                <tr className="font-semibold bg-primary/10">
                  <td className="py-2 pl-2 text-secondary-dark">Total interacțiuni</td>
                  <td className="py-2 text-right tabular-nums">
                    <Num value={t ? t.engaged : null} />
                    <Delta current={t ? t.engaged : null} prev={p ? p.engaged : null} />
                  </td>
                  <td className="py-2 pr-2 text-right tabular-nums text-slate-500">
                    <PrevCell value={p ? p.engaged : null} before={report.prevBeforeStart} />
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-slate-500">
              {report.prevBeforeStart && (
                <>
                  Luna de comparație e dinaintea primei zile de rulare, deci nu are cifre de
                  pus alături.{' '}
                </>
              )}
              Total interacțiuni = clicuri către site + apeluri + WhatsApp + Facebook
              {rate !== null && (
                <>
                  {' '}
                  · rată de interacțiune{' '}
                  {rate.toLocaleString('ro-RO', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  % din afișări
                </>
              )}
              .
            </p>
          </section>

          {/* 2. Audiență */}
          <section className="space-y-3">
            <SectionTitle n={2}>Defalcare pe audiență</SectionTitle>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-secondary-light border-b-2 border-secondary/20">
                <tr>
                  <th className="text-left py-2 font-medium">Audiență</th>
                  <th className="text-right py-2 font-medium">Afișări</th>
                  <th className="text-right py-2 font-medium">Interacțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(['client', 'instalator'] as const).map((aud) => (
                  <tr key={aud}>
                    <td className="py-2 text-slate-700">{AUDIENCE_LABELS[aud]}</td>
                    <td className="py-2 text-right tabular-nums">
                      <Num value={t ? report.byAudience[aud].imp : null} />
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      <Num value={t ? report.byAudience[aud].engaged : null} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-500">
              Audiența se deduce din pagina pe care a apărut slotul: paginile de instalatori
              sunt feedul de cereri, portalul și formularul de listare.
            </p>
          </section>

          {/* 3. Pagini */}
          <section className="space-y-3">
            <SectionTitle n={3}>Defalcare pe pagină</SectionTitle>
            {report.rows.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t === null
                  ? 'Cifrele nu au putut fi citite din Umami pentru această lună.'
                  : 'Niciun eveniment înregistrat pentru acest partener în luna selectată.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead className="text-xs uppercase text-secondary-light border-b-2 border-secondary/20">
                    <tr>
                      <th className="text-left py-2 font-medium">Pagina</th>
                      <th className="text-right py-2 font-medium">Afișări</th>
                      <th className="text-right py-2 font-medium">Clicuri site</th>
                      <th className="text-right py-2 font-medium">Apeluri</th>
                      <th className="text-right py-2 font-medium">WhatsApp</th>
                      <th className="text-right py-2 font-medium">Facebook</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.rows.map((r) => (
                      <tr key={r.position}>
                        <td className="py-2 text-slate-700">{r.label}</td>
                        <td className="py-2 text-right tabular-nums">
                          {r.imp.toLocaleString('ro-RO')}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {r.clicks.toLocaleString('ro-RO')}
                        </td>
                        <td className="py-2 text-right tabular-nums font-medium text-emerald-700">
                          {r.calls.toLocaleString('ro-RO')}
                        </td>
                        <td className="py-2 text-right tabular-nums font-medium text-emerald-700">
                          {r.wa.toLocaleString('ro-RO')}
                        </td>
                        <td className="py-2 text-right tabular-nums text-slate-500">
                          {r.social.toLocaleString('ro-RO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-slate-500">
              Afișările din popup se numără la deschiderea popup-ului, doar când partenerul era
              primul în rotație. Previzualizările (<code className="font-mono">?preview=</code>)
              nu trimit evenimente.
            </p>
          </section>

          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
            <span>
              <span className="font-semibold text-secondary-dark">Instalatori Fotovoltaice</span>{' '}
              · instalatori-fotovoltaice.ro
            </span>
            <span>contact@instalatori-fotovoltaice.ro</span>
          </div>
        </div>
      </div>

      {/* Markdown-ul, gata de lipit în email. Vizibil ca fallback dacă clipboard-ul
          e blocat în browserul curent. */}
      <details className="print:hidden">
        <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-900">
          Vezi markdown-ul trimis
        </summary>
        <textarea
          id="raport-markdown"
          readOnly
          value={markdown}
          rows={24}
          className="mt-2 w-full font-mono text-[11px] p-3 border border-slate-200 rounded-lg bg-white text-slate-700"
        />
      </details>
    </div>
  );
}
