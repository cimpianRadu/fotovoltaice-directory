import type { LeadClaim, LeadWatch, NewLead } from '@/lib/sheets';
import {
  CLAIM_STATUS_LABELS,
  LEAD_STATUS_LABELS,
  type ClaimStatus,
  type LeadNote,
  type LeadStatus,
} from '@/lib/sheets-shared';
import { FIRM_REPORT_OPTIONS, REFUZ_REASON_OPTIONS } from '@/lib/client-account-shared';
import type { LeadActivityDetail } from '@/lib/admin-cereri';
import type { LeadChangeBy } from '@/lib/lead-history';
import { firmDisplayName } from '@/lib/client-account';

// Cronologia unei cereri, adunată din tot ce are o dată: coloanele din Leads,
// revendicările, urmăririle și jurnalele din Neon. Nimic nu se scrie: se
// recompune la fiecare deschidere a fișei.

export type TimelineKind = 'intrare' | 'firma' | 'client' | 'email' | 'stare' | 'nota' | 'vizita';

export interface TimelineItem {
  at: string;
  kind: TimelineKind;
  title: string;
  detail?: string;
  /** Doar ziua e sigură (note vechi fără oră, apeluri confirmate pe zi). */
  dayOnly?: boolean;
}

/** Ce trimite /api/admin/cereri/activitate modalului din listă. */
export interface CerereActivitate {
  title: string;
  hot: boolean;
  place: string;
  contact: string;
  enteredAt: string;
  mesaj: string;
  timeline: TimelineItem[];
  /** Neon n-a răspuns: lipsesc jurnalele, emailurile și vizitele. */
  dbError: string;
}

const BY_LABEL: Record<LeadChangeBy, string> = {
  admin: 'tu',
  firma: 'firma',
  client: 'clientul',
  automat: 'automat',
};

const SOURCE_LABEL: Record<LeadClaim['source'], string> = {
  self: 'din /cereri',
  manual: 'dată de tine',
  abonament: 'din abonament',
};

const SEND_KIND_LABEL: Record<string, string> = {
  creare: 'alerta de cerere nouă',
  retrimitere: 'retrimisă la cererea clientului',
  rezumat: 'rezumatul de luni',
  deblocare: 'după rezervarea abonatului',
};

const RESPONSE_LABEL: Record<string, string> = {
  gata: 'e gata de ofertă',
  astept: 'încă așteaptă',
  renunt: 'nu mai vrea',
  activa: 'încă vrea oferte',
  aleasa: 'a ales deja o firmă',
  semnat: 'a semnat',
  decid: 'se decide',
  altafirma: 'altă firmă sau renunță',
  necontactat: 'nu l-a contactat nicio firmă',
};

const CLIENT_EVENT_LABEL: Record<string, string> = {
  cta_vazut: 'A văzut blocul „Urmăriți cererea” după formular',
  cta_click: 'A apăsat „Urmăriți cererea”',
  intrare_link: 'A intrat în cont din linkul din email',
  cod_intrat: 'A intrat în cont cu codul din email',
  inchisa: 'A închis cererea din cont',
  stergere: 'A cerut ștergerea contului',
};

const CLICK_KIND_LABEL: Record<string, string> = {
  vreau: '„Vreau această cerere”',
  urmaresc: '„Urmăresc”',
  link: 'link direct',
};

