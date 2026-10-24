import { NextResponse } from 'next/server';
import { isValidEmail, normalizeEmail } from '@/lib/portal-auth';
import { consumeLoginCode, ensureAccount, sessionCookie } from '@/lib/client-auth';
import { recordClientEvent } from '@/lib/client-events';

// Pasul 2 al intrării din /cont: emailul și codul primit. Maximum 5 încercări pe
// cod (lib/client-auth), apoi trebuie cerut altul.

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; code?: unknown } | null;
  const raw = typeof body?.email === 'string' ? body.email : '';
  const code = String(body?.code ?? '').replace(/\s/g, '');
  if (!isValidEmail(raw) || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Codul are 6 cifre.' }, { status: 400 });
  }
  const email = normalizeEmail(raw);
  try {
    const result = await consumeLoginCode(email, code);
    if (result === 'gresit') return NextResponse.json({ error: 'Cod greșit. Verificați emailul.' }, { status: 400 });
    if (result === 'expirat') {
      return NextResponse.json({ error: 'Codul a expirat sau a fost încercat de prea multe ori. Cereți altul.' }, { status: 400 });
    }
    await ensureAccount(email, true);
    await recordClientEvent(null, 'cod_intrat');
    const res = NextResponse.json({ ok: true });
    const session = await sessionCookie(email);
    res.cookies.set(session.name, session.value, session.options);
    return res;
  } catch (err) {
    console.error('[cont] intra:', err);
    return NextResponse.json({ error: 'A apărut o eroare. Încercați din nou.' }, { status: 500 });
  }
}
