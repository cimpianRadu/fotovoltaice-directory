// Locul lucrării (adresa și/sau coordonatele), salvat de pe ecranul de
// confirmare sau din contul clientului. Autorizarea e tokenul de la poze: îl
// primește doar cine tocmai a trimis cererea, iar pagina din cont îl emite din
// nou doar după ce a verificat sesiunea clientului. Id-ul cererii singur nu
// ajunge, apare în feedul public.

import { NextResponse } from 'next/server';
import { verifyLeadPhotoToken } from '@/lib/lead-photos';
import { LEAD_ADDRESS_MAX, formatCoords, parseCoords } from '@/lib/lead-location-shared';
import { setLeadLocation } from '@/lib/lead-location';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const leadId = typeof body.leadId === 'string' ? body.leadId : '';
    const token = typeof body.token === 'string' ? body.token : '';
    if (!leadId || !token) {
      return NextResponse.json({ error: 'date lipsă' }, { status: 400 });
    }
    if (!verifyLeadPhotoToken(token, leadId)) {
      return NextResponse.json(
        { error: 'Pagina e deschisă de prea mult timp. Reîncărcați-o și încercați din nou.' },
        { status: 403 },
      );
    }

    // Spațiile și rândurile noi se strâng, ca în celulă să ajungă un singur rând.
    const adresa = (typeof body.adresa === 'string' ? body.adresa : '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, LEAD_ADDRESS_MAX);
    const raw = typeof body.coordonate === 'string' ? body.coordonate : '';
    const coords = raw ? parseCoords(raw) : null;
    if (raw && !coords) {
      return NextResponse.json({ error: 'Locația de pe telefon nu e validă.' }, { status: 400 });
    }

    const coordonate = coords ? formatCoords(coords) : '';
    await setLeadLocation(leadId, { adresa, coordonate });
    return NextResponse.json({ ok: true, adresa, coordonate });
  } catch (err) {
    console.error('[locatie] salvare:', err);
    return NextResponse.json(
      { error: 'Nu am putut salva adresa. Cererea dumneavoastră este însă înregistrată.' },
      { status: 500 },
    );
  }
}
