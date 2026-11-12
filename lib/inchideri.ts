// Cererile deschise care par de închis, cu motivul și citatul (12 nov 2026).
// Le citește /admin/inchideri; nu închide nimic singur. Surse: motivul de
// renunțare și jurnalul firmelor (Revendicări, K și L), notițele clientului pe
// firmă (Neon, client_firm_notes) și firmele care au marcat „Concretizat” pe o
// cerere rămasă deschisă (marcajele de dinainte de 24 oct n-au trecut singure).

import 'server-only';
import { db } from './db';
import {
  CLAIM_STATUS_LABELS,
  getClaims,
  getLeadsSince,
  isLeadClosed,
  isLeadHidden,
  isTestLead,
  type LeadClaim,
  type NewLead,
} from './sheets';
import {
  KEEP_OPEN_PREFIX,
  classifyClosingText,
  type ClosingOutcome,
} from './inchideri-rules';
import { getProjectTypeLabel } from './utils-shared';

export type SignalSource = 'renuntare' | 'jurnal_firma' | 'notita_client' | 'concretizat';

export interface ClosingSignal {
  source: SignalSource;
  /** Firma care a scris (sau despre care a scris clientul). */
  firma: string;
  /** „YYYY-MM-DD HH:MM”, ora României. */
  at: string;
  quote: string;
  outcome: ClosingOutcome;
  match: string;
  doubts: string[];
}

export interface OtherClaim {
  firma: string;
  /** Firma asta a dat chiar ea unul dintre semnale (de obicei în jurnal, fără să renunțe). */
  gaveSignal: boolean;
  status: string;
  /** Ultima notă a firmei, dacă e mai nouă decât semnalul. */
  laterNote: string | null;
}

export interface ClosingCandidate {
  leadId: string;
  summary: string;
  contact: string;
  crmStatus: string;
  suggested: ClosingOutcome;
  /** „clar” = un singur fel de semnal, fără îndoieli și fără altă firmă încă activă. */
  clear: boolean;
  signals: ClosingSignal[];
  /** Firmele încă pe cerere (fără cele care au dat semnalul și au renunțat). */
  activeClaims: OtherClaim[];
  /** Câte firme primesc emailul „Cerere închisă” dacă o închizi. */
  firmsToNotify: number;
  /** Ultima „Lasă deschisă”, dacă a fost una. */
  keptOpenAt: string | null;
}

const STAMP = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Bucharest',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function stampOf(iso: string): string {
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? STAMP.format(new Date(ms)) : '';
}

function noteStamp(n: { date: string; time?: string }): string {
  return `${n.date} ${n.time || '00:00'}`;
}

