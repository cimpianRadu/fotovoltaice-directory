'use client';

import { useSyncExternalStore } from 'react';
import { CLIENT_HINT_COOKIE, PORTAL_HINT_COOKIE } from './portal-auth';

// Semnul de sesiune din cookie (vezi PORTAL_HINT_COOKIE), pentru componentele
// din afara portalului. Pe server și la prima randare e mereu „nelogat", ca
// HTML-ul cache-uit (ISR) să fie același pentru toți vizitatorii.
const noopSubscribe = () => () => {};

const readHint = (name: string) => document.cookie.split('; ').some((c) => c === `${name}=1`);
const readPortalHint = () => readHint(PORTAL_HINT_COOKIE);
const readClientHint = () => readHint(CLIENT_HINT_COOKIE);

/** Firma pare logată în portal. Doar pentru afișare, nu pentru acces. */
export function usePortalLoggedIn(): boolean {
  return useSyncExternalStore(noopSubscribe, readPortalHint, () => false);
}

/** Browserul ține o cerere de client (formular sau intrare în cont). Tot doar pentru afișare. */
export function useClientLoggedIn(): boolean {
  return useSyncExternalStore(noopSubscribe, readClientHint, () => false);
}
