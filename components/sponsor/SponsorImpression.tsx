'use client';

import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

export default function SponsorImpression({
  sponsor,
  position,
  children,
  className,
}: {
  sponsor: string;
  position: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !tracked.current) {
            tracked.current = true;
            window.umami?.track('sponsor-impression', { sponsor, position });
            obs.disconnect();
          }
        });
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [sponsor, position]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
