'use client';

import { useMemo, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

/**
 * Județele în care firma vrea să fie anunțată prin email la fiecare cerere nouă.
 *
 * Un singur criteriu, județul, la cererea instalatorilor care ofertează: la
 * volumul actual (5-6 cereri pe săptămână în toată țara), un filtru pe urgență
 * sau pe putere ar stinge alertele cu totul. Detaliile care contează la ofertare
 * (finanțare, termen, putere) sunt în email, nu în filtru.
 */
export default function PortalCountyAlerts({
  counties,
  initial,
}: {
  counties: string[];
  initial: string[];
}) {
  const [selected, setSelected] = useState<string[]>(initial);
  const [saved, setSaved] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(initial.length === 0);

  const dirty = useMemo(() => {
    if (selected.length !== saved.length) return true;
    const set = new Set(saved);
    return selected.some((c) => !set.has(c));
  }, [selected, saved]);

  function toggle(county: string) {
    setSelected((prev) =>
      prev.includes(county) ? prev.filter((c) => c !== county) : [...prev, county],
    );
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/portal/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counties: selected }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'Eroare la salvare');
      const next: string[] = Array.isArray(json.counties) ? json.counties : selected;
      setSelected(next);
      setSaved(next);
      trackEvent('portal_alerts_saved', { counties: next.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la salvare');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-8 rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-gray-900">Alerte pe județ</h2>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
            Bifează județele în care lucrezi. Când intră o cerere nouă acolo, primești email cu
            finanțarea, termenul și puterea, iar cererea o revendici din feed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-secondary/40 hover:text-secondary-dark"
        >
          {open ? 'Ascunde' : 'Schimbă'}
        </button>
      </div>

      {saved.length > 0 && (
        <p className="mt-3 text-sm text-gray-700">
          Primești alerte pentru: <strong>{saved.join(', ')}</strong>
        </p>
      )}
      {saved.length === 0 && !open && (
        <p className="mt-3 text-sm text-gray-500">
          Niciun județ bifat, deci nu primești nicio alertă.
        </p>
      )}

      {open && (
        <>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {counties.map((county) => {
              const active = selected.includes(county);
              return (
                <button
                  key={county}
                  type="button"
                  onClick={() => toggle(county)}
                  aria-pressed={active}
                  className={`rounded-full border px-3 py-2.5 text-[13px] font-medium transition-colors sm:py-1.5 sm:text-xs ${
                    active
                      ? 'border-secondary bg-secondary text-white'
                      : 'border-border bg-white text-gray-600 hover:border-secondary/40 hover:text-secondary-dark'
                  }`}
                >
                  {county}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={busy || !dirty}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:py-2"
            >
              {busy ? 'Salvez…' : 'Salvează județele'}
            </button>
            <span className="text-xs text-gray-500">
              {selected.length === 0
                ? 'Niciun județ bifat = fără alerte.'
                : `${selected.length} ${selected.length === 1 ? 'județ bifat' : 'județe bifate'}`}
            </span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-xs text-gray-400 underline hover:text-gray-600 hover:no-underline"
              >
                golește
              </button>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          {!error && !dirty && saved.length > 0 && (
            <p className="mt-3 text-xs text-gray-400">Salvat. Alertele pleacă la fiecare cerere nouă.</p>
          )}
        </>
      )}
    </div>
  );
}
