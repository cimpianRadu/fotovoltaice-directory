import { NextResponse } from 'next/server';
import { getPortalEmail } from '@/lib/portal-session';
import { saveCountyAlertPrefs } from '@/lib/sheets';
import { getCounties } from '@/lib/utils-shared';

// Județele de interes ale firmei logate. Singura scriere din portal care nu
// atinge o revendicare, deci nu are nevoie de leadId: identitatea e sesiunea.

export async function POST(request: Request) {
  const email = await getPortalEmail();
  if (!email) {
    return NextResponse.json({ error: 'Sesiune expirată. Intră din nou în portal.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const raw = Array.isArray(body.counties) ? body.counties : null;
    if (!raw) {
      return NextResponse.json({ error: 'Lista de județe lipsește.' }, { status: 400 });
    }

    // Doar județe din dicționar, fără duplicate, scrise exact ca în
    // data/counties.json: la cerere nouă comparăm cu județul din formular, iar
    // un text liber în Sheet ar face alerta să nu se mai potrivească niciodată.
    const known = getCounties();
    const selected = known.filter((c) => raw.includes(c));

    await saveCountyAlertPrefs(email, selected);

    return NextResponse.json({ success: true, counties: selected });
  } catch (err) {
    console.error('[portal] salvare alerte județ:', err);
    return NextResponse.json({ error: 'Nu am putut salva județele. Încearcă din nou.' }, { status: 500 });
  }
}
