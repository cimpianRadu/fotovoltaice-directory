'use client';

import { useEffect } from 'react';
import { captureFirstTouch } from '@/lib/attribution';

/**
 * Reține canalul de intrare la prima încărcare din sesiune. Nu randează nimic.
 *
 * Stă în layout, nu în formular: până ajunge omul la `/cere-oferta`, parametrii
 * de campanie au dispărut deja din URL. Vezi `lib/attribution.ts`.
 */
export default function AttributionCapture() {
  useEffect(() => {
    captureFirstTouch();
  }, []);
  return null;
}
