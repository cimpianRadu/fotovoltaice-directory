import 'server-only';
import { getEventValues } from '@/lib/umami';
import { isValidRunStart } from '@/lib/sponsor-run';
import {
  POSITION_AUDIENCE,
  SPONSOR_POSITION_LABELS,
  type SponsorAudience,
  type SponsorPosition,
} from '@/lib/sponsor-positions';

/**
 * Raportul lunar contractual al unui singur partener (art. 4.3 din contractul
 * de parteneriat: se trimite până în ziua 10 a lunii următoare).
 *
 * Regula care ține tot fișierul: **o cifră lipsă nu e zero**. Dacă interogarea
 * către Umami pică, valoarea rămâne `null` și se scrie „nedisponibil" în raport.
 * Un zero inventat într-un document care ajunge la un client plătitor e mai rău
 * decât o casetă goală.
 *
 * Sursele, per eveniment:
 * - bannerul („Furnizori Recomandați") trimite `sp` = `slug|plasare`, singura
 *   proprietate care separă doi parteneri afișați pe aceleași pagini;
 * - popup-ul dreapta-jos e altă componentă (`PartnerCarousel`) și trimite
 *   `partner` = slug, fără plasare — de aceea intră ca rând sintetic.
 */

export type MonthKey = { year: number; month: number }; // month: 1-12

export type PositionRow = {
  position: string;
  label: string;
  audience: SponsorAudience | null;
  imp: number;
  clicks: number;
  calls: number;
  wa: number;
  social: number;
};

export type Totals = {
  imp: number;
  clicks: number;
  calls: number;
  wa: number;
  social: number;
  /** clicuri + apeluri + WhatsApp + Facebook */
  engaged: number;
};

export type SponsorMonthReport = {
  slug: string;
  month: MonthKey;
  monthLabel: string;
  prevMonthLabel: string;
  startAt: number;
  endAt: number;
  rows: PositionRow[];
  totals: Totals | null;
  prevTotals: Totals | null;
  /**
   * Luna de comparație e dinaintea primei zile plătite. Un „0" acolo ar fi
   * adevărat și înșelător în același timp — face luna curentă să pară o
   * creștere, când de fapt partenerul încă nu era pe site.
   */
  prevBeforeStart: boolean;
  byAudience: Record<SponsorAudience, Totals>;
  errors: string[];
};

const MONTH_NAMES = [
  'ianuarie',
  'februarie',
  'martie',
  'aprilie',
  'mai',
  'iunie',
  'iulie',
  'august',
  'septembrie',
  'octombrie',
  'noiembrie',
  'decembrie',
];

