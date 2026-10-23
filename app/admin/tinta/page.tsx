import Link from 'next/link';
import { getCrmFirms, getLeadsSince, isSameFirm, FIRM_STATUS_LABELS, type CrmFirm } from '@/lib/sheets';
import { getTinta, SIGNAL_LABELS, type TintaFirm } from '@/lib/firme-tinta';
import NecesitCrm, { type FirmCard } from '../necesit/NecesitCrm';
import CountyFilter from '../necesit/CountyFilter';

export const dynamic = 'force-dynamic';

/**
 * Firmele care au nevoie de lucrări, ca listă de apeluri. Firmele stabile au
 * refuzat cererile („avem destulă muncă", „avem marketingul nostru"), deci aici
 * căutăm opusul: firme cu atestat ANRE de execuție care s-au înființat de curând
 * sau cărora le-a scăzut cifra de afaceri. Fiecare motiv de pe card e o cifră din
 * bilanțul public, nu o estimare.
 *
 * Datele: tabelul `tinta_snapshots` din Neon (`node scripts/firme-tinta.mjs`). Notițele se
 * scriu în fișa din „CRM Firme", ca pe /admin/necesit.
 */

const SEGMENTS = ['noi', 'scadere', 'ambele', 'toate'] as const;
type Segment = (typeof SEGMENTS)[number];

const SEGMENT_LABELS: Record<Segment, string> = {
  noi: 'Firme noi',
  scadere: 'Cifra de afaceri în scădere',
  ambele: 'Și noi, și în scădere',
  toate: 'Toate',
};

/** Pe „toate firmele ANRE" ar fi ~1.900 de carduri cu editor de CRM fiecare. */
const MAX_CARDS = 150;

const strip = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[țţ]/g, 't')
    .replace(/[șş]/g, 's')
    .trim();

const lei = (n: number) => `${Math.round(n).toLocaleString('ro-RO')} lei`;

