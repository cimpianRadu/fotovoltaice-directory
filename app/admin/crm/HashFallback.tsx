'use client';

import { useEffect } from 'react';

/**
 * Pagina arată doar cele mai noi cereri (24 nov 2026). Un link spre o cerere
 * mai veche (/admin/crm#<id>, din portal, din /admin/firme sau din emailuri)
 * n-ar găsi cardul: dacă ancora lipsește din pagină, se reîncarcă cu toate.
 */
export default function HashFallback({ showingAll }: { showingAll: boolean }) {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const el = document.getElementById(id);
    // Pe o pagină lungă, browserul sare la ancoră înainte să existe cardul.
    if (el) {
      el.scrollIntoView({ block: 'start' });
      return;
    }
    if (showingAll) return;
    const url = new URL(window.location.href);
    url.searchParams.set('n', 'toate');
    window.location.replace(url.toString());
  }, [showingAll]);
  return null;
}
