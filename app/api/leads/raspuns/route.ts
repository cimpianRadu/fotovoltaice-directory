import { NextResponse } from 'next/server';
import { getFullLeadById, isLeadClosed } from '@/lib/sheets';
import { isClientLinkAction, verifyClientToken } from '@/lib/lead-client-token';
import { closeLeadByClient, recordStillWaiting } from '@/lib/informez';

// Răspunsurile cu un click din emailurile către client: „încă mă informez"
// (repornește ceasul check-in-urilor) și „nu mai vreau" (închide cererea).
// Pagina /cerere/raspuns/[action] confirmă și apelează aici; efectul nu se
// produce la simpla deschidere a linkului, ca un client de email care
// preîncarcă linkurile să nu închidă cereri.

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const token = typeof body.token === 'string' ? body.token : '';
    const action = typeof body.action === 'string' ? body.action : '';

    if (!isClientLinkAction(action) || action === 'actualizare') {
      return NextResponse.json({ error: 'Acțiune necunoscută.' }, { status: 400 });
    }
    if (!id || !token || !verifyClientToken(token, id, action)) {
      return NextResponse.json(
        { error: 'Legătura a expirat sau nu este validă. Scrieți-ne și o refacem.' },
        { status: 403 },
      );
    }

    const lead = await getFullLeadById(id);
    if (!lead) return NextResponse.json({ error: 'Cererea nu mai există.' }, { status: 404 });
    if (isLeadClosed(lead.crmStatus)) return NextResponse.json({ success: true, alreadyClosed: true });

    if (action === 'renunt') await closeLeadByClient(lead);
    else await recordStillWaiting(lead);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Raspuns API error:', err);
    return NextResponse.json({ error: 'Eroare internă. Vă rugăm încercați din nou.' }, { status: 500 });
  }
}
