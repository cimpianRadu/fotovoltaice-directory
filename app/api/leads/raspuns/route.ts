import { NextResponse } from 'next/server';
import { getFullLeadById, isLeadClosed } from '@/lib/sheets';
import { isClientLinkAction, verifyClientToken } from '@/lib/lead-client-token';
import { closeLeadByClient, recordStillWaiting } from '@/lib/informez';
import { closeLeadChosenFirm, confirmLeadActive } from '@/lib/confirmare-activa';
import { recordStatusResponse, type AltaFirmaMotiv } from '@/lib/verificare-status';

// Răspunsurile cu un click din emailurile către client: „încă mă informez"
// (repornește ceasul check-in-urilor) și „nu mai vreau" (închide cererea).
// Pagina /cerere/raspuns/[action] confirmă și apelează aici; efectul nu se
// produce la simpla deschidere a linkului, ca un client de email care
// preîncarcă linkurile să nu închidă cereri.
// Din 21 sept 2026, și verificarea „mai căutați oferte?": „activa" (cererea
// urcă în feed) și „aleasa" (închisă, cu firma aleasă, opțional, în `firma`).
// Din 6 oct 2026, și „Ați găsit o ofertă bună?": „semnat" (revendicarea în `f`,
// semnată în token), „decid", „altafirma" (cu `motiv`) și „necontactat".

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const token = typeof body.token === 'string' ? body.token : '';
    const action = typeof body.action === 'string' ? body.action : '';
    const firma = typeof body.firma === 'string' ? body.firma : '';
    const f = typeof body.f === 'string' ? body.f : '';
    const motiv = typeof body.motiv === 'string' ? (body.motiv as AltaFirmaMotiv) : undefined;

    if (!isClientLinkAction(action) || action === 'actualizare') {
      return NextResponse.json({ error: 'Acțiune necunoscută.' }, { status: 400 });
    }
    if (!id || !token || !verifyClientToken(token, id, action, action === 'semnat' ? f : '')) {
      return NextResponse.json(
        { error: 'Legătura a expirat sau nu este validă. Scrieți-ne și o refacem.' },
        { status: 403 },
      );
    }

    const lead = await getFullLeadById(id);
    if (!lead) return NextResponse.json({ error: 'Cererea nu mai există.' }, { status: 404 });
    if (isLeadClosed(lead.crmStatus)) return NextResponse.json({ success: true, alreadyClosed: true });

    if (action === 'semnat' || action === 'decid' || action === 'altafirma' || action === 'necontactat') {
      const res = await recordStatusResponse(lead, action, { claimTs: f, motiv });
      if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === 'renunt') await closeLeadByClient(lead);
    else if (action === 'activa') await confirmLeadActive(lead);
    else if (action === 'aleasa') await closeLeadChosenFirm(lead, firma);
    else await recordStillWaiting(lead);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Raspuns API error:', err);
    return NextResponse.json({ error: 'Eroare internă. Vă rugăm încercați din nou.' }, { status: 500 });
  }
}
