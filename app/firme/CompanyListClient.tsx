'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
  fuzzyMatchCompanyName,
  companyMatchesSegment,
} from '@/lib/utils';
import { useSegment } from '@/components/segment/SegmentProvider';
import SegmentToggle from '@/components/segment/SegmentToggle';
import { trackEvent } from '@/lib/analytics';

const ITEMS_PER_PAGE = 9;

const certOptions = [
  { value: 'ANRE-C2A', label: 'ANRE C2A (comercial >50kW)' },
  { value: 'ANRE-C1A', label: 'ANRE C1A (proiectare)' },
  { value: 'ANRE-B', label: 'ANRE B (joasă tensiune)' },
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
  { value: 'newest', label: 'Cel mai recent adăugate' },
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
  const { segment } = useSegment();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '');
  const [county, setCounty] = useState(searchParams.get('judet') ?? '');
  const [specialization, setSpecialization] = useState(searchParams.get('specializare') ?? '');
  const [minCapacity, setMinCapacity] = useState('');
  const [certification, setCertification] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
    result = result.filter((c) => companyMatchesSegment(c, segment));
    if (searchQuery.trim()) {
      // Search covers name + oraș + județ — pe mobil oamenii tastează localitatea, nu numele firmei
      result = result.filter((c) =>
        fuzzyMatchCompanyName(`${c.name} ${c.location.city} ${c.location.county}`, searchQuery)
      );
    }
    return sortCompanies(result, sortBy);
  }, [allCompanies, segment, county, specialization, minCapacity, certification, selectedTags, sortBy, searchQuery]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Blochează scroll-ul paginii cât timp e deschis bottom sheet-ul de filtre
  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
    trackEvent('filter_applied', { filter_type: 'tag', filter_value: tag });
  }

  function clearFilters() {
    setSearchQuery('');
    setCounty('');
    setSpecialization('');
    setMinCapacity('');
    setCertification('');
    setSelectedTags([]);
    setPage(1);
  }

  function clearFiltersOnly() {
    setCounty('');
    setSpecialization('');
    setMinCapacity('');
    setCertification('');
    setSelectedTags([]);
    setPage(1);
  }

  // Enter pe tastatura de mobil: închide tastatura și duce la rezultate
  function handleSearchSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    searchInputRef.current?.blur();
    if (searchQuery.trim()) {
      trackEvent('search_performed', { search_term: searchQuery.trim(), results: filtered.length });
    }
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const filterChips = [
    {
      key: 'county',
      label: 'Județ',
      value: county,
      clear: () => { setCounty(''); setPage(1); },
    },
    {
      key: 'specialization',
      label: 'Specializare',
      value: specializations.find((s) => s.id === specialization)?.label ?? '',
      clear: () => { setSpecialization(''); setPage(1); },
    },
    {
      key: 'capacity',
      label: 'Capacitate',
      value: capacityOptions.find((o) => o.value === minCapacity)?.label ?? '',
      clear: () => { setMinCapacity(''); setPage(1); },
    },
    {
      key: 'certification',
      label: 'Certificare',
      value: certOptions.find((o) => o.value === certification)?.label ?? '',
      clear: () => { setCertification(''); setPage(1); },
    },
    {
      key: 'tags',
      label: 'Etichete',
      value: selectedTags.length === 1
        ? getTagLabel(selectedTags[0])
        : selectedTags.length > 1
          ? `${selectedTags.length} etichete`
          : '',
      clear: () => { setSelectedTags([]); setPage(1); },
    },
  ];

  const activeFilterCount = filterChips.filter((c) => c.value).length;
  const hasFilters = Boolean(searchQuery) || activeFilterCount > 0;

  // Aceleași câmpuri se randează în sidebar-ul de desktop și în sheet-ul de mobil
  const filterFields = (
    <>
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
            <button key={tag} type="button" onClick={() => toggleTag(tag)}>
              <Badge variant={selectedTags.includes(tag) ? 'primary' : 'outline'} size="sm">
                {getTagLabel(tag)}
              </Badge>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Segment context bar — lets visitors confirm/switch between Casă and Firmă */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface border border-border rounded-xl px-4 py-3">
        <p className="text-sm text-gray-600">
          {segment === 'rezidential' ? (
            <>Afișăm instalatori pentru <strong className="text-gray-900">casă</strong> (rezidențial)</>
          ) : (
            <>Afișăm instalatori pentru <strong className="text-gray-900">firmă</strong> (comercial / industrial)</>
          )}
        </p>
        {/* Inline toggle on desktop; on mobile the floating toggle handles switching */}
        <div className="hidden sm:block">
          <SegmentToggle source="firme_bar" />
        </div>
      </div>

      {/* Search — always visible, never buried in filters */}
      <form role="search" onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref={searchInputRef}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(e); }}
            placeholder="Caută firmă sau oraș"
            aria-label="Caută firmă, oraș sau județ"
            className="w-full h-12 pl-11 pr-10 text-base border border-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary [&::-webkit-search-cancel-button]:appearance-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setPage(1); searchInputRef.current?.focus(); }}
              aria-label="Șterge căutarea"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-12 px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shrink-0"
        >
          Caută
        </button>
      </form>

      {/* Mobile filter chips — fiecare deschide sheet-ul, X-ul curăță filtrul */}
      <div className="lg:hidden mt-3 -mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 w-max pb-1">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Filtre
            {activeFilterCount > 0 && (
              <span className="ml-0.5 min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-xs font-bold grid place-items-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterChips.map((chip) =>
            chip.value ? (
              <span
                key={chip.key}
                className="flex items-center gap-1 h-9 pl-3.5 pr-1.5 rounded-full bg-primary/10 border border-primary/40 text-sm font-medium text-primary-dark shrink-0"
              >
                <button type="button" onClick={() => setSheetOpen(true)} className="max-w-40 truncate">
                  {chip.value}
                </button>
                <button
                  type="button"
                  onClick={chip.clear}
                  aria-label={`Șterge filtrul ${chip.label}`}
                  className="p-1 rounded-full hover:bg-primary/15"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ) : (
              <button
                key={chip.key}
                type="button"
                onClick={() => setSheetOpen(true)}
                className="flex items-center gap-1 h-9 px-3.5 rounded-full border border-gray-300 bg-white text-sm text-gray-600 shrink-0"
              >
                {chip.label}
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            )
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col lg:flex-row gap-6">
        {/* Filters sidebar — desktop */}
        <aside className="hidden lg:block lg:w-64 shrink-0">
          <div className="bg-white rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Filtre</h3>
              {activeFilterCount > 0 && (
                <button onClick={clearFiltersOnly} className="text-xs text-primary-dark hover:underline">
                  Resetează
                </button>
              )}
            </div>
            {filterFields}
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1" ref={resultsRef} style={{ scrollMarginTop: '5rem' }}>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-3">
            <p className="text-sm text-gray-500 shrink-0">
              <strong className="text-gray-900">{filtered.length}</strong>{' '}
              {filtered.length === 1 ? 'firmă găsită' : 'firme găsite'}
            </p>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sortează rezultatele"
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white max-w-44"
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
            <div className="text-center py-16 px-4">
              <p className="text-gray-900 font-medium mb-1">Nicio firmă pentru această căutare</p>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery
                  ? <>Verifică scrierea sau caută după oraș ori județ.</>
                  : <>Încearcă să elimini un filtru.</>}
              </p>
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium px-4 py-2 rounded-lg border border-border text-primary-dark hover:bg-surface"
                >
                  Șterge căutarea și filtrele
                </button>
              )}
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
            <div className="flex flex-wrap justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPage(p); resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
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

      {/* Mobile filter sheet */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Filtre">
          <button
            type="button"
            aria-label="Închide filtrele"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] flex flex-col bg-white rounded-t-2xl shadow-2xl animate-[sheetUp_220ms_ease-out]">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
              <h3 className="font-semibold text-gray-900">Filtre</h3>
              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button onClick={clearFiltersOnly} className="text-sm text-primary-dark">
                    Resetează
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Închide"
                  className="p-1.5 -mr-1.5 text-gray-400"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              {filterFields}
            </div>

            <div className="px-4 py-3 border-t border-border pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="w-full h-12 rounded-xl bg-primary text-white font-semibold"
              >
                {filtered.length === 0
                  ? 'Închide'
                  : `Arată ${filtered.length} ${filtered.length === 1 ? 'firmă' : 'firme'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
