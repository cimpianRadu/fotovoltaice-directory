import { NextRequest, NextResponse } from 'next/server';
import {
  PORTAL_COOKIE,
  PORTAL_PENDING_COOKIE,
  PORTAL_SESSION_DAYS,
  createToken,
  portalCookieOptions,
  verifyToken,
} from '@/lib/portal-auth';

/**
 * Pasul 2 (varianta cu link): butonul din email. Spre deosebire de cod, linkul
 * merge de pe orice dispozitiv — tokenul semnat din URL e toată dovada.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.PORTAL_SECRET;
  const loginUrl = new URL('/portal/login', request.url);

  if (!secret) {
    return new NextResponse('Portal disabled (PORTAL_SECRET not set)', { status: 503 });
  }

  const token = request.nextUrl.searchParams.get('token') || undefined;
  const payload = await verifyToken(token, 'login-link', secret);
  if (!payload) {
    loginUrl.searchParams.set('eroare', 'link-expirat');
    return NextResponse.redirect(loginUrl);
  }

  const session = await createToken(
    {
      kind: 'session',
      email: payload.email,
      exp: Date.now() + PORTAL_SESSION_DAYS * 86_400_000,
    },
    secret,
  );

  const res = NextResponse.redirect(new URL('/portal', request.url));
  res.cookies.set(PORTAL_COOKIE, session, portalCookieOptions(PORTAL_SESSION_DAYS * 86_400));
  res.cookies.delete(PORTAL_PENDING_COOKIE);
  return res;
}
