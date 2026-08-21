import Link from 'next/link';
import {
  getPortalAccessEvents,
  getClaims,
  getCrmFirms,
  getLeadsSince,
  getCountyAlertPrefs,
  type CountyAlertPref,
  claimsHeldForLead,
  isLeadClosed,
  isLeadHidden,
  isSameFirm,
  MAX_CLAIMS_PER_LEAD,
  type PortalAccessEvent,
  type LeadClaim,
  type CrmFirm,
  type NewLead,
} from '@/lib/sheets';
import { isClaimUntouched } from '@/lib/sheets-shared';
import { matchFirmsForLead } from '@/lib/lead-match';
import { getCompanies } from '@/lib/utils';
import { getProjectTypeLabel, type Company } from '@/lib/utils-shared';
import ApproveClaims, { type PortalClaimRow } from './ApproveClaims';
import GiveLead, { type GiveLeadFirm, type LeadOption } from './GiveLead';

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
  /** Revendicări cu datele deblocate de 2+ zile pe care firma nu le-a atins. */
  untouched: number;
  company: Company | undefined;
  crmFirm: CrmFirm | undefined;
  /** Județele bifate pentru alerte pe email, dacă firma a intrat vreodată pe secțiunea aia. */
  alerts: CountyAlertPref | null;
  /** Cui se scrie revendicarea când îi dau o cerere de aici. */
  giveFirm: GiveLeadFirm | null;
  /** Cereri deschise pe care i le pot da, cele mai potrivite primele. */
  giveOptions: LeadOption[];
}

/**
 * Starea contului, strict din jurnal:
 * - `cont`: s-a autentificat măcar o dată. Singura afirmație de prezență.
 *   Contul nu cere nici revendicări, nici firmă cunoscută — un email care a
 *   intrat și vede portalul gol tot cont e; golul e marcaj separat pe card,
 *   nu altă stare, ca să nu scoată contul din vederea implicită.
 * - `blocat`: a cerut acces și n-a intrat niciodată. De sunat, ceva n-a mers.
 * - `necunoscut`: jurnalul nu știe nimic despre email. NU înseamnă „n-a
 *   intrat": jurnalul a pornit pe 12 aug 2026, iar sesiunile durează 30 de
 *   zile, deci o firmă logată dinainte nu produce niciun eveniment până
 *   deschide portalul din nou.
 */
type AccountState = 'cont' | 'blocat' | 'necunoscut';

function stateOf(a: PortalAccount): AccountState {
  if (a.logins > 0 || a.visits > 0) return 'cont';
  if (a.requests > 0) return 'blocat';
  return 'necunoscut';
}

const STATE_LABELS: Record<AccountState, string> = {
  cont: 'are cont',
  blocat: 'a cerut, n-a intrat',
  necunoscut: 'jurnalul nu știe',
};

/**
 * Starea se citește de la distanță, de pe capul cardului: un pill mic într-un
 * colț se pierde când ai douăzeci de carduri pe ecran. Fundalul colorat e
 * semnalul, badge-ul plin doar confirmă în cuvinte.
 */
