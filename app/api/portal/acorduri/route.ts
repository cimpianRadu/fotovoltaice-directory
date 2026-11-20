import { NextResponse } from 'next/server';
import { peekPortalEmail } from '@/lib/portal-session';
import { acceptaAcorduri, acorduriLipsa, dovadaCerere, numeFirmaPentru, verificaAcorduri } from '@/lib/acorduri';
import { ACORDURI, type AcordId } from '@/lib/acorduri-shared';

// Modalul de acorduri (20 nov 2026): ce mai are de bifat firma logată și
// salvarea bifelor. Fără sesiune: { lipsa: [] }, ca vizitatorul să nu coste nimic.

export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  const email = await peekPortalEmail();
  if (!email) return NextResponse.json({ lipsa: [], actualizate: [], firma: '' }, { headers });
  const stare = await verificaAcorduri(email);
  // Numele firmei (din Sheets) doar când e ceva de bifat: altfel fiecare pagină
  // vizitată de o firmă logată ar costa o citire din cotă.
  const firma = stare.lipsa.length > 0 ? await numeFirmaPentru(email) : '';
  return NextResponse.json({ ...stare, firma }, { headers });
}

export async function POST(request: Request) {
  const email = await peekPortalEmail();
  if (!email) {
    return NextResponse.json({ error: 'Sesiune expirată. Intră din nou în portal.' }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as { ids?: unknown; versiuni?: unknown; firma?: unknown };
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

  // Numele firmei se ia de pe server, nu din ce trimite browserul. Dacă diferă de
  // cel din modal (profil schimbat între timp), firma n-a văzut textul ăsta.
  const firma = await numeFirmaPentru(email);
  if (typeof body.firma === 'string' && body.firma.trim() !== firma) {
    return NextResponse.json(
      { error: 'Datele firmei s-au schimbat între timp. Reîncarcă pagina și bifează din nou.' },
      { status: 409 },
    );
  }

  try {
    await acceptaAcorduri({ email, ids, sursa: 'portal', firma, ...dovadaCerere(request) });
    return NextResponse.json({ ok: true }, { headers });
  } catch (err) {
    console.error('[acorduri] salvare:', err);
    return NextResponse.json({ error: 'Nu am putut salva. Încearcă din nou.' }, { status: 500 });
  }
}
