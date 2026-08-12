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

/**
 * Urma cea mai recentă pe care o firmă a lăsat-o SCRIIND din /portal: notele,
 * renunțarea, marcajul de ofertă și statusul pe revendicare vin exclusiv de
 * acolo. Contează pentru că jurnalul de accesări a pornit abia în august 2026,
 * iar firmele care au folosit portalul înainte n-au niciun rând în el — dovada
 * lor e ce au scris. Șir gol = nicio urmă (sau status schimbat fără dată).
 */
function lastPortalWrite(c: LeadClaim): string {
  const stamps = [c.releasedAt, c.offeredAt];
  for (const n of c.firmNotes) stamps.push(n.time ? `${n.date}T${n.time}` : n.date);
  const valid = stamps.filter((s) => s && Number.isFinite(Date.parse(s)));
  return valid.sort().at(-1) ?? '';
}

/** A atins firma portalul vreodată, chiar și fără dată (doar status schimbat)? */
function touchedPortal(c: LeadClaim): boolean {
  return Boolean(lastPortalWrite(c)) || c.firmStatus !== 'de_sunat';
}

/**
 * Un email = o firmă în portal. Rând per email, nu per eveniment: cele patru
 * încercări ale aceleiași firme sunt o singură problemă, nu patru.
 */
interface PortalAccount {
  email: string;
  /** Câte emailuri de login au plecat către adresa asta (doar din jurnal). */
  requests: number;
  /** Câte s-au terminat cu o sesiune deschisă (doar din jurnal). */
  logins: number;
  firstRequest: string;
  lastLogin: string;
  /** Ultima mișcare, din jurnal SAU dedusă din ce a scris firma în portal. */
  lastSeen: string;
  events: PortalAccessEvent[];
  /** A folosit portalul înainte să existe jurnalul (dedus din ce a scris). */
  usedBeforeLog: boolean;
  claims: LeadClaim[];
  /** Revendicări active fără datele clientului deblocate — de aprobat. */
  pending: number;
  company: Company | undefined;
  crmFirm: CrmFirm | undefined;
}

/**
 * Patru situații, patru acțiuni diferite:
 * - `de_aprobat`: are cereri cărora le lipsește deblocarea datelor. Ăsta e
 *   butonul, restul e context.
 * - `blocat`: a cerut acces și n-a intrat niciodată. De sunat, ceva n-a mers.
 * - `gol`: intră, dar pe emailul lui nu e nicio revendicare, deci vede o pagină
 *   goală — aproape mereu emailul lipsă/greșit în coloana I din „Revendicări".
 * - `ok`: are cereri, toate deblocate.
 */
type AccountState = 'de_aprobat' | 'blocat' | 'gol' | 'ok';

function stateOf(a: PortalAccount): AccountState {
  if (a.pending > 0) return 'de_aprobat';
  if (a.claims.length === 0) return 'gol';
  if (a.logins === 0 && !a.usedBeforeLog) return 'blocat';
  return 'ok';
}

const STATE_LABELS: Record<AccountState, string> = {
  de_aprobat: 'de aprobat',
  blocat: 'a cerut, n-a intrat',
  gol: 'portal gol',
  ok: 'la zi',
};

const STATE_TONES: Record<AccountState, string> = {
  de_aprobat: 'bg-sky-50 text-sky-700',
  blocat: 'bg-red-50 text-red-700',
  gol: 'bg-amber-50 text-amber-700',
  ok: 'bg-emerald-50 text-emerald-700',
};

