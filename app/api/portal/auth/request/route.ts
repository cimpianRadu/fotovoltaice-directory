import { NextResponse } from 'next/server';
import {
  PORTAL_LOGIN_TTL_MINUTES,
  PORTAL_PENDING_COOKIE,
  createToken,
  generateLoginCode,
  hashLoginCode,
  isValidEmail,
  normalizeEmail,
  portalCookieOptions,
} from '@/lib/portal-auth';
import { sendPortalLoginEmail } from '@/lib/email';

/**
 * Pasul 1 al loginului: firma își lasă emailul, primește link + cod de 6 cifre.
 * Nu există „cont greșit" — orice email valid primește cod (portalul e gol dacă
 * n-are revendicări), deci endpointul nu divulgă ce emailuri există în sistem.
 */
export async function POST(request: Request) {
  try {
    const secret = process.env.PORTAL_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Portalul nu este configurat.' }, { status: 503 });
    }

    const body = await request.json();
    const email = normalizeEmail(String(body?.email || ''));
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Adresa de email nu este validă.' }, { status: 400 });
    }

    const exp = Date.now() + PORTAL_LOGIN_TTL_MINUTES * 60_000;
    const code = generateLoginCode();
    const codeHash = await hashLoginCode(email, code, secret);
    const linkToken = await createToken({ kind: 'login-link', email, exp }, secret);
    const pendingToken = await createToken({ kind: 'pending', email, exp, codeHash }, secret);

    const verifyUrl = `${new URL(request.url).origin}/api/portal/auth/verify?token=${encodeURIComponent(linkToken)}`;

    const sent = await sendPortalLoginEmail({
      to: email,
      code,
      verifyUrl,
      ttlMinutes: PORTAL_LOGIN_TTL_MINUTES,
    });
    // Aici NU fail-open: fără email, firma n-are cum să intre — mai bine un
    // mesaj clar decât un „verifică inboxul" care nu vine niciodată.
    if (!sent.ok) {
      console.error('[portal] login email failed:', sent.reason);
      return NextResponse.json(
        { error: 'Nu am putut trimite emailul. Încearcă din nou în câteva minute.' },
        { status: 502 },
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(
      PORTAL_PENDING_COOKIE,
      pendingToken,
      portalCookieOptions(PORTAL_LOGIN_TTL_MINUTES * 60),
    );
    return res;
  } catch (err) {
    console.error('[portal] auth request error:', err);
    return NextResponse.json({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
  }
}
