import Link from 'next/link';
import {
  getLeadsSince,
  getClaims,
  getListingsSince,
  LEAD_STATUSES,
  MAX_CLAIMS_PER_LEAD,
  type NewLead,
  type NewListing,
  type LeadClaim,
} from '@/lib/sheets';
import LeadCrm from './LeadCrm';
import MessagePreview from './MessagePreview';

export const dynamic = 'force-dynamic';

type Filter = 'toate' | 'nerevendicate' | 'revendicate' | 'pline';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'toate', label: 'Toate' },
  { key: 'nerevendicate', label: 'Fără revendicare' },
  { key: 'revendicate', label: 'Revendicate' },
  { key: 'pline', label: `Pline (${MAX_CLAIMS_PER_LEAD}/${MAX_CLAIMS_PER_LEAD})` },
];

const SEGMENTS = ['rezidential', 'comercial'] as const;

const LISTINGS_WINDOW_DAYS = 30;

interface Props {
  searchParams: Promise<{ filtru?: string; judet?: string; segment?: string; status?: string }>;
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

function ClaimList({ claims }: { claims: LeadClaim[] }) {
  if (claims.length === 0) {
    return <span className="text-xs text-slate-400">nerevendicat</span>;
  }
  return (
    <div className="space-y-1.5">
      {claims.map((c) => (
        <div key={`${c.leadId}-${c.timestamp}`} className="text-xs">
          <span className="font-medium text-slate-800">{c.numeFirma}</span>
          <div className="text-slate-500">
            {c.numeContact}
            {c.telefon && (
              <>
                {' · '}
                <a href={`tel:${c.telefon}`} className="hover:text-slate-900">
                  {c.telefon}
                </a>
              </>
            )}
          </div>
          <div className="text-slate-400">{fmtDateTime(c.timestamp)}</div>
        </div>
      ))}
    </div>
  );
}

function LeadRow({ lead, claims }: { lead: NewLead; claims: LeadClaim[] }) {
  // Formularul cere putere în kW și suprafață în mp, dar salvează cifra goală.
  const specs = [
    lead.putere && `${lead.putere} kW`,
    lead.suprafata && `${lead.suprafata} mp`,
  ]
    .filter(Boolean)
    .join(' · ');
  const full = claims.length >= MAX_CLAIMS_PER_LEAD;

  return (
    <tr className="border-b border-slate-100 align-top last:border-0">
      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500 tabular-nums">
        {fmtDateTime(lead.timestamp)}
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-slate-900">{lead.tipProiect || '(fără tip)'}</div>
        <div className="text-xs text-slate-500">
          {lead.judet}
          {specs && ` · ${specs}`}
        </div>
        {lead.mesaj && <MessagePreview text={lead.mesaj} />}
      </td>
      <td className="px-4 py-3 text-xs">
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
        {lead.preselectedCompany && (
          <div className="mt-1 text-slate-400">a cerut: {lead.preselectedCompany}</div>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            lead.segment === 'rezidential'
              ? 'bg-sky-50 text-sky-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {lead.segment || 'comercial'}
        </span>
        {lead.status && (
          <div className="mt-1 text-xs text-slate-500">{lead.status}</div>
        )}
      </td>
      <td className="px-4 py-3">
        <div
          className={`mb-1 text-xs font-semibold tabular-nums ${
            full ? 'text-emerald-600' : claims.length > 0 ? 'text-slate-700' : 'text-slate-400'
          }`}
        >
          {claims.length}/{MAX_CLAIMS_PER_LEAD}
        </div>
        <ClaimList claims={claims} />
      </td>
      <td className="px-4 py-3">
        <LeadCrm id={lead.timestamp} status={lead.crmStatus} notes={lead.notes} />
      </td>
    </tr>
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
  const { filtru, judet, segment, status } = await searchParams;
  const activeFilter: Filter =
    FILTERS.find((f) => f.key === filtru)?.key ?? 'toate';

  let leads: NewLead[];
  let claims: LeadClaim[];
  let listings: NewListing[];
  try {
    const listingsCutoff = new Date(Date.now() - LISTINGS_WINDOW_DAYS * 86_400_000);
    [leads, claims, listings] = await Promise.all([
      getLeadsSince(new Date(0)),
      getClaims(),
      getListingsSince(listingsCutoff),
    ]);
  } catch (err) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Nu am putut citi din Google Sheets: {err instanceof Error ? err.message : String(err)}
      </div>
    );
  }

  // Revendicările sunt legate de lead prin timestamp-ul rândului (vezi getFullLeadById).
  const claimsByLead = new Map<string, LeadClaim[]>();
  for (const c of claims) {
    const list = claimsByLead.get(c.leadId);
    if (list) list.push(c);
    else claimsByLead.set(c.leadId, [c]);
  }

  const counties = [...new Set(leads.map((l) => l.judet).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'ro')
  );

  const newestFirst = [...leads].reverse();
  const visible = newestFirst.filter((l) => {
    if (judet && l.judet !== judet) return false;
    if (segment && (l.segment || 'comercial') !== segment) return false;
    if (status && l.crmStatus !== status) return false;
    const n = claimsByLead.get(l.timestamp)?.length ?? 0;
    if (activeFilter === 'nerevendicate') return n === 0;
    if (activeFilter === 'revendicate') return n > 0;
    if (activeFilter === 'pline') return n >= MAX_CLAIMS_PER_LEAD;
    return true;
  });

  const unclaimed = leads.filter((l) => !claimsByLead.has(l.timestamp)).length;

  const qs = (next: { filtru?: Filter; judet?: string; segment?: string; status?: string }) => {
    const p = new URLSearchParams();
    const f = next.filtru ?? activeFilter;
    const j = next.judet ?? judet;
    const sg = next.segment ?? segment;
    const st = next.status ?? status;
    if (f !== 'toate') p.set('filtru', f);
    if (j) p.set('judet', j);
    if (sg) p.set('segment', sg);
    if (st) p.set('status', st);
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

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Cereri total" value={leads.length} />
        <Stat label="Fără nicio revendicare" value={unclaimed} tone="alert" />
        <Stat label="Revendicări total" value={claims.length} />
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

        <FilterRow label="Status">
          <Pill href={qs({ status: '' })} active={!status}>
            Toate
          </Pill>
          {LEAD_STATUSES.map((s) => (
            <Pill key={s} href={qs({ status: s })} active={status === s}>
              {s}
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

      <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Data</th>
              <th className="px-4 py-2 font-medium">Cerere</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Segment</th>
              <th className="px-4 py-2 font-medium">Revendicări</th>
              <th className="px-4 py-2 font-medium">Status și note</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((lead) => (
              <LeadRow
                key={lead.timestamp}
                lead={lead}
                claims={claimsByLead.get(lead.timestamp) ?? []}
              />
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Nicio cerere pentru filtrele alese.
          </p>
        )}
      </div>

      <ListingsSection listings={listings} />
    </div>
  );
}
