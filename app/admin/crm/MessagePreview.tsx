'use client';

import { useState } from 'react';

/**
 * Mesajul complet la hover. Cardul e `fixed`, nu `absolute`: tabelul stă într-un
 * container cu `overflow-x-auto`, care ar tăia orice popup poziționat în flux.
 */
export default function MessagePreview({ text }: { text: string }) {
  const [box, setBox] = useState<{ top: number; left: number } | null>(null);

  function show(e: React.MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const width = 360;
    setBox({
      top: Math.min(r.bottom + 6, window.innerHeight - 40),
      left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)),
    });
  }

  return (
    <>
      <p
        onMouseEnter={show}
        onMouseLeave={() => setBox(null)}
        className="mt-1 line-clamp-2 max-w-xs cursor-help text-xs text-slate-500 underline decoration-slate-200 decoration-dotted underline-offset-2"
      >
        {text}
      </p>
      {box && (
        <div
          style={{ top: box.top, left: box.left, width: 360 }}
          className="pointer-events-none fixed z-50 max-h-80 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed whitespace-pre-wrap text-slate-700 shadow-lg"
        >
          {text}
        </div>
      )}
    </>
  );
}
