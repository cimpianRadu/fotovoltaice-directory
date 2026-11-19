import Link from 'next/link';
import {
  getClaims,
  getLeadsSince,
  isLeadClosed,
  isLeadHidden,
  maxClaimsForLead,
  type LeadClaim,
  type NewLead,
} from '@/lib/sheets';
import { claimOccupiesLeadSlot } from '@/lib/sheets-shared';
import { getProjectTypeLabel } from '@/lib/utils-shared';
import { firmDisplayName } from '@/lib/client-account';
import {
  getRegisteredFirms,
  getWhatsappThreads,
  registeredFirmsForLead,
  choseWithoutFirm,
  revenireMotiv,
  type RegisteredFirm,
  type WhatsappThread,
} from '@/lib/whatsapp-tracking';
import { whatsappRevenireFor, type WhatsappRevenire } from '@/lib/whatsapp-verificare';
import {
  ago,
  cerereHref,
  EtapaBadge,
  FinancingBadge,
  FirmStatusChip,
  fmtDateTime,
  isEtapaOpen,
  isHot,
  leadEtapa,
  TimelineBadge,
} from '../cereri/shared';
import { RESPONSE_LABEL } from '../cereri/timeline';
import ReplyForm from './ReplyForm';
import GiveToFirm from './GiveToFirm';
import RevenireButton from './RevenireButton';

// Mesajele WhatsApp către clienți și ce a urmat după ele (17 nov 2026, cerut de
// Radu: „vreau să văd în admin”). Un rând pe mesaj: cererea, firmele care o
// țin, ce a făcut clientul (link deschis, răspuns pe link, răspuns pe WhatsApp)
// și firmele cu cont pe județ, ca cererea să poată fi dată mai departe de aici.
// Datele: lib/whatsapp-tracking.
//
// 18 nov 2026: revenirea, a doua încercare la cine n-a răspuns sau n-a spus
// firma, o dată pe mesaj (filtrul „De revenit”, lib/whatsapp-verificare).
// 19 nov 2026: „ultimul mesaj”, a treia încercare pe „ofertă bună?”, la 5+ zile
// după o revenire fără răspuns; apare tot la „De revenit”.

export const dynamic = 'force-dynamic';

const KIND_LABEL = { oferta: '„Ofertă bună?”', firma: '„Ce firmă?”', status: '„Mai căutați?”' } as const;
const MOTIV_LABEL = {
  oferta: 'n-a răspuns',
  firma: 'n-a răspuns',
  nume_firma: 'a întrebat numele firmei',
  ultimul: 'ultimul mesaj',
} as const;
const DAY = 24 * 60 * 60 * 1000;

/** Codurile cu motiv de pe „Ați găsit o ofertă bună?” (lib/verificare-status), care nu sunt în RESPONSE_LABEL. */
const LINK_CODE_LABEL: Record<string, string> = {
  'altafirma-altundeva': 'a ales o firmă din afara platformei',
  'altafirma-renuntat': 'nu mai face lucrarea',
};

type Filter = 'toate' | 'raspuns' | 'fara' | 'revenire';

interface Row {
  thread: WhatsappThread;
  lead: NewLead | undefined;
  claims: LeadClaim[];
  /** Răspunsul dat pe linkul din mesaj (coloana AT), doar dacă a venit după mesaj. */
  linkAnswer: { label: string; at: string; code: string } | null;
  /** Linkul deschis, socotind și deschiderile urmate de un răspuns pe link. */
  linkOpenedAt: string | null;
  /** Primul semn de la client după mesaj, oricare ar fi canalul. */
  firstResponseAt: string | null;
  candidates: RegisteredFirm[];
  /** Revenirea de trimis acum, dacă e cazul. */
  revenireDue: WhatsappRevenire | null;
  /** Clientul a răspuns (pe orice canal) după revenire. */
  answeredAfterRevenire: boolean;
  /** Clientul a răspuns (pe orice canal) după ultimul mesaj. */
  answeredAfterUltimul: boolean;
  /** A ales o firmă fără s-o numească (lib/whatsapp-tracking `choseWithoutFirm`). */
  noFirm: boolean;
}

