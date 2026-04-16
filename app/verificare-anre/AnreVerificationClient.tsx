'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import companiesData from '@/data/companies.json';

interface AnreAgent {
  IdAgentEconomic: number;
  Nume: string;
}

interface Certificate {
  nrAtestat: string;
  tipTarif: string;
  dataEmitere: string;
  dataExpirare: string;
  stare: string;
}

interface AgentResult {
  societate: string;
  sediu: string;
  localitate: string;
  judet: string;
  telefon: string;
  certificates: Certificate[];
}

type SearchMode = 'name' | 'cui';

export default function AnreVerificationClient() {
  const [searchMode, setSearchMode] = useState<SearchMode>('name');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AnreAgent[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AnreAgent | null>(null);
  const [results, setResults] = useState<AgentResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchingName, setSearchingName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Close suggestions on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchByName = useCallback(async (text: string) => {
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    setSearchingName(true);
    setError(null);

    try {
      const res = await fetch(`/api/anre/search?text=${encodeURIComponent(text)}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setSuggestions([]);
      } else {
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch {
      setError('Eroare de conexiune. Verificați conexiunea la internet.');
      setSuggestions([]);
    } finally {
      setSearchingName(false);
    }
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedAgent(null);
    setResults(null);
    setError(null);

    if (searchMode === 'name') {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => searchByName(value), 400);
    }
  }

  function handleSelectAgent(agent: AnreAgent) {
    setSelectedAgent(agent);
    setQuery(agent.Nume);
    setShowSuggestions(false);
    fetchCertificates(agent.IdAgentEconomic);
  }

  async function handleCuiSearch() {
    const cui = query.replace(/\s/g, '').replace(/^RO/i, '');
    if (!cui || !/^\d{2,10}$/.test(cui)) {
      setError('Introduceți un CUI valid (ex: 26414626 sau RO26414626).');
      return;
    }

    // Look up company name in our local database
    const cuiWithPrefix = `RO${cui}`;
    const company = companiesData.companies.find(
      (c) => c.cui === cuiWithPrefix || c.cui === cui
    );

    if (!company) {
      // Try searching ANRE directly — CUI not in our database,
      // but we can try the numeric CUI as a search term (won't work for name search)
      setError(
        `CUI-ul ${cuiWithPrefix} nu a fost găsit în baza noastră de date. Încercați căutarea după nume.`
      );
      return;
    }

    // Use the company name to search ANRE
    setSearchingName(true);
    setError(null);

    try {
      // Extract just the main company name (without S.A., S.R.L., etc.)
      const searchName = company.name
        .replace(/\s*(S\.?A\.?|S\.?R\.?L\.?|S\.?C\.?S\.?|S\.?N\.?C\.?)\.?\s*$/i, '')
        .trim();

      const res = await fetch(`/api/anre/search?text=${encodeURIComponent(searchName)}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.length === 0) {
        setError(`Firma "${company.name}" nu a fost găsită în registrul ANRE.`);
        return;
      }

      if (data.length === 1) {
        // Direct match — fetch certificates immediately
        setSelectedAgent(data[0]);
        setQuery(data[0].Nume);
        fetchCertificates(data[0].IdAgentEconomic);
      } else {
        // Multiple matches — show suggestions
        setSuggestions(data);
        setShowSuggestions(true);
        setQuery(searchName);
      }
    } catch {
      setError('Eroare de conexiune. Verificați conexiunea la internet.');
    } finally {
      setSearchingName(false);
    }
  }

  async function fetchCertificates(agentId: number) {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch(`/api/anre/certificates?agentId=${agentId}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setResults(data);
      }
    } catch {
      setError('Eroare la obținerea atestatelor. Încercați din nou.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
    if (e.key === 'Enter' && searchMode === 'cui') {
      e.preventDefault();
      handleCuiSearch();
    }
  }

  function getStareColor(stare: string) {
    const s = stare.toLowerCase();
    if (s === 'atestat') return 'bg-green-50 text-green-700 border-green-200';
    if (s === 'expirat') return 'bg-red-50 text-red-700 border-red-200';
    if (s === 'retras') return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
  }

  function getStareDot(stare: string) {
    const s = stare.toLowerCase();
    if (s === 'atestat') return 'bg-green-500';
    if (s === 'expirat') return 'bg-red-500';
    if (s === 'retras') return 'bg-orange-500';
    return 'bg-gray-400';
  }

  function isRelevantForPV(tipTarif: string) {
    const t = tipTarif.toLowerCase();
    return t.includes('c2a') || t.includes('tarif b') || (t.startsWith('b') && !t.startsWith('bp'));
  }

  return (
    <div>
      {/* Info note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Date din registrul oficial ANRE</p>
            <p>
              Datele sunt preluate în timp real din{' '}
              <a
                href="https://portal.anre.ro/PublicLists/Atestate"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-900"
              >
                portalul public ANRE
              </a>
              . Rezultatele reflectă starea curentă a registrului de atestate al Autorității
              Naționale de Reglementare în domeniul Energiei.
            </p>
          </div>
        </div>
      </div>

      {/* Search mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setSearchMode('name');
            setQuery('');
            setResults(null);
            setError(null);
            setSuggestions([]);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            searchMode === 'name'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Caută după Nume
        </button>
        <button
          onClick={() => {
            setSearchMode('cui');
            setQuery('');
            setResults(null);
            setError(null);
            setSuggestions([]);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            searchMode === 'cui'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Caută după CUI
        </button>
      </div>

      {/* Search input */}
      <div className="relative" ref={suggestionsRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder={
                searchMode === 'name'
                  ? 'Ex: Simtel Team, Energomontaj...'
                  : 'Ex: 26414626 sau RO26414626'
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
            />
            {searchingName && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </div>
          {searchMode === 'cui' && (
            <button
              onClick={handleCuiSearch}
              disabled={searchingName}
              className="bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              Caută
            </button>
          )}
        </div>

        {/* Autocomplete suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((agent) => (
              <button
                key={agent.IdAgentEconomic}
                onClick={() => handleSelectAgent(agent)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-surface transition-colors border-b border-gray-100 last:border-0"
              >
                {agent.Nume}
              </button>
            ))}
          </div>
        )}
      </div>

      {searchMode === 'cui' && (
        <p className="mt-2 text-xs text-gray-500">
          Căutarea după CUI funcționează pentru firmele din directorul nostru. Numele firmei este
          folosit apoi pentru interogarea registrului ANRE.
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-8 flex items-center justify-center gap-3 text-gray-500">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Se încarcă atestatele...
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="mt-6 space-y-6">
          {results.map((agent, idx) => (
            <div key={idx} className="bg-white border border-border rounded-xl overflow-hidden">
              {/* Agent header */}
              <div className="bg-surface px-5 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-secondary-dark">{agent.societate}</h2>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  {agent.localitate && (
                    <span>{agent.localitate}{agent.judet && agent.judet !== agent.localitate ? `, ${agent.judet}` : ''}</span>
                  )}
                  {agent.sediu && <span className="hidden sm:inline">{agent.sediu}</span>}
                  {agent.telefon && <span>{agent.telefon}</span>}
                </div>
              </div>

              {/* Certificates */}
              {agent.certificates.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {agent.certificates.map((cert, certIdx) => (
                    <div
                      key={certIdx}
                      className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
                        isRelevantForPV(cert.tipTarif) ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-secondary-dark">
                            {cert.tipTarif}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStareColor(cert.stare)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStareDot(cert.stare)}`} />
                            {cert.stare}
                          </span>
                          {isRelevantForPV(cert.tipTarif) && cert.stare.toLowerCase() === 'atestat' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-dark">
                              Relevant fotovoltaice
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Nr. atestat: {cert.nrAtestat}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600 sm:text-right shrink-0">
                        <div>Emis: {cert.dataEmitere}</div>
                        <div>Expiră: {cert.dataExpirare}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8 text-center text-gray-500 text-sm">
                  Nu au fost găsite atestate pentru acest agent.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {results && results.length === 0 && (
        <div className="mt-8 text-center py-8">
          <p className="text-gray-500">Nu au fost găsite rezultate pentru această căutare.</p>
        </div>
      )}
    </div>
  );
}
