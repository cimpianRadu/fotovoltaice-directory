import { NextResponse } from 'next/server';
import { loadAccountMovements } from '@/app/admin/portal/account-data';

/** „Istoric complet” al unui cont din /admin/portal, la deschidere. Auth: middleware. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const members: string[] = Array.isArray(body?.members)
      ? body.members.map((e: unknown) => String(e || '').trim()).filter(Boolean)
      : [];
    if (!members.length) return NextResponse.json({ error: 'Lipsesc adresele.' }, { status: 400 });
    return NextResponse.json({ movements: await loadAccountMovements(members) });
  } catch (err) {
    console.error('[admin/portal] istoric:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
