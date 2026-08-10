'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import SegmentToggle from './SegmentToggle';

/**
 * Rutele unde comutatorul nu are ce căuta. `/portal` e unealta de lucru a
 * firmei logate: acolo nu alege ce fel de conținut citește, ci lucrează pe
 * cererile ei, iar bara plutitoare acoperă exact partea de jos a cardului
 * (banda de statusuri, la 375px).
 */
const HIDE_ON = ['/portal'];

/**
 * Mobile-only floating Casă/Firmă switcher, pinned bottom-center.
 * Fades out while the user is actively scrolling, fades back in shortly after
 * scrolling stops — so it stays reachable without covering content.
 */
export default function FloatingSegmentToggle() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      setVisible(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => setVisible(true), 600);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(idleTimer);
    };
  }, []);

  if (HIDE_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <div
      className={`md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
    >
      <SegmentToggle elevated source="floating" />
    </div>
  );
}
