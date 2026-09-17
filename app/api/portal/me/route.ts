import { NextResponse } from 'next/server';
import { peekPortalEmail } from '@/lib/portal-session';
import { getClaims, getFirmIdentity } from '@/lib/sheets';
import { MAX_ACTIVE_CLAIMS_PER_FIRM, countActiveClaimsForFirm } from '@/lib/sheets-shared';

// Cine e firma logată, pentru /cereri: cu cont, revendicarea și urmărirea se
// trimit dintr-un click, cu datele declarate ultima dată. Pagina /cereri e
// cache-uită (ISR), deci cookie-ul nu se poate citi acolo — se cere de aici,
// din client, la încărcare. Fără sesiune răspunde { me: null } și nu atinge
// Sheets, ca vizitatorul anonim să nu coste nimic.

export const dynamic = 'force-dynamic';

export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const email = await peekPortalEmail();
    if (!email) return NextResponse.json({ me: null }, { headers });

    const [claims, identity] = await Promise.all([getClaims(), getFirmIdentity(email)]);
    return NextResponse.json(
      {
        me: {
          email,
          numeFirma: identity?.numeFirma ?? '',
          numeContact: identity?.numeContact ?? '',
          telefon: identity?.telefon ?? '',
          // Pentru bara „Conectat ca" de pe /cereri: câte locuri mai are firma
          // înainte ca revendicarea să fie refuzată de plafon.
          activeClaims: identity ? countActiveClaimsForFirm(claims, identity) : 0,
          maxActiveClaims: MAX_ACTIVE_CLAIMS_PER_FIRM,
        },
      },
      { headers },
    );
  } catch (err) {
    console.error('[portal] /me:', err);
    // Fail-open spre formularul complet: firma poate revendica oricum.
    return NextResponse.json({ me: null }, { headers });
  }
}
