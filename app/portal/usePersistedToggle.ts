'use client';

import { useEffect, useState } from 'react';

/**
 * Preferință de afișare ținută în browserul firmei (legendă deschisă, detalii
 * de card desfăcute). Pornim mereu de la `initial`, ca randarea de pe server să
 * fie identică cu prima randare din browser, și abia după hidratare aplicăm ce
 * scrie în localStorage. În mod privat scrierea aruncă, iar atunci preferința
 * ține doar cât sesiunea, ceea ce e în regulă.
 */
export function usePersistedToggle(key: string, initial: boolean) {
  const [on, setOn] = useState(initial);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) setOn(stored === '1');
    } catch {
      /* private mode */
    }
  }, [key]);

  function set(next: boolean) {
    setOn(next);
    try {
      localStorage.setItem(key, next ? '1' : '0');
    } catch {
      /* private mode */
    }
  }

  return [on, set] as const;
}
