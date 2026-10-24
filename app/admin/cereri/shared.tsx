import {
  CLAIM_STATUS_LABELS,
  LEAD_STATUS_LABELS,
  claimOccupiesLeadSlot,
  isLeadClosed,
  type ClaimStatus,
  type LeadStatus,
} from '@/lib/sheets-shared';
import {
  getFinancingShort,
  getFinancingTone,
  getTimelineLabel,
  type FinancingTone,
} from '@/lib/utils-shared';

// Formatare și insigne comune listei și fișei din /admin/cereri.

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Bucharest',
  });
}

export function fmtDay(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', timeZone: 'Europe/Bucharest' });
}

/** „azi”, „ieri”, „acum 5 zile”: cât a trecut, pe zile calendaristice. */
export function ago(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const day = (ms: number) =>
    new Date(ms).toLocaleDateString('sv-SE', { timeZone: 'Europe/Bucharest' });
  const days = Math.round((Date.parse(day(now)) - Date.parse(day(t))) / 86_400_000);
  if (days <= 0) return 'azi';
  if (days === 1) return 'ieri';
  return `acum ${days} zile`;
}

export const LEAD_STATUS_CHIP: Record<LeadStatus, string> = {
  noua: 'bg-slate-100 text-slate-700',
  valida: 'bg-sky-100 text-sky-800',
  ofertare: 'bg-amber-100 text-amber-800',
  castigata: 'bg-emerald-600 text-white',
  altundeva: 'bg-orange-100 text-orange-800',
  renuntat: 'bg-slate-100 text-slate-500',
  inactiva: 'bg-slate-100 text-slate-400',
};

export const FIRM_STATUS_CHIP: Record<ClaimStatus, string> = {
  de_sunat: 'bg-slate-100 text-slate-600',
  nu_raspunde: 'bg-amber-100 text-amber-700',
  discutii: 'bg-indigo-100 text-indigo-700',
  ofertat: 'bg-sky-100 text-sky-700',
  castigat: 'bg-emerald-600 text-white',
  pierdut: 'bg-rose-100 text-rose-700',
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${LEAD_STATUS_CHIP[status]}`}
    >
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

export function FirmStatusChip({ status }: { status: ClaimStatus }) {
  return (
    <span
      className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${FIRM_STATUS_CHIP[status]}`}
    >
      {CLAIM_STATUS_LABELS[status]}
    </span>
  );
}

export function Caption({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
      {children}
    </span>
  );
}

/** Calea fișei unei cereri. Id-ul e timestampul rândului din Leads. */
export function cerereHref(id: string): string {
  return `/admin/cereri/${encodeURIComponent(id)}`;
}

// ── Finanțare și termen ────────────────────────────────────────────────────
// Cele două întrebări care decid dacă o cerere se sună azi: cu ce bani și cât
// de repede. Pe cererile de dinainte de 29 iul (finanțare) și 4 aug (termen)
// lipsesc; lipsa se scrie, nu se ascunde.

export const FINANCING_CHIP: Record<FinancingTone, string> = {
  ready: 'bg-emerald-100 text-emerald-800',
  credit: 'bg-sky-100 text-sky-800',
  program: 'bg-amber-100 text-amber-800',
  unknown: 'bg-slate-100 text-slate-500',
};

export const TIMELINE_CHIP: Record<string, string> = {
  'cat-mai-repede': 'border-rose-300 bg-rose-50 text-rose-700',
  '1-3-luni': 'border-slate-300 bg-white text-slate-700',
  'peste-3-luni': 'border-slate-200 bg-white text-slate-500',
  'ma-informez': 'border-violet-200 bg-violet-50 text-violet-700',
};

/** Fonduri proprii și „cât mai repede”: cererea care se închide. */
export function isHot(lead: { finantare: string; termen: string }): boolean {
  return getFinancingTone(lead.finantare) === 'ready' && lead.termen === 'cat-mai-repede';
}

/** Pentru sortarea „🔥 întâi”: banii (proprii 2, credit 1) plus graba (repede 2, 1-3 luni 1). */
export function hotScore(lead: { finantare: string; termen: string }): number {
  const tone = getFinancingTone(lead.finantare);
  const money = tone === 'ready' ? 2 : tone === 'credit' ? 1 : 0;
  const time = lead.termen === 'cat-mai-repede' ? 2 : lead.termen === '1-3-luni' ? 1 : 0;
  return money + time;
}

