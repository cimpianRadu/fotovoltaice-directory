import {
  CLAIM_STATUS_LABELS,
  LEAD_STATUS_LABELS,
  type ClaimStatus,
  type LeadStatus,
} from '@/lib/sheets-shared';

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
