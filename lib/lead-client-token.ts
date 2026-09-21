// Linkurile din emailurile către client (fluxul „mă informez", 14 sept 2026):
// „sunt gata pentru oferte", „încă mă informez", „nu mai vreau", plus, din
// 21 sept 2026, verificarea „mai e activă?": „încă vreau oferte" și „am ales
// deja o firmă". Fiecare link poartă un token semnat cu PORTAL_SECRET, ca la
// pozele cererii, peste (cerere, acțiune, expirare). Fără el, oricine ar
// ghici un timestamp de cerere ar putea închide sau reactiva cererea altcuiva.
//
// Expirarea e lungă intenționat: omul care așteaptă Casa Verde Baterii apasă
// linkul peste două luni, nu peste o zi. Tokenul nu deschide date de contact,
// doar formularul de actualizare al propriei cereri.

import { createHmac, timingSafeEqual } from 'node:crypto';

export const CLIENT_LINK_ACTIONS = ['actualizare', 'astept', 'renunt', 'activa', 'aleasa'] as const;
export type ClientLinkAction = (typeof CLIENT_LINK_ACTIONS)[number];

const TOKEN_TTL_MS = 180 * 24 * 60 * 60 * 1000;

function secret(): string {
  const value = process.env.PORTAL_SECRET;
  if (!value) throw new Error('PORTAL_SECRET lipsește: nu pot semna linkurile către client.');
  return value;
}

function sign(leadId: string, action: ClientLinkAction, exp: number): string {
  return createHmac('sha256', secret())
    .update(`lead-client:${leadId}:${action}:${exp}`)
    .digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function createClientToken(leadId: string, action: ClientLinkAction): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  return `${exp}.${sign(leadId, action, exp)}`;
}

export function verifyClientToken(token: string, leadId: string, action: ClientLinkAction): boolean {
  const dot = token.indexOf('.');
  if (dot === -1) return false;
  const exp = Number(token.slice(0, dot));
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  try {
    return safeEqual(token.slice(dot + 1), sign(leadId, action, exp));
  } catch {
    return false;
  }
}

export function isClientLinkAction(s: string): s is ClientLinkAction {
  return (CLIENT_LINK_ACTIONS as readonly string[]).includes(s);
}

const BASE_URL = 'https://instalatori-fotovoltaice.ro';

/** Adresa completă a unui link din email. Cererea și tokenul merg în query, ca la /cereri?cerere=. */
export function clientLinkUrl(leadId: string, action: ClientLinkAction): string {
  const token = createClientToken(leadId, action);
  const params = new URLSearchParams({ id: leadId, t: token });
  const path = action === 'actualizare' ? '/cerere/actualizare' : `/cerere/raspuns/${action}`;
  return `${BASE_URL}${path}?${params.toString()}`;
}
