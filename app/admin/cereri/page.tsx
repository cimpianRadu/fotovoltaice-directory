import Link from 'next/link';
import {
  getClaims,
  getLeadsSince,
  isLeadInformez,
  isPriorityHeld,
  isTestLead,
  type LeadClaim,
  type NewLead,
} from '@/lib/sheets';
import {
  LEAD_STATUS_LABELS,
  claimOccupiesLeadSlot,
  parseRequestedFirms,
} from '@/lib/sheets-shared';
import { MAX_CLAIMS_PER_LEAD } from '@/lib/sheets';
import { CLICKS_SINCE, getLeadsActivity, type LeadActivity } from '@/lib/admin-cereri';
import { firmDisplayName } from '@/lib/client-account';
import { normalizePhone } from '@/lib/sheets-shared';
import { TIMELINE_OPTIONS, getFinancingTone, getProjectTypeLabel, type FinancingTone } from '@/lib/utils-shared';
import {
  ETAPE,
  EtapaBadge,
  FinancingBadge,
  FirmStatusChip,
  TimelineBadge,
  ago,
  cerereHref,
  fmtDateTime,
  fmtDay,
  hotScore,
  isEtapaOpen,
  isHot,
  leadEtapa,
  type Etapa,
} from './shared';
import ActivityTable from './ActivityTable';

export const dynamic = 'force-dynamic';

// Toate cererile într-un tabel (24 oct 2026, cerut de Radu): când a intrat, în ce
// stare e, ce firme au preluat-o și unde e fiecare, dacă clientul își urmărește
// cererea din cont și de câte ori a fost apăsată pe /cereri. Fișa fiecărei
// cereri (/admin/cereri/[id]) are restul: detaliile, cronologia și acțiunile.
// Click pe un rând arată cronologia într-un modal, fără să pleci din listă.

type EtapaFilter = '' | 'deschise' | Etapa;
type ContFilter = '' | 'da' | 'nu';
type Sort = 'intrare' | 'miscare' | 'hot';

const FINANCING_FILTERS: { key: FinancingTone; label: string }[] = [
  { key: 'ready', label: 'Fonduri proprii' },
  { key: 'credit', label: 'Caută finanțare' },
  { key: 'program', label: 'Așteaptă program' },
  { key: 'unknown', label: 'Nu știe / necompletat' },
];

interface Props {
  searchParams: Promise<{
    etapa?: string;
    cont?: string;
    judet?: string;
    q?: string;
    sort?: string;
    bani?: string;
    termen?: string;
    hot?: string;
  }>;
}

/** Ultima mișcare reală pe cerere: oamenii, nu emailurile automate. */
function lastActivity(lead: NewLead, claims: LeadClaim[], activity: LeadActivity | undefined): string {
  const dates: string[] = [lead.timestamp, lead.reactivataLa, lead.confirmataLa];
  if (lead.raspunsClient) dates.push(lead.raspunsClient.split(' ')[1] || '');
  for (const n of lead.notes) dates.push(n.date);
  for (const c of claims) {
    dates.push(c.timestamp, c.approvedAt, c.offeredAt, c.releasedAt, c.contactedAt);
    for (const n of c.firmNotes) dates.push(n.date);
  }
  if (activity) dates.push(activity.lastChange || '', activity.clientLastView || '');
  return dates
    .filter((d) => d && Number.isFinite(Date.parse(d)))
    .reduce((max, d) => (Date.parse(d) > Date.parse(max) ? d : max), lead.timestamp);
}

/**
 * Când a ajuns firma în starea de acum, dacă se știe: din jurnal (din 24 oct),
 * din data ofertei sau a renunțării, ori preluarea pentru „De sunat”. Altfel
 * null: o dată pusă lângă „Concretizat” care e de fapt data ofertei ar minți.
 */
function claimStatusSince(c: LeadClaim, activity: LeadActivity | undefined): string | null {
  const logged = activity?.claimStatusChanges.get(c.timestamp);
  if (logged) return logged;
  if (c.firmStatus === 'ofertat' && c.offeredAt) return c.offeredAt;
  if (c.firmStatus === 'pierdut' && c.releasedAt) return c.releasedAt;
  if (c.firmStatus === 'de_sunat') return c.timestamp;
  return null;
}

