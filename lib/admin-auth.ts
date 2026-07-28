// Autentificare admin pe bază de cookie, nu Basic Auth: dialogul nativ al
// browserului nu se mai afișează după o parolă greșită, iar Chrome retrimite
// tăcut credențialele memorate, ceea ce arată ca o pagină blocată în loading.
//
// Rulează și în middleware (Edge), deci NUMAI API-uri web standard aici.

export const ADMIN_COOKIE = 'admin_session';
export const ADMIN_SESSION_DAYS = 30;

/** Cookie-ul ține un hash al parolei, nu parola. Schimbarea `ADMIN_PASSWORD` invalidează sesiunile. */
export async function sessionToken(password: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`admin:${password}`));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Comparație fără scurtcircuit pe prima diferență. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Acceptă doar destinații interne de admin, ca `next` să nu devină open redirect. */
export function safeNext(next: string | undefined): string {
  return next && next.startsWith('/admin') && !next.startsWith('//') ? next : '/admin';
}
