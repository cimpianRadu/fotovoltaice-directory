import Link from 'next/link';
import {
  getLeadsSince,
  getClaims,
  getCrmFirms,
  getTodos,
  isLeadHidden,
  CLAIM_STATUS_LABELS,
  FIRM_STATUS_LABELS,
  type NewLead,
  type LeadClaim,
} from '@/lib/sheets';
import {
  buildAgenda,
  bucharestDay,
  QUALIFY_WINDOW_DAYS,
  VERIFY_CALL_AFTER_DAYS,
  VERIFY_OFFER_AFTER_DAYS,
  type AgendaLead,
} from '@/lib/daily-agenda';
import {
  getCallWindowLabel,
  getFinancingShort,
  getProjectTypeLabel,
  getTimelineLabel,
} from '@/lib/utils-shared';
import TodoPanel from './TodoPanel';

export const dynamic = 'force-dynamic';

const LOOKBACK_DAYS = 120;

function fmtDay(day: string): string {
  const d = new Date(day);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', timeZone: 'Europe/Bucharest' });
}

function fmtLongDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <a
      href={href}
      className="rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-400"
    >
      <p className={`text-2xl font-bold tabular-nums ${value > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </a>
  );
}

function Section({
  id,
  title,
  count,
  hint,
  children,
}: {
  id: string;
  title: string;
  count: number;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-slate-100 px-5 py-3">
        <h2 className="text-base font-semibold text-slate-900">
          {title} <span className="tabular-nums text-slate-400">{count}</span>
        </h2>
        <p className="text-xs text-slate-400">{hint}</p>
      </div>
      <div className="px-5 py-3">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}

function Phone({ value }: { value: string }) {
  if (!value) return null;
  return (
    <a href={`tel:${value}`} className="tabular-nums text-slate-600 hover:text-slate-900">
      {value}
    </a>
  );
}

function LeadLine({ lead, claims }: { lead: AgendaLead; claims?: LeadClaim[] }) {
  const who = lead.numeCompanie ? `${lead.numeContact} · ${lead.numeCompanie}` : lead.numeContact;
  const bits = [
    lead.segment === 'comercial' ? 'comercial' : 'rezidențial',
    lead.putere ? `${lead.putere} kW` : '',
    lead.tipProiect ? getProjectTypeLabel(lead.tipProiect) : '',
    lead.termen ? getTimelineLabel(lead.termen) : '',
    lead.finantare ? getFinancingShort(lead.finantare) : '',
    lead.intervalApel ? `apel: ${getCallWindowLabel(lead.intervalApel)}` : '',
  ].filter(Boolean);
  return (
    <div className="space-y-0.5">
      <div className="flex flex-wrap items-baseline gap-x-3 text-sm">
        <span className="text-slate-400 tabular-nums">{fmtDay(lead.timestamp)}</span>
        <span className="font-medium text-slate-900">{who || '(fără nume)'}</span>
        <Phone value={lead.telefon} />
        <span className="text-slate-500">{lead.judet}</span>
        <Link
          href={`/admin/crm?judet=${encodeURIComponent(lead.judet)}`}
          className="ml-auto text-xs text-amber-700 hover:underline"
        >
          în CRM
        </Link>
      </div>
      <p className="text-xs text-slate-500">{bits.join(' · ')}</p>
      {claims && claims.length > 0 && (
        <p className="text-xs text-slate-400">
          {claims
            .map((c) => `${c.numeFirma} (${CLAIM_STATUS_LABELS[c.firmStatus].toLowerCase()})`)
            .join(', ')}
        </p>
      )}
    </div>
  );
}

// Ca în /admin/firme: momentul „acum" vine dintr-un helper de modul, nu din
// corpul componentei (regula react-hooks/purity). Pagina e force-dynamic, deci
// se calculează la fiecare cerere oricum.
function nowMs(): number {
  return Date.now();
}

export default async function AziPage() {
  const now = nowMs();
  const today = bucharestDay(now);
  const cutoff = new Date(now - LOOKBACK_DAYS * 86_400_000);

  const [allLeads, claims, firms, todos] = await Promise.all([
    getLeadsSince(cutoff),
    getClaims(),
    getCrmFirms(),
    getTodos(),
  ]);
  const leads: NewLead[] = allLeads.filter((l) => !isLeadHidden(l));
  const claimsByLead = new Map<string, LeadClaim[]>();
  for (const c of claims) {
    if (c.releasedAt) continue;
    const list = claimsByLead.get(c.leadId) ?? [];
    list.push(c);
    claimsByLead.set(c.leadId, list);
  }

  const agenda = buildAgenda({ leads, claims, firms, todos, today, now });
  const calls =
    agenda.firmsDue.length + agenda.toQualify.length + agenda.revin.length + agenda.toVerify.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold capitalize text-slate-900">{fmtLongDay(today)}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {calls} {calls === 1 ? 'apel' : 'apeluri'} de dat și {agenda.todosDue.length}{' '}
            {agenda.todosDue.length === 1 ? 'sarcină scrisă' : 'sarcini scrise'}. Totul de aici e dedus
            din Sheet; un rând dispare când faci lucrul pe care îl cere.
          </p>
        </div>
        {agenda.pendingApprovals > 0 && (
          <Link
            href="/admin/portal?filtru=de-aprobat"
            className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
          >
            {agenda.pendingApprovals} {agenda.pendingApprovals === 1 ? 'revendicare' : 'revendicări'} de aprobat →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Sarcini scrise" value={agenda.todosDue.length} href="#sarcini" />
        <Stat label="Firme de sunat" value={agenda.firmsDue.length} href="#firme" />
        <Stat label="Cereri de calificat" value={agenda.toQualify.length} href="#calificat" />
        <Stat label="Revin azi" value={agenda.revin.length} href="#revin" />
        <Stat label="Clienți de întrebat" value={agenda.toVerify.length} href="#verificat" />
        <Stat label="Rezervări expiră azi" value={agenda.expiringHolds.length} href="#rezervari" />
      </div>

      <Section
        id="sarcini"
        title="Sarcini scrise"
        count={agenda.todosDue.length}
        hint="ce nu se poate deduce din date: facturi, follow-up-uri pe abonamente, emailuri"
      >
        <TodoPanel
          today={today}
          due={agenda.todosDue.map(({ timestamp, text, due, link }) => ({ timestamp, text, due, link }))}
          upcoming={agenda.todosUpcoming.map(({ timestamp, text, due, link }) => ({
            timestamp,
            text,
            due,
            link,
          }))}
        />
      </Section>

      <Section
        id="firme"
        title="Firme de sunat"
        count={agenda.firmsDue.length}
        hint="fișele din CRM Instalatori cu follow-up azi sau restant; dispare când muți data"
      >
        {agenda.firmsDue.length === 0 ? (
          <Empty>Nicio firmă cu follow-up scadent.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {agenda.firmsDue.map((f) => {
              const overdue = f.followUp < today;
              const last = f.notes[0];
              return (
                <li key={f.timestamp} className="space-y-0.5 py-2">
                  <div className="flex flex-wrap items-baseline gap-x-3 text-sm">
                    <span className="font-medium text-slate-900">{f.numeFirma}</span>
                    <Phone value={f.telefon} />
                    <span className="text-xs text-slate-500">{FIRM_STATUS_LABELS[f.status]}</span>
                    {overdue && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                        restant din {fmtDay(f.followUp)}
                      </span>
                    )}
                    <Link href="/admin/firme?filtru=restante" className="ml-auto text-xs text-amber-700 hover:underline">
                      fișa
                    </Link>
                  </div>
                  {last && (
                    <p className="line-clamp-2 text-xs text-slate-500">
                      <span className="text-slate-400">[{last.date}]</span> {last.text}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {agenda.firmsUpcoming.length > 0 && (
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-900">
              Urmează în 7 zile ({agenda.firmsUpcoming.length})
            </summary>
            <ul className="mt-1 space-y-1">
              {agenda.firmsUpcoming.map((f) => (
                <li key={f.timestamp} className="text-xs text-slate-600">
                  <span className="tabular-nums text-slate-400">{fmtDay(f.followUp)}</span> {f.numeFirma}
                </li>
              ))}
            </ul>
          </details>
        )}
      </Section>

      <Section
        id="calificat"
        title="Cereri de calificat"
        count={agenda.toQualify.length}
        hint={`cereri din ultimele ${QUALIFY_WINDOW_DAYS} zile fără status CRM; dispare când îi pui un status (validă, altundeva, renunțat)`}
      >
        {agenda.toQualify.length === 0 ? (
          <Empty>Toate cererile recente au un status.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {agenda.toQualify.map((l) => (
              <li key={l.timestamp} className="py-2">
                <LeadLine lead={l} claims={claimsByLead.get(l.timestamp)} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        id="revin"
        title="Revin azi"
        count={agenda.revin.length}
        hint={`cereri a căror ultimă notă spune „revin AAAA-LL-ZZ"; dispare când scrii orice notă nouă`}
      >
        {agenda.revin.length === 0 ? (
          <Empty>Nicio revenire promisă pentru azi.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {agenda.revin.map(({ lead, due, note }) => (
              <li key={lead.timestamp} className="space-y-1 py-2">
                <LeadLine lead={lead} claims={claimsByLead.get(lead.timestamp)} />
                <p className="text-xs text-slate-500">
                  {due < today && (
                    <span className="mr-2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                      restant din {fmtDay(due)}
                    </span>
                  )}
                  {note}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        id="verificat"
        title="Clienți de întrebat"
        count={agenda.toVerify.length}
        hint={`firma a trimis ofertă de ${VERIFY_OFFER_AFTER_DAYS}+ zile (a primit-o? semnează?) sau are datele clientului de ${VERIFY_CALL_AFTER_DAYS}+ zile fără apel confirmat (l-a sunat cineva?); dispare când completezi „contactat de firmă"`}
      >
        {agenda.toVerify.length === 0 ? (
          <Empty>Nimic de verificat cu clienții.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {agenda.toVerify.map(({ lead, reason, claims: cs }) => (
              <li key={lead.timestamp} className="space-y-1 py-2">
                <LeadLine lead={lead} />
                <p className="text-xs">
                  <span
                    className={`mr-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      reason === 'oferta' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    {reason === 'oferta' ? 'a primit oferta? semnează?' : 'l-a sunat cineva?'}
                  </span>
                  <span className="text-slate-500">
                    {cs
                      .map(
                        (c) =>
                          `${c.numeFirma} (${CLAIM_STATUS_LABELS[c.firmStatus].toLowerCase()}${
                            c.offeredAt ? `, ofertă ${fmtDay(c.offeredAt)}` : ''
                          })`,
                      )
                      .join(', ')}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        id="rezervari"
        title="Rezervări care expiră azi"
        count={agenda.expiringHolds.length}
        hint="ferestre de prioritate (coloana AE) care se închid azi; după expirare cererea intră singură în /cereri"
      >
        {agenda.expiringHolds.length === 0 ? (
          <Empty>Nicio rezervare nu expiră azi.</Empty>
        ) : (
          <ul className="divide-y divide-slate-100">
            {agenda.expiringHolds.map((l) => (
              <li key={l.timestamp} className="py-2">
                <LeadLine lead={l} claims={claimsByLead.get(l.timestamp)} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
