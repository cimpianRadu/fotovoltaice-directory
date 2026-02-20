'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

interface SearchableSelectProps {
  label?: string;
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableSelect({
  label,
  name,
  options,
  required = false,
  value = '',
  onValueChange,
  placeholder = 'Selectează...',
  className = '',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, search]);

  const selectedLabel = options.find((opt) => opt.value === value)?.label;

  useEffect(() => {
    if (open) {
      setSearch('');
      // Small delay to let the dropdown render before focusing
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') setOpen(false);
  }

  function select(val: string) {
    onValueChange?.(val);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value} />

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-left bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors pr-10 relative"
      >
        <span className={selectedLabel ? 'text-gray-900' : 'text-gray-500'}>
          {selectedLabel || placeholder}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Caută..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {/* "All" / reset option */}
            <li>
              <button
                type="button"
                onClick={() => select('')}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-primary/5 transition-colors flex items-center gap-2 ${
                  !value ? 'text-primary font-medium bg-primary/5' : 'text-gray-600'
                }`}
              >
                {!value && (
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
                <span className={!value ? '' : 'pl-6'}>{placeholder}</span>
              </button>
            </li>

            {filtered.length === 0 ? (
              <li className="px-3 py-3 text-sm text-gray-400 text-center">
                Niciun rezultat
              </li>
            ) : (
              filtered.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => select(opt.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-primary/5 transition-colors flex items-center gap-2 ${
                      value === opt.value ? 'text-primary font-medium bg-primary/5' : 'text-gray-700'
                    }`}
                  >
                    {value === opt.value && (
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                    <span className={value === opt.value ? '' : 'pl-6'}>{opt.label}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
