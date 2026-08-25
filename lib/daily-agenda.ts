/**
 * Agenda zilei pentru /admin/azi: ce e de făcut AZI, dedus din datele care
 * există deja în Sheet, plus sarcinile scrise de mână (tabul „Todo").
 *
 * Regula de proiectare: nimic de aici nu se „bifează" separat. Un rând dispare
 * când datele se schimbă acolo unde se schimbau oricum: cererea primește
 * status CRM, clientul primește „contactat de firmă", firma primește alt
 * follow-up, nota „revin …" e urmată de altă notă. Singura excepție e tabul
 * Todo, care există exact pentru ce nu se poate deduce.
 *
 * Funcțiile sunt pure (primesc datele, întorc agenda), ca să poată fi rulate
 * și dintr-un script, și din pagină.
 */
import {
  isLeadClosed,
  type ClaimStatus,
  type FirmStatus,
  type LeadNote,
  type LeadStatus,
} from './sheets-shared';

// Subseturi structurale ale tipurilor din lib/sheets: pagina trimite NewLead /
// LeadClaim / CrmFirm / TodoItem, iar aici nu tragem googleapis după noi.
export interface AgendaLead {
  timestamp: string;
  numeContact: string;
  numeCompanie: string;
  telefon: string;
  judet: string;
  segment: string;
  tipProiect: string;
  putere: string;
  termen: string;
  finantare: string;
  intervalApel: string;
  prioritarPanaLa: string;
  crmStatus: LeadStatus;
  contactedByFirm: string;
  notes: LeadNote[];
}

export interface AgendaClaim {
  timestamp: string;
  leadId: string;
  numeFirma: string;
  firmStatus: ClaimStatus;
  offeredAt: string;
  approvedAt: string;
  releasedAt: string;
  contactedAt: string;
  source: string;
  email: string;
}

export interface AgendaFirm {
  timestamp: string;
  firmId: string;
  numeFirma: string;
  telefon: string;
  status: FirmStatus;
  followUp: string;
  notes: LeadNote[];
}

export interface AgendaTodo {
  timestamp: string;
  text: string;
  due: string;
  doneAt: string;
  link: string;
}

/** Cererile noi intră la „de calificat" atâta timp cât n-au status CRM; după atâtea zile ies din listă ca să nu o îngroape pe cea de azi. */
export const QUALIFY_WINDOW_DAYS = 14;
/** După câte zile de la oferta firmei întrebăm clientul dacă a primit-o și dacă semnează. */
export const VERIFY_OFFER_AFTER_DAYS = 3;
/** După câte zile de când firma are datele clientului (fără apel confirmat) întrebăm clientul dacă l-a sunat cineva. */
export const VERIFY_CALL_AFTER_DAYS = 2;
/** Cererile mai vechi de atât nu mai intră la verificare: ori s-au închis, ori le-am ratat deja. */
export const VERIFY_MAX_LEAD_AGE_DAYS = 60;
/** Orizontul listei „urmează". */
export const UPCOMING_DAYS = 7;

/** `revin 2026-10-15` (sau `revin: 2026-10-15`) în ULTIMA notă a cererii = reamintire deschisă. */
export const REVIN_RE = /\brevin\b[\s:,]*(\d{4}-\d{2}-\d{2})/i;

const DAY_MS = 86_400_000;

/** Ziua calendaristică din România pentru un moment dat. */
export function bucharestDay(at: string | number | Date): string {
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
}

/** `YYYY-MM-DD` + n zile, fără fusuri orare (aritmetică pe zi calendaristică). */
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function ageDays(iso: string, now: number): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return (now - t) / DAY_MS;
}

/**
 * Data de revenire, dacă ultima notă o cere. Notele noi se scriu primele
 * (updateLeadCrm), deci notes[0] e ultima. O notă ulterioară, de orice fel,
 * închide reamintirea: înseamnă că s-a întâmplat ceva după ce am promis că revin.
 */
export function revinDue(notes: LeadNote[]): string | null {
  const last = notes[0];
  if (!last) return null;
  const m = last.text.match(REVIN_RE);
  return m ? m[1] : null;
}

export type VerifyReason = 'oferta' | 'apel';

export interface VerifyItem {
  lead: AgendaLead;
  reason: VerifyReason;
  claims: AgendaClaim[];
}

export interface RevinItem {
  lead: AgendaLead;
  due: string;
  note: string;
}

export interface Agenda {
  today: string;
  todosDue: AgendaTodo[];
  todosUpcoming: AgendaTodo[];
  firmsDue: AgendaFirm[];
  firmsUpcoming: AgendaFirm[];
  toQualify: AgendaLead[];
  revin: RevinItem[];
  toVerify: VerifyItem[];
  expiringHolds: AgendaLead[];
  pendingApprovals: number;
}

