import { NextResponse, after } from 'next/server';
import { getPortalEmail } from '@/lib/portal-session';
import { getCountyAlertPref, saveCountyAlertPrefs } from '@/lib/sheets';
import { sendOpenLeadsForNewCounties } from '@/lib/open-leads-digest';
import { recordResubscribeIfNeeded } from '@/lib/firm-unsubscribe';
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

    const previous = await getCountyAlertPref(email);
    await saveCountyAlertPrefs(email, selected);
    // Județele abia bifate vin cu cererile deschise de acolo (16 oct 2026):
    // alerta pleacă doar la cererile noi, iar cele intrate înainte rămâneau
    // necunoscute firmei. După răspuns, ca salvarea să nu aștepte emailul.
    // Bifarea de județe după o dezabonare înseamnă că vrea emailurile înapoi.
    after(async () => {
      if (selected.length) await recordResubscribeIfNeeded(email).catch((err) => console.error('[dezabonare] reabonare:', err));
      await sendOpenLeadsForNewCounties(email, previous?.active ? previous.counties : [], selected);
    });

    return NextResponse.json({ success: true, counties: selected });
  } catch (err) {
    console.error('[portal] salvare alerte județ:', err);
    return NextResponse.json({ error: 'Nu am putut salva județele. Încearcă din nou.' }, { status: 500 });
  }
}
