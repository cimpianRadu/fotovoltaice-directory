// Citirea sesiunii de portal din cookies, pentru pagini și API routes.
// Separat de portal-auth pentru că `next/headers` nu poate fi importat în
// middleware — acolo cookie-ul se citește direct de pe request.

import { cookies } from 'next/headers';
import { after } from 'next/server';
import { PORTAL_COOKIE, normalizeEmail, verifyToken } from './portal-auth';
import { logPortalVisit } from './sheets';

/** Data și ora României pentru jurnalul de note — același format ca în /admin/crm. */
export function bucharestStamp(): { today: string; time: string } {
  // sv-SE = „YYYY-MM-DD HH:MM", singurul locale cu formatul ISO direct.
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Bucharest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
  const [today, time] = parts.split(' ');
  return { today, time };
}

/**
 * Emailul firmei logate, sau null dacă sesiunea lipsește/e invalidă.
 *
 * Tot ce face o firmă în portal trece pe aici (pagina + rutele de note, status
 * și renunțare), deci ăsta e singurul loc din care se poate ști că firma chiar
 * folosește portalul. Loginul nu spune asta: sesiunea ține 30 de zile, iar cine
 * a intrat o dată nu se mai autentifică o lună. Scris după răspuns și cu
 * eroarea înghițită — jurnalul n-are voie să strice portalul.
 */
export async function getPortalEmail(): Promise<string | null> {
  const secret = process.env.PORTAL_SECRET;
  if (!secret) return null;
  const token = (await cookies()).get(PORTAL_COOKIE)?.value;
  const payload = await verifyToken(token, 'session', secret);
  if (!payload) return null;

  const email = normalizeEmail(payload.email);
  after(() =>
    logPortalVisit(email).catch((err) => console.error('[portal] jurnal vizită:', err)),
  );
  return email;
}
