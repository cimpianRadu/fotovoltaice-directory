'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Un filtru din bara de deasupra feedului de cereri: buton-pastilă care
 * deschide o listă cu bifă și numărul de cereri pe fiecare opțiune.
 *
 * Bifă, nu alegere unică (în afară de vechime): o firmă din Galați merge și în
 * Brăila și în Vrancea, iar una care ia „cât mai repede" ia și „1-3 luni".
 * Dacă o obligăm să aleagă o singură valoare vede o cerere, crede că n-avem
 * nimic pentru ea și pleacă.
 *
 * Pastile pe rânduri aveam până la 26 oct 2026, dar la șase dimensiuni lista de
 * butoane împingea prima cerere sub ecran pe telefon. Un rând de dropdown-uri
 * încape pe două rânduri chiar și pe 375 px.
 *
 * Caseta de căutare apare peste 12 opțiuni, ca la SearchableSelect — sub prag
 * încap toate pe ecran, deci ar fi doar zgomot.
 */
const SEARCH_THRESHOLD = 12;
const PANEL_WIDTH = 256;

export interface FilterOption {
  value: string;
  label: string;
  count: number;
  /** Explicația de sub etichetă, pentru opțiunile care nu se înțeleg din nume. */
  hint?: string;
}

function fold(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export default function FilterDropdown({
  title,
  allLabel,
  options,
  selected,
  onChange,
  single = false,
  className = '',
  note,
}: {
  /** „Termen", „Finanțare" — prefixul butonului și titlul listei. */
  title: string;
  /** Ce scrie pe buton când nu e nimic ales („Toate județele"). */
  allLabel: string;
  options: FilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Alegere unică: un click închide lista. Fără „golește", există mereu o valoare. */
  single?: boolean;
  className?: string;
  /** Explicația de sub listă, pentru un filtru care nu se bazează doar pe ce a spus clientul. */
  note?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  // Lista se deschide spre stânga când butonul e în jumătatea dreaptă a
  // ecranului: pe telefon, deschisă spre dreapta ieșea din pagină.
  const [alignRight, setAlignRight] = useState(false);
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
    return options.filter((o) => fold(o.label).includes(q));
  }, [options, search]);

  const toggle = (value: string) => {
    if (single) {
      onChange([value]);
      setOpen(false);
      return;
    }
    onChange(selected.includes(value) ? selected.filter((s) => s !== value) : [...selected, value]);
  };

  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  const active = !single && selected.length > 0;
  const value =
    selected.length === 0
      ? allLabel
      : selected.length <= (single ? 1 : 2)
        ? selected.map(labelOf).join(', ')
        : `${selected.length} alese`;
  // Pe telefon butonul are o jumătate de ecran: „Finanțare: Fonduri proprii"
  // nu încape. Fără selecție rămâne numele filtrului, cu selecție doar valoarea
  // (culoarea arată deja că filtrul e activ).
  const compact = single
    ? null
    : selected.length === 0
      ? title
      : selected.length === 1
        ? labelOf(selected[0])
        : `${title} (${selected.length})`;

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => {
          if (!open && containerRef.current) {
            const left = containerRef.current.getBoundingClientRect().left;
            setAlignRight(left + PANEL_WIDTH > window.innerWidth - 16);
          }
          setOpen((v) => !v);
          setSearch('');
        }}
        aria-expanded={open}
        className={`flex w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors sm:w-auto ${
          active
            ? 'border-secondary bg-secondary text-white'
            : open
              ? 'border-secondary/40 bg-white text-gray-800'
              : 'border-border bg-white text-gray-700 hover:border-secondary/40 hover:text-secondary-dark'
        }`}
      >
        {compact !== null && (
          <span className="min-w-0 flex-1 truncate text-left font-medium sm:hidden">{compact}</span>
        )}
        <span
          className={`${compact !== null ? 'hidden sm:flex' : 'flex'} min-w-0 flex-1 items-center gap-1.5`}
        >
          <span className={`shrink-0 ${active ? 'text-white/75' : 'text-gray-400'}`}>{title}:</span>
          <span className="min-w-0 flex-1 truncate text-left font-medium">{value}</span>
        </span>
        <span aria-hidden className={`shrink-0 text-[10px] ${active ? 'opacity-80' : 'text-gray-400'}`}>
          ▼
        </span>
      </button>

      {open && (
        <div
          className={`absolute z-20 mt-1 rounded-xl border border-border bg-white p-2 shadow-lg ${
            alignRight ? 'right-0' : 'left-0'
          }`}
          style={{ width: PANEL_WIDTH }}
        >
          {options.length > SEARCH_THRESHOLD && (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Caută ${title.toLowerCase()}...`}
              className="mb-2 w-full rounded-lg border border-border px-2.5 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-secondary focus:outline-none"
            />
          )}
          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-sm text-gray-500">Nicio opțiune găsită.</p>
            ) : (
              filtered.map((o) => (
                <label
                  key={o.value}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface ${
                    o.count === 0 && !selected.includes(o.value) ? 'text-gray-400' : 'text-gray-700'
                  }`}
                >
                  <input
                    type={single ? 'radio' : 'checkbox'}
                    checked={selected.includes(o.value)}
                    onChange={() => toggle(o.value)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-secondary"
                  />
                  <span className="flex-1">
                    {o.label}
                    {o.hint && <span className="block text-xs text-gray-400">{o.hint}</span>}
                  </span>
                  <span className="text-xs text-gray-400">{o.count}</span>
                </label>
              ))
            )}
          </div>
          {note && (
            <p className="mt-1 border-t border-border px-2 pt-2 text-xs leading-snug text-gray-500">
              {note}
            </p>
          )}
          {active && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs text-gray-500 hover:bg-surface hover:text-gray-700"
            >
              Golește selecția
            </button>
          )}
        </div>
      )}
    </div>
  );
}
