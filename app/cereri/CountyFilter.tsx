'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Filtrul pe județ din feedul de cereri. E cu bifă, nu cu o singură alegere:
 * o firmă din Galați merge și în Brăila și în Vrancea, iar dacă o obligăm să
 * aleagă un singur județ vede o cerere, crede că n-avem nimic pentru ea și
 * pleacă. Se afișează doar județele care au cereri în feed, cu numărul lor.
 *
 * Caseta de căutare apare peste 12 opțiuni, ca la SearchableSelect — sub prag
 * încap toate pe ecran, deci ar fi doar zgomot.
 */
const SEARCH_THRESHOLD = 12;

function fold(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function CountyFilter({
  options,
  selected,
  onChange,
}: {
  options: { name: string; count: number }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = fold(search);
    return options.filter((o) => fold(o.name).includes(q));
  }, [options, search]);

  const toggle = (name: string) =>
    onChange(
      selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name],
    );

  const label =
    selected.length === 0
      ? 'Toate județele'
      : selected.length <= 2
        ? selected.join(', ')
        : `${selected.length} județe`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setSearch('');
        }}
        aria-expanded={open}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
          selected.length
            ? 'border-secondary bg-secondary text-white'
            : 'border-border bg-white text-gray-600 hover:border-secondary/40 hover:text-secondary-dark'
        }`}
      >
        {label}
        <span aria-hidden className={`text-[10px] ${selected.length ? 'opacity-80' : 'text-gray-400'}`}>
          ▼
        </span>
      </button>

      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="ml-2 text-xs text-gray-400 underline hover:text-gray-600 hover:no-underline"
        >
          golește
        </button>
      )}

      {open && (
        <div className="absolute left-0 z-20 mt-1 w-64 rounded-xl border border-border bg-white p-2 shadow-lg">
          {options.length > SEARCH_THRESHOLD && (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută județul..."
              className="mb-2 w-full rounded-lg border border-border px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-secondary focus:outline-none"
            />
          )}
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-sm text-gray-500">Niciun județ găsit.</p>
            ) : (
              filtered.map((o) => (
                <label
                  key={o.name}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-surface"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(o.name)}
                    onChange={() => toggle(o.name)}
                    className="h-4 w-4 accent-secondary"
                  />
                  <span className="flex-1">{o.name}</span>
                  <span className="text-xs text-gray-400">{o.count}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
