'use client';

import { useRef, useState } from 'react';

/**
 * Mesajul complet la hover, cu textul selectabil. Cardul e `fixed`, nu
 * `absolute`: părinții au `overflow` și ar tăia orice popup poziționat în flux.
 *
 * Închiderea e amânată câteva zecimi de secundă ca să apuci să treci cu mouse-ul
 * de pe text pe card fără să dispară; odată ajuns pe card, rămâne deschis.
 */
const WIDTH = 380;
const GAP = 6;

type Box = { left: number; top?: number; bottom?: number; maxHeight: number };

export default function MessagePreview({ text }: { text: string }) {
  const [box, setBox] = useState<Box | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  function open(e: React.MouseEvent<HTMLElement>) {
    cancelClose();
    const r = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - GAP * 2;
    const spaceAbove = r.top - GAP * 2;
    const below = spaceBelow >= spaceAbove;
    setBox({
      left: Math.max(8, Math.min(r.left, window.innerWidth - WIDTH - 8)),
      // Ancorat pe `bottom` când se deschide în sus: altfel ar trebui știută
      // înălțimea cardului înainte să existe.
      top: below ? r.bottom + GAP : undefined,
      bottom: below ? undefined : window.innerHeight - r.top + GAP,
      maxHeight: Math.max(120, below ? spaceBelow : spaceAbove),
    });
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = setTimeout(() => setBox(null), 200);
  }

  return (
    <>
      <p
        onMouseEnter={open}
        onMouseLeave={scheduleClose}
        className="mt-1 line-clamp-2 cursor-help text-xs text-slate-500 underline decoration-slate-200 decoration-dotted underline-offset-2"
      >
        {text}
      </p>
      {box && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            top: box.top,
            bottom: box.bottom,
            left: box.left,
            width: WIDTH,
            maxHeight: box.maxHeight,
          }}
          className="fixed z-50 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed whitespace-pre-wrap text-slate-700 shadow-lg select-text"
        >
          {text}
        </div>
      )}
    </>
  );
}
