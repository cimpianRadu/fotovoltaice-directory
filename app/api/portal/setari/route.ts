// Setările contului de firmă din portal. Deocamdată una: rezumatul asistentului
// pe cereri (pilot 12 nov 2026), pornit implicit.

import { NextResponse } from 'next/server';
import { peekPortalEmail } from '@/lib/portal-session';
import { rezumatPornit, setRezumatPornit } from '@/lib/asistent';

export const dynamic = 'force-dynamic';

export async function GET() {
  const email = await peekPortalEmail();
  if (!email) return NextResponse.json({ error: 'Intrați în portal.' }, { status: 401 });
  try {
    return NextResponse.json({ rezumatAi: await rezumatPornit(email) });
  } catch (err) {
    console.error('[portal] setări:', err);
    return NextResponse.json({ rezumatAi: true });
  }
}

export async function POST(request: Request) {
  const email = await peekPortalEmail();
  if (!email) return NextResponse.json({ error: 'Intrați în portal.' }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.rezumatAi !== 'boolean') return NextResponse.json({ error: 'date lipsă' }, { status: 400 });
    await setRezumatPornit(email, body.rezumatAi);
    return NextResponse.json({ ok: true, rezumatAi: body.rezumatAi });
  } catch (err) {
    console.error('[portal] setări:', err);
    return NextResponse.json({ error: 'Nu am putut salva setarea.' }, { status: 500 });
  }
}
