// Contul clientului (cel care lasă o cerere), din 23 oct 2026. Fără parolă, ca
// portalul firmelor: contul e emailul din cerere, iar intrarea e un link din
// emailurile noastre sau un cod de 6 cifre cerut din /cont.
//
// Trei feluri de acces, toate tokenuri HMAC cu PORTAL_SECRET (lib/portal-auth),
// cu `kind` propriu, ca o sesiune de firmă să nu treacă drept sesiune de client:
//   client-session  cookie-ul contului, după link sau cod: vede toate cererile emailului.
//   client-link     linkul din emailuri; deschis, pune sesiunea. Nu expiră practic
//                   (decizia lui Radu, 22 oct): omul care așteaptă Casa Verde caută
//                   emailul după șapte luni.
//   client-lead     pus de formular la trimitere, în browserul care a trimis: vede
//                   doar cererile trimise de acolo. Emailul nu e încă dovedit, deci
//                   nu deschide celelalte cereri ale adresei.

import 'server-only';
import { cookies } from 'next/headers';
import {
  createToken,
  hashLoginCode,
  normalizeEmail,
  portalCookieOptions,
  safeEqual,
  verifyToken,
} from './portal-auth';
import { db } from './db';

export const CLIENT_SESSION_COOKIE = 'cont_session';
export const CLIENT_LEAD_COOKIE = 'cont_cereri';
const SESSION_DAYS = 180;
const LINK_DAYS = 3 * 365;
const LEAD_GRANT_DAYS = 180;
/** Câte cereri ține cookie-ul de după formular. Un om trimite una, rar două. */
const LEAD_GRANT_MAX = 10;

export const LOGIN_CODE_TTL_MINUTES = 15;
const LOGIN_CODE_MAX_ATTEMPTS = 5;
const LOGIN_CODES_PER_HOUR = 3;

function secret(): string {
  const value = process.env.PORTAL_SECRET;
  if (!value) throw new Error('PORTAL_SECRET lipsește: contul clientului nu poate semna sesiunea.');
  return value;
}

export interface ClientViewer {
  /** Emailul dovedit (link sau cod), sau null dacă browserul vine doar de la formular. */
  email: string | null;
  /** Cererile trimise din browserul ăsta, fără email dovedit. */
  leads: string[];
}

export async function getClientViewer(): Promise<ClientViewer> {
  const jar = await cookies();
  const s = secret();
  const session = await verifyToken(jar.get(CLIENT_SESSION_COOKIE)?.value, 'client-session', s);
  const grant = await verifyToken(jar.get(CLIENT_LEAD_COOKIE)?.value, 'client-lead', s);
  return {
    email: session ? normalizeEmail(session.email) : null,
    leads: Array.isArray(grant?.leads) ? grant.leads : [],
  };
}

/** Poate vedea cererea: e a emailului dovedit sau a fost trimisă din browserul ăsta. */
export function canViewLead(viewer: ClientViewer, lead: { timestamp: string; email: string }): boolean {
  if (viewer.leads.includes(lead.timestamp)) return true;
  return !!viewer.email && normalizeEmail(lead.email) === viewer.email;
}

export async function sessionCookie(email: string) {
  const token = await createToken(
    { kind: 'client-session', email: normalizeEmail(email), exp: Date.now() + SESSION_DAYS * 86_400_000 },
    secret(),
  );
  return { name: CLIENT_SESSION_COOKIE, value: token, options: portalCookieOptions(SESSION_DAYS * 86_400) };
}

/** Cookie-ul de după formular: cererile existente din browser plus cea nouă. */
export async function leadGrantCookie(email: string, leadId: string, existing: string | undefined) {
  const s = secret();
  const prev = await verifyToken(existing, 'client-lead', s);
  const leads = [leadId, ...(prev?.leads ?? []).filter((id) => id !== leadId)].slice(0, LEAD_GRANT_MAX);
  const token = await createToken(
    { kind: 'client-lead', email: normalizeEmail(email), exp: Date.now() + LEAD_GRANT_DAYS * 86_400_000, leads },
    s,
  );
  return { name: CLIENT_LEAD_COOKIE, value: token, options: portalCookieOptions(LEAD_GRANT_DAYS * 86_400) };
}

const BASE_URL = 'https://instalatori-fotovoltaice.ro';

/** Linkul din emailuri: intră în cont și deschide cererea. */
export async function accountLink(email: string, leadId?: string, base = BASE_URL): Promise<string> {
  const token = await createToken(
    { kind: 'client-link', email: normalizeEmail(email), exp: Date.now() + LINK_DAYS * 86_400_000 },
    secret(),
  );
  const qs = new URLSearchParams({ t: token });
  if (leadId) qs.set('cerere', leadId);
  return `${base}/cont/intrare?${qs}`;
}

export async function verifyAccountLink(token: string | null): Promise<string | null> {
  const payload = await verifyToken(token ?? undefined, 'client-link', secret());
  return payload ? normalizeEmail(payload.email) : null;
}

/** Contul se creează singur la prima cerere; la intrare cu link sau cod devine dovedit. */
export async function ensureAccount(email: string, verified = false): Promise<void> {
  const e = normalizeEmail(email);
  await db()`
    INSERT INTO client_accounts (email, verified_at, last_seen_at)
    VALUES (${e}, ${verified ? new Date().toISOString() : null}, ${verified ? new Date().toISOString() : null})
    ON CONFLICT (email) DO UPDATE SET
      verified_at = COALESCE(client_accounts.verified_at, EXCLUDED.verified_at),
      last_seen_at = COALESCE(EXCLUDED.last_seen_at, client_accounts.last_seen_at),
      deleted_at = NULL
  `;
}

export async function touchAccount(email: string): Promise<void> {
  await db()`UPDATE client_accounts SET last_seen_at = now() WHERE email = ${normalizeEmail(email)}`;
}

/**
 * Un cod nou de intrare, sau null dacă adresa a cerut deja prea multe în ultima
 * oră. Codul nu se păstrează în clar, doar HMAC-ul lui.
 */
export async function issueLoginCode(email: string, code: string): Promise<boolean> {
  const e = normalizeEmail(email);
  const [{ n }] = await db()`
    SELECT count(*)::int AS n FROM client_login_codes WHERE email = ${e} AND created_at > now() - interval '1 hour'
  `;
  if (Number(n) >= LOGIN_CODES_PER_HOUR) return false;
  const hash = await hashLoginCode(e, code, secret());
  await db()`
    INSERT INTO client_login_codes (email, code_hash, expires_at)
    VALUES (${e}, ${hash}, now() + make_interval(mins => ${LOGIN_CODE_TTL_MINUTES}))
  `;
  return true;
}

/** Verifică codul pe cel mai nou cod valid al adresei. Maximum 5 încercări pe cod. */
export async function consumeLoginCode(email: string, code: string): Promise<'ok' | 'gresit' | 'expirat'> {
  const e = normalizeEmail(email);
  const [row] = await db()`
    SELECT id, code_hash, attempts FROM client_login_codes
    WHERE email = ${e} AND used_at IS NULL AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1
  `;
  if (!row || Number(row.attempts) >= LOGIN_CODE_MAX_ATTEMPTS) return 'expirat';
  const hash = await hashLoginCode(e, code, secret());
  if (!safeEqual(hash, String(row.code_hash))) {
    await db()`UPDATE client_login_codes SET attempts = attempts + 1 WHERE id = ${row.id}`;
    return 'gresit';
  }
  await db()`UPDATE client_login_codes SET used_at = now() WHERE id = ${row.id}`;
  return 'ok';
}
