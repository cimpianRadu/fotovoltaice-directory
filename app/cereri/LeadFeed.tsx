'use client';

import { useState } from 'react';
import LeadCard, { type LeadCardData } from './LeadCard';

interface LeadFeedProps {
  cards: LeadCardData[];
  claimCounts: Record<string, number>;
  maxClaims: number;
}

type AgeFilter = 'toate' | '7' | '7-30' | '30+';
type SegmentFilter = 'toate' | 'rezidential' | 'comercial';
type SortDir = 'recente' | 'vechi';

const AGE_FILTERS: { id: AgeFilter; label: string }[] = [
  { id: 'toate', label: 'Toate' },
  { id: '7', label: 'Ultimele 7 zile' },
  { id: '7-30', label: '7–30 zile' },
  { id: '30+', label: 'Peste 30 de zile' },
];

const SEGMENT_FILTERS: { id: SegmentFilter; label: string }[] = [
  { id: 'toate', label: 'Toate' },
  { id: 'rezidential', label: 'Rezidențial' },
  { id: 'comercial', label: 'Comercial' },
];

function matchesAge(ageDays: number, filter: AgeFilter): boolean {
  switch (filter) {
    case '7':
      return ageDays <= 7;
    case '7-30':
      return ageDays > 7 && ageDays <= 30;
    case '30+':
      return ageDays > 30;
    default:
      return true;
  }
}

function matchesSegment(segment: string, filter: SegmentFilter): boolean {
  if (filter === 'toate') return true;
  // Tot ce nu e explicit rezidențial tratăm ca și comercial (defaultul formularului).
  const seg = segment === 'rezidential' ? 'rezidential' : 'comercial';
  return seg === filter;
}

const pillClass = (active: boolean) =>
  `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
    active
      ? 'bg-secondary text-white border-secondary'
      : 'bg-white text-gray-600 border-border hover:border-secondary/40 hover:text-secondary-dark'
  }`;

export default function LeadFeed({ cards, claimCounts, maxClaims }: LeadFeedProps) {
  const [age, setAge] = useState<AgeFilter>('toate');
  const [segment, setSegment] = useState<SegmentFilter>('toate');
  const [sort, setSort] = useState<SortDir>('recente');

  // Counterele pe fiecare dimensiune țin cont de filtrul celeilalte (faceted).
  const ageCount = (f: AgeFilter) =>
    cards.filter((c) => matchesAge(c.ageDays, f) && matchesSegment(c.segment, segment)).length;
  const segmentCount = (f: SegmentFilter) =>
    cards.filter((c) => matchesAge(c.ageDays, age) && matchesSegment(c.segment, f)).length;

  const visible = cards
    .filter((c) => matchesAge(c.ageDays, age) && matchesSegment(c.segment, segment))
    .sort((a, b) => (sort === 'recente' ? a.ageDays - b.ageDays : b.ageDays - a.ageDays));

  return (
    <>
      <div className="mb-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 font-medium w-16">Segment</span>
            {SEGMENT_FILTERS.map((f) => (
              <button key={f.id} onClick={() => setSegment(f.id)} className={pillClass(segment === f.id)}>
                {f.label}{' '}
                <span className={segment === f.id ? 'opacity-80' : 'text-gray-400'}>
                  ({segmentCount(f.id)})
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-surface border border-border rounded-full p-1">
            {(
              [
                { id: 'recente', label: 'Cele mai recente' },
                { id: 'vechi', label: 'Cele mai vechi' },
              ] as { id: SortDir; label: string }[]
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  sort === s.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400 font-medium w-16">Vechime</span>
          {AGE_FILTERS.map((f) => (
            <button key={f.id} onClick={() => setAge(f.id)} className={pillClass(age === f.id)}>
              {f.label}{' '}
              <span className={age === f.id ? 'opacity-80' : 'text-gray-400'}>({ageCount(f.id)})</span>
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center text-sm text-gray-500">
          Nicio cerere pentru filtrele selectate.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((card) => (
            <LeadCard
              key={card.id}
              lead={card}
              initialClaims={claimCounts[card.id] || 0}
              maxClaims={maxClaims}
            />
          ))}
        </div>
      )}
    </>
  );
}
