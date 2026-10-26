import Link from 'next/link';
import {
  getCrmFirms,
  getListingsSince,
  isSameFirm,
  FIRM_STATUS_LABELS,
  type CrmFirm,
} from '@/lib/sheets';
import { normalizeFirmName } from '@/lib/sheets-shared';
import { getCompanies } from '@/lib/utils';
import { allNecesitFirms, necesitGeneratedAt, type NecesitFirm } from '@/lib/necesit-match';
import { getNecesitFin, type NecesitFin, type NecesitFinData } from '@/lib/necesit-fin';
import NecesitCrm, { type FirmCard } from './NecesitCrm';
import CountyFilter from './CountyFilter';

export const dynamic = 'force-dynamic';

/**
 * Firmele de pe necesit.ro, ca listă de apeluri. necesit e concurentul care ne
 * bate la trafic, dar își expune public instalatorii — iar cei marcați „partener"
 * (au „Oferte trimise" / „Răspunde în X") plătesc deja pentru cereri. Aia e proba
 * tare pe care nu o avem despre nimeni altcineva: firma cumpără lead-uri.
 *
 * Datele vin din `data/necesit-firms.json` (`node scripts/necesit-scan.mjs --build`),
 * iar notițele se scriu în fișa din „CRM Firme", nu într-un tab paralel.
 */

