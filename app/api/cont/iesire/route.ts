import { NextResponse } from 'next/server';
import { CLIENT_LEAD_COOKIE, CLIENT_SESSION_COOKIE } from '@/lib/client-auth';

// Ieșirea din cont: scoate și sesiunea, și cookie-ul de după formular, ca pe un
// calculator folosit de mai mulți să nu rămână nimic deschis.

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(CLIENT_SESSION_COOKIE);
  res.cookies.delete(CLIENT_LEAD_COOKIE);
  return res;
}
