'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  SPONSOR_POSITIONS,
  SPONSOR_POSITION_LABELS,
  type SponsorPosition,
} from '@/lib/sponsor-positions';
import {
  RUN_MAX_DAYS,
  formatRunDate,
  runLastDay,
  runStatus,
  todayRunStart,
  type RunStatus,
  type SponsorRun,
} from '@/lib/sponsor-run';
// Doar tipurile: importul de tip se șterge la compilare, deci garda
// `server-only` din modul nu se declanșează în bundle-ul client.
import type {
  BannerSponsor,
  SponsorData,
  StoreMode,
  WriteResult,
} from '@/lib/sponsors-store';

const inputCls =
  'mt-1 w-full rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 ' +
  'focus:border-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400';

function Field({
  label,
  value,
  onChange,
  hint,
  textarea,
  disabled,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  textarea?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={`block text-xs ${className ?? ''}`}>
      <span className="font-medium text-slate-600">{label}</span>
      {textarea ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`${inputCls} leading-snug`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputCls}
        />
      )}
      {hint && <span className="mt-0.5 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

function ActiveToggle({
  active,
  onToggle,
  disabled,
}: {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
        active
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          : 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {active ? 'Activ' : 'Oprit'}
    </button>
  );
}

const RUN_PILL: Record<'upcoming' | 'running' | 'ended', string> = {
  upcoming: 'border-sky-200 bg-sky-50 text-sky-800',
  running: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  ended: 'border-rose-200 bg-rose-50 text-rose-800',
};

function runLabel(status: RunStatus): string {
  if (status.phase === 'upcoming')
    return status.days <= 1 ? 'Începe mâine' : `Începe peste ${status.days} zile`;
  if (status.phase === 'running')
    return status.days <= 1 ? 'Azi e ultima zi' : `Mai are ${status.days} zile`;
  if (status.days === 0) return 'S-a încheiat azi';
  if (status.days === 1) return 'S-a încheiat ieri';
  return `Încheiat de ${status.days} zile`;
}

const presetCls =
  'rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 ' +
  'transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-50';

/**
 * Perioada contractată a unui partener. Există ca pachetele vândute pe termen
 * fix (o promovare de 60 de zile, un test de o lună) să se stingă singure în
 * ziua de după ultima zi plătită, în loc să depindă de memoria ta.
 *
 * `active` rămâne separat și rămâne deasupra: e oprirea manuală, care merge
 * oricând, indiferent de perioadă. Perioada nu îl atinge — un partener cu
 * promovarea încheiată rămâne `activ` în fișier, doar că nu se mai afișează.
 * Așa reînnoirea e o singură dată schimbată, nu o repornire.
 */
function RunRow({
  run,
  onChange,
  disabled,
  now,
}: {
  run: SponsorRun | undefined;
  onChange: (run: SponsorRun | undefined) => void;
  disabled?: boolean;
  /** `null` până la mount: statusul se calculează pe ceasul browserului. */
  now: Date | null;
}) {
  const lastDay = run ? runLastDay(run) : null;
  const status = run && now ? runStatus(run, now) : null;

  return (
    <div className="rounded border border-slate-200 bg-slate-50/70 p-3">
      <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
        <input
          type="checkbox"
          checked={Boolean(run)}
          onChange={(e) =>
            onChange(e.target.checked ? { start: todayRunStart(), days: 30 } : undefined)
          }
          disabled={disabled}
          className="h-3.5 w-3.5"
        />
        Rulează pe perioadă determinată
      </label>

      {!run ? (
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          Nebifat = rulează cât timp comutatorul e pe „Activ”, fără dată de final. Așa arată un
          abonament lunar care se prelungește automat.
        </p>
      ) : (
        <div className="mt-2.5 flex flex-wrap items-end gap-x-3 gap-y-2">
          <label className="block text-xs">
            <span className="font-medium text-slate-600">Prima zi</span>
            <input
              type="date"
              value={run.start}
              onChange={(e) => onChange({ ...run, start: e.target.value })}
              disabled={disabled}
              className={`${inputCls} w-40`}
            />
          </label>
          <label className="block text-xs">
            <span className="font-medium text-slate-600">Durată (zile)</span>
            <input
              type="number"
              min={1}
              max={RUN_MAX_DAYS}
              value={run.days}
              onChange={(e) => onChange({ ...run, days: Number(e.target.value) })}
              disabled={disabled}
              className={`${inputCls} w-24`}
            />
          </label>
          <div className="flex gap-1 pb-1.5">
            {[30, 60, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ ...run, days: d })}
                disabled={disabled}
                className={presetCls}
              >
                {d}z
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 pb-1.5 text-[11px]">
            {lastDay ? (
              <span className="text-slate-500">
                Ultima zi:{' '}
                <strong className="font-semibold text-slate-800">{formatRunDate(lastDay)}</strong>
              </span>
            ) : (
              <span className="font-medium text-amber-700">Completează o dată validă</span>
            )}
            {status && status.phase !== 'none' && (
              <span
                className={`rounded-full border px-2 py-0.5 font-semibold ${RUN_PILL[status.phase]}`}
              >
                {runLabel(status)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CardHeader({
  logo,
  name,
  slug,
  active,
  onToggle,
  disabled,
}: {
  logo: string;
  name: string;
  slug: string;
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-white">
        <Image src={logo} alt={name} width={32} height={32} className="h-8 w-8 object-contain" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-900">{name || slug}</div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <code className="font-mono">{slug}</code>
          <a
            href={`/?preview=${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 underline hover:text-slate-900"
          >
            preview pe site →
          </a>
        </div>
      </div>
      <ActiveToggle active={active} onToggle={onToggle} disabled={disabled} />
    </div>
  );
}

export default function SponsorControls({
  initial,
  writable,
  mode,
}: {
  initial: SponsorData;
  writable: boolean;
  mode: StoreMode;
}) {
  const router = useRouter();
  const [baseline, setBaseline] = useState<SponsorData>(initial);
  const [data, setData] = useState<SponsorData>(() => structuredClone(initial));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ kind: 'ok' | 'err'; text: string; url?: string } | null>(
    null,
  );

  // Statusul perioadei se calculează abia după mount: pagina e `force-dynamic`,
  // deci serverul randează la cerere, iar un `new Date()` în render ar putea
  // cădea de partea cealaltă a miezului nopții față de hidratare.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const dirty = useMemo(
    () => JSON.stringify(data) !== JSON.stringify(baseline),
    [data, baseline],
  );

  const patchSponsor = (slug: string, patch: Partial<BannerSponsor>) =>
    setData((d) => ({
      ...d,
      sponsors: d.sponsors.map((s) => (s.slug === slug ? { ...s, ...patch } : s)),
    }));

  const togglePosition = (sponsor: BannerSponsor, pos: SponsorPosition) => {
    if (sponsor.positions === 'all') return;
    const has = sponsor.positions.includes(pos);
    patchSponsor(sponsor.slug, {
      positions: has
        ? sponsor.positions.filter((p) => p !== pos)
        : [...sponsor.positions, pos],
    });
  };

  const reset = () => {
    setData(structuredClone(baseline));
    setResult(null);
  };

  const save = async () => {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/sponsors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as (WriteResult & { ok: true }) | { error: string; issues?: string[] };
      if (!res.ok || !('ok' in json)) {
        const err = json as { error: string; issues?: string[] };
        setResult({ kind: 'err', text: err.issues ? err.issues.join(' · ') : err.error });
        return;
      }
      if (!json.changed) {
        setResult({ kind: 'ok', text: 'Nimic de salvat: datele sunt identice cu cele existente.' });
        setData(structuredClone(baseline));
        return;
      }
      const what = json.changes.join(' · ');
      if (json.mode === 'github') {
        setResult({
          kind: 'ok',
          text: `Salvat (${what}). Commit ${json.commitSha.slice(0, 7)} creat, Vercel redeployează singur — live în ~2 minute.`,
          url: json.commitUrl,
        });
      } else {
        setResult({
          kind: 'ok',
          text: `Salvat în data/ (${what}). Local se vede imediat; live intră la următorul push.`,
        });
      }
      setBaseline(structuredClone(data));
      router.refresh();
    } catch {
      setResult({ kind: 'err', text: 'Eroare de rețea la salvare. Încearcă din nou.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Un partener = o intrare, cu toate plasările lui (bannere + popup). */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Parteneri</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Fiecare partener are plasările lui: sloturile din pagini și popup-ul dreapta-jos.
              Mesajul din pagini se alege singur după cine citește: clienți sau instalatori.
            </p>
          </div>
          <label className="block text-xs">
            <span className="font-medium text-slate-600">Rotație popup (sec)</span>
            <input
              type="number"
              min={5}
              max={120}
              value={data.popup.rotationSeconds}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  popup: { ...d.popup, rotationSeconds: Number(e.target.value) },
                }))
              }
              disabled={!writable}
              className={`${inputCls} w-24`}
            />
          </label>
        </div>
        {data.sponsors.map((s) => (
          <div key={s.slug} className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
            <CardHeader
              logo={s.logo}
              name={s.name}
              slug={s.slug}
              active={s.active}
              onToggle={() => patchSponsor(s.slug, { active: !s.active })}
              disabled={!writable}
            />
            <RunRow
              run={s.run}
              onChange={(run) => patchSponsor(s.slug, { run })}
              disabled={!writable}
              now={now}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Titlu card"
                value={s.name}
                onChange={(v) => patchSponsor(s.slug, { name: v })}
                disabled={!writable}
              />
              <Field
                label="Site (link-ul cardului)"
                value={s.baseUrl}
                onChange={(v) => patchSponsor(s.slug, { baseUrl: v })}
                hint="UTM-urile se adaugă singure la click"
                disabled={!writable}
              />
              <Field
                label="CTA popup (rândul amber)"
                value={s.cta ?? ''}
                onChange={(v) => patchSponsor(s.slug, { cta: v })}
                hint="apare doar în popup-ul dreapta-jos, ex: Vezi oferta →"
                disabled={!writable}
              />
              <Field
                label={'Telefon (buton „Sună")'}
                value={s.phone ?? ''}
                onChange={(v) => patchSponsor(s.slug, { phone: v })}
                hint="gol = fără buton"
                disabled={!writable}
              />
              <Field
                label="WhatsApp"
                value={s.whatsapp ?? ''}
                onChange={(v) => patchSponsor(s.slug, { whatsapp: v })}
                hint="doar cifre cu prefix de țară, ex: 40763990097 · gol = fără buton"
                disabled={!writable}
              />
              <Field
                label="Pagină de Facebook"
                value={s.facebook ?? ''}
                onChange={(v) => patchSponsor(s.slug, { facebook: v })}
                hint="URL complet · gol = fără buton"
                className="sm:col-span-2"
                disabled={!writable}
              />
              <Field
                label="Mesaj pentru clienți"
                value={s.messages.client}
                onChange={(v) =>
                  patchSponsor(s.slug, { messages: { ...s.messages, client: v } })
                }
                hint="același text apare și ca descriere în popup-ul dreapta-jos"
                textarea
                className="sm:col-span-2"
                disabled={!writable}
              />
              <Field
                label="Mesaj pentru instalatori"
                value={s.messages.instalator ?? ''}
                onChange={(v) =>
                  patchSponsor(s.slug, { messages: { ...s.messages, instalator: v } })
                }
                hint="gol = se afișează mesajul de clienți și pe paginile de instalatori"
                textarea
                className="sm:col-span-2"
                disabled={!writable}
              />
            </div>
            <div className="text-xs">
              <span className="font-medium text-slate-600">Plasări</span>
              <label className="mt-1.5 flex items-center gap-2 text-slate-700">
                <input
                  type="checkbox"
                  checked={s.positions === 'all'}
                  onChange={(e) =>
                    patchSponsor(s.slug, {
                      positions: e.target.checked ? 'all' : [...SPONSOR_POSITIONS],
                    })
                  }
                  disabled={!writable}
                />
                Toate plasările (pachet Premium)
              </label>
              {s.positions !== 'all' && (
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {SPONSOR_POSITIONS.map((pos) => (
                    <label key={pos} className="flex items-center gap-2 text-slate-600">
                      <input
                        type="checkbox"
                        checked={s.positions !== 'all' && s.positions.includes(pos)}
                        onChange={() => togglePosition(s, pos)}
                        disabled={!writable}
                      />
                      {SPONSOR_POSITION_LABELS[pos]}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Bara de salvare: apare doar când e ceva de salvat sau de raportat. */}
      {(dirty || result) && (
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          <div className="min-w-0 text-sm">
            {result ? (
              <span className={result.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}>
                {result.text}{' '}
                {result.url && (
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    vezi commit-ul →
                  </a>
                )}
              </span>
            ) : (
              <span className="text-slate-600">Ai modificări nesalvate.</span>
            )}
          </div>
          {dirty && (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={reset}
                disabled={saving}
                className="rounded border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Renunță
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !writable}
                className="rounded bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? 'Se salvează…' : mode === 'github' ? 'Salvează (commit + deploy)' : 'Salvează'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