export function monthLabel({ year, month }: MonthKey): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function monthParam({ year, month }: MonthKey): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function addMonths(key: MonthKey, delta: number): MonthKey {
  const d = new Date(key.year, key.month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

/** Ultima lună încheiată — raportul se trimite pentru ea, nu pentru cea curentă. */
export function lastCompletedMonth(now = new Date()): MonthKey {
  return addMonths({ year: now.getFullYear(), month: now.getMonth() + 1 }, -1);
}

/**
 * `luna=YYYY-MM` din URL. Orice altceva (lipsă, format greșit, lună imposibilă)
 * cade pe ultima lună încheiată, ca linkul din admin să nu poată da 500.
 */
export function parseMonthParam(value: string | undefined, now = new Date()): MonthKey {
  const m = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  if (!m) return lastCompletedMonth(now);
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12 || year < 2024 || year > now.getFullYear() + 1) {
    return lastCompletedMonth(now);
  }
  return { year, month };
}

function monthRange({ year, month }: MonthKey): { startAt: number; endAt: number } {
  // Aceeași convenție de fus ca `resolveRange` din `lib/umami` (ora serverului),
  // ca cifrele din raport să se potrivească la virgulă cu panoul de analytics.
  return {
    startAt: new Date(year, month - 1, 1).getTime(),
    endAt: new Date(year, month, 1).getTime() - 1,
  };
}

const emptyTotals = (): Totals => ({
  imp: 0,
  clicks: 0,
  calls: 0,
  wa: 0,
  social: 0,
  engaged: 0,
});

const withEngaged = (t: Totals): Totals => ({
  ...t,
  engaged: t.clicks + t.calls + t.wa + t.social,
});

export function ctr(t: Totals): number | null {
  return t.imp > 0 ? (t.engaged / t.imp) * 100 : null;
}

type Metric = keyof Omit<Totals, 'engaged'>;

const BANNER_EVENTS: { event: string; metric: Metric }[] = [
  { event: 'sponsor-impression', metric: 'imp' },
  { event: 'sponsor-click', metric: 'clicks' },
  { event: 'sponsor-call', metric: 'calls' },
  { event: 'sponsor-whatsapp', metric: 'wa' },
  { event: 'sponsor-social', metric: 'social' },
];

const CAROUSEL_EVENTS: { event: string; metric: Metric }[] = [
  { event: 'partner-carousel-view', metric: 'imp' },
  { event: 'partner-carousel-click', metric: 'clicks' },
];

type Fetched = { rows: { value: string; total: number }[] | null; error: string | null };

async function safeValues(
  startAt: number,
  endAt: number,
  event: string,
  propertyName: string,
): Promise<Fetched> {
  try {
    return { rows: await getEventValues(startAt, endAt, event, propertyName), error: null };
  } catch (e) {
    return { rows: null, error: `${event}: ${e instanceof Error ? e.message : String(e)}` };
  }
}

/**
 * Cifrele unei singure luni pentru un singur partener, împărțite pe plasări.
 * `null` la rândul de totaluri înseamnă că Umami n-a răspuns — nu că n-au fost
 * afișări.
 */
async function fetchMonth(slug: string, key: MonthKey) {
  const { startAt, endAt } = monthRange(key);

  const [banner, carousel] = await Promise.all([
    Promise.all(
      BANNER_EVENTS.map(async ({ event, metric }) => ({
        metric,
        ...(await safeValues(startAt, endAt, event, 'sp')),
      })),
    ),
    Promise.all(
      CAROUSEL_EVENTS.map(async ({ event, metric }) => ({
        metric,
        ...(await safeValues(startAt, endAt, event, 'partner')),
      })),
    ),
  ]);

  const errors = [...banner, ...carousel].map((r) => r.error).filter(Boolean) as string[];
  const allFailed = banner.every((r) => r.rows === null);

  const byPosition = new Map<string, Totals>();

  banner.forEach(({ metric, rows }) => {
    (rows ?? []).forEach((r) => {
      const [rowSlug, position] = r.value.split('|');
      if (rowSlug !== slug || !position) return;
      const cell = byPosition.get(position) ?? emptyTotals();
      cell[metric] = r.total;
      byPosition.set(position, cell);
    });
  });

  // Popup: componentă separată, fără plasare în proprietate. Intră ca rând
  // propriu ca să nu pară că bannerul a produs clicurile din colțul paginii.
  const popup = emptyTotals();
  let popupSeen = false;
  carousel.forEach(({ metric, rows }) => {
    (rows ?? []).forEach((r) => {
      if (r.value !== slug) return;
      popup[metric] = r.total;
      popupSeen = true;
    });
  });
  if (popupSeen) byPosition.set('popup', popup);

  const rows: PositionRow[] = Array.from(byPosition.entries())
    .map(([position, t]) => ({
      position,
      label: SPONSOR_POSITION_LABELS[position as SponsorPosition] ?? position,
      audience: POSITION_AUDIENCE[position as SponsorPosition] ?? null,
      ...withEngaged(t),
    }))
    .sort((a, b) => b.imp - a.imp || a.label.localeCompare(b.label, 'ro'));

  const totals = rows.reduce((acc, r) => {
    acc.imp += r.imp;
    acc.clicks += r.clicks;
    acc.calls += r.calls;
    acc.wa += r.wa;
    acc.social += r.social;
    return acc;
  }, emptyTotals());

  const byAudience: Record<SponsorAudience, Totals> = {
    client: emptyTotals(),
    instalator: emptyTotals(),
  };
  rows.forEach((r) => {
    if (!r.audience) return;
    const t = byAudience[r.audience];
    t.imp += r.imp;
    t.clicks += r.clicks;
    t.calls += r.calls;
    t.wa += r.wa;
    t.social += r.social;
  });

  return {
    startAt,
    endAt,
    rows,
    totals: allFailed ? null : withEngaged(totals),
    byAudience: {
      client: withEngaged(byAudience.client),
      instalator: withEngaged(byAudience.instalator),
    },
    errors,
  };
}

export async function getSponsorMonthReport(
  slug: string,
  key: MonthKey,
  options: { runStart?: string } = {},
): Promise<SponsorMonthReport> {
  const prevKey = addMonths(key, -1);
  const prevRange = monthRange(prevKey);
  const startDay =
    options.runStart && isValidRunStart(options.runStart)
      ? (() => {
          const [y, m, d] = options.runStart!.split('-').map(Number);
          return new Date(y, m - 1, d).getTime();
        })()
      : null;
  const prevBeforeStart = startDay !== null && prevRange.endAt < startDay;

  const [current, prev] = await Promise.all([
    fetchMonth(slug, key),
    prevBeforeStart ? Promise.resolve(null) : fetchMonth(slug, prevKey),
  ]);

  return {
    slug,
    month: key,
    monthLabel: monthLabel(key),
    prevMonthLabel: monthLabel(prevKey),
    startAt: current.startAt,
    endAt: current.endAt,
    rows: current.rows,
    totals: current.totals,
    prevTotals: prev?.totals ?? null,
    prevBeforeStart,
    byAudience: current.byAudience,
    errors: [...current.errors, ...(prev?.errors ?? [])],
  };
}

const nr = (v: number | null | undefined) =>
  v === null || v === undefined ? 'nedisponibil' : v.toLocaleString('ro-RO');

/**
 * Aceleași cifre ca pagina, în markdown, după structura din
 * `clienti/<partener>/raport-lunar-template.md`. Secțiunile care cer judecată
 * (postările de pe Facebook, observațiile) rămân cu casete goale — nu se
 * completează automat și nu se estimează.
 */
export function reportToMarkdown(report: SponsorMonthReport, partnerName: string): string {
  const { totals, prevTotals, byAudience } = report;
  const period = `${new Date(report.startAt).toLocaleDateString('ro-RO')} – ${new Date(
    report.endAt,
  ).toLocaleDateString('ro-RO')}`;

  const prevCell = (key: keyof Totals) =>
    report.prevBeforeStart ? 'nu era activ' : nr(prevTotals?.[key] ?? null);

  const summaryRow = (label: string, key: keyof Totals) =>
    `| ${label} | ${nr(totals?.[key] ?? null)} | ${prevCell(key)} |`;

  const audienceRow = (label: string, t: Totals) =>
    `| ${label} | ${nr(totals ? t.imp : null)} | ${nr(totals ? t.engaged : null)} |`;

  const positionRows = report.rows.length
    ? report.rows
        .map((r) => `| ${r.label} | ${nr(r.imp)} | ${nr(r.clicks)} |`)
        .join('\n')
    : '| — | nedisponibil | nedisponibil |';

  return `# Raport lunar — ${partnerName}

**Perioada:** ${period} (${report.monthLabel})
**Site:** instalatori-fotovoltaice.ro
**Sursa cifrelor:** Umami (evenimentele proprii ale site-ului)

---

## 1. Pe scurt

| Indicator | ${report.monthLabel} | ${report.prevMonthLabel} |
|---|---|---|
${summaryRow('Afișări ale slotului', 'imp')}
${summaryRow('Clicuri către site', 'clicks')}
${summaryRow('Apeluri telefonice', 'calls')}
${summaryRow('Mesaje WhatsApp', 'wa')}
${summaryRow('Clicuri Facebook', 'social')}
${summaryRow('**Total interacțiuni**', 'engaged')}

## 2. Defalcare pe audiență

| Audiență | Afișări | Interacțiuni |
|---|---|---|
${audienceRow('Clienți (caută instalator)', byAudience.client)}
${audienceRow('Instalatori (caută de lucru)', byAudience.instalator)}

## 3. Defalcare pe pagină

| Pagina | Afișări | Clicuri |
|---|---|---|
${positionRows}

## 4. Postările de pe Facebook

| Data | Subiect | Link |
|---|---|---|
| [ ] | [ ] | [ ] |
| [ ] | [ ] | [ ] |

*Cifrele de reach și reacții se văd direct în pagina de Facebook; nu fac parte din raport și nu sunt garantate contractual.*

## 5. Observații și propuneri

[ ]

---

*Total interacțiuni = clicuri către site + apeluri + WhatsApp + Facebook. Afișările din popup se numără la deschiderea popup-ului, doar când partenerul era primul în rotație. Previzualizările (\`?preview=\`) nu trimit evenimente.*
`;
}
