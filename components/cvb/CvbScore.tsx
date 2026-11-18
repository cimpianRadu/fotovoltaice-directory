// Punctajul estimativ Casa Verde Baterii, în cele două forme în care apare
// (16 nov 2026): eticheta de pe cardul firmei și caseta clientului. Calculul și
// limitele lui sunt în lib/cvb-score.
//
// Regula lui Radu: peste tot unde apare cifra scrie, la vedere, că e estimativă,
// doar informativă și că nu e o garanție. Nu într-un tooltip. Cifra apare ca
// „Punctaj estimativ: 81,3 / 100*", cu steluța explicată imediat dedesubt.
//
// Din 18 nov 2026 cifra urmează formula din Ordinul nr. 2.314/2026: capacitate
// (max 40), contribuție (10-35) și 25 de puncte pentru cine n-a mai avut finanțare
// publică pentru stocare. Din cerere nu știm dacă omul a avut, așa că cifra îl
// socotește fără, iar asta scrie la vedere lângă ea.
//
// Fără 'use client' și fără stare: merge și în componentele de server, și în cele
// de client.

import { PROGRAM, OWN_SHARE_FOR_MAX_POINTS } from '@/lib/battery-sizing';
import { cvbScenario, fmtCvb, type CvbEstimate } from '@/lib/cvb-score';

const SIMULATOR_HREF = '/calculator-casa-verde-baterii';
/** Spațiu care nu se rupe: „16 kWh” rămâne pe un rând. */
const NBSP = '\u00a0';

function BatteryIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="6.5" width="18" height="11" rx="2.5" />
      <path d="M22.5 10.5v3" />
      <rect x="5" y="9.5" width="3.5" height="5" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="9.75" y="9.5" width="3.5" height="5" rx="0.5" fill="currentColor" stroke="none" />
      <rect x="14.5" y="9.5" width="2.5" height="5" rx="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CoinsIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <ellipse cx="9" cy="7" rx="6" ry="3" />
      <path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" />
      <path d="M9 18c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3" />
    </svg>
  );
}

function ArrowUpIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Bara 0–100: verde pentru capacitate, albastru pentru contribuția proprie. */
function ScoreBar({
  capacity,
  contribution,
  noPriorFunding,
  className = '',
}: {
  capacity: number;
  contribution: number;
  noPriorFunding: number;
  className?: string;
}) {
  return (
    <div className={`flex h-2 overflow-hidden rounded-full bg-gray-200 ${className}`} aria-hidden>
      <div className="bg-emerald-500" style={{ width: `${capacity}%` }} />
      <div className="bg-sky-500" style={{ width: `${contribution}%` }} />
      <div className="bg-amber-400" style={{ width: `${noPriorFunding}%` }} />
    </div>
  );
}

function AfmBadge({ tone }: { tone: 'green' | 'amber' }) {
  const bg = tone === 'green' ? 'bg-emerald-600' : 'bg-amber-500';
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-md ${bg} px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-white`}
    >
      <BatteryIcon className="h-3.5 w-3.5" />
      AFM
    </span>
  );
}

/** Pe cardul firmei, în feed și în portal: eticheta AFM, cifra și steluța. */
export function CvbScoreLine({ estimate, className = '' }: { estimate: CvbEstimate; className?: string }) {
  if (!estimate.eligible) {
    return (
      <div
        className={`flex w-fit max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 ${className}`}
      >
        <AfmBadge tone="amber" />
        <span className="text-xs font-semibold text-amber-900">
          Sub pragul de {PROGRAM.minKwh} kWh al Casa Verde Baterii
        </span>
        <span className="text-xs text-amber-800">cere {fmtCvb(estimate.kwh)} kWh</span>
      </div>
    );
  }
  return (
    <div
      className={`w-fit max-w-full rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <AfmBadge tone="green" />
        <span className="text-xs text-emerald-950">
          Punctaj estimativ: <strong className="text-sm tabular-nums">{fmtCvb(estimate.total)}</strong>
          <span className="text-emerald-800"> / 100*</span>
        </span>
        <ScoreBar
          capacity={estimate.capacityPoints}
          contribution={estimate.contributionPoints}
          noPriorFunding={estimate.noPriorFundingPoints}
          className="w-16"
        />
        <span className="text-xs text-emerald-900">baterie {fmtCvb(estimate.kwh)} kWh</span>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-emerald-900">
        *Conform calculatorului platformei, pentru un client fără finanțare publică anterioară pentru stocare.
        Doar informativ, nu reprezintă o garanție.
      </p>
    </div>
  );
}

/**
 * Pentru client, după trimitere și în cont. Compactă, sub lista cu poze și
 * adresă (cerut de Radu, 16 nov): pagina trebuie să împingă spre poze și
 * detalii, punctajul e un bonus. La vedere: eticheta, cifra și steluța
 * explicată; din ce vine și cum urcă stau sub „Din ce vine”.
 */
