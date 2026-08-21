'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

// The two user-facing views. ('ambele' is a company attribute, not a view.)
export type SegmentView = 'comercial' | 'rezidential';

const COOKIE_NAME = 'segment';
// Implicit rezidențial: 40 din 54 de cereri primite sunt pentru casă (32 casă
// individuală, 7 vilă, 1 apartament), iar traficul organic vine pe ghidurile de
// Casa Verde, adică tot rezidențial. Cu comercialul implicit, formularul de pe
// /cere-oferta arăta unui om cu casă doar hală, birouri, parc logistic și retail.
const DEFAULT_SEGMENT: SegmentView = 'rezidential';
const ONE_YEAR = 60 * 60 * 24 * 365;

interface SegmentContextValue {
  segment: SegmentView;
  setSegment: (s: SegmentView) => void;
  // false during SSR + first client paint, true after the cookie has been read.
  // Use it to avoid content flashes when the persisted choice differs from default.
  hydrated: boolean;
}

const SegmentContext = createContext<SegmentContextValue | null>(null);

function readCookie(): SegmentView | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|;\s*)segment=(comercial|rezidential)\b/);
  return (m?.[1] as SegmentView) ?? null;
}

export function SegmentProvider({ children }: { children: React.ReactNode }) {
  const [segment, setSegmentState] = useState<SegmentView>(DEFAULT_SEGMENT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // A ?segment= URL param wins over the cookie (lets links target a segment directly,
    // e.g. residential article → /firme?segment=rezidential). Then it's persisted.
    const fromUrl = new URLSearchParams(window.location.search).get('segment');
    if (fromUrl === 'comercial' || fromUrl === 'rezidential') {
      setSegmentState(fromUrl);
      document.cookie = `${COOKIE_NAME}=${fromUrl}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    } else {
      const stored = readCookie();
      if (stored) setSegmentState(stored);
    }
    setHydrated(true);
  }, []);

  const setSegment = useCallback((s: SegmentView) => {
    setSegmentState(s);
    if (typeof document !== 'undefined') {
      document.cookie = `${COOKIE_NAME}=${s}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    }
  }, []);

  return (
    <SegmentContext.Provider value={{ segment, setSegment, hydrated }}>
      {children}
    </SegmentContext.Provider>
  );
}

export function useSegment(): SegmentContextValue {
  const ctx = useContext(SegmentContext);
  if (!ctx) {
    throw new Error('useSegment must be used within a SegmentProvider');
  }
  return ctx;
}
