import { NextResponse } from 'next/server';
import { adaugaAnunt, opresteAnunt } from '@/lib/watt-firme';

// Anunțurile din bula Watt pentru firme (19 nov 2026), din /admin/watt-firme.
// Protejat de middleware, ca tot /api/admin.
//   POST { text }    → anunț nou (îl înlocuiește pe cel activ)
//   POST { opreste } → anunțul nu mai apare la firmele care nu l-au văzut
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    if (typeof body?.opreste === 'number') {
      await opresteAnunt(body.opreste);
      return NextResponse.json({ ok: true });
    }
    const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 600) : '';
    if (!text) return NextResponse.json({ error: 'Anunțul e gol.' }, { status: 400 });
    await adaugaAnunt(text);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin] watt firme:', err);
    return NextResponse.json({ error: 'Nu am putut salva.' }, { status: 500 });
  }
}
