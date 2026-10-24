import type { LeadClaim } from '@/lib/sheets';
import { CLAIM_STATUS_LABELS, type ClaimStatus } from '@/lib/sheets-shared';
import { FIRM_REPORT_OPTIONS, REFUZ_REASON_OPTIONS } from '@/lib/client-account-shared';
import type { LeadActivityDetail } from '@/lib/admin-cereri';
import type { LeadChange } from '@/lib/lead-history';
import { bucharestIso } from '../timeline';
import { Caption, FIRM_STATUS_CHIP, fmtDateTime, fmtDay } from '../shared';

// Ce a făcut o firmă pe o cerere, câte o cutie pe pas, cu data și comentariul
// lăsat (Radu, 24 oct 2026: „dacă a mutat în discuții și a lăsat comment, box cu
// data; dacă a marcat neconcretizat, box cu data și comment”). Schimbările de
// stare au dată doar din 24 oct (lead_history); înainte se știu doar preluarea,
// oferta și renunțarea, iar starea de acum apare la final, fără dată.

type StepKind = 'preluare' | 'stare' | 'comentariu' | 'oferta_urcata' | 'noi' | 'client' | 'acum';

interface Step {
  at: string | null;
  kind: StepKind;
  label: string;
  status?: ClaimStatus;
  text?: string;
  dayOnly?: boolean;
}

/** Câmpurile revendicării din care se fac pașii (merge și cu ClaimRow din CRM). */
type JourneyClaim = Pick<
  LeadClaim,
  | 'timestamp'
  | 'source'
  | 'offeredAt'
  | 'releasedAt'
  | 'releaseReason'
  | 'firmNotes'
  | 'approvedAt'
  | 'contactedAt'
  | 'reminderCount'
  | 'remindedAt'
  | 'firmStatus'
>;

const SOURCE_LABEL: Record<LeadClaim['source'], string> = {
  self: 'din /cereri',
  manual: 'dată de tine',
  abonament: 'din abonament',
};

/** Un comentariu scris la cel mult atâta de o schimbare de stare intră în cutia ei. */
const NOTE_JOIN_MS = 15 * 60_000;

function buildSteps(
  claim: JourneyClaim,
  changes: LeadChange[],
  reports: LeadActivityDetail['reports'],
  offers: LeadActivityDetail['offers'],
): Step[] {
  const steps: Step[] = [{ at: claim.timestamp, kind: 'preluare', label: 'A revendicat', text: SOURCE_LABEL[claim.source] }];
  const near = (a: string, b: string, ms: number) => Math.abs(Date.parse(a) - Date.parse(b)) <= ms;

  for (const ch of changes) {
    steps.push({
      at: ch.at,
      kind: 'stare',
      label: 'A mutat în',
      status: ch.to as ClaimStatus,
      text: ch.detail?.replace(/^a renunțat: /, '') || undefined,
    });
  }
  // Oferta și renunțarea au coloana lor din Sheets, deci au dată și înainte de jurnal.
  if (claim.offeredAt && !changes.some((c) => c.to === 'ofertat' && near(c.at, claim.offeredAt, 5 * 60_000))) {
    steps.push({ at: claim.offeredAt, kind: 'stare', label: 'A marcat', status: 'ofertat' });
  }
  if (claim.releasedAt && !changes.some((c) => c.to === 'pierdut' && near(c.at, claim.releasedAt, 5 * 60_000))) {
    steps.push({
      at: claim.releasedAt,
      kind: 'stare',
      label: 'A renunțat',
      status: 'pierdut',
      text: claim.releaseReason || undefined,
    });
  }

  // Comentariile firmei: lângă o schimbare de stare intră în cutia ei, altfel au cutia lor.
  for (const n of claim.firmNotes) {
    // Motivul renunțării se scrie și ca notă: e deja în cutia renunțării.
    if (claim.releaseReason && n.text.trim() === claim.releaseReason.trim()) continue;
    const at = bucharestIso(n.date, n.time);
    const box = n.time
      ? steps.find((s) => s.kind === 'stare' && s.at && !s.text && near(s.at, at, NOTE_JOIN_MS))
      : undefined;
    if (box) box.text = n.text;
    else steps.push({ at, kind: 'comentariu', label: 'Comentariu', text: n.text, dayOnly: !n.time });
  }

  for (const o of offers) {
    steps.push({
      at: o.createdAt,
      kind: 'oferta_urcata',
      label: 'A urcat oferta',
      text: [o.valoare != null ? `${o.valoare.toLocaleString('ro-RO')} lei fără TVA` : '', o.putereKw != null ? `${o.putereKw} kW` : '']
        .filter(Boolean)
        .join(' · ') || undefined,
    });
  }

  if (claim.approvedAt) steps.push({ at: claim.approvedAt, kind: 'noi', label: 'Date deblocate de noi' });
  if (claim.contactedAt) {
    steps.push({ at: claim.contactedAt, kind: 'noi', label: 'Apel confirmat de noi', dayOnly: claim.contactedAt.length === 10 });
  }
  if (claim.reminderCount > 0 && claim.remindedAt) {
    steps.push({
      at: claim.remindedAt,
      kind: 'noi',
      label: claim.reminderCount === 1 ? 'Reminder de la noi' : `Reminder ${claim.reminderCount} de la noi`,
    });
  }

  for (const r of reports) {
    const label = FIRM_REPORT_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status;
    const motiv = r.motiv ? (REFUZ_REASON_OPTIONS.find((o) => o.value === r.motiv)?.label ?? r.motiv) : '';
    steps.push({ at: r.at, kind: 'client', label: 'Clientul spune', text: [`„${label}”`, motiv].filter(Boolean).join(' · ') });
  }

  steps.sort((a, b) => Date.parse(a.at as string) - Date.parse(b.at as string));

  // Starea de acum, dacă nicio cutie cu dată n-o explică (mutată înainte de 24 oct).
  const shown = steps.some((s) => s.kind === 'stare' && s.status === claim.firmStatus);
  if (!shown && claim.firmStatus !== 'de_sunat') {
    steps.push({
      at: null,
      kind: 'acum',
      label: 'Acum e pe',
      status: claim.firmStatus,
      text: 'data mutării nu se știe: s-a întâmplat înainte de 24 oct, când a pornit jurnalul',
    });
  }
  return steps;
}

