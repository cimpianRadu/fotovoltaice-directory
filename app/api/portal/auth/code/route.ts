import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  PORTAL_COOKIE,
  PORTAL_PENDING_COOKIE,
  PORTAL_SESSION_DAYS,
  createToken,
  hashLoginCode,
  portalCookieOptions,
  safeEqual,
  verifyToken,
} from '@/lib/portal-auth';

/**
 * Pasul 2 (varianta cu cod): codul de 6 cifre din email + cookie-ul pending de
 * pe același browser => sesiune. Cine are doar codul, fără browserul care a
 * cerut loginul, nu poate face nimic cu el.
 */
export async function POST(request: Request) {
  try {
    const secret = process.env.PORTAL_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Portalul nu este configurat.' }, { status: 503 });
    }

    const body = await request.json();
    const code = String(body?.code || '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Codul are 6 cifre.' }, { status: 400 });
    }

    const pendingToken = (await cookies()).get(PORTAL_PENDING_COOKIE)?.value;
    const pending = await verifyToken(pendingToken, 'pending', secret);
    if (!pending?.codeHash) {
      return NextResponse.json(
        { error: 'Cererea de login a expirat. Cere un cod nou.' },
        { status: 400 },
      );
    }

    const expected = await hashLoginCode(pending.email, code, secret);
    if (!safeEqual(expected, pending.codeHash)) {
      return NextResponse.json({ error: 'Cod greșit. Verifică emailul.' }, { status: 400 });
    }

    const session = await createToken(
      {
        kind: 'session',
        email: pending.email,
        exp: Date.now() + PORTAL_SESSION_DAYS * 86_400_000,
      },
      secret,
    );

    const res = NextResponse.json({ ok: true });
    res.cookies.set(PORTAL_COOKIE, session, portalCookieOptions(PORTAL_SESSION_DAYS * 86_400));
    res.cookies.delete(PORTAL_PENDING_COOKIE);
    return res;
  } catch (err) {
    console.error('[portal] auth code error:', err);
    return NextResponse.json({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
  }
}
