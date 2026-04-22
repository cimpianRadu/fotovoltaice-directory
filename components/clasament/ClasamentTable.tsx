'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Company } from '@/lib/utils';
import { PV_RELEVANT_CODES, type PvRelevantCode } from '@/lib/anre';

interface Row {
  slug: string;
  name: string;
  logo: string;
  city: string;
  county: string;
  revenue: number;
  profit: number;
  margin: number;
  employees: number;
  founded: number;
  activeCerts: Set<string>;
  financialYear: number;
}

interface Props {
  rows: Row[];
  counties: string[];
}

type SortKey = 'revenue' | 'profit' | 'margin' | 'employees' | 'founded' | 'name';
type SortDir = 'asc' | 'desc';

const MIN_REVENUE_PRESETS = [
  { label: 'orice', value: 0 },
  { label: '1M+', value: 1_000_000 },
  { label: '5M+', value: 5_000_000 },
  { label: '20M+', value: 20_000_000 },
];

function formatCompactRon(n: number): string {
  if (!n || n <= 0) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2).replace('.', ',')}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}`;
}

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-gray-300 ml-1">↕</span>;
  return <span className="text-primary ml-1">{dir === 'desc' ? '↓' : '↑'}</span>;
}

export default function ClasamentTable({ rows, counties }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [activeCertFilters, setActiveCertFilters] = useState<Set<PvRelevantCode>>(new Set());
  const [minRevenue, setMinRevenue] = useState<number>(0);

  const toggleCert = (code: PvRelevantCode) => {
    setActiveCertFilters((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      // Sensible defaults: numeric cols descending, name ascending, founded ascending (older first)
      setSortDir(key === 'name' || key === 'founded' ? 'asc' : 'desc');
    }
  };

  const filtered = useMemo(() => {
    let out = rows;
    if (selectedCounty) {
      out = out.filter((r) => r.county === selectedCounty);
    }
    if (minRevenue > 0) {
      out = out.filter((r) => r.revenue >= minRevenue);
    }
    if (activeCertFilters.size > 0) {
      out = out.filter((r) => {
        for (const code of activeCertFilters) {
          if (!r.activeCerts.has(code)) return false;
        }
        return true;
      });
    }
    return out;
  }, [rows, selectedCounty, minRevenue, activeCertFilters]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'ro');
          break;
        case 'founded':
          cmp = a.founded - b.founded;
          break;
        default:
          cmp = a[sortKey] - b[sortKey];
      }
      if (cmp === 0) cmp = b.revenue - a.revenue; // tiebreaker: revenue desc
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const hasActiveFilters =
    selectedCounty !== '' || activeCertFilters.size > 0 || minRevenue > 0;

  return (
    <div>
      {/* Filters */}
      <div className="bg-white border border-border rounded-xl p-4 mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* County filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Județ</label>
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="text-sm border border-border rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Toate județele</option>
              {counties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Min revenue */}
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Cifră minimă</label>
            <div className="flex gap-1">
              {MIN_REVENUE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setMinRevenue(p.value)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    minRevenue === p.value
                      ? 'bg-primary border-primary text-white font-semibold'
                      : 'bg-white border-border text-gray-700 hover:border-primary/30'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ANRE cert toggles */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Atestate ANRE (trebuie să le aibă pe toate bifate)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PV_RELEVANT_CODES.map((code) => {
              const active = activeCertFilters.has(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleCert(code)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? 'bg-green-600 border-green-600 text-white font-semibold'
                      : 'bg-white border-border text-gray-700 hover:border-green-400'
                  }`}
                >
                  {active ? '✓ ' : ''}
                  {code}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active filter summary */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <span>
            {sorted.length} {sorted.length === 1 ? 'firmă afișată' : 'firme afișate'} din {rows.length}
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSelectedCounty('');
                setActiveCertFilters(new Set());
                setMinRevenue(0);
              }}
              className="text-primary hover:underline font-medium"
            >
              Resetează filtre
            </button>
          )}
        </div>
      </div>

      {/* Table — desktop */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface border-b border-border text-left">
              <th className="px-3 py-3 font-semibold text-gray-600 w-10">#</th>
              <th className="px-3 py-3 font-semibold text-gray-600">
                <button onClick={() => toggleSort('name')} className="inline-flex items-center hover:text-primary transition-colors">
                  Firmă
                  <SortArrow active={sortKey === 'name'} dir={sortDir} />
                </button>
              </th>
              <th className="px-3 py-3 font-semibold text-gray-600 text-right">
                <button onClick={() => toggleSort('revenue')} className="inline-flex items-center hover:text-primary transition-colors">
                  Cifră
                  <SortArrow active={sortKey === 'revenue'} dir={sortDir} />
                </button>
              </th>
              <th className="px-3 py-3 font-semibold text-gray-600 text-right">
                <button onClick={() => toggleSort('profit')} className="inline-flex items-center hover:text-primary transition-colors">
                  Profit
                  <SortArrow active={sortKey === 'profit'} dir={sortDir} />
                </button>
              </th>
              <th className="px-3 py-3 font-semibold text-gray-600 text-right">
                <button onClick={() => toggleSort('margin')} className="inline-flex items-center hover:text-primary transition-colors">
                  Marjă
                  <SortArrow active={sortKey === 'margin'} dir={sortDir} />
                </button>
              </th>
              <th className="px-3 py-3 font-semibold text-gray-600 text-right">
                <button onClick={() => toggleSort('employees')} className="inline-flex items-center hover:text-primary transition-colors">
                  Angajați
                  <SortArrow active={sortKey === 'employees'} dir={sortDir} />
                </button>
              </th>
              <th className="px-3 py-3 font-semibold text-gray-600 text-right">
                <button onClick={() => toggleSort('founded')} className="inline-flex items-center hover:text-primary transition-colors">
                  Fondat
                  <SortArrow active={sortKey === 'founded'} dir={sortDir} />
                </button>
              </th>
              <th className="px-3 py-3 font-semibold text-gray-600">ANRE</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr key={row.slug} className="border-b border-border last:border-b-0 hover:bg-surface/60 transition-colors">
                <td className="px-3 py-3 text-gray-400 font-medium">{i + 1}</td>
                <td className="px-3 py-3">
                  <Link href={`/firme/${row.slug}`} className="flex items-center gap-3 group">
                    {row.logo ? (
                      <Image
                        src={row.logo}
                        alt={`Logo ${row.name}`}
                        width={32}
                        height={32}
                        className="rounded-md object-contain bg-white flex-shrink-0 border border-border"
                      />
                    ) : (
                      <span className="w-8 h-8 rounded-md bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-[10px] font-semibold text-secondary flex-shrink-0">
                        {row.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block font-semibold text-gray-900 group-hover:text-primary-dark transition-colors truncate">
                        {row.name}
                      </span>
                      <span className="block text-xs text-gray-500 truncate">
                        {row.city}, {row.county}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-3 text-right font-mono font-semibold text-gray-900 tabular-nums">
                  {formatCompactRon(row.revenue)}
                  <span className="block text-[10px] text-gray-400 font-sans">{row.financialYear}</span>
                </td>
                <td className={`px-3 py-3 text-right font-mono tabular-nums ${row.profit < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatCompactRon(row.profit)}
                </td>
                <td className={`px-3 py-3 text-right font-mono tabular-nums ${row.margin < 0 ? 'text-red-600' : row.margin >= 10 ? 'text-green-600 font-semibold' : 'text-gray-700'}`}>
                  {row.revenue > 0 ? `${row.margin.toFixed(1).replace('.', ',')}%` : '—'}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums text-gray-700">
                  {row.employees > 0 ? row.employees : '—'}
                </td>
                <td className="px-3 py-3 text-right text-gray-700">{row.founded || '—'}</td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {PV_RELEVANT_CODES.filter((c) => row.activeCerts.has(c)).map((code) => (
                      <span
                        key={code}
                        className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200"
                      >
                        {code}
                      </span>
                    ))}
                    {Array.from(row.activeCerts).filter((c) => !PV_RELEVANT_CODES.includes(c as PvRelevantCode)).length === 0 &&
                      row.activeCerts.size === 0 && <span className="text-xs text-gray-300">—</span>}
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-sm text-gray-500">
                  Nicio firmă nu îndeplinește criteriile selectate.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile — cards */}
      <div className="md:hidden space-y-2">
        {sorted.map((row, i) => (
          <Link
            key={row.slug}
            href={`/firme/${row.slug}`}
            className="block bg-white border border-border rounded-xl p-3 hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm font-medium w-6 text-center flex-shrink-0">{i + 1}</span>
              {row.logo ? (
                <Image
                  src={row.logo}
                  alt={`Logo ${row.name}`}
                  width={36}
                  height={36}
                  className="rounded-md object-contain bg-white flex-shrink-0 border border-border"
                />
              ) : (
                <span className="w-9 h-9 rounded-md bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-[10px] font-semibold text-secondary flex-shrink-0">
                  {row.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm truncate">{row.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {row.city}, {row.county}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-mono font-bold text-gray-900 tabular-nums">{formatCompactRon(row.revenue)}</div>
                <div className="text-[10px] text-gray-400">{row.financialYear}</div>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <div className="flex flex-wrap gap-1">
                {PV_RELEVANT_CODES.filter((c) => row.activeCerts.has(c)).map((code) => (
                  <span
                    key={code}
                    className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200"
                  >
                    {code}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 text-gray-500 tabular-nums">
                <span>{row.employees > 0 ? `${row.employees} ang.` : '—'}</span>
                <span>{row.revenue > 0 ? `${row.margin.toFixed(1).replace('.', ',')}%` : ''}</span>
              </div>
            </div>
          </Link>
        ))}
        {sorted.length === 0 && (
          <div className="bg-white border border-border rounded-xl p-8 text-center text-sm text-gray-500">
            Nicio firmă nu îndeplinește criteriile selectate.
          </div>
        )}
      </div>
    </div>
  );
}
