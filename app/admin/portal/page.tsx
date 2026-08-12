import Link from 'next/link';
import {
  getPortalAccessEvents,
  getClaims,
  getCrmFirms,
  getLeadsSince,
  isSameFirm,
  type PortalAccessEvent,
  type LeadClaim,
  type CrmFirm,
  type NewLead,
} from '@/lib/sheets';
import { getCompanies } from '@/lib/utils';
import { getProjectTypeLabel, type Company } from '@/lib/utils-shared';
import ApproveClaims, { type PortalClaimRow } from './ApproveClaims';

export const dynamic = 'force-dynamic';

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ro-RO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Bucharest',
  });
}

// Notă, pentru cine e tentat să deducă accesul din revendicări: statusul firmei
// (coloana F), marcajul de ofertă (N), renunțarea (J) și notele (L) NU dovedesc
// că firma a fost în portal, deși aplicația le scrie doar de acolo. Aceleași
// celule se completează și de mână în Sheet, după un telefon sau un WhatsApp,
// iar cele două cazuri sunt identice în date. Pe 12 aug 2026 pagina a afirmat
// „a folosit portalul" despre o firmă care trimisese oferta pe WhatsApp.
// Singura dovadă de cont e jurnalul „Portal Acces".

/**
 * Un email = o firmă în portal. Rând per email, nu per eveniment: cele patru
 * încercări ale aceleiași firme sunt o singură problemă, nu patru.
 */
interface PortalAccount {
  email: string;
  /** Câte emailuri de login au plecat către adresa asta. */
  requests: number;
  /** Câte s-au terminat cu o sesiune deschisă = câte ori și-a făcut cont. */
  logins: number;
  /** Deschideri de portal cu sesiune deja validă (cel mult una pe oră). */
  visits: number;
  firstRequest: string;
  /** Prima autentificare reușită — data la care firma „și-a făcut cont". */
  firstLogin: string;
  /** Ultima dată când a fost efectiv în portal (autentificare sau vizită). */
  lastInPortal: string;
  /** Ultima mișcare de orice fel, pentru ordonare. */
  lastSeen: string;
  events: PortalAccessEvent[];
  claims: LeadClaim[];
  /** Revendicări active fără datele clientului deblocate — de aprobat. */
  pending: number;
  company: Company | undefined;
  crmFirm: CrmFirm | undefined;
}

/**
 * Starea contului, strict din jurnal:
 * - `cont`: s-a autentificat măcar o dată. Singura afirmație de prezență.
 * - `blocat`: a cerut acces și n-a intrat niciodată. De sunat, ceva n-a mers.
 * - `gol`: are cont sau a cerut acces, dar pe emailul lui nu e nicio
 *   revendicare — vede o pagină goală. Aproape mereu emailul lipsă sau scris
 *   altfel în coloana I din „Revendicări".
 * - `necunoscut`: jurnalul nu știe nimic despre email. NU înseamnă „n-a
 *   intrat": jurnalul a pornit pe 12 aug 2026, iar sesiunile durează 30 de
 *   zile, deci o firmă logată dinainte nu produce niciun eveniment până
 *   deschide portalul din nou.
 */
type AccountState = 'cont' | 'blocat' | 'gol' | 'necunoscut';

function stateOf(a: PortalAccount): AccountState {
  if (a.claims.length === 0 && (a.logins > 0 || a.requests > 0)) return 'gol';
  if (a.logins > 0 || a.visits > 0) return 'cont';
  if (a.requests > 0) return 'blocat';
  return 'necunoscut';
}

const STATE_LABELS: Record<AccountState, string> = {
  cont: 'are cont',
  blocat: 'a cerut, n-a intrat',
  gol: 'portal gol',
  necunoscut: 'jurnalul nu știe',
};

