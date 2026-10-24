'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SERIES, type SeriesKey, type WeekPoint } from './series';

// Graficul pe săptămâni din /admin/analytics/cereri: o linie pe serie, câte un
// punct pe săptămână, o singură axă (toate sunt numărători). Seriile se aprind
// și se sting din butoanele de deasupra; culoarea rămâne a seriei, oricâte ar fi
// aprinse. Săptămâna în curs e neterminată: ultimul segment e punctat.

const RANGES: { weeks: number; label: string }[] = [
  { weeks: 8, label: '8 săpt.' },
  { weeks: 12, label: '12 săpt.' },
  { weeks: 26, label: '6 luni' },
  { weeks: 0, label: 'Tot' },
];

const INK = { primary: '#0b0b0b', secondary: '#52514e', muted: '#898781', grid: '#e1e0d9', axis: '#c3c2b7' };
const HEIGHT = 300;
const M = { top: 16, right: 112, bottom: 30, left: 36 };

function niceMax(v: number): number {
  if (v <= 5) return 5;
  const step = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= m * step) return m * step;
  return 10 * step;
}

function shortDay(ymd: string): string {
  return new Date(`${ymd}T12:00:00Z`).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export default function WeeklyChart({ weeks }: { weeks: WeekPoint[] }) {
  const [on, setOn] = useState<Set<SeriesKey>>(() => new Set(SERIES.map((s) => s.key)));
  const [range, setRange] = useState(12);
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(900);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(320, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => (range ? weeks.slice(-range) : weeks), [weeks, range]);
  const visible = SERIES.filter((s) => on.has(s.key));

  const plotW = width - M.left - M.right;
  const plotH = HEIGHT - M.top - M.bottom;
  const max = niceMax(Math.max(1, ...data.flatMap((w) => visible.map((s) => w[s.key]))));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f)).filter((v, i, a) => a.indexOf(v) === i);
  const x = (i: number) => M.left + (data.length === 1 ? plotW / 2 : (i * plotW) / (data.length - 1));
  const y = (v: number) => M.top + plotH - (v / max) * plotH;
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(2, Math.floor(plotW / 70))));

  // Etichetele de la capătul liniilor, împinse ca să nu se suprapună.
  const last = data.length - 1;
  const endLabels = visible
    .map((s) => ({ ...s, value: data[last]?.[s.key] ?? 0, y: y(data[last]?.[s.key] ?? 0) }))
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < endLabels.length; i++) {
    if (endLabels[i].y - endLabels[i - 1].y < 15) endLabels[i].y = endLabels[i - 1].y + 15;
  }

  const toggle = (key: SeriesKey) =>
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else next.add(key);
      return next;
    });

  const pick = (clientX: number, rect: DOMRect) => {
    const px = ((clientX - rect.left) / rect.width) * width;
    const i = Math.round(((px - M.left) / plotW) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, i)));
  };

  const hw = hover != null ? data[hover] : null;
  const tipLeft = hover != null ? Math.min(Math.max(x(hover) + 12, 0), width - 200) : 0;
  const tipFlip = hover != null && x(hover) + 212 > width;

  return (
    <section className="rounded-xl border border-slate-200 bg-white px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Serii afișate">
          {SERIES.map((s) => {
            const active = on.has(s.key);
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(s.key)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'border-slate-300 bg-white text-slate-900'
                    : 'border-dashed border-slate-200 bg-slate-50 text-slate-400'
                }`}
              >
                <span
                  className="h-0.5 w-4 rounded-full"
                  style={{ background: active ? s.color : '#c3c2b7' }}
                />
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1" role="group" aria-label="Perioada">
          {RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              aria-pressed={range === r.weeks}
              onClick={() => setRange(r.weeks)}
              className={`rounded-md px-2.5 py-1 text-xs transition ${
                range === r.weeks ? 'bg-slate-900 font-medium text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={boxRef} className="relative mt-4">
        <svg
          width={width}
          height={HEIGHT}
          role="img"
          aria-label={`Pe săptămâni: ${visible.map((s) => s.label).join(', ')}`}
          tabIndex={0}
          className="block outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          onPointerMove={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(last)}
          onBlur={() => setHover(null)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') setHover((h) => Math.max(0, (h ?? last) - 1));
            if (e.key === 'ArrowRight') setHover((h) => Math.min(last, (h ?? last) + 1));
          }}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={M.left}
                x2={M.left + plotW}
                y1={y(t)}
                y2={y(t)}
                stroke={t === 0 ? INK.axis : INK.grid}
                strokeWidth={1}
              />
              <text x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={INK.muted} className="tabular-nums">
                {t}
              </text>
            </g>
          ))}

          {data.map((w, i) =>
            i % labelEvery === (last % labelEvery) ? (
              <text key={w.start} x={x(i)} y={HEIGHT - 8} textAnchor="middle" fontSize={11} fill={INK.muted}>
                {shortDay(w.start)}
              </text>
            ) : null,
          )}

          {hover != null && (
            <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={M.top + plotH} stroke={INK.axis} strokeWidth={1} />
          )}

          {visible.map((s) => {
            const done = data.filter((w) => !w.partial);
            const path = done.map((w, i) => `${i ? 'L' : 'M'}${x(i)},${y(w[s.key])}`).join(' ');
            const partialIdx = data.findIndex((w) => w.partial);
            return (
              <g key={s.key}>
                <path d={path} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {partialIdx > 0 && (
                  <line
                    x1={x(partialIdx - 1)}
                    y1={y(data[partialIdx - 1][s.key])}
                    x2={x(partialIdx)}
                    y2={y(data[partialIdx][s.key])}
                    stroke={s.color}
                    strokeWidth={2}
                    strokeDasharray="3 4"
                    strokeLinecap="round"
                  />
                )}
                {data.map((w, i) => (
                  <circle
                    key={w.start}
                    cx={x(i)}
                    cy={y(w[s.key])}
                    r={hover === i ? 5 : 4}
                    fill={w.partial ? '#ffffff' : s.color}
                    stroke={w.partial ? s.color : '#ffffff'}
                    strokeWidth={2}
                  />
                ))}
              </g>
            );
          })}

          {endLabels.map((l) => (
            <g key={l.key}>
              <line x1={M.left + plotW + 10} x2={M.left + plotW + 22} y1={l.y} y2={l.y} stroke={l.color} strokeWidth={2} strokeLinecap="round" />
              <text x={M.left + plotW + 27} y={l.y} dy="0.32em" fontSize={11} fill={INK.secondary}>
                <tspan fontWeight={600} fill={INK.primary}>
                  {l.value}
                </tspan>{' '}
                {l.label.toLowerCase()}
              </text>
            </g>
          ))}
        </svg>

        {hw && (
          <div
            className="pointer-events-none absolute top-2 w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
            style={tipFlip ? { left: Math.max(0, x(hover!) - 212) } : { left: tipLeft }}
          >
            <div className="text-slate-500">
              {hw.label}
              {hw.partial && ' (în curs)'}
            </div>
            <ul className="mt-1 space-y-0.5">
              {visible.map((s) => (
                <li key={s.key} className="flex items-center gap-2">
                  <span className="h-0.5 w-3 rounded-full" style={{ background: s.color }} />
                  <span className="font-semibold text-slate-900 tabular-nums">{hw[s.key]}</span>
                  <span className="text-slate-500">{s.label.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-slate-500 hover:text-slate-900">Tabelul cu cifre</summary>
        <table className="mt-2 w-full max-w-xl">
          <thead className="text-left text-[11px] tracking-wide text-slate-400 uppercase">
            <tr>
              <th className="py-1 font-medium">Săptămâna</th>
              {SERIES.map((s) => (
                <th key={s.key} className="py-1 text-right font-medium">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {[...data].reverse().map((w) => (
              <tr key={w.start} className="border-t border-slate-100">
                <td className="py-1 text-slate-600">
                  {w.label}
                  {w.partial && <span className="text-slate-400"> (în curs)</span>}
                </td>
                {SERIES.map((s) => (
                  <td key={s.key} className="py-1 text-right text-slate-900">
                    {w[s.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
