import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_SESSION_DAYS, safeEqual, safeNext, sessionToken } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse('Admin disabled (ADMIN_PASSWORD not set)', { status: 503 });
  }

  const form = await request.formData();
  const supplied = String(form.get('password') ?? '');
  const next = safeNext(String(form.get('next') ?? ''));

  if (!safeEqual(supplied, password)) {
    const back = new URL('/admin/login', request.url);
    back.searchParams.set('next', next);
    back.searchParams.set('error', '1');
    return NextResponse.redirect(back, 303);
  }

  const res = NextResponse.redirect(new URL(next, request.url), 303);
  res.cookies.set(ADMIN_COOKIE, await sessionToken(password), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}