const STATE_STYLES: Record<AccountState, { header: string; badge: string }> = {
  cont: { header: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-600 text-white' },
  blocat: { header: 'bg-red-50 border-red-200', badge: 'bg-red-600 text-white' },
  necunoscut: { header: 'bg-slate-100 border-slate-200', badge: 'bg-slate-400 text-white' },
};

// Primul filtru = vederea implicită a paginii: doar cine ARE cont, chiar dacă
// emailul n-are nicio revendicare și nu e legat de vreo firmă din director —
// pagina răspunde întâi la „cine mi-a intrat în portal?". Restul emailurilor
// (revendicări pe care jurnalul nu le știe, blocați la intrare) stau pe
// filtrele lor, nu amestecate printre conturi.
const FILTERS: { key: string; label: string; state?: AccountState }[] = [
  { key: 'cont', label: 'Au cont', state: 'cont' },
  { key: 'toate', label: 'Toate' },
  { key: 'de-aprobat', label: 'De aprobat' },
  { key: 'fara-miscare', label: 'Fără mișcare 2z+' },
  { key: 'blocati', label: 'N-au intrat', state: 'blocat' },
  { key: 'necunoscut', label: 'Jurnalul nu știe', state: 'necunoscut' },
  { key: 'goi', label: 'Portal gol' },
  { key: 'fara-judete', label: 'Fără județe bifate' },
];

/** Are alerte pornite pe cel puțin un județ. */
function hasCountyAlerts(a: PortalAccount): boolean {
  return Boolean(a.alerts?.active && a.alerts.counties.length > 0);
}

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

/** Badge-ul „portal gol": informație pe card, nu stare — contul rămâne cont. */
function EmptyPortalBadge() {
  return (
    <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
      portal gol
    </span>
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

/**
 * Județele de interes, bifate de firmă în /portal. Trei cazuri distincte, pe
 * care nu le amestec: n-a bifat niciodată (rândul nu există în „Alerte Județe"),
 * a bifat și apoi a golit lista (rând cu Activ = nu, deci a văzut secțiunea și
 * a renunțat) și lista curentă. Primul e „încă n-a ajuns acolo", al doilea e un
 * răspuns, iar diferența contează la telefon.
 */
function alertsLine(alerts: CountyAlertPref | null): React.ReactNode {
  if (!alerts) {
    return <span className="text-slate-400">n-a bifat niciun județ</span>;
  }
  if (!alerts.active || alerts.counties.length === 0) {
    return (
      <span className="text-amber-700">
        oprite — a bifat cândva, acum lista e goală
        {alerts.updatedAt && <> · {fmtDateTime(alerts.updatedAt)}</>}
      </span>
    );
  }
  return (
    <>
      <span className="text-slate-900">{alerts.counties.join(', ')}</span>
      <span className="text-slate-400">
        {' '}
        ({alerts.counties.length})
        {alerts.updatedAt && <> · {fmtDateTime(alerts.updatedAt)}</>}
      </span>
    </>
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
      releaseReason: c.releaseReason,
      offeredAt: c.offeredAt,
      contactedAt: c.contactedAt,
      firmStatus: c.firmStatus,
      noteCount: c.firmNotes.length,
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header
        className={`flex items-start justify-between gap-3 border-b px-4 py-3 ${STATE_STYLES[state].header}`}
      >
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">{firmName || account.email}</h3>
          <p className="mt-0.5 truncate text-xs text-slate-600">
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
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${STATE_STYLES[state].badge}`}
          >
            {STATE_LABELS[state]}
          </span>
          {account.claims.length === 0 && <EmptyPortalBadge />}
          {account.pending > 0 && (
            <span className="rounded-full bg-sky-600 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white uppercase">
              {account.pending} de aprobat
            </span>
          )}
        </div>
      </header>

      <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-600">
        {accessLine(account)}
      </div>

      <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-600">
        <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Alerte pe județ ·{' '}
        </span>
        {alertsLine(account.alerts)}
      </div>

      <div className="px-4 py-3">
        <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Revendicări · vizibilitatea datelor de client
        </p>
        <ApproveClaims claims={rows} />
        {account.giveFirm && (
          <div className="mt-2">
            <GiveLead firm={account.giveFirm} leads={account.giveOptions} />
          </div>
        )}
        {account.claims.length === 0 && (
          <p className="mt-1.5 text-xs text-amber-700">
            Nicio revendicare pe emailul ăsta — în portal vede o pagină goală. Dacă e o
            firmă cu cereri, scrie-i emailul în coloana Email (I) din „Revendicări" sau
            dă-i o cerere de aici.
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
  let alertPrefs: CountyAlertPref[];
  try {
    [events, claims, firms, leads, alertPrefs] = await Promise.all([
      getPortalAccessEvents(),
      getClaims(),
      getCrmFirms(),
      getLeadsSince(new Date(0)),
      getCountyAlertPrefs(),
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
  const alertsByEmail = new Map(alertPrefs.map((p) => [p.email, p]));

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
  // Și cine și-a bifat județele: bifa se poate pune doar din portal, deci
  // emailul are portal chiar dacă n-are nici revendicare, nici eveniment.
  for (const p of alertPrefs) emails.add(p.email);

  // Cererile pe care le pot da: deschise (nu ascunse, nu închise din CRM) și
  // cu loc liber. Potrivirea firmă→cerere se calculează o dată per cerere, nu
  // per firmă, și se citește apoi din map — altfel scorul s-ar recalcula peste
  // tot directorul pentru fiecare card.
  const openLeads = leads.filter((l) => !isLeadHidden(l) && !isLeadClosed(l.crmStatus));
  const heldByLead = new Map(
    openLeads.map((l) => [l.timestamp, claimsHeldForLead(claims, l.timestamp)]),
  );
  const matchesByLead = new Map(
    openLeads.map((l) => [
      l.timestamp,
      matchFirmsForLead(l, l.timestamp, companies, claims, firms, 500),
    ]),
  );

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

    // Fără nume și telefon n-am ce scrie în „Revendicări", deci butonul de
    // atribuire nu apare: un email singur nu identifică o firmă.
    const giveFirm: GiveLeadFirm | null = identity
      ? {
          email,
          numeFirma: identity.numeFirma,
          numeContact:
            mine.find((c) => c.numeContact && c.numeContact !== '-')?.numeContact || '-',
          telefon: identity.telefon,
        }
      : null;

    const giveOptions: LeadOption[] = !identity
      ? []
      : openLeads
          .filter((l) => {
            const held = heldByLead.get(l.timestamp) ?? [];
            if (held.length >= MAX_CLAIMS_PER_LEAD) return false;
            return !held.some((c) => isSameFirm(c, identity) || c.email === email);
          })
          .map((l) => {
            const m = company
              ? matchesByLead.get(l.timestamp)?.find((x) => x.id === company.id)
              : undefined;
            return {
              id: l.timestamp,
              label: leadLabel(l, l.timestamp),
              slots: MAX_CLAIMS_PER_LEAD - (heldByLead.get(l.timestamp)?.length ?? 0),
              score: m?.score ?? 0,
              reasons: m?.reasons ?? [],
              warnings: m?.warnings ?? [],
            };
          })
          .sort((a, b) => b.score - a.score || b.id.localeCompare(a.id))
          .slice(0, 10);

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
      untouched: mine.filter((c) =>
        isClaimUntouched({ ...c, noteCount: c.firmNotes.length }),
      ).length,
      company,
      crmFirm: identity ? firms.find((f) => isSameFirm(f, identity)) : undefined,
      alerts: alertsByEmail.get(email) ?? null,
      giveFirm,
      giveOptions,
    };
  });

  // Ordinea = lista de lucru: întâi ce cere o apăsare de la mine (aprobări),
  // apoi conturile confirmate, apoi cine s-a împotmolit la intrare. În fiecare
  // grup, cel mai recent sus.
  const rank: Record<AccountState, number> = { cont: 0, blocat: 1, necunoscut: 2 };
  accounts.sort((a, b) => {
    if ((a.pending > 0) !== (b.pending > 0)) return a.pending > 0 ? -1 : 1;
    // Apoi cine cere un telefon: are datele și n-a făcut nimic cu ele.
    if ((a.untouched > 0) !== (b.untouched > 0)) return a.untouched > 0 ? -1 : 1;
    const d = rank[stateOf(a)] - rank[stateOf(b)];
    return d !== 0 ? d : b.lastSeen.localeCompare(a.lastSeen);
  });

  const activeFilter = FILTERS.find((f) => f.key === filtru) ?? FILTERS[0];
  const visible = activeFilter.state
    ? accounts.filter((a) => stateOf(a) === activeFilter.state)
    : activeFilter.key === 'de-aprobat'
      ? accounts.filter((a) => a.pending > 0)
      : activeFilter.key === 'fara-miscare'
        ? accounts.filter((a) => a.untouched > 0)
        : activeFilter.key === 'goi'
          ? accounts.filter((a) => a.claims.length === 0)
          : // Doar conturile confirmate: pe cine n-a intrat niciodată în portal
            // n-are sens să-l numeri drept „n-a bifat", n-a avut de unde.
            activeFilter.key === 'fara-judete'
            ? accounts.filter((a) => stateOf(a) === 'cont' && !hasCountyAlerts(a))
            : accounts;

  const pendingTotal = accounts.reduce((s, a) => s + a.pending, 0);
  const untouchedTotal = accounts.reduce((s, a) => s + a.untouched, 0);
  const withAccount = accounts.filter((a) => stateOf(a) === 'cont').length;
  const withCountyAlerts = accounts.filter(hasCountyAlerts).length;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Portal · Conturi și aprobări</h1>
      <p className="mt-1 text-sm text-slate-500">
        Implicit, doar cine s-a autentificat pe /portal — chiar dacă emailul n-are nicio
        revendicare sau nu e al vreunei firme din director. „Are cont" se spune doar pe baza
        jurnalului de acces, pornit pe 12 august 2026: un cont făcut înainte apare abia la
        prima pagină de portal pe care o mai deschide. Restul emailurilor (revendicări
        despre care jurnalul nu știe nimic, blocați la intrare) sunt pe filtrele de mai jos.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Emailuri cu portal posibil" value={accounts.length} />
        <Stat label="Conturi confirmate" value={withAccount} />
        <Stat label="Revendicări de aprobat" value={pendingTotal} tone="action" />
        <Stat label="Neatinse de 2+ zile" value={untouchedTotal} tone="alert" />
        <Stat
          label="Au cerut acces, n-au intrat"
          value={accounts.filter((a) => stateOf(a) === 'blocat').length}
          tone="alert"
        />
        <Stat label="Cu județe bifate" value={withCountyAlerts} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-3">
        {FILTERS.map((f) => (
          <Pill
            key={f.key}
            href={f.key === 'cont' ? '/admin/portal' : `/admin/portal?filtru=${f.key}`}
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
