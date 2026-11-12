'use client';

// Localitatea cu sugestii, ca la aplicațiile de livrare (11 nov 2026, cerut de
// Radu). Lista vine din SIRUTA, filtrată pe județul ales (lib/localitati-shared).
// Sugestiile ajută, nu obligă: cine scrie un cartier sau o localitate pe care
// lista n-o are trimite cererea la fel, ca până acum.

import { useEffect, useId, useRef, useState } from 'react';
import {
  type LocalitateEntry,
  loadLocalitati,
  localitateValue,
  searchLocalitati,
} from '@/lib/localitati-shared';

export default function LocalitateInput({
  judet,
  value,
  onChange,
  placeholder,
}: {
  judet: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  // Lista ține minte județul pentru care a venit: la schimbarea județului, cea
  // veche nu mai sugerează nimic până sosește cea nouă.
  const [loaded, setLoaded] = useState<{ judet: string; list: LocalitateEntry[] }>({ judet: '', list: [] });
  const list = loaded.judet === judet ? loaded.list : [];
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!judet) return;
    let alive = true;
    loadLocalitati(judet).then((l) => {
      if (alive) setLoaded({ judet, list: l });
    });
    return () => {
      alive = false;
    };
  }, [judet]);

  const matches = open ? searchLocalitati(list, value) : [];
  // Ascundem lista când textul e deja exact o sugestie aleasă.
  const exact = matches.length === 1 && localitateValue(matches[0]) === value;
  const show = open && matches.length > 0 && !exact;

  useEffect(() => {
    function onDoc(e: PointerEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, []);

  function choose(e: LocalitateEntry) {
    onChange(localitateValue(e));
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!show) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      // Altfel Enter ar trimite pasul cu textul pe jumătate scris.
      e.preventDefault();
      choose(matches[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <label htmlFor="localitate" className="block text-sm font-medium text-gray-700 mb-1">
        Localitate<span className="text-red-500 ml-0.5">*</span>
      </label>
      <input
        id="localitate"
        name="localitate"
        type="text"
        required
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        placeholder={judet ? placeholder : 'Alegeți întâi județul'}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
      />
      {show && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-[min(20rem,50vh)] overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {matches.map((m, i) => (
            <li
              key={`${m[0]}|${m[1]}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // pointerdown, nu click: pe telefon blur-ul inputului ar închide
              // lista înainte să ajungă click-ul.
              onPointerDown={(e) => {
                e.preventDefault();
                choose(m);
              }}
              className={`cursor-pointer px-3 py-2.5 text-sm ${i === active ? 'bg-primary/10' : 'hover:bg-primary/5'}`}
            >
              <span className="font-medium text-gray-900">{m[0]}</span>
              {m[1] && <span className="text-gray-500">, {m[1]}</span>}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-[11px] text-gray-400">
        Scrieți primele litere și alegeți din listă: satul, comuna sau orașul unde se face montajul.
      </p>
    </div>
  );
}
