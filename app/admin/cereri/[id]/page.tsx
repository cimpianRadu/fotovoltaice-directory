import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  countActiveClaimsForFirm,
  getClaims,
  getCrmFirms,
  getLeadsSince,
  getListingsSince,
  getPhotosForLead,
  getPortalAccountEmails,
  getWatches,
  isLeadInformez,
  isPriorityHeld,
  MAX_CLAIMS_PER_LEAD,
  type LeadClaim,
  type NewLead,
} from '@/lib/sheets';
import {
  claimOccupiesLeadSlot,
  isLeadClosed,
  isPozeLink,
  isSameClient,
  parseRequestedFirms,
} from '@/lib/sheets-shared';
import {
  getBlocajLabel,
  getBudgetLabel,
  getCallWindowLabel,
  getConnectionLabel,
  getFinancingLabel,
  getPhaseLabel,
  getProjectTypeLabel,
  getRoofTypeLabel,
  getScopLabel,
  getTimelineLabel,
  getWorkTypeLabel,
  getYesNoLabel,
} from '@/lib/utils-shared';
import { getCompanies } from '@/lib/utils';
import { matchFirmsForLead } from '@/lib/lead-match';
import { matchNecesitFirms } from '@/lib/necesit-match';
import { firmDisplayName } from '@/lib/client-account';
import {
  CLICKS_SINCE,
  CLIENT_VIEWS_SINCE,
  getLeadActivityDetail,
  type LeadActivityDetail,
} from '@/lib/admin-cereri';
import ClaimList, { type ClaimRow } from '../../crm/ClaimList';
import LeadCrm from '../../crm/LeadCrm';
import ManualClaimForm, { type FirmOption } from '../../crm/ManualClaimForm';
import ShareLeadButton from '../../crm/ShareLeadButton';
import MergeLeadsButton from '../../crm/MergeLeadsButton';
import { MatchList, NecesitList } from '../../crm/MatchLists';
import { formatLeadForShare } from '../../crm/formatLead';
import { buildTimeline, type TimelineKind } from '../timeline';
import FirmJourney from './FirmJourney';
import {
  Caption,
  FinancingBadge,
  LeadStatusBadge,
  TimelineBadge,
  ago,
  cerereHref,
  fmtDateTime,
  fmtDay,
  isHot,
} from '../shared';

export const dynamic = 'force-dynamic';

// Fișa unei cereri (24 oct 2026): tot ce s-a întâmplat cu ea, dintr-un loc.
// Acțiunile sunt aceleași ca pe cardul din /admin/crm (stare, note, aprobări,
// revendicare manuală), deci CRM-ul vechi nu mai e nevoie pentru o cerere anume.

interface Props {
  params: Promise<{ id: string }>;
}

const KIND_DOT: Record<TimelineKind, string> = {
  intrare: 'bg-slate-900',
  firma: 'bg-indigo-500',
  client: 'bg-emerald-500',
  email: 'bg-sky-400',
  stare: 'bg-amber-500',
  nota: 'bg-slate-300',
  vizita: 'bg-violet-400',
};

const KIND_LABEL: Record<TimelineKind, string> = {
  intrare: 'Intrare',
  firma: 'Firmă',
  client: 'Client',
  email: 'Email',
  stare: 'Stare',
  nota: 'Notă',
  vizita: 'Vizită',
};

