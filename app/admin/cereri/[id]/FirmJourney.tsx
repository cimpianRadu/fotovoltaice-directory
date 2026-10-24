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
      label: 'A trecut pe',
      status: ch.to as ClaimStatus,
      text: ch.detail?.replace(/^a renunțat: /, '') || undefined,
    });
  }
  // Oferta și renunțarea au coloana lor din Sheets, deci au dată și înainte de jurnal.
  if (claim.offeredAt && !changes.some((c) => c.to === 'ofertat' && near(c.at, claim.offeredAt, 5 * 60_000))) {
    steps.push({ at: claim.offeredAt, kind: 'stare', label: 'A trecut pe', status: 'ofertat' });
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
    else steps.push({ at, kind: 'comentariu', label: 'A scris', text: n.text, dayOnly: !n.time });
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

  if (claim.approvedAt) {
    // Revendicarea manuală se deblochează în aceeași clipă: un singur rând.
    if (near(claim.approvedAt, claim.timestamp, 60_000)) steps[0].text = `${steps[0].text}, cu datele deblocate`;
    else steps.push({ at: claim.approvedAt, kind: 'noi', label: 'Date deblocate de noi' });
  }
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
      text: 'mutată înainte de 24 oct, când a pornit jurnalul, deci fără dată',
    });
  }
  return steps;
}

const DOT: Record<StepKind, string> = {
  preluare: 'bg-slate-900',
  stare: 'bg-indigo-500',
  comentariu: 'border-2 border-slate-300 bg-white',
  oferta_urcata: 'bg-sky-500',
  noi: 'bg-slate-300',
  client: 'bg-emerald-500',
  acum: 'border-2 border-dashed border-slate-400 bg-white',
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
    <div>
      <Caption>Istoricul firmei</Caption>
      <ol className="mt-2">
        {steps.map((s, i) => {
          const lastStep = i === steps.length - 1;
          const quiet = s.kind === 'noi';
          return (
            <li key={`${s.kind}-${s.at}-${i}`} className="grid grid-cols-[6.5rem_1rem_1fr] gap-x-2">
              <div className="pt-px text-right text-[11px] leading-5 text-slate-400 tabular-nums">
                {s.at ? (s.dayOnly ? fmtDay(s.at) : fmtDateTime(s.at).replace(/ \d{4},/, ',')) : 'acum'}
              </div>
              <div className="relative flex justify-center">
                {!lastStep && <span className="absolute top-3 bottom-0 w-px bg-slate-200" />}
                <span className={`relative mt-1.5 h-2.5 w-2.5 rounded-full ${DOT[s.kind]}`} />
              </div>
              <div className={`min-w-0 ${lastStep ? '' : 'pb-3'}`}>
                <div className="flex flex-wrap items-center gap-1.5 leading-5">
                  <span
                    className={`text-xs ${
                      quiet
                        ? 'text-slate-400'
                        : s.kind === 'client'
                          ? 'font-medium text-emerald-700'
                          : 'font-medium text-slate-800'
                    }`}
                  >
                    {s.label}
                  </span>
                  {s.status && (
                    <span className={`rounded px-1.5 py-px text-[10px] font-semibold ${FIRM_STATUS_CHIP[s.status]}`}>
                      {CLAIM_STATUS_LABELS[s.status]}
                    </span>
                  )}
                  {s.text && (s.kind === 'preluare' || s.kind === 'oferta_urcata' || s.kind === 'noi') && (
                    <span className="text-xs text-slate-400">· {s.text}</span>
                  )}
                </div>
                {s.text && (s.kind === 'comentariu' || s.kind === 'stare' || s.kind === 'client') && (
                  <p
                    className={`mt-1 max-w-prose rounded-lg rounded-tl-sm px-3 py-1.5 text-xs leading-relaxed ${
                      s.kind === 'client' ? 'bg-emerald-50 text-emerald-900' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {s.text}
                  </p>
                )}
                {s.kind === 'acum' && s.text && <p className="mt-0.5 text-[11px] text-slate-400">{s.text}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
