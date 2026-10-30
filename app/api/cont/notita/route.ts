import { NextResponse } from 'next/server';
import { getClaims } from '@/lib/sheets';
import { addFirmNote, deleteFirmNote, leadForViewer, shownClaims } from '@/lib/client-account';
import { NOTE_MAX } from '@/lib/client-account-shared';

// Notițele clientului despre o firmă de pe pagina cererii (30 oct 2026): POST
// adaugă una, DELETE o șterge. Merge pentru orice firmă care i-a primit datele,
// și pentru cele care au renunțat apoi.

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const leadId = typeof body?.leadId === 'string' ? body.leadId : '';
  const claimTs = typeof body?.claimTs === 'string' ? body.claimTs : '';
  const nota = typeof body?.nota === 'string' ? body.nota.trim().slice(0, NOTE_MAX) : '';
  if (!leadId || !claimTs || !nota) return NextResponse.json({ error: 'Scrieți notița întâi.' }, { status: 400 });
  const access = await leadForViewer(leadId);
  if (!access) return NextResponse.json({ error: 'Intrați în cont ca să continuați.' }, { status: 401 });
  try {
    const claim = shownClaims(await getClaims(), leadId).find((c) => c.timestamp === claimTs);
    if (!claim) return NextResponse.json({ error: 'Firma nu mai apare la cererea dumneavoastră.' }, { status: 404 });
    const result = await addFirmNote({ lead: access.lead, claim, nota });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ ok: true, note: result.note });
  } catch (err) {
    console.error('[cont] notiță:', err);
    return NextResponse.json({ error: 'A apărut o eroare. Încercați din nou.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const leadId = typeof body?.leadId === 'string' ? body.leadId : '';
  const id = typeof body?.id === 'number' && Number.isInteger(body.id) ? body.id : 0;
  if (!leadId || !id) return NextResponse.json({ error: 'Notița nu există.' }, { status: 400 });
  const access = await leadForViewer(leadId);
  if (!access) return NextResponse.json({ error: 'Intrați în cont ca să continuați.' }, { status: 401 });
  try {
    if (!(await deleteFirmNote(leadId, id))) return NextResponse.json({ error: 'Notița nu există.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[cont] ștergere notiță:', err);
    return NextResponse.json({ error: 'A apărut o eroare. Încercați din nou.' }, { status: 500 });
  }
}
