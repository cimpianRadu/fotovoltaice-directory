import { NextResponse } from 'next/server';
import { ACTIUNI, aplicaActiune, type ActiuneCampanie } from '@/lib/campanie-furnizori';

// Butoanele din /admin/campanie (23 nov 2026): reia follow-up-urile, oprește,
// a răspuns, semnat, refuzat. Protejat de middleware, ca tot /api/admin.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const id = Number(body?.id);
  const actiune = body?.actiune as ActiuneCampanie;
  if (!Number.isInteger(id) || id <= 0 || !ACTIUNI.includes(actiune)) {
    return NextResponse.json({ error: 'Cerere invalidă.' }, { status: 400 });
  }
  try {
    await aplicaActiune(id, actiune);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Eroare.' }, { status: 500 });
  }
}
