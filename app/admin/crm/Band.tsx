'use client';

// Extrase din LeadCrm când a apărut CRM-ul de firme: aceleași controale, alt
// pipeline. Orice schimbare de aspect aici se vede în ambele CRM-uri.

export function Caption({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 text-[10px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase">
      {children}
    </span>
  );
}

/**
 * Bandă de selecție cu un cursor care alunecă între poziții, ca acul unui radio.
 * Segmentele sunt egale ca lățime (grid), ca poziția cursorului să fie o simplă
 * regulă de trei și tranziția să nu depindă de lungimea etichetelor.
 */
export default function Band<T extends string>({
  options,
  value,
  tone,
  disabled,
  onPick,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T;
  tone: Record<string, string>;
  disabled?: boolean;
  onPick: (v: T) => void;
}) {
  const idx = options.findIndex((o) => o.value === value);
  const pct = 100 / options.length;

  return (
    <div
      className="relative grid rounded-full border border-slate-200 bg-slate-100 p-0.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {/* Gradațiile dintre segmente, ca reperele de pe scala unui radio. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-2 left-0 w-full">
        {options.slice(1).map((o, i) => (
          <span
            key={o.value}
            className="absolute inset-y-0 w-px bg-slate-300/70"
            style={{ left: `${(i + 1) * pct}%` }}
          />
        ))}
      </div>

      {idx >= 0 && (
        <span
          aria-hidden
          className={`absolute top-0.5 bottom-0.5 rounded-full shadow-sm transition-[left,background-color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${tone[value] ?? 'bg-slate-400'}`}
          style={{ left: `calc(${idx * pct}% + 2px)`, width: `calc(${pct}% - 4px)` }}
        />
      )}

      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.hint}
          disabled={disabled}
          onClick={() => onPick(o.value)}
          className={`relative z-10 truncate rounded-full px-1 py-1 text-[11px] font-medium transition-colors duration-200 disabled:cursor-wait ${
            o.value === value ? 'text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
