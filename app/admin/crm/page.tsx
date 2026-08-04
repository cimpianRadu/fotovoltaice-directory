import Link from 'next/link';
import {
  getLeadsSince,
  getClaims,
  getListingsSince,
  getCrmFirms,
  countActiveClaimsForFirm,
  isLeadClosed,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  MAX_CLAIMS_PER_LEAD,
  type NewLead,
  type NewListing,
  type LeadClaim,
  type CrmFirm,
} from '@/lib/sheets';
import { getCompanies } from '@/lib/utils';
import { matchFirmsForLead, type FirmMatch } from '@/lib/lead-match';
import { getFinancingShort, getFinancingTone, type FinancingTone } from '@/lib/utils-shared';
import ClaimList, { type ClaimRow } from './ClaimList';
import LeadCrm from './LeadCrm';
import MessagePreview from './MessagePreview';
import ShareLeadButton from './ShareLeadButton';
import ManualClaimForm, { type FirmOption } from './ManualClaimForm';
import { formatLeadForShare } from './formatLead';

export const dynamic = 'force-dynamic';

type Filter = 'toate' | 'nerevendicate' | 'revendicate' | 'pline';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'toate', label: 'Toate' },
  { key: 'nerevendicate', label: 'Fără revendicare' },
  { key: 'revendicate', label: 'Revendicate' },
  { key: 'pline', label: `Pline (${MAX_CLAIMS_PER_LEAD}/${MAX_CLAIMS_PER_LEAD})` },
];

const SEGMENTS = ['rezidential', 'comercial'] as const;

// Rutele concrete diferă pe segment (Casa Verde vs Electric Up), dar la filtrare
// contează doar întrebarea „cumpără acum sau așteaptă un program?".
const FINANCING_FILTERS: { key: FinancingTone; label: string }[] = [
  { key: 'ready', label: 'Fonduri proprii' },
  { key: 'credit', label: 'Caută finanțare' },
  { key: 'program', label: 'Așteaptă program' },
  { key: 'unknown', label: 'Nu știe / necompletat' },
];

const FINANCING_TONE_CLASS: Record<FinancingTone, string> = {
  ready: 'bg-emerald-50 text-emerald-700',
  credit: 'bg-sky-50 text-sky-700',
  program: 'bg-amber-50 text-amber-700',
  unknown: 'bg-slate-100 text-slate-500',
};

const LISTINGS_WINDOW_DAYS = 30;