function Card({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex items-baseline justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {aside}
      </header>
      <div className="px-4 py-3">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === '' || value == null || value === false) return null;
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-2 py-1 text-xs">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}

function Details({ lead }: { lead: NewLead }) {
  const requested = parseRequestedFirms(lead.preselectedCompany);
  // Unii clienți scriu și unitatea („1385 kWh”): atunci cifra rămâne cum e.
  const unit = (v: string, u: string) => (!v ? '' : /[a-z]/i.test(v) ? v : `${v} ${u}`);
  return (
    <dl className="divide-y divide-slate-50">
      <Field label="Segment" value={lead.segment === 'rezidential' ? 'Rezidențial' : 'Comercial'} />
      <Field label="Tip proiect" value={lead.tipProiect && getProjectTypeLabel(lead.tipProiect)} />
      <Field label="Lucrare" value={lead.tipLucrare && getWorkTypeLabel(lead.tipLucrare)} />
      <Field label="Județ" value={lead.judet} />
      <Field label="Localitate" value={lead.localitate} />
      <Field label="Putere" value={unit(lead.putere, 'kW')} />
      <Field label="Suprafață" value={unit(lead.suprafata, 'mp')} />
      <Field label="Consum lunar" value={unit(lead.consumLunar, 'kWh')} />
      <Field label="Acoperiș" value={lead.tipAcoperis && getRoofTypeLabel(lead.tipAcoperis)} />
      <Field label="Alimentare" value={lead.fazare && getPhaseLabel(lead.fazare)} />
      <Field label="Branșament" value={lead.bransament && getConnectionLabel(lead.bransament)} />
      <Field label="Baterie" value={lead.stocare && getYesNoLabel(lead.stocare)} />
      <Field label="Capacitate baterie" value={unit(lead.capacitateBaterie, 'kWh')} />
      <Field label="Stație încărcare" value={lead.wallbox && getYesNoLabel(lead.wallbox)} />
      <Field label="Termen" value={lead.termen ? getTimelineLabel(lead.termen) : 'nedeclarat'} />
      <Field label="Finanțare" value={lead.finantare && getFinancingLabel(lead.finantare)} />
      <Field label="Buget" value={getBudgetLabel(lead.buget)} />
      <Field label="Vrea să rezolve" value={getScopLabel(lead.scop, lead.scopDetalii)} />
      <Field
        label="Ce îl oprește"
        value={
          lead.blocaj &&
          `${getBlocajLabel(lead.blocaj)}${lead.blocajDetalii ? ` („${lead.blocajDetalii}”)` : ''}`
        }
      />
      <Field label="Firme cerute" value={requested.join(' · ')} />
      <Field label="Rezervată până la" value={lead.prioritarPanaLa && fmtDateTime(lead.prioritarPanaLa)} />
      <Field label="Canal" value={[lead.canal, lead.campanie].filter(Boolean).join(' · ')} />
      <Field label="Pagina de intrare" value={lead.paginaIntrare} />
      <Field label="Trimisă din" value={lead.sourcePage} />
      <Field
        label="Poze"
        value={
          lead.poze &&
          (isPozeLink(lead.poze) ? (
            <a href={lead.poze} target="_blank" rel="noopener noreferrer" className="underline">
              link
            </a>
          ) : (
            lead.poze
          ))
        }
      />
    </dl>
  );
}

function ClientAccount({
  lead,
  activity,
  dbError,
}: {
  lead: NewLead;
  activity: LeadActivityDetail | null;
  dbError: string;
}) {
  if (!activity) {
    return <p className="text-xs text-amber-700">Baza Neon nu a răspuns: {dbError}</p>;
  }
  const { account, views, events, clicks, sends, bumps } = activity;
  const totalViews = views.reduce((n, v) => n + v.views, 0);
  const days = new Set(views.map((v) => v.day)).size;
  const sawCta = events.some((e) => e.event === 'cta_vazut');
  const clickedCta = events.some((e) => e.event === 'cta_click');
  // Un rând = un vizitator, o zi, un buton (lib/lead-clicks).
  const presses = clicks.length;
  const firms = [...new Set(clicks.map((c) => c.firmEmail).filter(Boolean))];
  const old = Date.parse(lead.timestamp) < Date.parse(CLICKS_SINCE);

  let state: string;
  if (account?.deletedAt) state = `Și-a șters contul pe ${fmtDay(account.deletedAt)}`;
  else if (account?.verifiedAt) state = `Da, a intrat din email pe ${fmtDateTime(account.verifiedAt)}`;
  else if (totalViews > 0) state = 'Și-a deschis pagina din browserul cu care a trimis cererea, n-a intrat din email';
  else if (clickedCta) state = 'A apăsat „Urmăriți cererea”, dar nu și-a deschis pagina';
  else if (sawCta) state = 'A văzut blocul „Urmăriți cererea”, n-a apăsat';
  else if (account) state = 'Nu (contul există, creat automat la cerere)';
  else state = old ? 'Nu (cererea e de dinainte de contul clientului)' : 'Nu';

  return (
    <dl className="divide-y divide-slate-50">
      <Field label="Își urmărește cererea" value={state} />
      <Field
        label="Vizite pe pagina ei"
        value={
          totalViews > 0
            ? `${totalViews} în ${days} ${days === 1 ? 'zi' : 'zile'}, ultima ${ago(
                views.map((v) => v.lastAt).sort().at(-1) as string,
              )}`
            : Date.parse(lead.timestamp) < Date.parse(CLIENT_VIEWS_SINCE)
              ? '— (se numără din 24 oct)'
              : '0'
        }
      />
      <Field
        label="Apăsată pe /cereri"
        value={
          clicks.length === 0 && old
            ? '— (se numără din 23 oct)'
            : `${presses} ${presses === 1 ? 'dată' : 'ori'} (un vizitator pe zi și buton)${
                firms.length ? ` · firme logate: ${firms.join(', ')}` : ''
              }`
        }
      />
      <Field
        label="Trimisă pe email"
        value={
          sends.length
            ? `la ${new Set(sends.map((s) => s.firmEmail)).size} firme`
            : lead.alerteTrimise
              ? `alertă plecată pe ${fmtDay(lead.alerteTrimise)}, fără listă de firme (înainte de 23 oct)`
              : ''
        }
      />
      <Field label="„Încă vreau oferte”" value={bumps.length ? `de ${bumps.length} ori` : ''} />
    </dl>
  );
}

export default async function CererePage({ params }: Props) {
  const id = decodeURIComponent((await params).id);

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
  const lead = leads.find((l) => l.timestamp === id);
  if (!lead) notFound();

  const closed = isLeadClosed(lead.crmStatus);
  const [photos, watches, portalAccounts, crmFirms, listings, activityResult] = await Promise.all([
    getPhotosForLead(id).catch(() => []),
    getWatches().then((w) => w.filter((x) => x.leadId === id)),
    getPortalAccountEmails(),
    closed ? Promise.resolve([]) : getCrmFirms(),
    closed ? Promise.resolve([]) : getListingsSince(new Date(0)),
    getLeadActivityDetail(lead).then(
      (a) => ({ activity: a, error: '' }),
      (err: unknown) => ({ activity: null, error: err instanceof Error ? err.message : String(err) }),
    ),
  ]);
  const { activity, error: dbError } = activityResult;

  const leadClaims = claims.filter((c) => c.leadId === id);
  const claimRows: ClaimRow[] = leadClaims.map((c) => ({
    ...c,
    firmActive: countActiveClaimsForFirm(claims, c),
    hasPortalAccount: portalAccounts.has((c.email || '').trim().toLowerCase()),
  }));
  const held = leadClaims.filter(claimOccupiesLeadSlot).length;
  const full = held >= MAX_CLAIMS_PER_LEAD;

  const companies = getCompanies();
  const firms: FirmOption[] = companies
    .map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.contact.phone,
      city: c.location.city,
      email: c.contact.email || '',
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ro'));

  const sameClient = closed
    ? []
    : leads.filter(
        (o) =>
          o.timestamp !== id && !o.duplicatAl && !isLeadClosed(o.crmStatus) && isSameClient(lead, o),
      );
  const timeline = buildTimeline(lead, leadClaims, watches, activity);

  const title = [lead.tipProiect ? getProjectTypeLabel(lead.tipProiect) : '(fără tip)', lead.putere && `${lead.putere} kW`]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <Link href="/admin/cereri" className="text-slate-500 hover:text-slate-900">
          ← Toate cererile
        </Link>
        {!closed && (
          <Link href={`/cereri?cerere=${encodeURIComponent(id)}`} className="text-slate-500 hover:text-slate-900">
            pe /cereri →
          </Link>
        )}
      </div>

      {lead.duplicatAl && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          E o retrimitere comasată în{' '}
          <Link href={cerereHref(lead.duplicatAl)} className="underline">
            cererea din {fmtDateTime(lead.duplicatAl)}
          </Link>
          .
        </p>
      )}

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">
            {isHot(lead) && <span title="Fonduri proprii și cât mai repede">🔥 </span>}
            {title}
          </h1>
          <LeadStatusBadge status={lead.crmStatus} />
          {isLeadInformez(lead) && (
            <span className="rounded bg-violet-50 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700">
              se informează
            </span>
          )}
          {isPriorityHeld(lead) && (
            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-700">
              rezervată abonatului
            </span>
          )}
          {lead.status === 'Ascuns' && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-500">ascunsă</span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <FinancingBadge finantare={lead.finantare} size="md" />
          <TimelineBadge termen={lead.termen} size="md" />
          {lead.buget && getBudgetLabel(lead.buget) && (
            <span className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
              buget {getBudgetLabel(lead.buget)}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          {lead.judet}
          {lead.localitate && `, ${lead.localitate}`} · {lead.numeContact || lead.numeCompanie || '—'} · intrată{' '}
          {fmtDateTime(lead.timestamp)} ({ago(lead.timestamp)})
        </p>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Sus și în coloana lată: banda cu cele 7 stări nu încape în cea îngustă. */}
          <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <LeadCrm
              id={id}
              status={lead.crmStatus}
              contacted={lead.contactedByFirm}
              poze={lead.poze}
              notes={lead.notes}
            />
          </section>

          <Card
            title="Firme"
            aside={
              <span className={`text-xs font-semibold tabular-nums ${full ? 'text-emerald-600' : 'text-slate-500'}`}>
                {held}/{MAX_CLAIMS_PER_LEAD} locuri ocupate
              </span>
            }
          >
            <div className="space-y-3">
              {claimRows.length > 0 ? (
                <div className="space-y-3">
                  {claimRows.map((row) => (
                    <div key={row.timestamp} className="rounded-xl border border-slate-200 p-2">
                      <ClaimList claims={[row]} hideNotes />
                      <FirmJourney
                        claim={row}
                        changes={(activity?.changes ?? []).filter(
                          (c) => c.field === 'stare_firma' && c.claimTs === row.timestamp,
                        )}
                        reports={(activity?.reports ?? []).filter((r) => r.claimTs === row.timestamp)}
                        offers={(activity?.offers ?? []).filter((o) => o.claimTs === row.timestamp)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-xs ${closed ? 'text-slate-400' : 'font-medium text-amber-700'}`}>
                  Nicio firmă n-a preluat cererea.
                </p>
              )}

              {watches.length > 0 && (
                <p className="text-xs text-slate-500">
                  <Caption>Urmăresc</Caption>{' '}
                  {watches.map((w) => firmDisplayName(w.numeFirma)).join(', ')}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                <ShareLeadButton text={formatLeadForShare(lead)} />
                <ManualClaimForm leadId={id} firms={firms} full={full} />
              </div>
            </div>
          </Card>

          {!closed && (
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <MatchList matches={matchFirmsForLead(lead, id, companies, claims, crmFirms)} lead={lead} />
              <NecesitList matches={matchNecesitFirms(lead, listings)} />
            </section>
          )}

          <Card title="Cronologie" aside={<span className="text-xs text-slate-400">{timeline.length} momente</span>}>
            <ol className="relative space-y-3 border-l border-slate-200 pl-4">
              {timeline.map((t, i) => (
                <li key={`${t.at}-${i}`} className="relative">
                  <span
                    className={`absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full ring-2 ring-white ${KIND_DOT[t.kind]}`}
                  />
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-xs whitespace-nowrap text-slate-400 tabular-nums">
                      {t.dayOnly ? fmtDay(t.at) : fmtDateTime(t.at)}
                    </span>
                    <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                      {KIND_LABEL[t.kind]}
                    </span>
                  </div>
                  <div className="text-sm text-slate-800">{t.title}</div>
                  {t.detail && <div className="text-xs whitespace-pre-line text-slate-500">{t.detail}</div>}
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
              Schimbările de stare (ale cererii și ale firmelor) au oră exactă din 24 oct 2026. Înainte se vedea
              doar starea de acum, plus datele care aveau coloană proprie: preluare, deblocare, ofertă, renunțare,
              notele.
            </p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Client">
            <div className="space-y-0.5 text-sm">
              <div className="font-medium text-slate-900">{lead.numeContact || '—'}</div>
              {lead.numeCompanie && <div className="text-slate-500">{lead.numeCompanie}</div>}
              {lead.telefon && (
                <a href={`tel:${lead.telefon}`} className="block text-slate-600 hover:text-slate-900">
                  {lead.telefon}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="block break-all text-slate-600 hover:text-slate-900">
                  {lead.email}
                </a>
              )}
              {lead.intervalApel && (
                <div className="text-xs text-emerald-700">sună: {getCallWindowLabel(lead.intervalApel)}</div>
              )}
            </div>
            {sameClient.length > 0 && (
              <div className="mt-2 text-xs text-amber-700">
                Același telefon/email ca{' '}
                {sameClient.map((o, i) => (
                  <span key={o.timestamp}>
                    {i > 0 && ', '}
                    <Link href={cerereHref(o.timestamp)} className="underline">
                      cererea din {fmtDateTime(o.timestamp)}
                    </Link>
                  </span>
                ))}
                <MergeLeadsButton
                  leadId={id}
                  candidates={sameClient.map((o) => ({
                    id: o.timestamp,
                    when: fmtDateTime(o.timestamp),
                    firms: parseRequestedFirms(o.preselectedCompany),
                  }))}
                />
              </div>
            )}
          </Card>

          <Card title="Contul clientului și vizualizări">
            <ClientAccount lead={lead} activity={activity} dbError={dbError} />
          </Card>

          <Card title="Detaliile cererii">
            <Details lead={lead} />
            {lead.mesaj && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <Caption>Mesajul clientului</Caption>
                <p className="mt-1 text-xs whitespace-pre-line text-slate-700">{lead.mesaj}</p>
              </div>
            )}
            {photos.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <Caption>Poze de la client</Caption>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {photos.map((poza) => {
                    const src = `/api/admin/poza?cerere=${encodeURIComponent(id)}&poza=${encodeURIComponent(
                      poza.pathname,
                    )}`;
                    return (
                      <li key={poza.pathname}>
                        <a href={src} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={poza.fileName || 'Poză de la client'}
                            loading="lazy"
                            className="h-16 w-16 rounded border border-slate-200 object-cover hover:opacity-80"
                          />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
