import Link from 'next/link';
import type { FirmSize, NecesitStatus, RequestedFirmFit } from '@/lib/requested-firm-fit';

// Firmele cerute de client cu numele, câte o cutie pe firmă: cât de mare e, dacă
// plătește pe necesit și un scor din 10 pentru „are sens s-o sun?" (Radu, 26 oct
// 2026, după cererea din Codlea care o voia pe DG Solar). Scorul vine cu toate
// cele cinci criterii la vedere, ca să se vadă pe ce stă.

const SIZE_CHIP: Record<FirmSize, string> = {
  mică: 'bg-slate-100 text-slate-700',
  medie: 'bg-sky-50 text-sky-700',
  mare: 'bg-violet-50 text-violet-700',
  necunoscută: 'bg-slate-50 text-slate-400',
};

const NECESIT_CHIP: Record<NecesitStatus, { label: string; cls: string }> = {
  plateste: { label: 'plătește pe necesit', cls: 'bg-emerald-50 text-emerald-700' },
  listata: { label: 'pe necesit, nu plătește', cls: 'bg-slate-100 text-slate-600' },
  absenta: { label: 'nu e pe necesit', cls: 'bg-slate-50 text-slate-400' },
};

function verdict(score: number): { label: string; cls: string } {
  if (score >= 7) return { label: 'are sens', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' };
  if (score >= 4) return { label: 'de cântărit', cls: 'bg-amber-50 text-amber-700 ring-amber-200' };
  return { label: 'puțin probabil', cls: 'bg-rose-50 text-rose-700 ring-rose-200' };
}

const SIZE_HINT =
  'Cifra de afaceri ANAF: mică sub 4 mil. lei, medie 4–25 mil., mare peste 25 mil. (fără bilanț: după angajați).';

function FirmBox({ fit, necesitScannedAt }: { fit: RequestedFirmFit; necesitScannedAt: string }) {
  const v = fit.score === null ? null : verdict(fit.score);
  const nec = NECESIT_CHIP[fit.necesit];
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {fit.slug ? (
            <Link href={`/firme/${fit.slug}`} className="text-sm font-semibold text-slate-900 hover:underline">
              {fit.name}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-slate-900">{fit.name}</span>
          )}
          <div className="text-[11px] text-slate-500">
            {fit.place}
            {fit.phone && (
              <>
                {' · '}
                <a href={`tel:${fit.phone}`} className="tabular-nums hover:text-slate-900">
                  {fit.phone}
                </a>
              </>
            )}
          </div>
        </div>
        {v && (
          <div
            className={`shrink-0 rounded-md px-2 py-1 text-center ring-1 ${v.cls}`}
            title="Suma a cinci criterii de câte 2 puncte, listate dedesubt"
          >
            <div className="text-lg leading-none font-bold tabular-nums">
              {fit.score}
              <span className="text-xs font-semibold">/10</span>
            </div>
            <div className="mt-0.5 text-[9px] font-semibold tracking-wide uppercase">{v.label}</div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1 text-[11px]">
        <span className={`rounded px-1.5 py-0.5 font-semibold ${SIZE_CHIP[fit.size]}`} title={SIZE_HINT}>
          {fit.size === 'necunoscută' ? 'mărime necunoscută' : `firmă ${fit.size}`}
        </span>
        {fit.necesitUrl ? (
          <a
            href={fit.necesitUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`rounded px-1.5 py-0.5 font-semibold hover:underline ${nec.cls}`}
            title={`Scanarea necesit din ${necesitScannedAt}`}
          >
            {nec.label}
          </a>
        ) : (
          <span className={`rounded px-1.5 py-0.5 font-semibold ${nec.cls}`} title={`Scanarea necesit din ${necesitScannedAt}`}>
            {nec.label}
          </span>
        )}
        {fit.claimedThisLead && (
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-semibold text-indigo-700">a preluat-o deja</span>
        )}
      </div>

      {(fit.sizeNote || fit.necesitNote) && (
        <div className="space-y-0.5 text-[11px] text-slate-500">
          {fit.sizeNote && (
            <div>
              {fit.sizeNote}
              {fit.trendNote && <span className="text-slate-400"> (în {fit.trendNote})</span>}
            </div>
          )}
          {fit.necesitNote && <div>necesit: {fit.necesitNote}</div>}
        </div>
      )}

      {fit.criteria.length > 0 && (
        <ul className="space-y-0.5 border-t border-slate-100 pt-2 text-[11px] leading-snug">
          {fit.criteria.map((c) => (
            <li key={c.label} className="grid grid-cols-[2rem_4.5rem_1fr] gap-1">
              <span
                className={`font-semibold tabular-nums ${
                  c.points === 2 ? 'text-emerald-600' : c.points === 1 ? 'text-amber-600' : 'text-rose-600'
                }`}
              >
                {c.points}/2
              </span>
              <span className="text-slate-400">{c.label}</span>
              <span className="text-slate-700">{c.note}</span>
            </li>
          ))}
        </ul>
      )}

      {fit.warnings.length > 0 && <p className="text-[11px] text-amber-700">{fit.warnings.join(' · ')}</p>}
    </div>
  );
}

export default function RequestedFirms({
  fits,
  necesitScannedAt,
}: {
  fits: RequestedFirmFit[];
  necesitScannedAt: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {fits.map((fit) => (
        <FirmBox key={fit.name} fit={fit} necesitScannedAt={necesitScannedAt} />
      ))}
    </div>
  );
}
