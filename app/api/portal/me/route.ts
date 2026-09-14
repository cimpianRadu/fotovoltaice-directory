import { NextResponse } from 'next/server';
import { peekPortalEmail } from '@/lib/portal-session';
import { getClaims, getFirmEmailGroup, latestClaimIdentity } from '@/lib/sheets';

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

    const [claims, emails] = await Promise.all([getClaims(), getFirmEmailGroup(email)]);
    const identity = latestClaimIdentity(claims, emails);
    return NextResponse.json(
      {
        me: {
          email,
          numeFirma: identity?.numeFirma ?? '',
          numeContact: identity?.numeContact ?? '',
          telefon: identity?.telefon ?? '',
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
