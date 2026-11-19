import { NextResponse } from 'next/server';
import { setNotaPlatforma } from '@/lib/nota-platforma';

// Nota platformei pe o cerere (19 nov 2026), din /admin/whatsapp: o văd firmele
// care țin cererea, pe cardul din /portal. Textul gol șterge nota. Protejat de
// middleware, ca tot /api/admin.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
  if (!leadId) return NextResponse.json({ error: 'Lipsește cererea.' }, { status: 400 });
  const text = typeof body?.text === 'string' ? body.text : '';
  try {
    const nota = await setNotaPlatforma(leadId, text);
    return NextResponse.json({ ok: true, nota });
  } catch (err) {
    console.error('[admin] nota platformei:', err);
    return NextResponse.json({ error: 'Nu am putut salva nota.' }, { status: 500 });
  }
}
