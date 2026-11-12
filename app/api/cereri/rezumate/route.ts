// Sesiunile Watt AI pentru firma logată (pilot 12 nov 2026). Pagina /cereri e
// cache-uită (ISR), deci se cer de aici, din client, ca la /api/portal/me.
// Fără sesiune sau cu rezumatul oprit din portal: listă goală, fără să atingă
// baza.
//
// Conținutul îl primește doar firma care a preluat cererea (Radu, 12 nov). Pe
// celelalte cereri, firma află doar că există o sesiune și câte detalii are,
// ca la poze: „le vezi după ce preiei cererea”. Regula e aici, pe server, ca
// detaliile să nu ajungă în pagină nici ascunse.
//
//   GET                         → { pornit, rezumate: { [leadId]: SesiuneFirma } }
//   POST {leadId, nota, motiv}  → nota firmei: „util” sau „nu_prea”
//   POST {leadId, vazut, sursa} → firma a deschis sesiunea

import { NextResponse } from 'next/server';
import { peekPortalEmail } from '@/lib/portal-session';
import { getClaimsForAccount, getFirmEmailGroup } from '@/lib/sheets';
import { conversatiiPentruFirma, logVizualizare, noteazaRezumat, rezumatPornit } from '@/lib/asistent';
import { rezumatCerere } from '@/lib/asistent-shared';

export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };

/** Cererile preluate de firmă, de pe oricare din adresele ei legate. */
async function cereriPreluate(email: string): Promise<Set<string>> {
  const [emails, claims] = await Promise.all([getFirmEmailGroup(email), getClaimsForAccount(email)]);
  const ale = new Set(emails);
  return new Set(claims.filter((c) => ale.has(c.email)).map((c) => c.leadId));
}

export async function GET() {
  try {
    const email = await peekPortalEmail();
    if (!email) return NextResponse.json({ pornit: false, rezumate: {} }, { headers });
    if (!(await rezumatPornit(email))) return NextResponse.json({ pornit: false, rezumate: {} }, { headers });

    const [conversatii, preluate] = await Promise.all([conversatiiPentruFirma(email), cereriPreluate(email)]);
    const rezumate: Record<string, unknown> = {};
    for (const c of conversatii) {
      const r = rezumatCerere(c.cerere, c.date, c.updatedAt);
      if (!r) continue;
      rezumate[c.leadId] = preluate.has(c.leadId)
        ? { preluata: true, ...r, nota: c.nota }
        : {
            preluata: false,
            detalii: r.confirmate.length + r.intrebari.length,
            atentionari: r.semnale.filter((s) => s.tip === 'atentie').length,
          };
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
    if (!leadId) return NextResponse.json({ error: 'date lipsă' }, { status: 400 });
    // Notele și vizualizările vin doar de la firma care a preluat cererea.
    if (!(await cereriPreluate(email)).has(leadId)) {
      return NextResponse.json({ error: 'Sesiunea se vede după ce preiei cererea.' }, { status: 403 });
    }
    if (body.vazut === true) {
      const sursa = body.sursa === 'portal' ? 'portal' : 'cereri';
      await logVizualizare(leadId, email, sursa);
      return NextResponse.json({ ok: true });
    }
    const nota = body.nota === 'util' || body.nota === 'nu_prea' ? body.nota : null;
    const motiv = (typeof body.motiv === 'string' ? body.motiv : '').trim().slice(0, 500);
    if (!nota) return NextResponse.json({ error: 'date lipsă' }, { status: 400 });
    await noteazaRezumat(leadId, email, nota, motiv);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[rezumate] notă:', err);
    return NextResponse.json({ error: 'Nu am putut salva nota.' }, { status: 500 });
  }
}
