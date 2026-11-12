// Rezumatele asistentului pentru firma logată (pilot 12 nov 2026). Pagina
// /cereri e cache-uită (ISR), deci rezumatele se cer de aici, din client, ca la
// /api/portal/me. Fără sesiune sau cu rezumatul oprit din portal: listă goală,
// fără să atingă baza.
//
//   GET                         → { pornit, rezumate: { [leadId]: RezumatCerere & { nota } } }
//   POST {leadId, nota, motiv}  → nota firmei: „util” sau „nu_prea”

import { NextResponse } from 'next/server';
import { peekPortalEmail } from '@/lib/portal-session';
import { conversatiiPentruFirma, noteazaRezumat, rezumatPornit } from '@/lib/asistent';
import { rezumatCerere } from '@/lib/asistent-shared';

export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const email = await peekPortalEmail();
    if (!email) return NextResponse.json({ pornit: false, rezumate: {} }, { headers });
    if (!(await rezumatPornit(email))) return NextResponse.json({ pornit: false, rezumate: {} }, { headers });

    const rezumate: Record<string, unknown> = {};
    for (const c of await conversatiiPentruFirma(email)) {
      const r = rezumatCerere(c.cerere, c.date, c.updatedAt);
      if (r) rezumate[c.leadId] = { ...r, nota: c.nota };
    }
    return NextResponse.json({ pornit: true, rezumate }, { headers });
  } catch (err) {
    console.error('[rezumate] încărcare:', err);
    return NextResponse.json({ pornit: false, rezumate: {} }, { headers });
  }
}

export async function POST(request: Request) {
  const email = await peekPortalEmail();
  if (!email) return NextResponse.json({ error: 'Intrați în portal.' }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const leadId = typeof body.leadId === 'string' ? body.leadId : '';
    const nota = body.nota === 'util' || body.nota === 'nu_prea' ? body.nota : null;
    const motiv = (typeof body.motiv === 'string' ? body.motiv : '').trim().slice(0, 500);
    if (!leadId || !nota) return NextResponse.json({ error: 'date lipsă' }, { status: 400 });
    await noteazaRezumat(leadId, email, nota, motiv);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[rezumate] notă:', err);
    return NextResponse.json({ error: 'Nu am putut salva nota.' }, { status: 500 });
  }
}