interface Props {
  searchParams: Promise<{
    filtru?: string;
    judet?: string;
    segment?: string;
    status?: string;
    contact?: string;
    finantare?: string;
  }>;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Bucharest',
  });
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'alert' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p
        className={`text-2xl font-bold tabular-nums ${
          tone === 'alert' && value > 0 ? 'text-amber-600' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
      {children}
    </span>
  );
}

/**
 * Cele 3-4 firme pe care le-aș suna pentru cererea asta, cu motivele la
 * vedere. Scorul decide ordinea, dar nu se afișează: motivele sunt
 * argumentul, cifra ar părea mai exactă decât e.
 */
function MatchList({ matches, lead }: { matches: FirmMatch[]; lead: NewLead }) {
  return (
    <div className="space-y-2 border-t border-slate-100 px-4 py-2">
      <Caption>De contactat, potriviri din director</Caption>
      {matches.length > 0 && (
        <ul className="space-y-1.5">
          {matches.map((m) => (
            <li key={m.id} className="text-xs leading-snug">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <Link
                  href={`/firme/${m.slug}`}
                  className="font-medium text-slate-800 hover:underline"
                >
                  {m.name}
                </Link>
                <span className="text-slate-400">{m.city}</span>
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="text-slate-500 tabular-nums hover:text-slate-900">
                    {m.phone}
                  </a>
                )}
              </div>
              <p className="text-[10px] text-slate-400">{m.reasons.join(' · ')}</p>
              {m.warnings.length > 0 && (
                <p className="text-[10px] text-amber-600">{m.warnings.join(' · ')}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {/* Directorul nu acoperă tot: sub 3 potriviri, restul se caută offline
          cu targetare (cheia API nu există pe Vercel, doar în .env.local). */}
      {matches.length < 3 && lead.judet && (
        <p className="text-[10px] leading-relaxed text-slate-400">
          {matches.length === 0
            ? 'Nicio potrivire în director.'
            : `Doar ${matches.length} ${matches.length === 1 ? 'potrivire' : 'potriviri'} în director.`}{' '}
          Caută candidați ANRE cu targetare, local:{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-600">
            node scripts/lead-targetare.mjs --judet=&quot;{lead.judet}&quot; --segment=
            {lead.segment || 'comercial'}
          </code>
        </p>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  claims,
  firms,
  matches,
}: {
  lead: NewLead;
  claims: ClaimRow[];
  firms: FirmOption[];
  matches: FirmMatch[] | null;
}) {
  // Formularul cere putere în kW și suprafață în mp, dar salvează cifra goală.
  const specs = [lead.putere && `${lead.putere} kW`, lead.suprafata && `${lead.suprafata} mp`]
    .filter(Boolean)
    .join(' · ');
  const full = claims.length >= MAX_CLAIMS_PER_LEAD;
  const shareText = formatLeadForShare(lead);

  return (
    // id-ul e timestampul cererii: fișele din /admin/firme leagă „vezi cererea"
    // direct de cardul ei de aici. scroll-mt lasă loc de header la săritură.
    <article
      id={lead.timestamp}
      className="flex scroll-mt-20 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">
              {lead.tipProiect || '(fără tip)'}
            </h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
                lead.segment === 'rezidential'
                  ? 'bg-sky-50 text-sky-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {lead.segment || 'comercial'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {lead.judet}
            {specs && ` · ${specs}`}
          </p>
          {/* Goală pe cererile de dinainte de 29 iul 2026. */}
          {lead.finantare && (
            <span
              className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${
                FINANCING_TONE_CLASS[getFinancingTone(lead.finantare)]
              }`}
            >
              {getFinancingShort(lead.finantare)}
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs text-slate-400 tabular-nums">
          {fmtDateTime(lead.timestamp)}
        </span>
      </header>

      <div className="grid gap-4 px-4 py-3 sm:grid-cols-2">
        <div className="space-y-1 text-xs">
          <Caption>Client</Caption>
          <div>
            <div className="font-medium text-slate-800">{lead.numeContact || '—'}</div>
            {lead.numeCompanie && <div className="text-slate-500">{lead.numeCompanie}</div>}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="block text-slate-500 hover:text-slate-900">
                {lead.email}
              </a>
            )}
            {lead.telefon && (
              <a href={`tel:${lead.telefon}`} className="block text-slate-500 hover:text-slate-900">
                {lead.telefon}
              </a>
            )}
          </div>
          {lead.preselectedCompany && (
            <div className="text-slate-400">a cerut: {lead.preselectedCompany}</div>
          )}
          {/* Coloana M, veche: „Nou" e valoarea implicită și nu spune nimic.
              Se afișează doar când conține text scris manual. */}
          {lead.status && lead.status !== 'Nou' && (
            <div className="text-slate-400">{lead.status}</div>
          )}
          {lead.mesaj && <MessagePreview text={lead.mesaj} />}
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex items-baseline gap-1.5">
            <Caption>Revendicări</Caption>
            <span
              className={`text-[11px] font-semibold tabular-nums ${
                full ? 'text-emerald-600' : claims.length > 0 ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              {claims.length}/{MAX_CLAIMS_PER_LEAD}
            </span>
          </div>
          <ClaimList claims={claims} />
        </div>
      </div>

      <div className="space-y-2 border-t border-slate-100 px-4 py-2">
        <Caption>Trimite la instalator</Caption>
        <div className="flex flex-wrap items-center gap-1.5">
          <ShareLeadButton text={shareText} />
          <ManualClaimForm leadId={lead.timestamp} firms={firms} full={full} />
        </div>
      </div>

      {/* null = cerere închisă, nu mai sun pe nimeni pentru ea. */}
      {matches !== null && <MatchList matches={matches} lead={lead} />}

      <div className="mt-auto border-t border-slate-100 bg-slate-50 px-4 py-3">
        <LeadCrm
          id={lead.timestamp}
          status={lead.crmStatus}
          contacted={lead.contactedByFirm}
          notes={lead.notes}
        />
      </div>
    </article>
  );
}

function ListingsSection({ listings }: { listings: NewListing[] }) {
  if (listings.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="text-sm font-semibold text-slate-900 mb-3">
        Listări noi (ultimele {LISTINGS_WINDOW_DAYS} zile)
      </h2>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Data</th>
              <th className="px-4 py-2 font-medium">Firmă</th>
              <th className="px-4 py-2 font-medium">Contact</th>
              <th className="px-4 py-2 font-medium">ANRE</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.timestamp} className="border-b border-slate-100 align-top last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 tabular-nums">
                  {fmtDateTime(l.timestamp)}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{l.numeFirma}</div>
                  <div className="text-xs text-slate-500">
                    {l.cui}
                    {l.judet && ` · ${l.judet}`}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  <div className="text-slate-800">{l.numeContact}</div>
                  {l.email && (
                    <a href={`mailto:${l.email}`} className="block hover:text-slate-900">
                      {l.email}
                    </a>
                  )}
                  {l.telefon && (
                    <a href={`tel:${l.telefon}`} className="block hover:text-slate-900">
                      {l.telefon}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {l.anreStatus || '—'}
                  {l.anreCerts && <div className="text-slate-400">{l.anreCerts}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-20 shrink-0 text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </span>
      {children}
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

export default async function CrmPage({ searchParams }: Props) {
  const { filtru, judet, segment, status, contact, finantare } = await searchParams;
  const activeFilter: Filter =
    FILTERS.find((f) => f.key === filtru)?.key ?? 'toate';

  let leads: NewLead[];
  let claims: LeadClaim[];
  let listings: NewListing[];
  let crmFirms: CrmFirm[];
  try {
    const listingsCutoff = new Date(Date.now() - LISTINGS_WINDOW_DAYS * 86_400_000);
    [leads, claims, listings, crmFirms] = await Promise.all([
      getLeadsSince(new Date(0)),
      getClaims(),
      getListingsSince(listingsCutoff),
      getCrmFirms(),
    ]);
  } catch (err) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Nu am putut citi din Google Sheets: {err instanceof Error ? err.message : String(err)}
      </div>
    );
  }

  // Revendicările sunt legate de lead prin timestamp-ul rândului (vezi getFullLeadById).
  // Fiecare primește și câte cereri ține firma ei fără apel confirmat, ca să se
  // vadă pe card cine a strâns sloturi fără să sune.
  const claimsByLead = new Map<string, ClaimRow[]>();
  for (const c of claims) {
    const row: ClaimRow = { ...c, firmActive: countActiveClaimsForFirm(claims, c) };
    const list = claimsByLead.get(c.leadId);
    if (list) list.push(row);
    else claimsByLead.set(c.leadId, [row]);
  }

  const counties = [...new Set(leads.map((l) => l.judet).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'ro')
  );

  // Lista de firme pentru revendicarea manuală — TOATE, indiferent de segment.
  // Filtrarea pe segment (rezidential vs comercial) suna ordonat pe hârtie dar
  // în practică ascunde firme relevante: o firmă „comercial" poate accepta un
  // lead rezidențial mic dacă îi convine. Ești admin, ai judecata ta; searchul
  // rapid din SearchableSelect face lungimea listei irelevantă. Trecem doar
  // câmpurile de care are nevoie formul, nu toată structura Company
  // (~180 firme × {id,name,phone,city} ≈ 10 KB serializat).
  const companies = getCompanies();
  const firms: FirmOption[] = companies
    .map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.contact.phone,
      city: c.location.city,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ro'));

  const newestFirst = [...leads].reverse();
  const visible = newestFirst.filter((l) => {
    if (judet && l.judet !== judet) return false;
    if (segment && (l.segment || 'comercial') !== segment) return false;
    if (status && l.crmStatus !== status) return false;
    // `neverificat` = celula e goală, adică n-am întrebat încă clientul.
    if (contact === 'neverificat' && l.contactedByFirm !== '') return false;
    if ((contact === 'da' || contact === 'nu') && l.contactedByFirm !== contact) return false;
    if (finantare && getFinancingTone(l.finantare) !== finantare) return false;
    const n = claimsByLead.get(l.timestamp)?.length ?? 0;
    if (activeFilter === 'nerevendicate') return n === 0;
    if (activeFilter === 'revendicate') return n > 0;
    if (activeFilter === 'pline') return n >= MAX_CLAIMS_PER_LEAD;
    return true;
  });

  const unclaimed = leads.filter((l) => !claimsByLead.has(l.timestamp)).length;
  // Revendicări pe care nicio firmă nu le-a confirmat cu un apel. Astea sunt
  // sloturile ocupate degeaba, și tot ele sunt ce blochează firma să ia altele.
  const claimsWithoutCall = claims.filter((c) => !c.contactedAt).length;
  // Clientul a vrut panouri, s-a rezolvat în altă parte, și nu l-a sunat nimeni.
  // Asta nu e concurență pierdută, e livrare ruptă.
  const lostUncontacted = leads.filter(
    (l) => l.crmStatus === 'altundeva' && l.contactedByFirm === 'nu',
  ).length;

  const qs = (next: {
    filtru?: Filter;
    judet?: string;
    segment?: string;
    status?: string;
    contact?: string;
    finantare?: string;
  }) => {
    const p = new URLSearchParams();
    const f = next.filtru ?? activeFilter;
    const j = next.judet ?? judet;
    const sg = next.segment ?? segment;
    const st = next.status ?? status;
    const ct = next.contact ?? contact;
    const fn = next.finantare ?? finantare;
    if (f !== 'toate') p.set('filtru', f);
    if (j) p.set('judet', j);
    if (sg) p.set('segment', sg);
    if (st) p.set('status', st);
    if (ct) p.set('contact', ct);
    if (fn) p.set('finantare', fn);
    const s = p.toString();
    return s ? `/admin/crm?${s}` : '/admin/crm';
  };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold text-slate-900">CRM · Cereri și revendicări</h1>
        <Link href="/cereri" className="text-xs text-slate-500 hover:text-slate-900">
          feedul public →
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Cereri total" value={leads.length} />
        <Stat label="Fără nicio revendicare" value={unclaimed} tone="alert" />
        {/* Combinația care decide dacă problema e prețul sau livrarea: clientul
            a vrut panouri, s-a rezolvat în altă parte, și nu l-a sunat nimeni. */}
        <Stat label="Pierdute fără niciun apel" value={lostUncontacted} tone="alert" />
        <Stat label="Revendicări total" value={claims.length} />
        <Stat label="Revendicări fără apel" value={claimsWithoutCall} tone="alert" />
        <Stat label={`Listări (${LISTINGS_WINDOW_DAYS}z)`} value={listings.length} />
      </div>

      <div className="mt-6 space-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <FilterRow label="Revendicări">
          {FILTERS.map((f) => (
            <Pill key={f.key} href={qs({ filtru: f.key })} active={activeFilter === f.key}>
              {f.label}
            </Pill>
          ))}
        </FilterRow>

        <FilterRow label="Segment">
          <Pill href={qs({ segment: '' })} active={!segment}>
            Toate
          </Pill>
          {SEGMENTS.map((s) => (
            <Pill key={s} href={qs({ segment: s })} active={segment === s}>
              {s === 'rezidential' ? 'Rezidențial' : 'Comercial'}
            </Pill>
          ))}
        </FilterRow>

        <FilterRow label="Stare">
          <Pill href={qs({ status: '' })} active={!status}>
            Toate
          </Pill>
          {LEAD_STATUSES.map((s) => (
            <Pill key={s} href={qs({ status: s })} active={status === s}>
              {LEAD_STATUS_LABELS[s]}
            </Pill>
          ))}
        </FilterRow>

        <FilterRow label="Contactat">
          <Pill href={qs({ contact: '' })} active={!contact}>
            Toate
          </Pill>
          <Pill href={qs({ contact: 'da' })} active={contact === 'da'}>
            De o firmă
          </Pill>
          <Pill href={qs({ contact: 'nu' })} active={contact === 'nu'}>
            De nimeni
          </Pill>
          <Pill href={qs({ contact: 'neverificat' })} active={contact === 'neverificat'}>
            Neverificat
          </Pill>
        </FilterRow>

        <FilterRow label="Finanțare">
          <Pill href={qs({ finantare: '' })} active={!finantare}>
            Toate
          </Pill>
          {FINANCING_FILTERS.map((f) => (
            <Pill key={f.key} href={qs({ finantare: f.key })} active={finantare === f.key}>
              {f.label}
            </Pill>
          ))}
        </FilterRow>

        <FilterRow label="Județ">
          <Pill href={qs({ judet: '' })} active={!judet}>
            Toate
          </Pill>
          {counties.map((c) => (
            <Pill key={c} href={qs({ judet: c })} active={judet === c}>
              {c}
            </Pill>
          ))}
        </FilterRow>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {visible.length} {visible.length === 1 ? 'cerere afișată' : 'cereri afișate'}
      </p>

      <div className="mt-2 grid items-start gap-3 xl:grid-cols-2">
        {visible.map((lead) => (
          <LeadCard
            key={lead.timestamp}
            lead={lead}
            claims={claimsByLead.get(lead.timestamp) ?? []}
            firms={firms}
            // Potrivirile se calculează doar pe cererile deschise: pentru una
            // închisă nu mai sun pe nimeni, secțiunea ar fi zgomot.
            matches={
              isLeadClosed(lead.crmStatus)
                ? null
                : matchFirmsForLead(lead, lead.timestamp, companies, claims, crmFirms)
            }
          />
        ))}
      </div>
      {visible.length === 0 && (
        <p className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          Nicio cerere pentru filtrele alese.
        </p>
      )}

      <ListingsSection listings={listings} />
    </div>
  );
}
