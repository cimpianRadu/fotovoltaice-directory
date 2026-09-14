import { NextResponse } from 'next/server';
import { getFullLeadById, isLeadClosed } from '@/lib/sheets';
import { verifyClientToken } from '@/lib/lead-client-token';
import { reactivateLead } from '@/lib/informez';
import { FINANCING_COMERCIAL, FINANCING_REZIDENTIAL, TIMELINE_OPTIONS } from '@/lib/utils-shared';

// „Sunt gata pentru oferte", trimis de pe /cerere/actualizare. Tokenul din
// linkul emailului dovedește că cel care actualizează e clientul; fără el,
// oricine ar ghici un timestamp ar putea reactiva cererea altcuiva.
//
// Ce NU face: nu atinge contactul, consimțământul sau coloanele de CRM. Scrie
// termenul (obligatoriu, unul concret), finanțarea, puterea și mesajul, apoi
// datează cererea de acum (vezi lib/informez.reactivateLead).

const MAX_MESSAGE_LENGTH = 1000;
const TIMELINES = TIMELINE_OPTIONS.map((o) => o.value as string);
const FINANCINGS = [...FINANCING_REZIDENTIAL, ...FINANCING_COMERCIAL].map((o) => o.value as string);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const token = typeof body.token === 'string' ? body.token : '';
    if (!id || !token || !verifyClientToken(token, id, 'actualizare')) {
      return NextResponse.json(
        { error: 'Legătura a expirat sau nu este validă. Scrieți-ne și o refacem.' },
        { status: 403 },
      );
    }

    const termen = typeof body.termen === 'string' ? body.termen.trim() : '';
    if (!TIMELINES.includes(termen) || termen === 'ma-informez') {
      return NextResponse.json(
        { error: 'Alegeți cât de repede vreți instalarea.', field: 'termen' },
        { status: 400 },
      );
    }
    const finantare = typeof body.finantare === 'string' && FINANCINGS.includes(body.finantare) ? body.finantare : '';
    const putereRaw = typeof body.putere === 'string' ? body.putere.trim().replace(',', '.') : '';
    const putere = putereRaw && Number.isFinite(Number(putereRaw)) && Number(putereRaw) > 0 ? putereRaw : '';
    const mesaj = typeof body.mesaj === 'string' ? body.mesaj.trim().slice(0, MAX_MESSAGE_LENGTH) : '';

    const lead = await getFullLeadById(id);
    if (!lead) {
      return NextResponse.json({ error: 'Cererea nu mai există.' }, { status: 404 });
    }
    if (isLeadClosed(lead.crmStatus)) {
      return NextResponse.json(
        { error: 'Cererea a fost închisă. Dacă vreți oferte, trimiteți una nouă.' },
        { status: 409 },
      );
    }

    const outcome = await reactivateLead(lead, { termen, finantare, putere, mesaj });
    return NextResponse.json({ success: true, ...outcome });
  } catch (err) {
    console.error('Reactivare API error:', err);
    return NextResponse.json({ error: 'Eroare internă. Vă rugăm încercați din nou.' }, { status: 500 });
  }
}
