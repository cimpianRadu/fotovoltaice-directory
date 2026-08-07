// Autentificarea portalului de instalatori: magic link + cod de 6 cifre pe
// email, fără parole. Un instalator își cere acces cu emailul firmei, primește
// un email cu link și cod, iar sesiunea e un token HMAC ținut în cookie —
// modelul din admin-auth, dar per-email în loc de parolă unică.
//
// Rulează și în middleware (Edge), deci NUMAI API-uri web standard aici.

export const PORTAL_COOKIE = 'portal_session';
export const PORTAL_PENDING_COOKIE = 'portal_pending';
export const PORTAL_SESSION_DAYS = 30;
/** Linkul și codul din email expiră împreună — destul cât să deschizi inboxul. */
export const PORTAL_LOGIN_TTL_MINUTES = 15;

const encoder = new TextEncoder();

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function base64UrlEncode(s: string): string {
  const bytes = encoder.encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(s: string): string | null {
  try {
    const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** Comparație fără scurtcircuit pe prima diferență (ca în admin-auth). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Payloadul tokenurilor. `kind` separă întrebuințările: un link de login nu
 * poate fi rejucat drept cookie de sesiune și invers — semnătura acoperă tot
 * JSON-ul, deci schimbarea kind-ului o invalidează.
 */
export interface PortalTokenPayload {
  kind: 'session' | 'login-link' | 'pending';
  email: string;
  /** Unix ms. */
  exp: number;
  /** Doar pe `pending`: HMAC-ul codului de 6 cifre, nu codul în clar. */
  codeHash?: string;
}

export async function createToken(
  payload: PortalTokenPayload,
  secret: string,
): Promise<string> {
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = await hmacHex(secret, body);
  return `${body}.${sig}`;
}

export async function verifyToken(
  token: string | undefined,
  kind: PortalTokenPayload['kind'],
  secret: string,
): Promise<PortalTokenPayload | null> {
  if (!token) return null;
  const dot = token.indexOf('.');
  if (dot === -1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, await hmacHex(secret, body))) return null;

  const json = base64UrlDecode(body);
  if (!json) return null;
  try {
    const payload = JSON.parse(json) as PortalTokenPayload;
    if (payload.kind !== kind) return null;
    if (typeof payload.email !== 'string' || !payload.email) return null;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Emailul e identitatea firmei în portal — comparațiile se fac pe forma asta. */
export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(s: string): boolean {
  return EMAIL_RE.test(s.trim());
}

/** Cod de 6 cifre din CSPRNG. `100000 + x % 900000` ar fi părtinitor doar teoretic — respins oricum, folosim respingere pe interval. */
export function generateLoginCode(): string {
  const range = 900_000;
  // Respingem valorile care ar strâmba distribuția modulo (rejection sampling).
  const limit = Math.floor(0xffffffff / range) * range;
  const buf = new Uint32Array(1);
  let v: number;
  do {
    crypto.getRandomValues(buf);
    v = buf[0];
  } while (v >= limit);
  return String(100_000 + (v % range));
}

/** Opțiunile comune ale cookie-urilor de portal — httpOnly, un singur loc de greșit. */
export function portalCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/** Codul nu se ține nicăieri în clar: cookie-ul pending ține HMAC(email:cod). */
export function hashLoginCode(
  email: string,
  code: string,
  secret: string,
): Promise<string> {
  return hmacHex(secret, `code:${normalizeEmail(email)}:${code}`);
}
