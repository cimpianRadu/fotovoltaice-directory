import { NextResponse } from 'next/server';
import { peekPortalEmail } from '@/lib/portal-session';
import { acceptaAcorduri, acorduriLipsa, dovadaCerere, verificaAcorduri } from '@/lib/acorduri';
import { ACORDURI, type AcordId } from '@/lib/acorduri-shared';

// Modalul de acorduri (20 nov 2026): ce mai are de bifat firma logată și
// salvarea bifelor. Fără sesiune: { lipsa: [] }, ca vizitatorul să nu coste nimic.

export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  const email = await peekPortalEmail();
  if (!email) return NextResponse.json({ lipsa: [], actualizate: [] }, { headers });
  return NextResponse.json(await verificaAcorduri(email), { headers });
}

export async function POST(request: Request) {
  const email = await peekPortalEmail();
  if (!email) {
    return NextResponse.json({ error: 'Sesiune expirată. Intră din nou în portal.' }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { ids?: unknown; versiuni?: unknown };
  const ids = (Array.isArray(body.ids) ? body.ids : []).filter((x): x is AcordId =>
    ACORDURI.some((a) => a.id === x),
  );
  // Versiunile pe care le-a văzut firma. Dacă între timp a ieșit una nouă
  // (modal deschis de dinainte de release), nu salvăm o bifă pe un text pe
  // care nu l-a citit: reîncarcă și vede textul nou.
  const versiuni = (body.versiuni ?? {}) as Record<string, unknown>;
  const vechi = ids.filter((id) => versiuni[id] !== ACORDURI.find((a) => a.id === id)!.versiune);
  if (vechi.length > 0) {
    return NextResponse.json(
      { error: 'Textul s-a actualizat între timp. Reîncarcă pagina și citește versiunea nouă.' },
      { status: 409 },
    );
  }

  const lipsa = await acorduriLipsa(email);
  const nebifate = lipsa.filter((id) => !ids.includes(id));
  if (nebifate.length > 0) {
    return NextResponse.json({ error: 'Bifează ambele acorduri ca să continui.' }, { status: 400 });
  }

  try {
    await acceptaAcorduri({ email, ids, sursa: 'portal', ...dovadaCerere(request) });
    return NextResponse.json({ ok: true }, { headers });
  } catch (err) {
    console.error('[acorduri] salvare:', err);
    return NextResponse.json({ error: 'Nu am putut salva. Încearcă din nou.' }, { status: 500 });
  }
}