export function CvbScoreBox({ estimate }: { estimate: CvbEstimate }) {
  const simulatorLink = (
    <a
      href={SIMULATOR_HREF}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
    >
      Încercați alte variante în simulator <span aria-hidden>→</span>
    </a>
  );
  const longNote = (
    <p className="text-xs leading-relaxed text-gray-600">
      *Calculat după formula din ghidul de finanțare (forma din Ordinul nr. 2.314/2026), la costul standard de
      1.500 lei/kWh, cu finanțarea cea mai mare posibilă și pentru cineva care nu a mai primit finanțare din
      fonduri publice pentru un sistem de stocare. Punctajul oficial îl stabilește AFM la analiza dosarului,
      iar pragul de admitere se află abia după încheierea sesiunii.
    </p>
  );

  if (!estimate.eligible) {
    const atMin = cvbScenario(PROGRAM.minKwh).total;
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <AfmBadge tone="amber" />
          <p className="text-sm font-semibold text-amber-950">
            Casa Verde Baterii: {fmtCvb(estimate.kwh)} kWh e sub pragul de {PROGRAM.minKwh} kWh
          </p>
        </div>
        <p className="mt-2 text-sm text-amber-950">
          Cu o baterie de {PROGRAM.minKwh} kWh, punctajul estimativ ar fi{' '}
          <strong>{fmtCvb(atMin)} / 100*</strong>. Firma care preia cererea vă poate spune ce capacitate se
          potrivește.
        </p>
        <p className="mt-1.5 text-xs font-medium text-amber-900">
          *Conform calculatorului platformei. Acest punctaj nu reprezintă nicio garanție, este doar
          informativ.
        </p>
        <div className="mt-2">{simulatorLink}</div>
      </div>
    );
  }

  const ifBigger = cvbScenario(PROGRAM.capacityForMaxPoints);
  // Treapta de contribuție care contează: jumătate din proiect, unde criteriul
  // ia maximul de 35 de puncte (contribuția egală cu suma cerută de la AFM).
  const nextShare = OWN_SHARE_FOR_MAX_POINTS;
  const ifMore = estimate.ownShare < OWN_SHARE_FOR_MAX_POINTS ? cvbScenario(estimate.kwh, nextShare) : null;
  const pct = (share: number) => `${fmtCvb(share * 100)}%`;

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
        <AfmBadge tone="green" />
        <p className="text-sm text-emerald-950">
          Casa Verde Baterii · Punctaj estimativ:{' '}
          <strong className="text-lg tabular-nums">{fmtCvb(estimate.total)}</strong>
          <span className="text-emerald-800"> / 100*</span>
        </p>
        <ScoreBar
          capacity={estimate.capacityPoints}
          contribution={estimate.contributionPoints}
          noPriorFunding={estimate.noPriorFundingPoints}
          className="w-20"
        />
      </div>
      <p className="mt-1.5 text-xs font-medium text-emerald-900">
        {`*Conform calculatorului platformei, pentru o baterie de ${fmtCvb(estimate.kwh)}${NBSP}kWh. Acest punctaj nu reprezintă nicio garanție, este doar informativ.`}
      </p>

      <details className="group mt-2">
        <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-emerald-800 hover:text-emerald-950 [&::-webkit-details-marker]:hidden">
          Din ce vine și cum poate urca
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 transition-transform group-open:rotate-180"
            aria-hidden
          >
            <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
          </svg>
        </summary>
        <div className="mt-3 space-y-3 rounded-lg bg-white p-3">
          <ul className="space-y-1.5 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <BatteryIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong>
                  {fmtCvb(estimate.capacityPoints)} din {PROGRAM.maxPoints.capacity}
                </strong>{' '}
                {`puncte din capacitate (4 × ${fmtCvb(estimate.kwh)}${NBSP}kWh − 20, maximul de la ${PROGRAM.capacityForMaxPoints}${NBSP}kWh)`}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CoinsIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
              <span>
                <strong>
                  {fmtCvb(estimate.contributionPoints)} din {PROGRAM.maxPoints.contribution}
                </strong>{' '}
                {`puncte din contribuția proprie (plătiți ${pct(estimate.ownShare)} din proiect, minimul posibil)`}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>
                <strong>
                  {fmtCvb(estimate.noPriorFundingPoints)} din {PROGRAM.maxPoints.noPriorFunding}
                </strong>{' '}
                puncte dacă nu ați mai primit finanțare din fonduri publice pentru o baterie. Dacă ați primit,
                punctajul e cu {PROGRAM.maxPoints.noPriorFunding} de puncte mai mic.
              </span>
            </li>
            {!estimate.capacityMaxed && (
              <li className="flex items-start gap-2">
                <ArrowUpIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  Cu o baterie de {PROGRAM.capacityForMaxPoints} kWh:{' '}
                  <strong>{fmtCvb(ifBigger.total)} / 100</strong>
                </span>
              </li>
            )}
            {ifMore && (
              <li className="flex items-start gap-2">
                <ArrowUpIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <span>
                  Dacă plătiți {pct(nextShare)} din proiect: <strong>{fmtCvb(ifMore.total)} / 100</strong>
                </span>
              </li>
            )}
          </ul>
          {simulatorLink}
          {longNote}
        </div>
      </details>
    </div>
  );
}