export function FinancingBadge({ finantare, size = 'sm' }: { finantare: string; size?: 'sm' | 'md' }) {
  const pad = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-0.5 text-[11px]';
  if (!finantare) {
    return (
      <span className={`inline-block rounded border border-dashed border-slate-200 font-medium whitespace-nowrap text-slate-400 ${pad}`}>
        finanțare nedeclarată
      </span>
    );
  }
  return (
    <span className={`inline-block rounded font-semibold whitespace-nowrap ${FINANCING_CHIP[getFinancingTone(finantare)]} ${pad}`}>
      {getFinancingShort(finantare)}
    </span>
  );
}

export function TimelineBadge({ termen, size = 'sm' }: { termen: string; size?: 'sm' | 'md' }) {
  const pad = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-0.5 text-[11px]';
  if (!termen) {
    return (
      <span className={`inline-block rounded border border-dashed border-slate-200 font-medium whitespace-nowrap text-slate-400 ${pad}`}>
        termen nedeclarat
      </span>
    );
  }
  return (
    <span
      className={`inline-block rounded border font-semibold whitespace-nowrap ${
        TIMELINE_CHIP[termen] ?? 'border-slate-200 bg-white text-slate-500'
      } ${pad}`}
    >
      {getTimelineLabel(termen)}
    </span>
  );
}

// ── Etapa cererii ──────────────────────────────────────────────────────────
// O singură stare pe cerere, din ce au făcut firmele (Radu, 24 oct 2026: „avem
// prea multe statusuri și e greu de urmărit; care e marcată concretizată de
// firmă, aia e”). Starea din coloana V rămâne doar pentru final: câștigată de
// mână sau închisă (altundeva, renunțat, inactivă).

export type Etapa = 'fara_firma' | 'preluata' | 'discutii' | 'oferta' | 'concretizata' | 'inchisa';

export const ETAPE: { key: Etapa; label: string; hint: string; chip: string }[] = [
  {
    key: 'fara_firma',
    label: 'Fără firmă',
    hint: 'deschisă, nicio firmă nu o are acum',
    chip: 'bg-amber-100 text-amber-800',
  },
  {
    key: 'preluata',
    label: 'Preluată',
    hint: 'o firmă o are, dar n-a ajuns la discuții (de sunat, nu răspunde)',
    chip: 'bg-slate-200 text-slate-700',
  },
  { key: 'discutii', label: 'În discuții', hint: 'o firmă vorbește cu clientul', chip: 'bg-indigo-100 text-indigo-700' },
  { key: 'oferta', label: 'Ofertă trimisă', hint: 'o firmă i-a trimis oferta', chip: 'bg-sky-100 text-sky-800' },
  {
    key: 'concretizata',
    label: 'Concretizată',
    hint: 'o firmă a marcat „Concretizat”, sau ai pus-o tu pe câștigată',
    chip: 'bg-emerald-600 text-white',
  },
  {
    key: 'inchisa',
    label: 'Închisă',
    hint: 'și-a rezolvat altundeva, a renunțat sau n-a mai răspuns',
    chip: 'bg-slate-100 text-slate-400',
  },
];

export function isEtapaOpen(e: Etapa): boolean {
  return e !== 'concretizata' && e !== 'inchisa';
}

export function leadEtapa(
  lead: { crmStatus: LeadStatus },
  claims: { firmStatus: ClaimStatus; releasedAt: string }[],
): Etapa {
  if (lead.crmStatus === 'castigata' || claims.some((c) => c.firmStatus === 'castigat' && !c.releasedAt)) {
    return 'concretizata';
  }
  if (isLeadClosed(lead.crmStatus)) return 'inchisa';
  const active = claims.filter(claimOccupiesLeadSlot);
  if (active.some((c) => c.firmStatus === 'ofertat')) return 'oferta';
  if (active.some((c) => c.firmStatus === 'discutii')) return 'discutii';
  if (active.length) return 'preluata';
  return 'fara_firma';
}

export function EtapaBadge({ etapa, size = 'sm' }: { etapa: Etapa; size?: 'sm' | 'md' }) {
  const e = ETAPE.find((x) => x.key === etapa)!;
  return (
    <span
      title={e.hint}
      className={`inline-block rounded-full font-semibold whitespace-nowrap ${e.chip} ${
        size === 'md' ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[11px]'
      }`}
    >
      {e.label}
    </span>
  );
}