/** Ziua și ora unei note, scrise în ora României, ca ISO. */
export function bucharestIso(date: string, time?: string): string {
  const guess = new Date(`${date}T${time || '12:00'}:00Z`);
  if (Number.isNaN(guess.getTime())) return date;
  const local = new Date(guess.toLocaleString('en-US', { timeZone: 'Europe/Bucharest' }));
  const utc = new Date(guess.toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(guess.getTime() - (local.getTime() - utc.getTime())).toISOString();
}

function noteItems(notes: LeadNote[], title: string, kind: TimelineKind): TimelineItem[] {
  return notes.map((n) => ({
    at: bucharestIso(n.date, n.time),
    kind,
    title,
    detail: n.text,
    dayOnly: !n.time,
  }));
}

function valid(iso: string | null | undefined): iso is string {
  return Boolean(iso) && Number.isFinite(Date.parse(iso as string));
}

function statusLabel(field: string, v: string): string {
  if (field === 'stare') return LEAD_STATUS_LABELS[v as LeadStatus] ?? (v || '—');
  if (field === 'stare_firma') return CLAIM_STATUS_LABELS[v as ClaimStatus] ?? (v || '—');
  return v === 'da' ? 'da' : v === 'nu' ? 'nu' : 'neverificat';
}

export function buildTimeline(
  lead: NewLead,
  claims: LeadClaim[],
  watches: LeadWatch[],
  activity: LeadActivityDetail | null,
): TimelineItem[] {
  const items: TimelineItem[] = [];
  const push = (at: string | null | undefined, item: Omit<TimelineItem, 'at'>) => {
    if (valid(at)) items.push({ at: at as string, ...item, dayOnly: item.dayOnly ?? (at as string).length === 10 });
  };
  const firmOf = new Map(claims.map((c) => [c.timestamp, firmDisplayName(c.numeFirma)]));

  // ── Cererea ──────────────────────────────────────────────────────────────
  push(lead.timestamp, {
    kind: 'intrare',
    title: 'Cererea a intrat',
    detail: [lead.canal || '', lead.sourcePage ? `din ${lead.sourcePage}` : ''].filter(Boolean).join(' · ') || undefined,
  });

  const sendsByCreare = activity?.sends.some((s) => s.kind === 'creare');
  if (!sendsByCreare) push(lead.alerteTrimise, { kind: 'email', title: 'Alertă trimisă firmelor din județ' });
  push(lead.emailClientLa, { kind: 'email', title: 'Email de întâmpinare către client (se informează)' });
  if (lead.checkinTrimise > 0) {
    push(lead.checkinLa, { kind: 'email', title: `Check-in ${lead.checkinTrimise} trimis clientului` });
  }
  push(lead.reactivataLa, { kind: 'client', title: 'Clientul a reactivat cererea: e gata de ofertă' });
  push(lead.alerteReactivareLa, { kind: 'email', title: 'Alertă de reactivare către firmele din județ' });
  push(lead.anuntProgramLa, { kind: 'email', title: 'Anunțul de deschidere a programului, către client' });
  push(lead.verificareTrimisaLa, { kind: 'email', title: 'Email „Mai căutați oferte?” către client' });
  push(lead.verificareRetrimisaLa, { kind: 'email', title: 'Email „Mai căutați oferte?” retrimis' });
  push(lead.confirmataLa, { kind: 'client', title: 'Clientul a confirmat că încă vrea oferte' });
  push(lead.verificareStatusLa, { kind: 'email', title: 'Email „Ați găsit o ofertă bună?” către client' });

  if (lead.raspunsClient) {
    const [code = '', at = '', ...rest] = lead.raspunsClient.split(' ');
    const firma = rest.join(' ');
    push(at, {
      kind: 'client',
      title: `Răspunsul clientului: ${RESPONSE_LABEL[code] ?? code}${firma ? ` cu ${firma}` : ''}`,
    });
  }

  items.push(...noteItems(lead.notes, 'Notă pe cerere', 'nota'));

  // ── Firmele ──────────────────────────────────────────────────────────────
  for (const c of claims) {
    const f = firmDisplayName(c.numeFirma);
    push(c.timestamp, {
      kind: 'firma',
      title: `${f} a preluat cererea`,
      detail: [SOURCE_LABEL[c.source], c.canal].filter(Boolean).join(' · '),
    });
    push(c.approvedAt, { kind: 'firma', title: `Datele clientului deblocate pentru ${f}` });
    push(c.contactedAt, { kind: 'firma', title: `Confirmat: ${f} a sunat clientul` });
    push(c.offeredAt, { kind: 'firma', title: `${f} a marcat oferta ca trimisă` });
    push(c.releasedAt, { kind: 'firma', title: `${f} a renunțat`, detail: c.releaseReason || undefined });
    if (c.reminderCount > 0) {
      push(c.remindedAt, {
        kind: 'email',
        title: `Reminder ${c.reminderCount} către ${f}`,
        detail: c.reminderCount > 1 ? 'data celui mai recent' : undefined,
      });
    }
    items.push(...noteItems(c.firmNotes, `Notă de la ${f}`, 'nota'));
  }

  for (const w of watches) {
    const f = firmDisplayName(w.numeFirma);
    push(w.timestamp, { kind: 'firma', title: `${f} urmărește cererea` });
    push(w.notifiedAt, { kind: 'email', title: `${f} anunțată că cererea s-a reactivat` });
  }

  if (!activity) return sortTimeline(items);

  // ── Jurnalele din Neon ───────────────────────────────────────────────────
  for (const ch of activity.changes) {
    const claim = ch.claimTs ? claims.find((c) => c.timestamp === ch.claimTs) : undefined;
    // Oferta și renunțarea au deja rândul lor, cu motivul, din Sheets.
    if (ch.field === 'stare_firma' && ch.to === 'ofertat' && claim?.offeredAt) continue;
    if (ch.field === 'stare_firma' && ch.to === 'pierdut' && claim?.releasedAt) continue;
    const who = BY_LABEL[ch.by] ?? ch.by;
    const change = `${statusLabel(ch.field, ch.from)} → ${statusLabel(ch.field, ch.to)}`;
    const title =
      ch.field === 'stare'
        ? `Starea cererii: ${change}`
        : ch.field === 'contactat'
          ? `Contactat de o firmă: ${change}`
          : `${firmOf.get(ch.claimTs || '') ?? 'Firma'}: ${change}`;
    push(ch.at, { kind: 'stare', title, detail: [`de ${who}`, ch.detail].filter(Boolean).join(' · ') });
  }

  // Emailurile cu cererea, grupate pe trimitere (aceeași clipă, același fel).
  const sendGroups = new Map<string, typeof activity.sends>();
  for (const s of activity.sends) {
    const key = `${s.kind}|${s.at.slice(0, 16)}`;
    sendGroups.set(key, [...(sendGroups.get(key) ?? []), s]);
  }
  for (const group of sendGroups.values()) {
    const names = group.map((s) => s.firmName || s.firmEmail);
    push(group[0].at, {
      kind: 'email',
      title: `Trimisă pe email la ${group.length} ${group.length === 1 ? 'firmă' : 'firme'}`,
      detail: `${SEND_KIND_LABEL[group[0].kind] ?? group[0].kind}: ${names.join(', ')}`,
    });
  }

  if (activity.account?.verifiedAt) {
    push(activity.account.verifiedAt, { kind: 'client', title: 'Clientul a intrat prima dată în cont' });
  }
  for (const e of activity.events) {
    const label = CLIENT_EVENT_LABEL[e.event];
    if (label) push(e.at, { kind: 'client', title: label });
  }
  for (const v of activity.views) {
    push(v.firstAt, {
      kind: 'vizita',
      title: 'Clientul și-a deschis pagina cererii',
      detail: `${v.views}× în ziua aceea · ${v.via === 'cont' ? 'intrat în cont' : 'din browserul cu care a trimis cererea'}`,
    });
  }
  for (const b of activity.bumps) {
    push(b.at, {
      kind: 'client',
      title: 'Clientul a apăsat „Încă vreau oferte”',
      detail: `retrimisă la ${b.firms} ${b.firms === 1 ? 'firmă' : 'firme'}`,
    });
  }
  for (const r of activity.reports) {
    const label = FIRM_REPORT_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status;
    const motiv = r.motiv ? REFUZ_REASON_OPTIONS.find((o) => o.value === r.motiv)?.label ?? r.motiv : '';
    push(r.at, {
      kind: 'client',
      title: `Clientul despre ${firmDisplayName(r.firm)}: „${label}”`,
      detail: [motiv, r.putere ? `${r.putere} kW după contract` : ''].filter(Boolean).join(' · ') || undefined,
    });
  }
  for (const e of activity.emails) {
    const [kind, ref = ''] = e.kind.split(':');
    const offer = kind === 'oferta' ? activity.offers.find((o) => String(o.id) === ref) : undefined;
    const title =
      kind === 'confirmare'
        ? 'Email către client: confirmarea cererii'
        : kind === 'preluare'
          ? `Email către client: cererea a fost preluată de ${firmOf.get(ref) ?? 'o firmă'}`
          : kind === 'oferta'
            ? `Email către client: ofertă nouă de la ${offer ? firmDisplayName(offer.firm) : 'o firmă'}`
            : `Email către client: ${e.kind}`;
    push(e.at, { kind: 'email', title });
  }
  for (const o of activity.offers) {
    const f = firmDisplayName(o.firm);
    push(o.createdAt, {
      kind: 'firma',
      title: `${f} a urcat o ofertă în platformă`,
      detail: [
        o.valoare != null ? `${o.valoare.toLocaleString('ro-RO')} lei fără TVA` : '',
        o.putereKw != null ? `${o.putereKw} kW` : '',
        `${o.files} ${o.files === 1 ? 'fișier' : 'fișiere'}`,
      ]
        .filter(Boolean)
        .join(' · '),
    });
    push(o.withdrawnAt, { kind: 'firma', title: `${f} și-a retras oferta` });
    push(o.clientFirstView, {
      kind: 'vizita',
      title: `Clientul a deschis oferta de la ${f}`,
      detail: o.clientViews > 1 ? `${o.clientViews} deschideri în total` : undefined,
    });
  }

  // Click-urile de pe /cereri, câte un rând pe zi.
  const clickDays = new Map<string, typeof activity.clicks>();
  for (const c of activity.clicks) clickDays.set(c.day, [...(clickDays.get(c.day) ?? []), c]);
  for (const day of clickDays.values()) {
    const counts = new Map<string, number>();
    for (const c of day) counts.set(c.kind, (counts.get(c.kind) ?? 0) + 1);
    const firms = [...new Set(day.map((c) => c.firmEmail).filter(Boolean))];
    push(day[0].at, {
      kind: 'vizita',
      title: 'Apăsată pe /cereri',
      detail: [
        [...counts].map(([k, n]) => `${CLICK_KIND_LABEL[k] ?? k} ×${n}`).join(' · '),
        firms.length ? `firme logate: ${firms.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join(' · '),
    });
  }

  return sortTimeline(items);
}

function sortTimeline(items: TimelineItem[]): TimelineItem[] {
  return items.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}
