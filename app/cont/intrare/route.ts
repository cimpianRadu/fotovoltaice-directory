import { NextResponse, type NextRequest } from 'next/server';
import { ensureAccount, sessionCookie, verifyAccountLink } from '@/lib/client-auth';
import { recordClientEvent } from '@/lib/client-events';

// Linkul din emailurile către client: `/cont/intrare?t=<token>&cerere=<id>`.
// Tokenul dovedește că omul are acces la căsuța de email a cererii, deci primește
// sesiunea întreagă a contului (toate cererile adresei) și ajunge pe cerere.
//
// GET care pune un cookie, ca orice link de intrare. Filtrele de securitate care
// deschid singure linkurile primesc și ele cookie-ul, dar în browserul lor; nu
// schimbă nimic din cerere (acțiunile cer apăsări pe pagină).

const LEAD_ID_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const email = await verifyAccountLink(url.searchParams.get('t'));
  if (!email) return NextResponse.redirect(new URL('/cont?eroare=link', url));

  try {
    await ensureAccount(email, true);
  } catch (err) {
    // Fără rândul din Neon contul tot funcționează: sesiunea e în cookie.
    console.error('[cont] intrare:', err);
  }

  const cerere = url.searchParams.get('cerere') || '';
  await recordClientEvent(LEAD_ID_RE.test(cerere) ? cerere : null, 'intrare_link');
  const dest = LEAD_ID_RE.test(cerere) ? `/cont/cerere/${encodeURIComponent(cerere)}` : '/cont';
  const res = NextResponse.redirect(new URL(dest, url));
  const session = await sessionCookie(email);
  res.cookies.set(session.name, session.value, session.options);
  return res;
}
