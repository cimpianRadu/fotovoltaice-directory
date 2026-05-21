'use client';

import { useSegment, type SegmentView } from './SegmentProvider';

function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
      <path d="M4 12.5 L12 5 L20 12.5 V20 H4 Z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
      <path d="M3 9 H21 V20 H3 Z" />
      <path d="M5 9 L19 9 L21.5 4.5 L7.5 4.5 Z" />
    </svg>
  );
}

const OPTIONS: {
  view: SegmentView;
  label: string;
  Icon: () => React.JSX.Element;
  activeClass: string;
}[] = [
  { view: 'rezidential', label: 'Casă', Icon: HouseIcon, activeClass: 'bg-primary text-white' },
  { view: 'comercial', label: 'Firmă', Icon: BuildingIcon, activeClass: 'bg-secondary text-white' },
];

export default function SegmentToggle({
  className = '',
  elevated = false,
}: {
  className?: string;
  elevated?: boolean;
}) {
  const { segment, setSegment } = useSegment();

  return (
    <div
      role="group"
      aria-label="Alege: pentru casă sau pentru firmă"
      className={`inline-flex items-center rounded-full p-0.5 border border-border ${
        elevated ? 'bg-white shadow-lg' : 'bg-surface'
      } ${className}`}
    >
      {OPTIONS.map(({ view, label, Icon, activeClass }) => {
        const active = segment === view;
        return (
          <button
            key={view}
            type="button"
            onClick={() => setSegment(view)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
              active ? activeClass : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon />
            {label}
          </button>
        );
      })}
    </div>
  );
}
