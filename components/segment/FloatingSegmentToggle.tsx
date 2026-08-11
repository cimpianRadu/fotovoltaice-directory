'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import SegmentToggle from './SegmentToggle';

/**
 * Rutele unde comutatorul nu are ce căuta. `/portal` e unealta de lucru a
 * firmei logate: acolo nu alege ce fel de conținut citește, ci lucrează pe
 * cererile ei, iar bara plutitoare acoperă exact partea de jos a cardului
 * (banda de statusuri, la 375px).
 * Pe `/cere-oferta` și `/despre`, LeadForm își ține butonul de trimitere
 * lipit de baza ecranului pe telefon, exact unde ar pluti și comutatorul;
 * ambele pagini au comutatorul în altă parte (caseta de deasupra
 * formularului, respectiv meniul din header).
 */
const HIDE_ON = ['/portal', '/cere-oferta', '/despre'];

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