const FILTERS: { key: string; label: string; state?: AccountState }[] = [
  { key: 'toate', label: 'Toate' },
  { key: 'de-aprobat', label: 'De aprobat', state: 'de_aprobat' },
  { key: 'blocati', label: 'N-au intrat', state: 'blocat' },
  { key: 'goi', label: 'Portal gol', state: 'gol' },
  { key: 'la-zi', label: 'La zi', state: 'ok' },
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
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${STATE_TONES[state]}`}
        >
          {STATE_LABELS[state]}
        </span>
      </header>

      <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-600">
        {account.events.length > 0 ? (
          <>
            <span className="text-slate-900">{account.requests}</span> cereri de acces,{' '}
            <span className="text-slate-900">{account.logins}</span> intrări
            {account.lastLogin && <> · ultima {fmtDateTime(account.lastLogin)}</>}
            {!account.lastLogin && account.firstRequest && (
              <> · prima cerere {fmtDateTime(account.firstRequest)}</>
            )}
          </>
        ) : account.usedBeforeLog ? (
          <span title="Note, renunțări, oferte sau status pe revendicări — se pot scrie doar din portal.">
            A folosit portalul înainte de jurnal
            {account.lastSeen && <> · ultima urmă {fmtDateTime(account.lastSeen)}</>}
          </span>
        ) : (
          <span className="text-slate-400">
            Nicio urmă că ar fi intrat vreodată în portal
          </span>
        )}
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
                  {e.event === 'cerut'
                    ? 'a cerut acces (email trimis)'
                    : `a intrat (${e.method === 'cod' ? 'cod' : 'link'})`}
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

  // Lista completă a emailurilor care au portal: cele din jurnal plus cele de
  // pe revendicări. Al doilea set contează dublu — acolo sunt și firmele
  // dinaintea jurnalului, și cele cărora trebuie să le aprob deblocarea
  // datelor, indiferent dacă au apucat să intre.
  const emails = new Set(eventsByEmail.keys());
  for (const c of claims) if (c.email) emails.add(c.email);

  const accounts: PortalAccount[] = [...emails].map((email) => {
    const evs = (eventsByEmail.get(email) ?? []).sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    );
    const requests = evs.filter((e) => e.event === 'cerut');
    const logins = evs.filter((e) => e.event === 'intrat');
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

    const writes = mine.map(lastPortalWrite).filter(Boolean).sort();
    const lastSeen = [evs[0]?.timestamp ?? '', writes.at(-1) ?? ''].sort().at(-1) ?? '';

    return {
      email,
      requests: requests.length,
      logins: logins.length,
      firstRequest: requests.at(-1)?.timestamp ?? '',
      lastLogin: logins[0]?.timestamp ?? '',
      lastSeen,
      events: evs,
      usedBeforeLog: mine.some(touchedPortal),
      claims: mine,
      pending: mine.filter((c) => !c.releasedAt && !c.approvedAt).length,
      company,
      crmFirm: identity ? firms.find((f) => isSameFirm(f, identity)) : undefined,
    };
  });

  // Ordinea = lista de lucru: întâi ce cere o apăsare de la mine (aprobări),
  // apoi cine s-a împotmolit la intrare, apoi portalurile goale, apoi restul.
  // În fiecare grup, cel mai recent sus.
  const rank: Record<AccountState, number> = { de_aprobat: 0, blocat: 1, gol: 2, ok: 3 };
  accounts.sort((a, b) => {
    const d = rank[stateOf(a)] - rank[stateOf(b)];
    return d !== 0 ? d : b.lastSeen.localeCompare(a.lastSeen);
  });

  const activeFilter = FILTERS.find((f) => f.key === filtru) ?? FILTERS[0];
  const visible = activeFilter.state
    ? accounts.filter((a) => stateOf(a) === activeFilter.state)
    : accounts;

  const pendingTotal = accounts.reduce((s, a) => s + a.pending, 0);

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Portal · Acces și aprobări</h1>
      <p className="mt-1 text-sm text-slate-500">
        Fiecare firmă care are portal: cine a cerut acces, cine a intrat și, pentru fiecare,
        cererile ei cu butonul care deblochează datele clientului. Jurnalul de accesări a
        pornit odată cu pagina asta, deci intrările de dinainte apar doar acolo unde firma a
        lăsat o urmă scrisă în portal (notă, renunțare, ofertă, status).
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Firme cu portal" value={accounts.length} />
        <Stat label="Revendicări de aprobat" value={pendingTotal} tone="action" />
        <Stat
          label="Au cerut acces, n-au intrat"
          value={accounts.filter((a) => stateOf(a) === 'blocat').length}
          tone="alert"
        />
        <Stat
          label="Portal gol (email fără revendicări)"
          value={accounts.filter((a) => stateOf(a) === 'gol').length}
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
