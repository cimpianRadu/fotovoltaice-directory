// Watt AI pentru firmele logate (19 nov 2026). Sesiunea e cea din portal: fără
// ea, bula nu există.
//
//   GET                  → starea bulei (mesajele, câte mai are azi, anunțul nevăzut)
//   POST { mesaj }       → o replică (cel mult 5 pe zi de firmă)
//   POST { vazut: id }   → firma a deschis bula cu anunțul afișat
//   POST { eveniment, detalii } → o măsurătoare (bula afișată, deschisă, balonul, un link, o notă)

import { NextResponse } from 'next/server';
import { alertError } from '@/lib/alert';
import { peekPortalEmail } from '@/lib/portal-session';
import { acorduriLipsa } from '@/lib/acorduri';
import {
  EVENIMENTE_BULA,
  WattFirmeEroare,
  marcheazaAnunt,
  noteazaEveniment,
  raspundeFirmei,
  stareWattFirme,
  wattFirmePornit,
} from '@/lib/watt-firme';
import { WATT_FIRME_MAX_CARACTERE } from '@/lib/watt-firme-shared';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const headers = { 'Cache-Control': 'no-store' };

export async function GET() {
  if (!wattFirmePornit()) return NextResponse.json({ pornit: false }, { headers });
  const email = await peekPortalEmail();
  if (!email) return NextResponse.json({ pornit: false }, { headers });
  // Fără acordurile bifate (care includ Watt AI) bula nu apare: modalul vine întâi.
  if ((await acorduriLipsa(email)).length > 0) return NextResponse.json({ pornit: false }, { headers });
  try {
    return NextResponse.json(await stareWattFirme(email), { headers });
  } catch (err) {
    console.error('[watt-firme] stare:', err);
    return NextResponse.json({ pornit: false }, { headers });
  }
}

export async function POST(request: Request) {
  if (!wattFirmePornit()) return NextResponse.json({ error: 'Watt nu e pornit.' }, { status: 404 });
  const email = await peekPortalEmail();
  if (!email) return NextResponse.json({ error: 'Intrați în contul firmei.' }, { status: 401 });
  if ((await acorduriLipsa(email)).length > 0) {
    return NextResponse.json(
      { error: 'Acceptă întâi termenii din cont. Reîncarcă pagina.', needsAcorduri: true },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  if (typeof body.eveniment === 'string') {
    if (!(EVENIMENTE_BULA as readonly string[]).includes(body.eveniment)) {
      return NextResponse.json({ error: 'eveniment necunoscut' }, { status: 400 });
    }
    const detalii = typeof body.detalii === 'string' ? body.detalii : '';
    await noteazaEveniment(email, body.eveniment, detalii).catch((err) => console.error('[watt-firme] eveniment:', err));
    return NextResponse.json({ ok: true }, { headers });
  }

  if (typeof body.vazut === 'number') {
    try {
      await marcheazaAnunt(email, body.vazut);
      return NextResponse.json(await stareWattFirme(email), { headers });
    } catch (err) {
      console.error('[watt-firme] anunț văzut:', err);
      return NextResponse.json({ error: 'eroare' }, { status: 500 });
    }
  }

  const mesaj = (typeof body.mesaj === 'string' ? body.mesaj : '').trim();
  if (!mesaj) return NextResponse.json({ error: 'Mesajul e gol.' }, { status: 400 });
  if (mesaj.length > WATT_FIRME_MAX_CARACTERE) {
    return NextResponse.json({ error: 'Mesajul e prea lung.' }, { status: 400 });
  }

  try {
    const sursa = body.sursa === 'rapid' ? 'rapid' : 'scris';
    return NextResponse.json(await raspundeFirmei(email, mesaj, sursa), { headers });
  } catch (err) {
    if (err instanceof WattFirmeEroare) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('[watt-firme] replică:', err);
    await alertError({
      area: 'watt-firme',
      kind: err instanceof Error ? `${err.constructor.name}-${(err as { status?: number }).status ?? 'fara-status'}` : 'exceptie',
      message: `Watt pentru firme nu răspunde: ${err instanceof Error ? err.message : String(err)}`.slice(0, 200),
    });
    return NextResponse.json({ error: 'Watt nu răspunde acum. Încercați peste puțin.' }, { status: 500 });
  }
}