const FILTERS = ['platesc', 'telefon', 'fisa', 'toate'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_LABELS: Record<Filter, string> = {
  platesc: 'Plătesc pentru cereri',
  telefon: 'Cu telefon',
  fisa: 'Contactate',
  toate: 'Toate firmele scanate',
};

/** „500+" / „200+" / „100+" → cât de mult cumpără. Gol = partener fără cifră. */
function offersWeight(offers: string): number {
  const n = parseInt(offers, 10);
  return Number.isFinite(n) ? Math.min(4, Math.round(n / 150) + 2) : 0;
}

/**
 * Mărimea după cifra de afaceri din ultimul bilanț. Banda vine din firmele care au
 * ajuns la ofertă din cererile noastre (Enera 4,3 mil., East Solar 4,7, Voltech
 * 12,3, AXIONET 12,7, Stratospark 25,4; 6–20 angajați), citite pe 21 aug 2026.
 * Peste 40 mil. e JTS: 22 de cereri revendicate, niciuna lucrată.
 */
type SizeBand = 'mica' | 'sub' | 'banda' | 'peste' | 'mare';

const BAND: Record<SizeBand, { label: string; points: number; tone: string }> = {
  mica: { label: 'mică, sub 1 mil.', points: -2, tone: 'bg-slate-100 text-slate-500' },
  sub: { label: 'sub bandă, 1–4 mil.', points: 1, tone: 'bg-slate-100 text-slate-600' },
  banda: { label: 'în bandă, 4–25 mil.', points: 4, tone: 'bg-emerald-100 text-emerald-700' },
  peste: { label: 'peste bandă, 25–40 mil.', points: 0, tone: 'bg-slate-100 text-slate-600' },
  mare: { label: 'mare, peste 40 mil.', points: -2, tone: 'bg-slate-100 text-slate-500' },
};

function sizeBand(ca: number): SizeBand {
  if (ca < 1_000_000) return 'mica';
  if (ca < 4_000_000) return 'sub';
  if (ca <= 25_000_000) return 'banda';
  if (ca <= 40_000_000) return 'peste';
  return 'mare';
}

/** Ultimul an cu bilanț, plus scăderea față de vârful anilor de dinainte (ca la /admin/tinta). */
function lastYear(size: NecesitFin | undefined) {
  if (!size) return null;
  const years = Object.keys(size.fin).sort();
  const year = years.at(-1);
  if (!year) return null;
  const peakYear = years.slice(0, -1).sort((a, b) => size.fin[b].ca - size.fin[a].ca)[0];
  const peak = peakYear ? size.fin[peakYear].ca : 0;
  const drop = peak >= 300_000 && size.fin[year].ca <= peak * 0.7 ? Math.round((1 - size.fin[year].ca / peak) * 100) : 0;
  return { year, ...size.fin[year], band: sizeBand(size.fin[year].ca), drop, peakYear };
}

type Tier = 1 | 2 | 3;

interface Verdict {
  tier: Tier;
  label: string;
  score: number;
  /** De unde vine scorul, punct cu punct. Apare la hover pe verdict. */
  points: { label: string; pts: number }[];
}

interface Row {
  firm: NecesitFirm;
  /** Toate județele în care apare firma pe necesit — acoperă mai multe orașe. */
  counties: string[];
  phone: string;
  /** De unde e numărul — necesit nu publică telefoane, toate sunt recuperate. */
  phoneSource: string;
  company: { id: string; slug: string; name: string } | undefined;
  card: CrmFirm | null;
  size: NecesitFin | undefined;
  verdict: Verdict;
}

/**
 * Merită sunată? Treapta spune cu cine începi, scorul ordonează în treaptă.
 * Sună prima: plătește deja pentru cereri ȘI are mărimea firmelor care le lucrează.
 * Merită: una din cele două. La urmă: fără telefon, închisă, refuzată sau în afara benzii.
 */
function judge(f: NecesitFirm, phone: string, size: NecesitFin | undefined, card: CrmFirm | null): Verdict {
  const points: Verdict['points'] = [];
  const add = (label: string, pts: number) => points.push({ label, pts });

  if (f.partner) add('plătește pentru cereri pe necesit', 3);
  const offers = offersWeight(f.offers);
  if (offers) add(`${f.offers} oferte trimise`, offers);
  if (f.responds) add(`răspunde în ${f.responds}`, 2);
  if (f.verified) add('verificat necesit', 1);
  if (f.pvOnly) add('doar fotovoltaice', 2);
  if (f.afm) add('validată AFM Casa Verde', 2);
  if (f.lastReviewMonths !== null && f.lastReviewMonths <= 12) add('recenzie în ultimul an', 1);
  if (phone) {
    if (f.phone && f.anreActive) add('ANRE activ', 1);
  } else {
    add('fără telefon', -4);
  }

  const last = lastYear(size);
  if (last) {
    add(`${BAND[last.band].label} lei (${last.year})`, BAND[last.band].points);
    if (last.emp <= 2) add(`${last.emp} angajați`, -1);
    else if (last.emp >= 6 && last.emp <= 20) add(`${last.emp} angajați`, 1);
    if (last.drop) add(`cifra −${last.drop}% față de ${last.peakYear}: caută lucrări`, 1);
  }
  const closed = size?.status.length ? size.status.join(', ') : '';
  if (closed) add(`ONRC: ${closed}`, -6);

  const score = points.reduce((s, p) => s + p.pts, 0);
  const band = last?.band;

  if (card?.status === 'refuzat') return { tier: 3, label: 'a refuzat', score, points };
  if (card?.status === 'client') return { tier: 3, label: 'deja client', score, points };
  if (!phone) return { tier: 3, label: 'fără telefon', score, points };
  if (closed) return { tier: 3, label: 'firmă închisă', score, points };
  if (f.partner && band === 'banda') return { tier: 1, label: 'sună prima', score, points };
  if ((f.partner && band !== 'mare') || band === 'banda') return { tier: 2, label: 'merită sunată', score, points };
  return { tier: 3, label: 'la urmă', score, points };
}

const TIER_TONE: Record<Tier, string> = {
  1: 'bg-emerald-600 text-white',
  2: 'bg-amber-100 text-amber-800',
  3: 'bg-slate-100 text-slate-500',
};

const lei = (n: number) =>
  Math.abs(n) >= 1_000_000
    ? `${(n / 1_000_000).toLocaleString('ro-RO', { maximumFractionDigits: 1 })} mil. lei`
    : `${Math.round(n / 1000).toLocaleString('ro-RO')} mii lei`;

function SizeLine({ size, loaded }: { size: NecesitFin | undefined; loaded: boolean }) {
  if (!loaded) return null;
  if (!size) {
    return <p className="mt-1.5 text-[11px] text-slate-400">mărime necunoscută: n-am găsit firma în ONRC după nume</p>;
  }
  const last = lastYear(size);
  const where = `${size.name}, ${size.judet} · ${size.via === 'director' ? 'CUI din directorul nostru' : 'potrivită pe nume și județ în ONRC'}`;
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-slate-600">
      {last ? (
        <>
          <Badge tone={BAND[last.band].tone}>{BAND[last.band].label}</Badge>
          <span>
            <strong className="font-semibold text-slate-800">{lei(last.ca)}</strong> cifră de afaceri {last.year}
            {last.drop > 0 && <span className="text-red-600"> (−{last.drop}% față de {last.peakYear})</span>}
          </span>
          <span className="text-slate-300">·</span>
          <span>{last.emp} angajați</span>
          <span className="text-slate-300">·</span>
          <span className={last.profit < 0 ? 'text-red-600' : ''}>
            {last.profit < 0 ? 'pierdere' : 'profit'} {lei(Math.abs(last.profit))}
          </span>
        </>
      ) : (
        <span className="text-slate-400">fără bilanț depus în ultimii 3 ani</span>
      )}
      <span className="text-slate-300">·</span>
      <span className="text-slate-400" title={where}>
        CUI {size.cui}
      </span>
      {size.status.length > 0 && <span className="font-semibold text-red-600">ONRC: {size.status.join(', ')}</span>}
    </p>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
      {hint && <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? 'bg-slate-900 text-white'
          : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
    </Link>
  );
}

function Badge({ tone, title, children }: { tone: string; title?: string; children: React.ReactNode }) {
  return (
    <span
      title={title}
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${tone}`}
    >
      {children}
    </span>
  );
}

function FirmCard_({ row, sizesLoaded }: { row: Row; sizesLoaded: boolean }) {
  const { firm, counties, phone, phoneSource, company, card, size, verdict } = row;
  const breakdown = verdict.points.map((p) => `${p.pts > 0 ? '+' : ''}${p.pts}  ${p.label}`).join('\n');
  const buys = [firm.offers && `${firm.offers} oferte trimise`, firm.responds && `răspunde în ${firm.responds}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900">{firm.name}</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {firm.locality || counties[0]}, {counties.join(' · ')}
              {phone && (
                <>
                  {' · '}
                  <a href={`tel:${phone}`} className="font-medium text-slate-700 hover:text-slate-900">
                    {phone}
                  </a>
                  <span className="text-slate-400"> ({phoneSource})</span>
                </>
              )}
              {!phone && <span className="text-slate-400"> · fără telefon</span>}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              title={`Scor ${verdict.score}:\n${breakdown}`}
              className={`cursor-help rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${TIER_TONE[verdict.tier]}`}
            >
              {verdict.label} · {verdict.score}
            </span>
            {card && (
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
                {FIRM_STATUS_LABELS[card.status]}
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {firm.partner ? (
            <Badge tone="bg-amber-100 text-amber-800" title={buys || 'marcată partener pe necesit'}>
              plătește pentru cereri
            </Badge>
          ) : (
            <Badge
              tone="bg-slate-100 text-slate-600"
              title="Apare în listele necesit, dar cererile de pe pagina ei se duc la partenerii plătitori."
            >
              listată, nu colaborează
            </Badge>
          )}
          {firm.pvOnly ? (
            <Badge tone="bg-emerald-100 text-emerald-700">doar fotovoltaice</Badge>
          ) : (
            <Badge tone="bg-slate-100 text-slate-500">generalist +{firm.nonSolar}</Badge>
          )}
          {firm.afm && <Badge tone="bg-sky-100 text-sky-700">AFM Casa Verde</Badge>}
          {firm.phone && firm.anreActive && <Badge tone="bg-slate-100 text-slate-600">ANRE activ</Badge>}
          {firm.verified && <Badge tone="bg-slate-100 text-slate-600">verificat necesit</Badge>}
          {company && (
            <Link href={`/firme/${company.slug}`} className="text-[10px] font-semibold text-amber-700 hover:underline">
              în directorul nostru →
            </Link>
          )}
        </div>

        <SizeLine size={size} loaded={sizesLoaded} />

        {buys && <p className="mt-1.5 text-[11px] text-slate-500">{buys}</p>}

        <p className="mt-1.5 text-[11px]">
          <a href={firm.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900">
            profilul de pe necesit.ro →
          </a>
        </p>
      </header>

      <div className="px-4 py-3">
        <NecesitCrm
          card={card as FirmCard | null}
          identity={{ firmId: company?.id ?? '', numeFirma: firm.name, telefon: phone }}
        />
      </div>
    </article>
  );
}

interface Props {
  searchParams: Promise<{ judet?: string; filtru?: string }>;
}

export default async function NecesitPage({ searchParams }: Props) {
  const { judet, filtru } = await searchParams;
  const activeFilter: Filter = (FILTERS as readonly string[]).includes(filtru || '')
    ? (filtru as Filter)
    : 'platesc';

  // Mărimea e un plus: dacă baza nu răspunde, lista de apeluri merge și fără ea.
  const sizesPromise = getNecesitFin().catch((err): NecesitFinData | null => {
    console.error('[admin/necesit] mărimea firmelor din Neon:', err);
    return null;
  });

  let cards: CrmFirm[];
  let listingPhones: Map<string, string>;
  try {
    const [crmFirms, listings] = await Promise.all([getCrmFirms(), getListingsSince(new Date(0))]);
    cards = crmFirms;
    listingPhones = new Map(
      listings
        .filter((l) => l.numeFirma && l.telefon)
        .map((l) => [normalizeFirmName(l.numeFirma), l.telefon]),
    );
  } catch (err) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Nu am putut citi din Google Sheets: {err instanceof Error ? err.message : String(err)}
      </div>
    );
  }

  const sizes = await sizesPromise;
  const companies = getCompanies();
  const byName = new Map(companies.map((c) => [normalizeFirmName(c.name), c]));

  // Scanarea are un rând per firmă și oraș, deci 53 de firme care acoperă mai
  // multe orașe apar de două-trei ori. Pe o listă de apeluri asta înseamnă să
  // suni de două ori aceeași firmă: le comasăm pe slug și ținem județele la un
  // loc. Rândul păstrat e cel cu semnalul cel mai tare (partener, apoi telefon).
  const signal = (f: NecesitFirm) => (f.partner ? 2 : 0) + (f.phone ? 1 : 0);
  const merged = new Map<string, { firm: NecesitFirm; counties: string[] }>();
  for (const f of allNecesitFirms()) {
    const seen = merged.get(f.slug);
    if (!seen) {
      merged.set(f.slug, { firm: f, counties: [f.county] });
      continue;
    }
    if (!seen.counties.includes(f.county)) seen.counties.push(f.county);
    if (signal(f) > signal(seen.firm)) seen.firm = f;
  }

  const rows: Row[] = [...merged.values()].map(({ firm, counties: firmCounties }) => {
    const key = normalizeFirmName(firm.name);
    const company = byName.get(key) ?? (firm.anreName ? byName.get(normalizeFirmName(firm.anreName)) : undefined);
    // necesit nu publică telefoane. Registrul ANRE acoperă ~43%; restul se
    // recuperează din director (dacă e listată la noi) sau din formularul de
    // listare, unde firma și-a lăsat singură numărul.
    const listingPhone = listingPhones.get(key) ?? (firm.anreName ? listingPhones.get(normalizeFirmName(firm.anreName)) : undefined);
    const phone = firm.phone || company?.contact.phone || listingPhone || '';
    const phoneSource = firm.phone
      ? 'ANRE'
      : company?.contact.phone
        ? 'director'
        : listingPhone
          ? 'formular de listare'
          : '';
    const card = cards.find((c) => isSameFirm(c, { numeFirma: firm.name, telefon: phone })) ?? null;
    const size = sizes?.firms[firm.slug];
    return {
      firm,
      counties: firmCounties.sort((a, b) => a.localeCompare(b, 'ro')),
      phone,
      phoneSource,
      company: company && { id: company.id, slug: company.slug, name: company.name },
      card,
      size,
      verdict: judge(firm, phone, size, card),
    };
  });

  const counties = [...new Set(rows.flatMap((r) => r.counties))].sort((a, b) => a.localeCompare(b, 'ro'));
  const countyRows = judet ? rows.filter((r) => r.counties.includes(judet)) : rows;

  const visible = countyRows
    .filter((r) => {
      if (activeFilter === 'platesc') return r.firm.partner;
      if (activeFilter === 'telefon') return r.phone !== '';
      if (activeFilter === 'fisa') return r.card !== null;
      return true;
    })
    .sort(
      (a, b) =>
        a.verdict.tier - b.verdict.tier ||
        b.verdict.score - a.verdict.score ||
        a.firm.name.localeCompare(b.firm.name, 'ro'),
    );

  const partners = countyRows.filter((r) => r.firm.partner);
  const qs = (f: Filter) => {
    const p = new URLSearchParams();
    if (judet) p.set('judet', judet);
    if (f !== 'platesc') p.set('filtru', f);
    const s = p.toString();
    return s ? `/admin/necesit?${s}` : '/admin/necesit';
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Firme de pe necesit.ro</h1>
        <p className="text-xs text-slate-400">
          scanat {new Date(necesitGeneratedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-500">
            node scripts/necesit-scan.mjs --build
          </code>
        </p>
      </div>

      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Cele marcate <strong>plătesc pentru cereri</strong> au pe necesit „Oferte trimise" și „Răspunde în X":
        cumpără deja lead-uri, deci n-ai de vândut ideea, doar prețul. Restul sunt profiluri importate din
        Google, pe care necesit le listează fără să colaboreze cu ele — pe alea le suni cu alt argument:
        apar în „Top 20 firme" pe Google, dar cererile de pe pagina lor se duc la concurenți.
        Notițele se scriu în fișa din <Link href="/admin/firme" className="underline">CRM · Instalatori</Link>,
        deci apar și acolo.
      </p>

      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        <strong>Sună prima</strong> = plătește pentru cereri <em>și</em> are 4–25 mil. lei cifră de afaceri, mărimea
        firmelor care au ajuns la ofertă din cererile noastre. <strong>Merită sunată</strong> = una din cele două.
        Restul (fără telefon, peste 40 mil., închise, refuzate) sunt la urmă. Cifra de lângă verdict e scorul care
        ordonează lista; ține mouse-ul pe el ca să vezi din ce e făcut.
      </p>

      {!sizes && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Mărimea firmelor lipsește, deci verdictul ține cont doar de semnalele de pe necesit. Se generează cu{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">node scripts/necesit-fin.mjs</code>.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Firme scanate" value={countyRows.length} hint={judet ? `în ${judet}` : '41 de județe'} />
        <Stat
          label="Sună prima"
          value={countyRows.filter((r) => r.verdict.tier === 1).length}
          hint="plătesc + 4–25 mil. lei + telefon"
        />
        <Stat label="Plătesc pentru cereri" value={partners.length} />
        <Stat label="Cu telefon" value={countyRows.filter((r) => r.phone).length} hint="ANRE + director + listări" />
        <Stat label="Contactate (au fișă)" value={countyRows.filter((r) => r.card).length} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <CountyFilter
          counties={counties.map((c) => ({ value: c, label: c }))}
          value={judet || ''}
          filtru={activeFilter === 'platesc' ? undefined : activeFilter}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTERS.map((f) => (
            <Pill key={f} href={qs(f)} active={activeFilter === f}>
              {FILTER_LABELS[f]}
            </Pill>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {visible.length} {visible.length === 1 ? 'firmă afișată' : 'firme afișate'}, în ordinea de apelat
      </p>

      <div className="mt-2 grid items-start gap-3 xl:grid-cols-2">
        {visible.map((row) => (
          <FirmCard_ key={row.firm.slug} row={row} sizesLoaded={sizes !== null} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Nicio firmă pentru filtrele alese.
        </p>
      )}
    </div>
  );
}
