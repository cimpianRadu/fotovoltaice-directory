import { NextRequest, NextResponse } from 'next/server';
import {
  PORTAL_COOKIE,
  PORTAL_SESSION_DAYS,
  createToken,
  isValidEmail,
  normalizeEmail,
  portalCookieOptions,
} from '@/lib/portal-auth';

/**
 * Intrare fără cod în portal, DOAR în `next dev`: /api/portal/auth/dev?email=...
 * Ca portalul să poată fi verificat local pe contul unei firme reale, fără să
 * pornească un email de login către ea și fără rând „intrat" în jurnal. În
 * producție ruta nu există (404), iar middleware-ul nici n-o lasă să treacă.
 *
 * Atenție: datele sunt cele reale. Un status mutat sau o notă lăsată local se
 * scriu în Sheets ca și cum le-ar fi scris firma.
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Not found', { status: 404 });
  }
  const secret = process.env.PORTAL_SECRET;
  const email = normalizeEmail(request.nextUrl.searchParams.get('email') || '');
  if (!secret || !isValidEmail(email)) {
    return new NextResponse('Lipsește ?email= valid sau PORTAL_SECRET.', { status: 400 });
  }

  const session = await createToken(
    { kind: 'session', email, exp: Date.now() + PORTAL_SESSION_DAYS * 86_400_000 },
    secret,
  );
  const next = request.nextUrl.searchParams.get('next') === 'cereri' ? '/cereri' : '/portal';
  const res = NextResponse.redirect(new URL(next, request.url));
  res.cookies.set(PORTAL_COOKIE, session, portalCookieOptions(PORTAL_SESSION_DAYS * 86_400));
  return res;
}
