'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import CompanyCard from '@/components/company/CompanyCard';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import {
  getCompanies,
  getCounties,
  getSpecializations,
  filterCompanies,
  sortCompanies,
  getTagLabel,
} from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

const ITEMS_PER_PAGE = 9;

const certOptions = [
  { value: 'ANRE-C2A', label: 'ANRE C2A' },
  { value: 'ISO-9001', label: 'ISO 9001' },
  { value: 'ISO-14001', label: 'ISO 14001' },
  { value: 'ISO-45001', label: 'ISO 45001' },
];

const tagOptions = [
  'experienta-10-ani',
  'proiecte-mari',
  'mentenanta-inclusa',
  'finantare-disponibila',
  'garantie-extinsa',
  'monitorizare-inclusa',
];

const sortOptions = [
  { value: 'relevance', label: 'Relevanță' },
  { value: 'projects', label: 'Proiecte finalizate' },
  { value: 'founded', label: 'Anul înființării' },
  { value: 'capacity', label: 'Capacitate maximă' },
];

const capacityOptions = [
  { value: '50', label: '50+ kW' },
  { value: '100', label: '100+ kW' },
  { value: '500', label: '500+ kW' },
  { value: '1000', label: '1.000+ kW' },
  { value: '5000', label: '5.000+ kW' },
];

export default function CompanyListClient() {
  const searchParams = useSearchParams();

  const [county, setCounty] = useState(searchParams.get('judet') ?? '');
  const [specialization, setSpecialization] = useState(searchParams.get('specializare') ?? '');
  const [minCapacity, setMinCapacity] = useState('');
  const [certification, setCertification] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const allCompanies = getCompanies();
  const counties = getCounties();
  const specializations = getSpecializations();

  const filtered = useMemo(() => {
    let result = filterCompanies(allCompanies, {
      county: county || undefined,
      specialization: specialization || undefined,
      minCapacity: minCapacity ? Number(minCapacity) : undefined,
      certification: certification || undefined,
      tag: selectedTags[0] || undefined,
    });
    return sortCompanies(result, sortBy);
  }, [allCompanies, county, specialization, minCapacity, certification, selectedTags, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
    trackEvent('filter_applied', { filter_type: 'tag', filter_value: tag });
  }

  function clearFilters() {
    setCounty('');
    setSpecialization('');
    setMinCapacity('');
    setCertification('');
    setSelectedTags([]);
    setPage(1);
  }

  const hasFilters = county || specialization || minCapacity || certification || selectedTags.length > 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Mobile filter toggle */}
      <button
        onClick={() => setFiltersOpen(!filtersOpen)}
        className="lg:hidden flex items-center justify-center gap-2 bg-surface border border-border rounded-lg px-4 py-2.5 text-sm font-medium"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        Filtre {hasFilters && `(${filtered.length})`}
      </button>

      {/* Filters sidebar */}
      <aside className={`lg:w-64 shrink-0 space-y-4 ${filtersOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="bg-white rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Filtre</h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-primary-dark hover:underline">
                Resetează
              </button>
            )}
          </div>

          <Select
            label="Județ"
            name="county"
            value={county}
            onChange={(e) => { setCounty(e.target.value); setPage(1); trackEvent('filter_applied', { filter_type: 'county', filter_value: e.target.value }); }}
            options={counties.map((c) => ({ value: c, label: c }))}
            placeholder="Toate județele"
          />

          <Select
            label="Specializare"
            name="specialization"
            value={specialization}
            onChange={(e) => { setSpecialization(e.target.value); setPage(1); trackEvent('filter_applied', { filter_type: 'specialization', filter_value: e.target.value }); }}
            options={specializations.map((s) => ({ value: s.id, label: s.label }))}
            placeholder="Toate specializările"
          />

          <Select
            label="Capacitate minimă"
            name="capacity"
            value={minCapacity}
            onChange={(e) => { setMinCapacity(e.target.value); setPage(1); }}
            options={capacityOptions}
            placeholder="Orice capacitate"
          />

          <Select
            label="Certificare"
            name="certification"
            value={certification}
            onChange={(e) => { setCertification(e.target.value); setPage(1); }}
            options={certOptions}
            placeholder="Orice certificare"
          />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Etichete</p>
            <div className="flex flex-wrap gap-1.5">
              {tagOptions.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)}>
                  <Badge variant={selectedTags.includes(tag) ? 'primary' : 'outline'} size="sm">
                    {getTagLabel(tag)}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Results */}
      <div className="flex-1">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <p className="text-sm text-gray-500">
            {filtered.length} {filtered.length === 1 ? 'firmă' : 'firme'} găsite
          </p>

          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <div className="hidden sm:flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={`p-1.5 ${view === 'grid' ? 'bg-surface' : 'hover:bg-gray-50'}`}
                aria-label="Vizualizare grid"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-1.5 ${view === 'list' ? 'bg-surface' : 'hover:bg-gray-50'}`}
                aria-label="Vizualizare listă"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Company Grid/List */}
        {paginated.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-2">Nu am găsit firme cu aceste filtre.</p>
            <button onClick={clearFilters} className="text-sm text-primary-dark hover:underline">
              Resetează filtrele
            </button>
          </div>
        ) : (
          <div
            className={
              view === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'flex flex-col gap-3'
            }
          >
            {paginated.map((company) => (
              <CompanyCard key={company.id} company={company} view={view} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-primary text-white'
                    : 'bg-white border border-border text-gray-600 hover:bg-surface'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