function summaryOf(l: NewLead): string {
  return [
    getProjectTypeLabel(l.tipProiect),
    [l.localitate, l.judet].filter(Boolean).join(', '),
    l.putere ? `${l.putere} kW` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

async function clientNotes(): Promise<Map<string, { claimTs: string; text: string; at: string }[]>> {
  const out = new Map<string, { claimTs: string; text: string; at: string }[]>();
  // Fără tabel (sau fără bază, local) pagina merge mai departe pe Sheets.
  const rows = await db()`SELECT lead_id, claim_ts, nota, created_at FROM client_firm_notes`.catch(
    (err: unknown) => {
      console.error('[inchideri] notițele clientului:', err);
      return [];
    },
  );
  for (const r of rows) {
    const list = out.get(String(r.lead_id)) ?? [];
    list.push({
      claimTs: String(r.claim_ts),
      text: String(r.nota),
      at: stampOf(new Date(r.created_at as string).toISOString()),
    });
    out.set(String(r.lead_id), list);
  }
  return out;
}

function textSignal(
  source: SignalSource,
  firma: string,
  at: string,
  quote: string,
): ClosingSignal | null {
  const v = classifyClosingText(quote);
  return v ? { source, firma, at, quote: quote.trim(), ...v } : null;
}

function candidateFor(
  lead: NewLead,
  claims: LeadClaim[],
  notes: { claimTs: string; text: string; at: string }[],
): ClosingCandidate | null {
  const keptOpen = lead.notes
    .filter((n) => n.text.startsWith(KEEP_OPEN_PREFIX))
    .map(noteStamp)
    .sort()
    .pop() ?? null;

  const signals: ClosingSignal[] = [];
  const signalClaims = new Set<string>();
  for (const c of claims) {
    const firma = c.numeFirma;
    const add = (s: ClosingSignal | null) => {
      if (s && (!keptOpen || s.at > keptOpen)) {
        signals.push(s);
        signalClaims.add(c.timestamp);
      }
    };
    if (c.releasedAt && c.releaseReason) {
      add(textSignal('renuntare', firma, stampOf(c.releasedAt), c.releaseReason));
    }
    for (const n of c.firmNotes) add(textSignal('jurnal_firma', firma, noteStamp(n), n.text));
    if (!c.releasedAt && c.firmStatus === 'castigat') {
      add({
        source: 'concretizat',
        firma,
        at: stampOf(c.approvedAt || c.timestamp),
        quote: 'Firma a marcat „Concretizat” în portal.',
        outcome: 'castigata',
        match: 'Concretizat',
        doubts: [],
      });
    }
    for (const n of notes.filter((x) => x.claimTs === c.timestamp)) {
      add(textSignal('notita_client', firma, n.at, n.text));
    }
  }
  if (!signals.length) return null;
  signals.sort((a, b) => b.at.localeCompare(a.at));

  // Firmele încă active, cu nota lor de după cel mai nou semnal: „L-am re sunat
  // și analizează” scris după „nu mai face investiția” schimbă tot.
  const newest = signals[0].at;
  const active = claims.filter((c) => !c.releasedAt);
  const activeClaims: OtherClaim[] = active
    .filter((c) => c.firmStatus !== 'castigat')
    .map((c) => {
      const later = c.firmNotes.map((n) => ({ at: noteStamp(n), text: n.text })).filter((n) => n.at > newest);
      later.sort((a, b) => b.at.localeCompare(a.at));
      return {
        firma: c.numeFirma,
        gaveSignal: signalClaims.has(c.timestamp),
        status: CLAIM_STATUS_LABELS[c.firmStatus] || c.firmStatus,
        laterNote: later[0] ? `${later[0].at.slice(0, 10)}: ${later[0].text}` : null,
      };
    });

  const won = signals.some((s) => s.outcome === 'castigata');
  const suggested: ClosingOutcome = won
    ? 'castigata'
    : signals.some((s) => s.outcome === 'altundeva')
      ? 'altundeva'
      : 'renuntat';
  const outcomes = new Set(signals.map((s) => s.outcome));
  // O firmă activă care n-a dat ea semnalul și n-a pierdut încă poate fi chiar
  // cea aleasă: atunci nu e „clar”, chiar dacă textul e.
  const stillWorking = active.some(
    (c) => !signalClaims.has(c.timestamp) && c.firmStatus !== 'pierdut' && c.firmStatus !== 'castigat',
  );
  const clear =
    outcomes.size === 1 &&
    signals.every((s) => s.doubts.length === 0) &&
    !stillWorking &&
    !activeClaims.some((c) => c.laterNote);

  // Aceeași regulă ca notifyFirmsClientClosed: active, nu cea care a semnat, câte una pe email.
  const firmsToNotify = new Set(
    active.filter((c) => c.firmStatus !== 'castigat' && c.email).map((c) => c.email.toLowerCase()),
  ).size;

  return {
    leadId: lead.timestamp,
    summary: summaryOf(lead),
    contact: lead.numeContact || lead.numeCompanie,
    crmStatus: lead.crmStatus,
    suggested,
    clear,
    signals,
    activeClaims,
    firmsToNotify,
    keptOpenAt: keptOpen,
  };
}

/** Două citiri din Sheets (Leads, Revendicări) și una din Neon, oricâte cereri. */
export async function getClosingCandidates(): Promise<ClosingCandidate[]> {
  const [leads, claims, notes] = await Promise.all([getLeadsSince(new Date(0)), getClaims(), clientNotes()]);
  const byLead = new Map<string, LeadClaim[]>();
  for (const c of claims) {
    const list = byLead.get(c.leadId) ?? [];
    list.push(c);
    byLead.set(c.leadId, list);
  }
  const out: ClosingCandidate[] = [];
  for (const l of leads) {
    if (isLeadClosed(l.crmStatus) || isLeadHidden(l) || isTestLead(l)) continue;
    const c = candidateFor(l, byLead.get(l.timestamp) ?? [], notes.get(l.timestamp) ?? []);
    if (c) out.push(c);
  }
  // Întâi cele clare, apoi după cel mai nou semnal.
  return out.sort(
    (a, b) => Number(b.clear) - Number(a.clear) || b.signals[0].at.localeCompare(a.signals[0].at),
  );
}