interface Row {
  firm: TintaFirm;
  card: CrmFirm | null;
  leads30: number | null;
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
    <span title={title} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${tone}`}>
      {children}
    </span>
  );
}

/** Ce spui în primele 20 de secunde, pe baza a ce a băgat-o în listă. */
function pitch(firm: TintaFirm, leads30: number | null): string {
  const cereri =
    leads30 && leads30 > 0
      ? `Am avut ${leads30} ${leads30 === 1 ? 'cerere' : 'cereri'} din ${firm.judet} în ultimele 30 de zile`
      : `Primim cereri de fotovoltaice și din ${firm.judet}`;
  if (firm.segments.includes('noua')) {
    return `${cereri}, iar multe rămân fără firmă. Aveți atestat și echipă — vă trimitem cererile, plătiți doar ce se semnează.`;
  }
  return `${cereri}, de la oameni care caută singuri o firmă. Dacă aveți capacitate liberă, vi le trimitem — plătiți doar lucrările semnate.`;
}

function FinTable({ fin }: { fin: TintaFirm['fin'] }) {
  const years = Object.keys(fin).sort();
  if (!years.length) return <p className="text-[11px] text-slate-400">Fără bilanț depus în 2023–2025.</p>;
  return (
    <table className="w-full text-[11px] tabular-nums">
      <thead>
        <tr className="text-left text-slate-400">
          <th className="font-medium">An</th>
          <th className="text-right font-medium">Cifră de afaceri</th>
          <th className="text-right font-medium">Profit</th>
          <th className="text-right font-medium">Angajați</th>
        </tr>
      </thead>
      <tbody className="text-slate-700">
        {years.map((y) => (
          <tr key={y}>
            <td>{y}</td>
            <td className="text-right">{lei(fin[y].ca)}</td>
            <td className={`text-right ${fin[y].profit < 0 ? 'text-red-600' : ''}`}>{lei(fin[y].profit)}</td>
            <td className="text-right">{fin[y].emp}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FirmCard_({ row }: { row: Row }) {
  const { firm, card, leads30 } = row;
  const google = `https://www.google.com/search?q=${encodeURIComponent(`${firm.name} ${firm.localitate}`)}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900">{firm.name}</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {firm.localitate}, {firm.judet} · CUI {firm.cui}
              {firm.phone ? (
                <>
                  {' · '}
                  <a href={`tel:${firm.phone}`} className="font-medium text-slate-700 hover:text-slate-900">
                    {firm.phone}
                  </a>
                </>
              ) : (
                <span className="text-slate-400"> · fără telefon</span>
              )}
            </p>
          </div>
          {card && (
            <span className="shrink-0 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase">
              {FIRM_STATUS_LABELS[card.status]}
            </span>
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {firm.segments.includes('noua') && <Badge tone="bg-violet-100 text-violet-700">firmă nouă</Badge>}
          {firm.segments.includes('scadere') && <Badge tone="bg-red-100 text-red-700">CA în scădere</Badge>}
          {firm.signals.map((s) => (
            <Badge key={s} tone={s === 'afm' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700'}>
              {SIGNAL_LABELS[s]}
            </Badge>
          ))}
          <Badge tone="bg-slate-100 text-slate-600" title="Atestate ANRE de execuție active">
            ANRE {firm.codes.join(' · ')}
          </Badge>
          {firm.caen && <Badge tone="bg-slate-100 text-slate-500">CAEN {firm.caen}</Badge>}
        </div>

        <ul className="mt-2 space-y-0.5 text-[12px] text-slate-700">
          {firm.reasons.map((r) => (
            <li key={r}>• {r}</li>
          ))}
          {firm.warnings.map((w) => (
            <li key={w} className="text-amber-700">
              ⚠ {w}
            </li>
          ))}
        </ul>

        <div className="mt-2">
          <FinTable fin={firm.fin} />
        </div>

        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          <span className="font-semibold">Deschidere: </span>
          {pitch(firm, leads30)}
        </p>

        <p className="mt-2 flex flex-wrap gap-3 text-[11px]">
          {firm.directorySlug && (
            <Link href={`/firme/${firm.directorySlug}`} className="text-amber-700 hover:underline">
              profilul din director →
            </Link>
          )}
          {firm.necesitUrl && (
            <a href={firm.necesitUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900">
              necesit.ro →
            </a>
          )}
          {firm.web && (
            <a
              href={firm.web.startsWith('http') ? firm.web : `https://${firm.web}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-900"
            >
              site →
            </a>
          )}
          <a href={google} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900">
            caută pe Google →
          </a>
        </p>
      </header>

      <div className="px-4 py-3">
        <NecesitCrm
          card={card as FirmCard | null}
          identity={{ firmId: firm.directorySlug, numeFirma: firm.name, telefon: firm.phone }}
        />
      </div>
    </article>
  );
}

// Ca în /admin/azi: „acum" vine dintr-un helper de modul (regula react-hooks/purity).
function nowMs(): number {
  return Date.now();
}

interface Props {
  searchParams: Promise<{ judet?: string; segment?: string; semnal?: string }>;
}

export default async function TintaPage({ searchParams }: Props) {
  const { judet, segment, semnal } = await searchParams;
  const activeSegment: Segment = (SEGMENTS as readonly string[]).includes(segment || '')
    ? (segment as Segment)
    : 'toate';
  // Implicit doar firmele despre care avem un semn că fac fotovoltaice.
  const allAnre = semnal === 'toate';

  // Lista vine din Neon, fișele și cererile din Sheets: pornesc în paralel.
  const tintaPromise = getTinta().then(
    (data) => ({ data, error: '' }),
    (err: unknown) => ({ data: null, error: err instanceof Error ? err.message : String(err) }),
  );

  let cards: CrmFirm[] = [];
  let leadsByCounty: Map<string, number> | null = null;
  let sheetsError = '';
  try {
    const since = new Date(nowMs() - 30 * 86_400_000);
    const [crm, leads] = await Promise.all([getCrmFirms(), getLeadsSince(since)]);
    cards = crm;
    leadsByCounty = new Map();
    for (const l of leads) {
      if (l.duplicatAl || !l.judet) continue;
      const k = strip(l.judet);
      leadsByCounty.set(k, (leadsByCounty.get(k) ?? 0) + 1);
    }
  } catch (err) {
    sheetsError = err instanceof Error ? err.message : String(err);
  }

  const { data: tinta, error: dbError } = await tintaPromise;
  if (!tinta) {
    return (
      <div>
        <h1 className="text-xl font-bold text-slate-900">Firme care au nevoie de lucrări</h1>
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {dbError ? `Baza de date nu răspunde (${dbError}).` : 'Lista nu e generată încă.'} Rulează{' '}
          <code>node scripts/firme-tinta.mjs</code>.
        </p>
      </div>
    );
  }

  const pool = tinta.firms.filter((f) => allAnre || f.signals.length > 0);
  const counties = [...new Set(pool.map((f) => f.judet))].sort((a, b) => a.localeCompare(b, 'ro'));
  const countyPool = judet ? pool.filter((f) => f.judet === judet) : pool;

  const visible = countyPool
    .filter((f) => {
      if (activeSegment === 'noi') return f.segments.includes('noua');
      if (activeSegment === 'scadere') return f.segments.includes('scadere');
      if (activeSegment === 'ambele') return f.segments.length === 2;
      return true;
    })
    .map(
      (firm): Row => ({
        firm,
        card: cards.find((c) => isSameFirm(c, { numeFirma: firm.name, telefon: firm.phone })) ?? null,
        leads30: leadsByCounty ? (leadsByCounty.get(strip(firm.judet)) ?? 0) : null,
      }),
    );
  const shown = visible.slice(0, MAX_CARDS);

  const qs = (next: { segment?: Segment; semnal?: string }) => {
    const p = new URLSearchParams();
    if (judet) p.set('judet', judet);
    const seg = next.segment ?? activeSegment;
    if (seg !== 'toate') p.set('segment', seg);
    const sem = 'semnal' in next ? next.semnal : allAnre ? 'toate' : undefined;
    if (sem) p.set('semnal', sem);
    const s = p.toString();
    return s ? `/admin/tinta?${s}` : '/admin/tinta';
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">Firme care au nevoie de lucrări</h1>
        <p className="text-xs text-slate-400">
          generat {new Date(tinta.generatedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-500">node scripts/firme-tinta.mjs</code>
        </p>
      </div>

      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Firmele stabile refuză cererile pentru că au deja de lucru. Aici e opusul: firme cu atestat ANRE de execuție
        (B, Be sau C2A) <strong>înființate după {tinta.rules.newSince.slice(0, 4)}</strong> sau care au primit primul
        atestat din {tinta.rules.newCertSince.slice(0, 4)}, plus cele cu <strong>cifra de afaceri cu cel puțin{' '}
        {Math.round(tinta.rules.drop * 100)}% sub vârful anilor trecuți</strong> (vârf de minimum{' '}
        {lei(tinta.rules.dropMinPeak)}). Cifrele vin din bilanțurile publice ({tinta.sources.bilanturi.length} ani, data.gov.ro),
        nu sunt estimate. Implicit vezi doar firmele despre care avem un semn că fac fotovoltaice. Notițele merg în{' '}
        <Link href="/admin/firme" className="underline">
          CRM · Instalatori
        </Link>
        .
      </p>

      {sheetsError && (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Google Sheets nu răspunde ({sheetsError}): lipsesc fișele CRM și numărul de cereri pe județ.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Firme în listă" value={countyPool.length} hint={judet ? `în ${judet}` : allAnre ? 'toate firmele ANRE' : 'cu semnal de fotovoltaice'} />
        <Stat label="Firme noi" value={countyPool.filter((f) => f.segments.includes('noua')).length} />
        <Stat label="În scădere" value={countyPool.filter((f) => f.segments.includes('scadere')).length} />
        <Stat label="Contactate (au fișă)" value={countyPool.filter((f) => cards.some((c) => isSameFirm(c, { numeFirma: f.name, telefon: f.phone }))).length} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <CountyFilter
          counties={counties.map((c) => ({ value: c, label: c }))}
          value={judet || ''}
          basePath="/admin/tinta"
          params={{ segment: activeSegment === 'toate' ? undefined : activeSegment, semnal: allAnre ? 'toate' : undefined }}
        />
        <div className="flex flex-wrap items-center gap-1.5">
          {SEGMENTS.map((s) => (
            <Pill key={s} href={qs({ segment: s })} active={activeSegment === s}>
              {SEGMENT_LABELS[s]}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
          <Pill href={qs({ semnal: undefined })} active={!allAnre}>
            Doar fotovoltaice
          </Pill>
          <Pill href={qs({ semnal: 'toate' })} active={allAnre}>
            Toate firmele ANRE
          </Pill>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {visible.length} {visible.length === 1 ? 'firmă' : 'firme'}, în ordinea de apelat
        {visible.length > MAX_CARDS && ` — afișez primele ${MAX_CARDS}; alege un județ ca să le vezi pe toate`}
      </p>

      <div className="mt-2 grid items-start gap-3 xl:grid-cols-2">
        {shown.map((row) => (
          <FirmCard_ key={row.firm.cui} row={row} />
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
