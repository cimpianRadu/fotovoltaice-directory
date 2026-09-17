'use client';

import { useSyncExternalStore } from 'react';
import { PORTAL_HINT_COOKIE } from './portal-auth';

// Semnul de sesiune din cookie (vezi PORTAL_HINT_COOKIE), pentru componentele
// din afara portalului. Pe server și la prima randare e mereu „nelogat", ca
// HTML-ul cache-uit (ISR) să fie același pentru toți vizitatorii.
const noopSubscribe = () => () => {};

function readPortalHint(): boolean {
  return document.cookie.split('; ').some((c) => c === `${PORTAL_HINT_COOKIE}=1`);
}

/** Firma pare logată în portal. Doar pentru afișare, nu pentru acces. */
export function usePortalLoggedIn(): boolean {
  return useSyncExternalStore(noopSubscribe, readPortalHint, () => false);
}