export function buildAgenda(input: {
  /** Doar cererile vizibile (fără „Ascuns" și fără retrimiteri comasate). */
  leads: AgendaLead[];
  claims: AgendaClaim[];
  firms: AgendaFirm[];
  todos: AgendaTodo[];
  today: string;
  now: number;
}): Agenda {
  const { leads, claims, firms, todos, today, now } = input;
  const horizon = addDays(today, UPCOMING_DAYS);

  const todosOpen = todos.filter((t) => !t.doneAt && t.due);
  const todosDue = todosOpen.filter((t) => t.due <= today).sort((a, b) => a.due.localeCompare(b.due));
  const todosUpcoming = todosOpen
    .filter((t) => t.due > today && t.due <= horizon)
    .sort((a, b) => a.due.localeCompare(b.due));

  const withFollowUp = firms.filter((f) => f.followUp !== '');
  const firmsDue = withFollowUp
    .filter((f) => f.followUp <= today)
    .sort((a, b) => a.followUp.localeCompare(b.followUp));
  const firmsUpcoming = withFollowUp
    .filter((f) => f.followUp > today && f.followUp <= horizon)
    .sort((a, b) => a.followUp.localeCompare(b.followUp));

  const toQualify = leads
    .filter((l) => l.crmStatus === 'noua' && ageDays(l.timestamp, now) <= QUALIFY_WINDOW_DAYS)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const revin: RevinItem[] = [];
  for (const lead of leads) {
    if (isLeadClosed(lead.crmStatus)) continue;
    const due = revinDue(lead.notes);
    if (due && due <= today) revin.push({ lead, due, note: lead.notes[0].text });
  }
  revin.sort((a, b) => a.due.localeCompare(b.due));

  const claimsByLead = new Map<string, AgendaClaim[]>();
  for (const c of claims) {
    if (c.releasedAt) continue;
    const list = claimsByLead.get(c.leadId) ?? [];
    list.push(c);
    claimsByLead.set(c.leadId, list);
  }

  const toVerify: VerifyItem[] = [];
  for (const lead of leads) {
    if (isLeadClosed(lead.crmStatus)) continue;
    if (lead.contactedByFirm !== '') continue;
    if (ageDays(lead.timestamp, now) > VERIFY_MAX_LEAD_AGE_DAYS) continue;
    const cs = claimsByLead.get(lead.timestamp) ?? [];
    let reason: VerifyReason | null = null;
    const involved: AgendaClaim[] = [];
    for (const c of cs) {
      const offered = c.offeredAt !== '' || c.firmStatus === 'ofertat';
      if (offered) {
        if (ageDays(c.offeredAt || c.timestamp, now) >= VERIFY_OFFER_AFTER_DAYS) {
          reason = 'oferta';
          involved.push(c);
        }
        continue;
      }
      // Firma are datele clientului doar după aprobare (portal) sau când i le-am
      // dat noi la telefon (manual). O revendicare self neaprobată n-are ce verifica.
      const hasContact = c.approvedAt !== '' || c.source === 'manual';
      const stillOpen =
        c.firmStatus === 'de_sunat' || c.firmStatus === 'nu_raspunde' || c.firmStatus === 'discutii';
      if (!hasContact || !stillOpen || c.contactedAt) continue;
      if (ageDays(c.approvedAt || c.timestamp, now) >= VERIFY_CALL_AFTER_DAYS) {
        reason ??= 'apel';
        involved.push(c);
      }
    }
    if (reason) toVerify.push({ lead, reason, claims: involved });
  }
  toVerify.sort((a, b) => {
    if (a.reason !== b.reason) return a.reason === 'oferta' ? -1 : 1;
    return a.lead.timestamp.localeCompare(b.lead.timestamp);
  });

  const expiringHolds = leads.filter(
    (l) => l.prioritarPanaLa !== '' && bucharestDay(l.prioritarPanaLa) === today,
  );

  const openLeadIds = new Set(leads.filter((l) => !isLeadClosed(l.crmStatus)).map((l) => l.timestamp));
  const pendingApprovals = claims.filter(
    (c) => c.email !== '' && c.approvedAt === '' && c.releasedAt === '' && openLeadIds.has(c.leadId),
  ).length;

  return {
    today,
    todosDue,
    todosUpcoming,
    firmsDue,
    firmsUpcoming,
    toQualify,
    revin,
    toVerify,
    expiringHolds,
    pendingApprovals,
  };
}