const BOX: Record<StepKind, string> = {
  preluare: 'border-slate-300 bg-white',
  stare: 'border-slate-300 bg-white',
  comentariu: 'border-slate-200 bg-white',
  oferta_urcata: 'border-sky-200 bg-sky-50/50',
  noi: 'border-dashed border-slate-200 bg-slate-50',
  client: 'border-emerald-200 bg-emerald-50/60',
  acum: 'border-dashed border-slate-300 bg-white',
};

export default function FirmJourney({
  claim,
  changes,
  reports,
  offers,
}: {
  claim: JourneyClaim;
  changes: LeadChange[];
  reports: LeadActivityDetail['reports'];
  offers: LeadActivityDetail['offers'];
}) {
  const steps = buildSteps(claim, changes, reports, offers);
  return (
    <div className="mt-2 px-1">
      <Caption>Ce a făcut firma, pas cu pas</Caption>
      <ol className="mt-1.5 flex flex-wrap items-stretch gap-y-2">
        {steps.map((s, i) => (
          <li key={`${s.kind}-${s.at}-${i}`} className="flex items-stretch">
            {i > 0 && <span className="self-center px-1 text-slate-300">→</span>}
            <div className={`flex w-48 flex-col rounded-lg border px-2.5 py-2 text-xs ${BOX[s.kind]}`}>
              <div className="flex flex-wrap items-center gap-1">
                <span
                  className={`text-[10px] font-semibold tracking-wide uppercase ${
                    s.kind === 'noi' ? 'text-slate-400' : s.kind === 'client' ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {s.label}
                </span>
                {s.status && (
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${FIRM_STATUS_CHIP[s.status]}`}>
                    {CLAIM_STATUS_LABELS[s.status]}
                  </span>
                )}
              </div>
              {s.at ? (
                <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                  {s.dayOnly ? fmtDay(s.at) : fmtDateTime(s.at)}
                </div>
              ) : null}
              {s.text && (
                <p
                  className={`mt-1 leading-snug ${
                    s.kind === 'comentariu' || (s.kind === 'stare' && s.text)
                      ? 'text-slate-800'
                      : 'text-slate-500'
                  }`}
                >
                  {s.kind === 'comentariu' || s.kind === 'stare' ? `„${s.text}”` : s.text}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