function linkAnswerOf(lead: NewLead | undefined, sentAt: string): Row['linkAnswer'] {
  if (!lead?.raspunsClient) return null;
  const [code = '', at = '', ...rest] = lead.raspunsClient.split(' ');
  if (!at || at < sentAt) return null;
  const firma = rest.join(' ');
  const label = LINK_CODE_LABEL[code] ?? RESPONSE_LABEL[code] ?? code;
  return { label: `${label}${firma ? ` cu ${firma}` : ''}`, at, code };
}

/** Fără niciun răspuns de cel puțin `days` zile de la mesaj. */
function silentFor(rows: Row[], days: number, now = Date.now()): Row[] {
  return rows.filter((r) => !r.firstResponseAt && now - Date.parse(r.thread.sentAt) >= days * DAY);
}

function fmtDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 6) / 10;
  if (h < 24) return `${h} ore`;
  return `${Math.round((h / 24) * 10) / 10} zile`;
}

function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2" title={hint}>
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-lg font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-900'
      }`}
    >
      {children}
    </Link>
  );
}

function leadTitle(lead: NewLead): string {
  return [
    lead.tipProiect ? getProjectTypeLabel(lead.tipProiect) : 'Cerere',
    lead.putere && `${lead.putere} kW`,
    [lead.judet, lead.localitate].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' · ');
}

function ClientColumn({ row }: { row: Row }) {
  const { thread, linkAnswer, linkOpenedAt } = row;
  return (
    <div className="space-y-1.5 text-xs">
      {thread.kind === 'oferta' && (
        <p className={linkOpenedAt ? 'text-slate-800' : 'text-slate-400'}>
          Link deschis: {linkOpenedAt ? fmtDateTime(linkOpenedAt) : 'nu'}
        </p>
      )}
      {thread.kind === 'oferta' && (
        <p className={linkAnswer ? 'font-medium text-emerald-800' : 'text-slate-400'}>
          Răspuns pe link: {linkAnswer ? `${linkAnswer.label} (${fmtDateTime(linkAnswer.at)})` : 'nu'}
        </p>
      )}
      {thread.kind === 'firma' && (
        <p className={thread.firmAnswer ? 'font-medium text-emerald-800' : 'text-slate-400'}>
          Firma aleasă: {thread.firmAnswer ? `${thread.firmAnswer.firma || '?'} (${fmtDateTime(thread.firmAnswer.at)})` : 'nu a răspuns'}
        </p>
      )}
      <div>
        <p className={thread.reply ? 'text-slate-800' : 'text-slate-400'}>
          Pe WhatsApp:{' '}
          {thread.reply ? (
            <>
              <span className="text-slate-500">{fmtDateTime(thread.reply.la)}</span>
              {row.noFirm && (
                <span className="ml-1.5 rounded bg-amber-50 px-1 py-px text-[10px] font-medium text-amber-700">
                  n-a spus firma
                </span>
              )}
              <span className="mt-0.5 block whitespace-pre-line rounded bg-emerald-50 px-2 py-1 text-slate-800">
                {thread.reply.text}
              </span>
            </>
          ) : (
            'nimic notat'
          )}
        </p>
        <ReplyForm
          leadId={thread.leadId}
          text={thread.reply?.text ?? ''}
          la={thread.reply?.la ?? null}
          faraFirma={row.noFirm}
        />
      </div>
      {thread.revenire && (
        <p className={row.answeredAfterRevenire ? 'font-medium text-emerald-800' : 'text-slate-600'}>
          Revenire: {fmtDateTime(thread.revenire.at)} ({MOTIV_LABEL[thread.revenire.motiv]})
          {row.answeredAfterRevenire ? ' · a răspuns după ea' : ' · nimic după ea'}
          {thread.revenire.linkOpenedAt && ` · link deschis ${fmtDateTime(thread.revenire.linkOpenedAt)}`}
        </p>
      )}
      {thread.ultimulAt && (
        <p className={row.answeredAfterUltimul ? 'font-medium text-emerald-800' : 'text-slate-600'}>
          Ultimul mesaj: {fmtDateTime(thread.ultimulAt)}
          {row.answeredAfterUltimul ? ' · a răspuns după el' : ' · nimic după el'}
        </p>
      )}
    </div>
  );
}

function FirmsColumn({ row }: { row: Row }) {
  const held = row.claims.filter(claimOccupiesLeadSlot).length;
  const max = maxClaimsForLead(row.thread.leadId);
  return (
    <div className="text-xs">
      <p className="mb-1 text-[11px] text-slate-500">
        {row.claims.length === 0 ? 'Nicio firmă n-a luat-o' : `${held} din ${max} locuri ocupate`}
      </p>
      <ul className="space-y-1">
        {row.claims.map((c) => (
          <li key={c.timestamp} className="flex flex-wrap items-center gap-1.5">
            <span className={c.releasedAt ? 'text-slate-400 line-through' : 'font-medium text-slate-800'}>
              {firmDisplayName(c.numeFirma)}
            </span>
            {c.releasedAt ? (
              <span className="text-[10px] text-slate-400">a renunțat</span>
            ) : (
              <FirmStatusChip status={c.firmStatus} />
            )}
            {c.offeredAt && !c.releasedAt && (
              <span className="text-[10px] text-slate-400">ofertă {fmtDateTime(c.offeredAt)}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CandidatesColumn({ row, canGive }: { row: Row; canGive: boolean }) {
  const { candidates, lead } = row;
  if (!lead) return null;
  if (candidates.length === 0) {
    return (
      <p className="text-xs text-slate-400">
        Nicio altă firmă cu cont nu primește alerte pe {lead.judet || 'județul ăsta'}.{' '}
        <Link href="/admin/portal" className="underline hover:text-slate-700">
          Conturi portal
        </Link>
      </p>
    );
  }
  const item = (f: RegisteredFirm) => (
    <li key={f.email} className="rounded bg-slate-50 px-2 py-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-medium text-slate-800">{firmDisplayName(f.numeFirma)}</span>
        <a href={`tel:${f.telefon}`} className="tabular-nums text-slate-500 hover:text-slate-900">
          {f.telefon}
        </a>
      </div>
      <p className="text-[10px] text-slate-400">
        {f.email} · {f.slotsFree} din 5 locuri libere
        {f.lastActivity && ` · activă ${ago(f.lastActivity)}`}
      </p>
      {canGive && (
        <div className="mt-1">
          <GiveToFirm
            leadId={row.thread.leadId}
            firm={{ email: f.email, numeFirma: f.numeFirma, numeContact: f.numeContact, telefon: f.telefon }}
          />
        </div>
      )}
    </li>
  );
  return (
    <div className="text-xs">
      <p className="mb-1 text-[11px] text-slate-500">
        Firme cu cont pe {lead.judet}: {candidates.length}
      </p>
      <ul className="space-y-1">{candidates.slice(0, 3).map(item)}</ul>
      {candidates.length > 3 && (
        <details className="mt-1">
          <summary className="cursor-pointer text-[11px] text-slate-500 hover:text-slate-900">
            încă {candidates.length - 3}
          </summary>
          <ul className="mt-1 space-y-1">{candidates.slice(3).map(item)}</ul>
        </details>
      )}
    </div>
  );
}

export default async function WhatsappPage({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const f = (await searchParams).f;
  const filter: Filter = f === 'raspuns' || f === 'fara' || f === 'revenire' ? f : 'toate';

  let threads: WhatsappThread[];
  let leads: NewLead[];
  let claims: LeadClaim[];
  let firms: RegisteredFirm[];
  try {
    [threads, leads, claims] = await Promise.all([getWhatsappThreads(), getLeadsSince(new Date(0)), getClaims()]);
    firms = await getRegisteredFirms(claims);
  } catch (err) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        Nu am putut citi datele: {err instanceof Error ? err.message : String(err)}
      </div>
    );
  }

  const leadById = new Map(leads.map((l) => [l.timestamp, l]));
  const rows: Row[] = threads.map((thread) => {
    const lead = leadById.get(thread.leadId);
    const leadClaims = claims.filter((c) => c.leadId === thread.leadId);
    const linkAnswer = thread.kind === 'oferta' ? linkAnswerOf(lead, thread.sentAt) : null;
    const firstResponseAt =
      [thread.reply?.la, linkAnswer?.at, thread.firmAnswer?.at].filter((x): x is string => Boolean(x)).sort()[0] ??
      null;
    // Un răspuns pe link înseamnă că linkul a fost deschis, chiar dacă deschiderea
    // a căzut în fereastra de preview (înainte de 17 nov n-avea user-agent).
    const linkOpenedAt = thread.linkOpenedAt ?? (linkAnswer ? (thread.anyOpenAt ?? linkAnswer.at) : null);
    // Revenirea are rost doar cât cererea e unde era: deschisă la „ofertă bună?”, încă pe altundeva la „ce firmă?”.
    const open =
      !!lead &&
      (thread.kind === 'firma'
        ? lead.crmStatus === 'altundeva'
        : !isLeadHidden(lead) && !isLeadClosed(lead.crmStatus));
    const noFirm = choseWithoutFirm(thread, linkAnswer?.code ?? null);
    const motiv = lead ? revenireMotiv(thread, firstResponseAt, open, noFirm) : null;
    const revAt = thread.revenire?.at;
    const answeredAfterRevenire =
      !!revAt &&
      [thread.reply?.la, linkAnswer?.at, thread.firmAnswer?.at].some((x) => !!x && x > revAt);
    const ultAt = thread.ultimulAt;
    const answeredAfterUltimul =
      !!ultAt && [thread.reply?.la, linkAnswer?.at, thread.firmAnswer?.at].some((x) => !!x && x > ultAt);
    return {
      thread,
      lead,
      claims: leadClaims,
      linkAnswer,
      linkOpenedAt,
      firstResponseAt,
      candidates: lead ? registeredFirmsForLead(lead, firms, claims) : [],
      revenireDue: lead && motiv ? whatsappRevenireFor(lead, thread.kind, motiv, thread.sentAt) : null,
      answeredAfterRevenire,
      answeredAfterUltimul,
      noFirm,
    };
  });

  const answered = rows.filter((r) => r.firstResponseAt);
  // Doar mesajele cu link („ofertă bună?”); un răspuns pe WhatsApp nu înseamnă link deschis.
  const withLink = rows.filter((r) => r.thread.kind === 'oferta');
  const opened = withLink.filter((r) => r.linkOpenedAt);
  const waits = answered
    .map((r) => Date.parse(r.firstResponseAt!) - Date.parse(r.thread.sentAt))
    .filter((ms) => ms >= 0);
  const med = median(waits);
  const silent3 = silentFor(rows, 3);
  const due = rows.filter((r) => r.revenireDue);
  const followed = rows.filter((r) => r.thread.revenire);
  const followedAnswered = followed.filter((r) => r.answeredAfterRevenire);

  const shown = rows.filter((r) =>
    filter === 'raspuns'
      ? r.firstResponseAt
      : filter === 'fara'
        ? !r.firstResponseAt
        : filter === 'revenire'
          ? r.revenireDue
          : true,
  );
  // La „De revenit”, cele mai vechi mesaje întâi, ca în rutina de dimineață.
  if (filter === 'revenire') shown.sort((a, b) => a.thread.sentAt.localeCompare(b.thread.sentAt));
  const pct = (n: number) => (rows.length ? `${Math.round((n / rows.length) * 100)}%` : '–');

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-900">WhatsApp către clienți</h1>
        <p className="mt-1 text-sm text-slate-500">
          Un rând pe mesaj trimis. Răspunsurile scrise pe WhatsApp nu intră singure: le notează rutina de dimineață
          sau le notezi tu aici.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Mesaje trimise" value={String(rows.length)} />
        <Stat
          label="Au răspuns"
          value={`${answered.length} · ${pct(answered.length)}`}
          hint="Pe WhatsApp, pe linkul din mesaj sau pe pagina „Cu ce firmă”"
        />
        <Stat
          label="Au deschis linkul"
          value={`${opened.length} · ${withLink.length ? `${Math.round((opened.length / withLink.length) * 100)}%` : '–'}`}
          hint="Din mesajele cu link („Ofertă bună?”), fără preview-urile WhatsApp; cine a răspuns pe link se numără și aici"
        />
        <Stat label="Timp median până la răspuns" value={med === null ? '–' : fmtDuration(med)} />
        <Stat label="Fără răspuns de 3+ zile" value={String(silent3.length)} />
        <Stat
          label="Reveniri"
          value={`${followed.length} · ${followedAnswered.length} au răspuns`}
          hint="A doua încercare, o dată pe mesaj; „au răspuns” = un semn de la client după revenire, pe orice canal. Ultimul mesaj (a treia) pleacă la 5+ zile după o revenire fără răspuns"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Pill href="/admin/whatsapp" active={filter === 'toate'}>
          Toate · {rows.length}
        </Pill>
        <Pill href="/admin/whatsapp?f=raspuns" active={filter === 'raspuns'}>
          Au răspuns · {answered.length}
        </Pill>
        <Pill href="/admin/whatsapp?f=fara" active={filter === 'fara'}>
          Fără răspuns · {rows.length - answered.length}
        </Pill>
        <Pill href="/admin/whatsapp?f=revenire" active={filter === 'revenire'}>
          De revenit · {due.length}
        </Pill>
      </div>

      {shown.length === 0 && <p className="text-sm text-slate-500">Nimic aici.</p>}

      <ul className="space-y-3">
        {shown.map((row) => {
          const { thread, lead } = row;
          const etapa = lead ? leadEtapa(lead, row.claims) : null;
          const open = etapa ? isEtapaOpen(etapa) : false;
          const slotsLeft =
            maxClaimsForLead(thread.leadId) - row.claims.filter(claimOccupiesLeadSlot).length;
          return (
            <li key={`${thread.leadId}-${thread.kind}`} className="rounded-xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-100 px-4 py-2">
                <span className="text-xs tabular-nums text-slate-500">
                  {fmtDateTime(thread.sentAt)}
                  {thread.sends > 1 && ` · ${thread.sends}×`}
                </span>
                <span className="text-xs font-medium text-slate-600">{KIND_LABEL[thread.kind]}</span>
                {thread.revenire && (
                  <span className="rounded bg-sky-50 px-1.5 py-px text-[10px] font-medium text-sky-700">
                    + revenire {fmtDateTime(thread.revenire.at)}
                  </span>
                )}
                {thread.ultimulAt && (
                  <span className="rounded bg-slate-100 px-1.5 py-px text-[10px] font-medium text-slate-600">
                    + ultimul {fmtDateTime(thread.ultimulAt)}
                  </span>
                )}
                {lead ? (
                  <Link href={cerereHref(thread.leadId)} className="text-sm font-semibold text-slate-900 hover:underline">
                    {isHot(lead) && '🔥 '}
                    {leadTitle(lead)}
                  </Link>
                ) : (
                  <span className="text-sm text-slate-400">cerere negăsită ({thread.leadId})</span>
                )}
                {etapa && <EtapaBadge etapa={etapa} />}
                {lead && <FinancingBadge finantare={lead.finantare} />}
                {lead && <TimelineBadge termen={lead.termen} />}
                {lead && (
                  <span className="text-[11px] text-slate-400">
                    {lead.numeContact || lead.numeCompanie} · cerere din {fmtDateTime(lead.timestamp)}
                  </span>
                )}
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    row.firstResponseAt ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {row.firstResponseAt
                    ? `a răspuns în ${fmtDuration(Math.max(0, Date.parse(row.firstResponseAt) - Date.parse(thread.sentAt)))}`
                    : `fără răspuns, ${ago(thread.sentAt)}`}
                </span>
              </div>
              {row.revenireDue && (
                <div className="border-b border-slate-100 bg-emerald-50/40 px-4 py-2">
                  <p className="mb-1 text-[10px] font-semibold tracking-wider text-emerald-700 uppercase">
                    De revenit ·{' '}
                    {row.revenireDue.motiv === 'nume_firma'
                      ? 'n-a spus firma'
                      : row.revenireDue.motiv === 'ultimul'
                        ? 'ultimul mesaj, n-a răspuns nici la revenire'
                        : 'n-a răspuns'}
                  </p>
                  <RevenireButton
                    leadId={thread.leadId}
                    kind={thread.kind === 'firma' ? 'firma' : 'oferta'}
                    motiv={row.revenireDue.motiv}
                    href={row.revenireDue.href}
                    text={row.revenireDue.text}
                  />
                </div>
              )}
              <div className="grid gap-4 px-4 py-3 md:grid-cols-3">
                <div>
                  <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Clientul</p>
                  <ClientColumn row={row} />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    Firmele pe cerere
                  </p>
                  <FirmsColumn row={row} />
                </div>
                <div>
                  <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                    De dat mai departe
                  </p>
                  {open ? (
                    <CandidatesColumn row={row} canGive />
                  ) : (
                    <p className="text-xs text-slate-400">Cererea e închisă.</p>
                  )}
                  {open && slotsLeft <= 0 && (
                    <p className="mt-1 text-[10px] text-amber-700">
                      Locurile cererii sunt pline: butonul cere „Dă oricum, peste plafon”.
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
