import { NextResponse } from 'next/server';
import { PORTAL_COOKIE, PORTAL_HINT_COOKIE } from '@/lib/portal-auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(PORTAL_COOKIE);
  res.cookies.delete(PORTAL_HINT_COOKIE);
  return res;
}
