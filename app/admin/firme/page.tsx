import Link from 'next/link';
import {
  getCrmFirms,
  getLeadsSince,
  getClaims,
  firmMentionedIn,
  isSameFirm,
  FIRM_STATUSES,
  FIRM_STATUS_LABELS,
  type CrmFirm,
  type NewLead,
  type LeadClaim,
} from '@/lib/sheets';
import { getCompanies } from '@/lib/utils';
import type { Company } from '@/lib/utils-shared';
import FirmCrm from './FirmCrm';
import AddFirmForm, { type DirectoryFirmOption } from './AddFirmForm';
import QuickAddClaimFirms, { type ClaimFirmSuggestion } from './QuickAddClaimFirms';

export const dynamic = 'force-dynamic';

function todayBucharest(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
}

function fmtDay(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Bucharest',
  });
}

/**
 * Ce s-a întâmplat cu firma pe partea de cereri, fără să scriu eu nimic pe
 * fișa ei: revendicările ei din tabul „Revendicări" și notele de pe cereri
 * care o pomenesc. Derivat la fiecare încărcare, nu copiat — o singură sursă
 * de adevăr per fapt, deci nu există „sync" care să rămână în urmă.
 */
interface ActivityEntry {
  sortKey: string;
  date: string;
  kind: 'claim' | 'mention';
  text: string;
  /** Ancoră către cardul cererii din /admin/crm. */
  leadHref: string;
  /** Pe revendicări: apelul către client e confirmat? */
  confirmed?: boolean;
}

function leadLabel(lead: NewLead | undefined, leadId: string): string {
  if (!lead) return `cerere din ${fmtDay(leadId)}`;
  const parts = [lead.tipProiect || 'cerere', lead.judet].filter(Boolean);
  return parts.join(' · ');
}