function ClientCell({ activity, lead }: { activity: LeadActivity | undefined; lead: NewLead }) {
  if (!activity) return <span className="text-slate-300">—</span>;
  const { account, clientViews, clientLastView, followClicked } = activity;
  let label: string;
  let tone: string;
  if (account?.deletedAt) {
    label = 'Cont șters';
    tone = 'text-slate-400';
  } else if (account?.verifiedAt) {
    label = 'Intrat în cont';
    tone = 'text-emerald-700 font-medium';
  } else if (clientViews > 0) {
    label = 'Și-a deschis pagina';
    tone = 'text-emerald-700';
  } else if (followClicked) {
    label = 'A apăsat „Urmăriți”';
    tone = 'text-slate-600';
  } else {
    // Contul se creează singur la cerere din 23 oct; înainte nu exista.
    return (
      <span className="text-slate-300">
        {Date.parse(lead.timestamp) < Date.parse(CLICKS_SINCE) ? '—' : 'nu'}
      </span>
    );
  }
  return (
    <div>
      <div className={tone}>{label}</div>
      {clientViews > 0 && (
        <div className="text-[11px] text-slate-400">
          {clientViews} {clientViews === 1 ? 'vizită' : 'vizite'}
          {clientLastView && ` · ultima ${ago(clientLastView)}`}
        </div>
      )}
    </div>
  );
}