const STATE_TONES: Record<AccountState, string> = {
  cont: 'bg-emerald-50 text-emerald-700',
  blocat: 'bg-red-50 text-red-700',
  gol: 'bg-amber-50 text-amber-700',
  necunoscut: 'bg-slate-100 text-slate-500',
};

const FILTERS: { key: string; label: string; state?: AccountState }[] = [
  { key: 'toate', label: 'Toate' },
  { key: 'de-aprobat', label: 'De aprobat' },
  { key: 'cont', label: 'Au cont', state: 'cont' },
  { key: 'blocati', label: 'N-au intrat', state: 'blocat' },
  { key: 'necunoscut', label: 'Jurnalul nu știe', state: 'necunoscut' },
  { key: 'goi', label: 'Portal gol', state: 'gol' },
];

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'alert' | 'action' }) {
  const color =
    value > 0 && tone === 'alert'
      ? 'text-red-600'
      : value > 0 && tone === 'action'
        ? 'text-sky-700'
        : 'text-slate-900';
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className={`text-2xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
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

function leadLabel(lead: NewLead | undefined, leadId: string): string {
  if (!lead) return `cerere ${leadId.slice(0, 10)}`;
  return [getProjectTypeLabel(lead.tipProiect), lead.judet, lead.putere ? `${lead.putere} kW` : '']
    .filter(Boolean)
    .join(' · ');
}

/** Linia de acces: ce știm sigur, spus fără să sune a mai mult decât e. */
function accessLine(account: PortalAccount): React.ReactNode {
  if (account.logins > 0 || account.visits > 0) {
    return (
      <>
        {account.firstLogin ? (
          <>
            Cont din <span className="text-slate-900">{fmtDateTime(account.firstLogin)}</span>
          </>
        ) : (
          'Are sesiune activă'
        )}
        {account.lastInPortal && (
          <> · ultima dată în portal {fmtDateTime(account.lastInPortal)}</>
        )}
      </>
    );
  }
  if (account.requests > 0) {
    return (
      <span className="text-red-700">
        {account.requests === 1
          ? 'A cerut acces o dată'
          : `A cerut acces de ${account.requests} ori`}
        , nicio autentificare reușită
        {account.firstRequest && <> · prima {fmtDateTime(account.firstRequest)}</>}
      </span>
    );
  }
  return (
    <span className="text-slate-400">
      Jurnalul nu știe nimic despre emailul ăsta. Dacă are sesiunea deschisă
      dinainte de 12 aug, apare aici la prima pagină de portal pe care o deschide.
    </span>
  );
}

function AccountCard({
  account,
  leadById,
}: {
  account: PortalAccount;
  leadById: Map<string, NewLead>;
}) {
  const state = stateOf(account);
  // Numele firmei: din revendicări (identitatea ei reală în portal), altfel din
  // director dacă emailul e cel public al unei firme listate.
  const firmName =
    account.claims.find((c) => c.numeFirma)?.numeFirma || account.company?.name || '';
  const phone =
    account.claims.find((c) => c.telefon)?.telefon || account.company?.contact.phone || '';

  const rows: PortalClaimRow[] = account.claims
    .map((c) => ({
      timestamp: c.timestamp,
      leadId: c.leadId,
      label: leadLabel(leadById.get(c.leadId), c.leadId),
      approvedAt: c.approvedAt,
      releasedAt: c.releasedAt,
      offeredAt: c.offeredAt,
      contactedAt: c.contactedAt,
      firmStatus: c.firmStatus,
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">{firmName || account.email}</h3>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            <a href={`mailto:${account.email}`} className="hover:text-slate-900">
              {account.email}
            </a>
            {phone && (
              <>
                {' · '}
                <a href={`tel:${phone}`} className="hover:text-slate-900">
                  {phone}
                </a>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${STATE_TONES[state]}`}
          >
            {STATE_LABELS[state]}
          </span>
          {account.pending > 0 && (
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-sky-700 uppercase">
              {account.pending} de aprobat
            </span>
          )}
        </div>
      </header>

      <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-600">
        {accessLine(account)}
      </div>

      <div className="px-4 py-3">
        <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Revendicări · vizibilitatea datelor de client
        </p>
        <ApproveClaims claims={rows} />
        {state === 'gol' && (
          <p className="mt-1.5 text-xs text-amber-700">
            Verifică coloana Email (I) din tabul „Revendicări" — cu emailul lipsă sau scris
            altfel, firma vede o pagină goală când intră.
          </p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap gap-3 border-t border-slate-100 px-4 py-2 text-xs">
        {account.crmFirm ? (
          <Link href="/admin/firme" className="text-slate-500 hover:text-slate-900">
            fișa din CRM →
          </Link>
        ) : (
          firmName && <span className="text-slate-400">fără fișă în CRM Instalatori</span>
        )}
        {account.claims.length > 0 && (
          <Link
            href={`/admin/crm#${encodeURIComponent(account.claims[0].leadId)}`}
            className="text-slate-500 hover:text-slate-900"
          >
            cererile în CRM →
          </Link>
        )}
      </div>

      {account.events.length > 0 && (
        <details className="border-t border-slate-100 bg-slate-50 px-4 py-2">
          <summary className="cursor-pointer text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Istoric acces ({account.events.length})
          </summary>
          <ul className="mt-1.5 max-h-40 space-y-1 overflow-y-auto">
            {account.events.map((e, i) => (
              <li key={`${e.timestamp}-${i}`} className="flex gap-2 text-xs">
                <span className="w-24 shrink-0 text-[10px] tracking-wide text-slate-400 uppercase">
                  {fmtDateTime(e.timestamp)}
                </span>
                <span className="text-slate-600">
                  {e.event === 'cerut' && 'a cerut acces (email trimis)'}
                  {e.event === 'intrat' &&
                    `s-a autentificat (${e.method === 'cod' ? 'cod' : 'link'})`}
                  {e.event === 'vazut' && 'a deschis portalul'}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

interface Props {
  searchParams: Promise<{ filtru?: string }>;
}

export default async function PortalAccessPage({ searchParams }: Props) {
  const { filtru } = await searchParams;

  let events: PortalAccessEvent[];
  let claims: LeadClaim[];
  let firms: CrmFirm[];
  let leads: NewLead[];
  try {
    [events, claims, firms, leads] = await Promise.all([
      getPortalAccessEvents(),
      getClaims(),
      getCrmFirms(),
      getLeadsSince(new Date(0)),
    ]);
  } catch (err) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Nu am putut citi din Google Sheets: {err instanceof Error ? err.message : String(err)}
      </div>
    );
  }

  const companies = getCompanies();
  const leadById = new Map(leads.map((l) => [l.timestamp, l]));

  const eventsByEmail = new Map<string, PortalAccessEvent[]>();
  for (const e of events) {
    if (!e.email) continue;
    const list = eventsByEmail.get(e.email);
    if (list) list.push(e);
    else eventsByEmail.set(e.email, [e]);
  }

  // Lista completă a emailurilor care POT avea portal: cele din jurnal plus
  // cele de pe revendicări. Al doilea set trebuie să fie aici chiar dacă
  // jurnalul nu știe nimic despre ele — altfel n-ai de unde să le aprobi
  // cererile, iar aprobarea e jumătate din motivul paginii.
  const emails = new Set(eventsByEmail.keys());
  for (const c of claims) if (c.email) emails.add(c.email);

  const accounts: PortalAccount[] = [...emails].map((email) => {
    const evs = (eventsByEmail.get(email) ?? []).sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    const requests = evs.filter((e) => e.event === 'cerut');
    const logins = evs.filter((e) => e.event === 'intrat');
    const visits = evs.filter((e) => e.event === 'vazut');
    const inPortal = [...logins, ...visits].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const mine = claims.filter((c) => c.email === email);

    const company =
      companies.find((c) => c.contact.email?.trim().toLowerCase() === email) ??
      (mine[0]
        ? companies.find((c) =>
            isSameFirm({ numeFirma: c.name, telefon: c.contact.phone }, mine[0]),
          )
        : undefined);
    const identity = mine[0]
      ? { numeFirma: mine[0].numeFirma, telefon: mine[0].telefon }
      : company
        ? { numeFirma: company.name, telefon: company.contact.phone }
        : undefined;

    return {
      email,
      requests: requests.length,
      logins: logins.length,
      visits: visits.length,
      firstRequest: requests.at(-1)?.timestamp ?? '',
      firstLogin: logins.at(-1)?.timestamp ?? '',
      lastInPortal: inPortal[0]?.timestamp ?? '',
      lastSeen: evs[0]?.timestamp || mine[0]?.timestamp || '',
      events: evs,
      claims: mine,
      pending: mine.filter((c) => !c.releasedAt && !c.approvedAt).length,
      company,
      crmFirm: identity ? firms.find((f) => isSameFirm(f, identity)) : undefined,
    };
  });

  // Ordinea = lista de lucru: întâi ce cere o apăsare de la mine (aprobări),
  // apoi conturile confirmate, apoi cine s-a împotmolit la intrare. În fiecare
  // grup, cel mai recent sus.
  const rank: Record<AccountState, number> = { cont: 0, blocat: 1, gol: 2, necunoscut: 3 };
  accounts.sort((a, b) => {
    if ((a.pending > 0) !== (b.pending > 0)) return a.pending > 0 ? -1 : 1;
    const d = rank[stateOf(a)] - rank[stateOf(b)];
    return d !== 0 ? d : b.lastSeen.localeCompare(a.lastSeen);
  });

  const activeFilter = FILTERS.find((f) => f.key === filtru) ?? FILTERS[0];
  const visible = activeFilter.state
    ? accounts.filter((a) => stateOf(a) === activeFilter.state)
    : activeFilter.key === 'de-aprobat'
      ? accounts.filter((a) => a.pending > 0)
      : accounts;

  const pendingTotal = accounts.reduce((s, a) => s + a.pending, 0);
  const withAccount = accounts.filter((a) => stateOf(a) === 'cont').length;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Portal · Conturi și aprobări</h1>
      <p className="mt-1 text-sm text-slate-500">
        Cine s-a autentificat pe /portal și, pentru fiecare, cererile lui cu butonul care
        deblochează datele clientului. „Are cont" se spune doar pe baza jurnalului de acces,
        pornit pe 12 august 2026. Marcajele de pe revendicări (status, ofertă, note) nu
        dovedesc nimic aici, pentru că se scriu și de mână în Sheet.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Emailuri cu portal posibil" value={accounts.length} />
        <Stat label="Conturi confirmate" value={withAccount} />
        <Stat label="Revendicări de aprobat" value={pendingTotal} tone="action" />
        <Stat
          label="Au cerut acces, n-au intrat"
          value={accounts.filter((a) => stateOf(a) === 'blocat').length}
          tone="alert"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3">
        {FILTERS.map((f) => (
          <Pill
            key={f.key}
            href={f.key === 'toate' ? '/admin/portal' : `/admin/portal?filtru=${f.key}`}
            active={activeFilter.key === f.key}
          >
            {f.label}
          </Pill>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {visible.length} {visible.length === 1 ? 'firmă afișată' : 'firme afișate'}
      </p>

      <div className="mt-2 grid items-start gap-3 xl:grid-cols-2">
        {visible.map((a) => (
          <AccountCard key={a.email} account={a} leadById={leadById} />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="mt-2 rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {accounts.length === 0
            ? 'Nicio firmă cu portal încă. Apar aici la prima revendicare cu email sau la prima cerere de acces.'
            : 'Nicio firmă pentru filtrul ales.'}
        </p>
      )}
    </div>
  );
}