function buildActivity(firm: CrmFirm, leads: NewLead[], claims: LeadClaim[]): ActivityEntry[] {
  const leadById = new Map(leads.map((l) => [l.timestamp, l]));
  const entries: ActivityEntry[] = [];

  for (const c of claims) {
    if (!isSameFirm(c, firm)) continue;
    const lead = leadById.get(c.leadId);
    entries.push({
      sortKey: c.timestamp,
      date: c.timestamp,
      kind: 'claim',
      text: `${c.source === 'manual' ? 'i-am dat telefonic' : 'a revendicat'}: ${leadLabel(lead, c.leadId)}`,
      leadHref: `/admin/crm#${encodeURIComponent(c.leadId)}`,
      confirmed: !!c.contactedAt,
    });
  }

  for (const lead of leads) {
    for (const n of lead.notes) {
      if (!firmMentionedIn(n.text, firm.numeFirma)) continue;
      entries.push({
        // Notele au doar zi (+ eventual oră); prânzul e un mijloc neutru care
        // le așază rezonabil printre timestampurile complete ale revendicărilor.
        sortKey: `${n.date}T${n.time ?? '12:00'}`,
        date: n.date,
        kind: 'mention',
        text: `${n.text} (pe ${leadLabel(lead, lead.timestamp)})`,
        leadHref: `/admin/crm#${encodeURIComponent(lead.timestamp)}`,
      });
    }
  }

  return entries.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'alert' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p
        className={`text-2xl font-bold tabular-nums ${
          tone === 'alert' && value > 0 ? 'text-red-600' : 'text-slate-900'
        }`}
      >
        {value}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
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

function FirmCard({
  firm,
  company,
  activity,
  today,
}: {
  firm: CrmFirm;
  company: Company | undefined;
  activity: ActivityEntry[];
  today: string;
}) {
  const phone = firm.telefon || company?.contact.phone || '';
  const overdue = firm.followUp !== '' && firm.followUp < today;
  const dueToday = firm.followUp === today;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {company ? (
              <Link
                href={`/firme/${company.slug}`}
                className="truncate font-semibold text-slate-900 hover:underline"
              >
                {firm.numeFirma}
              </Link>
            ) : (
              <h3 className="truncate font-semibold text-slate-900">{firm.numeFirma}</h3>
            )}
            {!company && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                în afara directorului
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {company && `${company.location.city}, ${company.location.county}`}
            {company && phone && ' · '}
            {phone && (
              <a href={`tel:${phone}`} className="hover:text-slate-900">
                {phone}
              </a>
            )}
            {company?.contact.email && (
              <>
                {' · '}
                <a href={`mailto:${company.contact.email}`} className="hover:text-slate-900">
                  {company.contact.email}
                </a>
              </>
            )}
          </p>
        </div>
        {(overdue || dueToday) && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${
              overdue ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
            }`}
          >
            {overdue ? `restant din ${fmtDay(firm.followUp)}` : 'de sunat azi'}
          </span>
        )}
      </header>

      <div className="px-4 py-3">
        <FirmCrm
          id={firm.timestamp}
          status={firm.status}
          followUp={firm.followUp}
          notes={firm.notes}
        />
      </div>

      {activity.length > 0 && (
        <div className="mt-auto border-t border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Din cereri, automat
          </p>
          <ul className="mt-1.5 max-h-40 space-y-1.5 overflow-y-auto">
            {activity.map((a, i) => (
              <li key={`${a.sortKey}-${i}`} className="flex gap-2 text-xs leading-relaxed">
                <span className="w-14 shrink-0 pt-px text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                  {fmtDay(a.date)}
                </span>
                <span className="min-w-0 flex-1 text-slate-600">
                  {a.kind === 'claim' && (
                    <span
                      title={a.confirmed ? 'apel către client confirmat' : 'slot ocupat, apel neconfirmat'}
                      className={`mr-1.5 inline-block rounded px-1.5 py-px text-[10px] font-semibold ${
                        a.confirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                      }`}
                    >
                      {a.confirmed ? 'revendicare ✓' : 'revendicare, fără apel'}
                    </span>
                  )}
                  {a.kind === 'mention' && (
                    <span className="mr-1.5 inline-block rounded bg-sky-100 px-1.5 py-px text-[10px] font-semibold text-sky-700">
                      notă pe cerere
                    </span>
                  )}
                  {a.text}{' '}
                  <Link href={a.leadHref} className="whitespace-nowrap text-slate-400 hover:text-slate-900">
                    vezi cererea →
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

interface Props {
  searchParams: Promise<{ status?: string; filtru?: string }>;
}

export default async function FirmsCrmPage({ searchParams }: Props) {
  const { status, filtru } = await searchParams;

  let firms: CrmFirm[];
  let leads: NewLead[];
  let claims: LeadClaim[];
  try {
    [firms, leads, claims] = await Promise.all([
      getCrmFirms(),
      getLeadsSince(new Date(0)),
      getClaims(),
    ]);
  } catch (err) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Nu am putut citi din Google Sheets: {err instanceof Error ? err.message : String(err)}
      </div>
    );
  }

  const companies = getCompanies();
  const today = todayBucharest();

  // Firma din director, dacă există: întâi pe id (fișele create din
  // SearchableSelect), apoi pe nume/telefon (fișele adăugate manual sau din
  // revendicări). Enrichment doar — fișa funcționează și fără potrivire.
  const companyFor = (firm: CrmFirm): Company | undefined =>
    (firm.firmId ? companies.find((c) => c.id === firm.firmId) : undefined) ??
    companies.find((c) =>
      isSameFirm({ numeFirma: c.name, telefon: c.contact.phone }, firm),
    );

  const enriched = firms.map((firm) => ({
    firm,
    company: companyFor(firm),
    activity: buildActivity(firm, leads, claims),
  }));

  // Ordinea = lista de lucru: restanțele primele (cea mai veche sus), apoi cele
  // de azi, apoi termenele viitoare, iar fișele fără termen la coadă, după
  // ultima activitate. Deschizi pagina și suni de sus în jos.
  const groupOf = (f: CrmFirm) =>
    f.followUp === '' ? 3 : f.followUp < today ? 0 : f.followUp === today ? 1 : 2;
  const lastActivity = (e: (typeof enriched)[number]) =>
    e.firm.notes[0]
      ? `${e.firm.notes[0].date}T${e.firm.notes[0].time ?? '00:00'}`
      : (e.activity[0]?.sortKey ?? e.firm.timestamp);
  const sorted = [...enriched].sort((a, b) => {
    const ga = groupOf(a.firm);
    const gb = groupOf(b.firm);
    if (ga !== gb) return ga - gb;
    if (ga === 3) return lastActivity(b).localeCompare(lastActivity(a));
    return a.firm.followUp.localeCompare(b.firm.followUp);
  });

  const activeStatus = FIRM_STATUSES.find((s) => s === status);
  const restante = filtru === 'restante';
  const visible = sorted.filter(({ firm }) => {
    if (activeStatus && firm.status !== activeStatus) return false;
    if (restante && !(firm.followUp !== '' && firm.followUp <= today)) return false;
    return true;
  });

  const overdueCount = firms.filter((f) => f.followUp !== '' && f.followUp < today).length;
  const todayCount = firms.filter((f) => f.followUp === today).length;

  // Firmele cu revendicări dar fără fișă: candidatele evidente la pipeline.
  const claimFirmsWithoutCard: ClaimFirmSuggestion[] = [];
  for (const c of claims) {
    if (firms.some((f) => isSameFirm(f, c))) continue;
    const seen = claimFirmsWithoutCard.find((s) => isSameFirm(s, c));
    if (seen) seen.claims += 1;
    else claimFirmsWithoutCard.push({ numeFirma: c.numeFirma, telefon: c.telefon, claims: 1 });
  }

  // Pentru formularul de adăugare: directorul fără firmele care au deja fișă.
  const directoryOptions: DirectoryFirmOption[] = companies
    .filter((c) => !firms.some((f) => f.firmId === c.id || isSameFirm({ numeFirma: c.name, telefon: c.contact.phone }, f)))
    .map((c) => ({ id: c.id, name: c.name, phone: c.contact.phone, city: c.location.city }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ro'));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900">CRM · Instalatori</h1>
        <AddFirmForm firms={directoryOptions} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Fișe în pipeline" value={firms.length} />
        <Stat label="Follow-up restant" value={overdueCount} tone="alert" />
        <Stat label="De sunat azi" value={todayCount} />
        <Stat
          label="Interesate + cliente"
          value={firms.filter((f) => f.status === 'interesat' || f.status === 'client').length}
        />
      </div>

      {claimFirmsWithoutCard.length > 0 && (
        <div className="mt-6">
          <QuickAddClaimFirms firms={claimFirmsWithoutCard} />
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <Pill href="/admin/firme" active={!activeStatus && !restante}>
          Toate
        </Pill>
        <Pill href="/admin/firme?filtru=restante" active={restante}>
          De sunat (restante + azi)
        </Pill>
        {FIRM_STATUSES.map((s) => (
          <Pill key={s} href={`/admin/firme?status=${s}`} active={activeStatus === s}>
            {FIRM_STATUS_LABELS[s]}
          </Pill>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {visible.length} {visible.length === 1 ? 'firmă afișată' : 'firme afișate'}
      </p>

      <div className="mt-2 grid items-start gap-3 xl:grid-cols-2">
        {visible.map(({ firm, company, activity }) => (
          <FirmCard
            key={firm.timestamp}
            firm={firm}
            company={company}
            activity={activity}
            today={today}
          />
        ))}
      </div>
      {visible.length === 0 && (
        <p className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {firms.length === 0
            ? 'Nicio fișă încă. Adaugă prima firmă cu butonul de sus sau dintr-o revendicare.'
            : 'Nicio firmă pentru filtrele alese.'}
        </p>
      )}
    </div>
  );
}