function ViewsCell({ activity, lead }: { activity: LeadActivity | undefined; lead: NewLead }) {
  if (!activity) return <span className="text-slate-300">—</span>;
  const { visitors, firms } = activity.clicks;
  // Click-urile se numără de pe 23 oct seara: 0 pe o cerere mai veche nu înseamnă nimic.
  if (visitors === 0 && Date.parse(lead.timestamp) < Date.parse(CLICKS_SINCE)) {
    return <span className="text-slate-300">—</span>;
  }
  return (
    <div className="tabular-nums">
      <span className={visitors > 0 ? 'font-semibold text-slate-900' : 'text-slate-400'}>{visitors}</span>
      {firms > 0 && (
        <div className="text-[11px] text-slate-400">
          {firms} {firms === 1 ? 'firmă logată' : 'firme logate'}
        </div>
      )}
    </div>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
        active
          ? 'bg-slate-900 text-white'
          : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
    </Link>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-16 shrink-0 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

export default async function CereriPage({ searchParams }: Props) {
  const params = await searchParams;
  const etapa = (params.etapa ?? '') as EtapaFilter;
  const cont = (params.cont ?? '') as ContFilter;
  const judet = params.judet ?? '';
  const q = (params.q ?? '').trim();
  const sort: Sort = params.sort === 'miscare' || params.sort === 'hot' ? params.sort : 'intrare';
  const bani = (params.bani ?? '') as FinancingTone | '';
  const termen = params.termen ?? '';
  const hot = params.hot === '1';

  let leads: NewLead[];
  let claims: LeadClaim[];
  try {
    [leads, claims] = await Promise.all([getLeadsSince(new Date(0)), getClaims()]);
  } catch (err) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Nu am putut citi din Google Sheets: {err instanceof Error ? err.message : String(err)}
      </div>
    );
  }

  // Retrimiterile comasate nu sunt cereri, iar cele de test nu sunt ale nimănui.
  leads = leads.filter((l) => !l.duplicatAl && !isTestLead(l));

  let activityById: Map<string, LeadActivity> | null = null;
  let dbError = '';
  try {
    activityById = await getLeadsActivity(leads);
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const claimsByLead = new Map<string, LeadClaim[]>();
  for (const c of claims) claimsByLead.set(c.leadId, [...(claimsByLead.get(c.leadId) ?? []), c]);

  const counties = [...new Set(leads.map((l) => l.judet).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'ro'),
  );

  const needle = q.toLowerCase();
  const needlePhone = normalizePhone(q);
  const rows = leads
    .map((lead) => {
      const all = claimsByLead.get(lead.timestamp) ?? [];
      const activity = activityById?.get(lead.timestamp);
      return {
        lead,
        claims: all,
        held: all.filter(claimOccupiesLeadSlot).length,
        etapa: leadEtapa(lead, all),
        activity,
        last: lastActivity(lead, all, activity),
      };
    })
    .filter(({ lead, claims: cl, activity, etapa: e }) => {
      if (etapa === 'deschise' && !isEtapaOpen(e)) return false;
      if (etapa && etapa !== 'deschise' && e !== etapa) return false;
      if (cont) {
        const has = Boolean(activity?.account?.verifiedAt || (activity?.clientViews ?? 0) > 0);
        if (cont === 'da' && !has) return false;
        if (cont === 'nu' && has) return false;
      }
      if (judet && lead.judet !== judet) return false;
      if (bani && getFinancingTone(lead.finantare) !== bani) return false;
      if (termen === 'nedeclarat' ? lead.termen !== '' : termen && lead.termen !== termen) return false;
      // Hot = bani proprii și cât mai repede, pe cererile încă deschise.
      if (hot && (!isHot(lead) || !isEtapaOpen(e))) return false;
      if (needle) {
        const hay = [
          lead.numeContact,
          lead.numeCompanie,
          lead.email,
          lead.judet,
          lead.localitate,
          lead.tipProiect,
          ...cl.map((c) => c.numeFirma),
        ]
          .join(' ')
          .toLowerCase();
        const phoneHit = needlePhone.length >= 6 && normalizePhone(lead.telefon).includes(needlePhone);
        if (!hay.includes(needle) && !phoneHit) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === 'miscare') return Date.parse(b.last) - Date.parse(a.last);
      if (sort === 'hot') {
        // Deschise înainte de închise, apoi bani + grabă, apoi cele mai noi.
        const open = Number(!isEtapaOpen(a.etapa)) - Number(!isEtapaOpen(b.etapa));
        if (open) return open;
        const score = hotScore(b.lead) - hotScore(a.lead);
        if (score) return score;
      }
      return b.lead.timestamp.localeCompare(a.lead.timestamp);
    });

  const hotCount = leads.filter(
    (l) => isHot(l) && isEtapaOpen(leadEtapa(l, claimsByLead.get(l.timestamp) ?? [])),
  ).length;

  const open = rows.filter((r) => isEtapaOpen(r.etapa));
  const openWithoutFirm = open.filter((r) => r.etapa === 'fara_firma').length;
  const inAccount = rows.filter(
    (r) => r.activity?.account?.verifiedAt || (r.activity?.clientViews ?? 0) > 0,
  ).length;

  const qs = (
    next: Partial<Record<'etapa' | 'cont' | 'judet' | 'q' | 'sort' | 'bani' | 'termen' | 'hot', string>>,
  ) => {
    const merged = {
      etapa,
      cont,
      judet,
      q,
      sort: sort === 'intrare' ? '' : sort,
      bani,
      termen,
      hot: hot ? '1' : '',
      ...next,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/cereri?${s}` : '/admin/cereri';
  };

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-900">Cereri</h1>
        <p className="text-xs text-slate-500">
          {rows.length} {rows.length === 1 ? 'cerere' : 'cereri'} · {open.length} deschise ·{' '}
          <span className={openWithoutFirm > 0 ? 'font-medium text-amber-700' : ''}>
            {openWithoutFirm} deschise fără nicio firmă
          </span>{' '}
          · {inAccount} cu clientul în cont
        </p>
      </div>

      {dbError && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Baza Neon nu a răspuns, deci lipsesc contul clientului, vizualizările și istoricul de stări:{' '}
          {dbError}
        </p>
      )}

      <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <form action="/admin/cereri" className="flex flex-wrap items-center gap-2">
          {Object.entries({ etapa, cont, judet, sort: sort === 'intrare' ? '' : sort, bani, termen, hot: hot ? '1' : '' })
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Caută: nume, telefon, email, localitate, firmă"
            className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
          >
            Caută
          </button>
          {q && (
            <Link href={qs({ q: '' })} className="text-xs text-slate-500 hover:text-slate-900">
              șterge căutarea
            </Link>
          )}
        </form>

        <FilterRow label="Etapă">
          <Pill href={qs({ etapa: '' })} active={!etapa}>
            Toate
          </Pill>
          <Pill href={qs({ etapa: 'deschise' })} active={etapa === 'deschise'}>
            Deschise
          </Pill>
          <span className="mx-1 h-4 w-px bg-slate-200" />
          {ETAPE.map((e) => (
            <Pill key={e.key} href={qs({ etapa: e.key })} active={etapa === e.key}>
              {e.label}
            </Pill>
          ))}
        </FilterRow>

        <FilterRow label="Ordine">
          <Pill href={qs({ hot: hot ? '' : '1' })} active={hot}>
            🔥 Hot · {hotCount}
          </Pill>
          <span className="mx-1 h-4 w-px bg-slate-200" />
          <Pill href={qs({ sort: '' })} active={sort === 'intrare'}>
            Cele mai noi
          </Pill>
          <Pill href={qs({ sort: 'hot' })} active={sort === 'hot'}>
            🔥 întâi
          </Pill>
          <Pill href={qs({ sort: 'miscare' })} active={sort === 'miscare'}>
            Ultima mișcare
          </Pill>
        </FilterRow>

        <FilterRow label="Bani">
          <Pill href={qs({ bani: '' })} active={!bani}>
            Toți
          </Pill>
          {FINANCING_FILTERS.map((f) => (
            <Pill key={f.key} href={qs({ bani: f.key })} active={bani === f.key}>
              {f.label}
            </Pill>
          ))}
        </FilterRow>

        <FilterRow label="Termen">
          <Pill href={qs({ termen: '' })} active={!termen}>
            Toate
          </Pill>
          {TIMELINE_OPTIONS.map((t) => (
            <Pill key={t.value} href={qs({ termen: t.value })} active={termen === t.value}>
              {t.label}
            </Pill>
          ))}
          <Pill href={qs({ termen: 'nedeclarat' })} active={termen === 'nedeclarat'}>
            Nedeclarat
          </Pill>
        </FilterRow>

        <FilterRow label="Client">
          <Pill href={qs({ cont: '' })} active={!cont}>
            Toți
          </Pill>
          <Pill href={qs({ cont: 'da' })} active={cont === 'da'}>
            Își urmărește cererea
          </Pill>
          <Pill href={qs({ cont: 'nu' })} active={cont === 'nu'}>
            Nu a intrat
          </Pill>
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

      <ActivityTable>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-[11px] tracking-wide text-slate-500 uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">
                <Link href={qs({ sort: '' })} className={sort === 'intrare' ? 'text-slate-900' : 'hover:text-slate-900'}>
                  Intrată {sort === 'intrare' && '↓'}
                </Link>
              </th>
              <th className="px-3 py-2 font-medium">Cerere</th>
              <th className="px-3 py-2 font-medium">Bani · termen</th>
              <th className="px-3 py-2 font-medium">Etapă</th>
              <th className="px-3 py-2 font-medium">Firme</th>
              <th className="px-3 py-2 font-medium" title="Contul clientului: și-a deschis pagina cererii sau a intrat din email">
                Client în cont
              </th>
              <th className="px-3 py-2 font-medium" title="Vizitatori care au apăsat pe cerere în /cereri, câte unul pe zi. Se numără din 23 oct.">
                Apăsată pe /cereri
              </th>
              <th className="px-3 py-2 font-medium">
                <Link href={qs({ sort: 'miscare' })} className={sort === 'miscare' ? 'text-slate-900' : 'hover:text-slate-900'}>
                  Ultima mișcare {sort === 'miscare' && '↓'}
                </Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ lead, claims: cl, held, activity, last, etapa: e }) => {
              const closed = !isEtapaOpen(e);
              const wonBy = cl.filter((c) => c.firmStatus === 'castigat' && !c.releasedAt);
              const requested = parseRequestedFirms(lead.preselectedCompany);
              const href = cerereHref(lead.timestamp);
              return (
                <tr
                  key={lead.timestamp}
                  id={lead.timestamp}
                  data-cerere={lead.timestamp}
                  className={`cursor-pointer border-t border-slate-100 align-top hover:bg-slate-50 ${closed ? 'text-slate-500' : ''}`}
                >
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap tabular-nums">
                    <div className="text-slate-700">{fmtDateTime(lead.timestamp)}</div>
                    <div className="text-slate-400">{ago(lead.timestamp)}</div>
                  </td>
                  <td className="max-w-64 px-3 py-2.5">
                    <Link href={href} className="font-medium text-slate-900 hover:underline">
                      {isHot(lead) && <span title="Fonduri proprii și cât mai repede">🔥 </span>}
                      {lead.tipProiect ? getProjectTypeLabel(lead.tipProiect) : '(fără tip)'}
                      {lead.putere && ` · ${lead.putere} kW`}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {lead.judet}
                      {lead.localitate && `, ${lead.localitate}`}
                      {' · '}
                      {lead.numeContact || lead.numeCompanie || '—'}
                    </div>
                    {requested.length > 0 && (
                      <div
                        className="mt-1 max-w-60 truncate rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700"
                        title={requested.join(' · ')}
                      >
                        a cerut: {requested.join(', ')}
                      </div>
                    )}
                    <div className="mt-0.5 flex flex-wrap gap-1">
                      {lead.segment === 'comercial' && (
                        <span className="rounded bg-amber-50 px-1 text-[10px] font-semibold text-amber-700">comercial</span>
                      )}
                      {isLeadInformez(lead) && (
                        <span className="rounded bg-violet-50 px-1 text-[10px] font-semibold text-violet-700">se informează</span>
                      )}
                      {isPriorityHeld(lead) && (
                        <span className="rounded bg-indigo-50 px-1 text-[10px] font-semibold text-indigo-700">rezervată</span>
                      )}
                      {lead.status === 'Ascuns' && (
                        <span className="rounded bg-slate-100 px-1 text-[10px] font-semibold text-slate-500">ascunsă</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col items-start gap-1">
                      <FinancingBadge finantare={lead.finantare} />
                      <TimelineBadge termen={lead.termen} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    <EtapaBadge etapa={e} />
                    {e === 'concretizata' && wonBy.length > 0 && (
                      <div className="mt-0.5 max-w-32 truncate text-[11px] text-slate-500">
                        de {wonBy.map((c) => firmDisplayName(c.numeFirma)).join(', ')}
                      </div>
                    )}
                    {/* Pusă de mână pe câștigată, dar nicio firmă n-a marcat: de verificat. */}
                    {e === 'concretizata' && wonBy.length === 0 && (
                      <div className="mt-0.5 max-w-32 text-[11px] font-medium text-amber-700">
                        pusă de mână, nicio firmă n-a marcat
                      </div>
                    )}
                    {e === 'inchisa' && (
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        {LEAD_STATUS_LABELS[lead.crmStatus].toLowerCase()}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {cl.length === 0 ? (
                      <span className={closed ? 'text-slate-400' : 'font-medium text-amber-700'}>
                        nicio firmă
                        {activity && activity.sentTo > 0 && (
                          <span className="block font-normal text-slate-400">
                            trimisă la {activity.sentTo} pe email
                          </span>
                        )}
                      </span>
                    ) : (
                      <ul className="space-y-1">
                        {cl.map((c) => (
                          <li key={c.timestamp} className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                            <span
                              className={`max-w-40 truncate ${c.releasedAt ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                              title={c.numeFirma}
                            >
                              {firmDisplayName(c.numeFirma)}
                            </span>
                            <FirmStatusChip status={c.firmStatus} />
                            {(() => {
                              const since = claimStatusSince(c, activity);
                              return since ? (
                                <span className="text-[11px] text-slate-400">{fmtDay(since)}</span>
                              ) : (
                                <span
                                  className="text-[11px] text-slate-300"
                                  title="Mutată înainte de 24 oct, când a pornit jurnalul: data nu se știe"
                                >
                                  ?
                                </span>
                              );
                            })()}
                            {c.firmNotes.length > 0 && (
                              <span
                                className="text-[11px] text-slate-500"
                                title={c.firmNotes[0].text}
                              >
                                💬 {c.firmNotes.length}
                              </span>
                            )}
                          </li>
                        ))}
                        <li className="text-[11px] text-slate-400">
                          {held}/{MAX_CLAIMS_PER_LEAD} locuri ocupate
                        </li>
                      </ul>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    <ClientCell activity={activity} lead={lead} />
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    <ViewsCell activity={activity} lead={lead} />
                  </td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap text-slate-500">
                    <div>{ago(last)}</div>
                    <div className="text-[11px] text-slate-400">{fmtDay(last)}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Nicio cerere pentru filtrele alese.</p>
        )}
      </div>
      </ActivityTable>
    </div>
  );
}
