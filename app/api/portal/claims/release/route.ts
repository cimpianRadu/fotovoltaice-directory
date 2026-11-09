import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPortalEmail } from '@/lib/portal-session';
import { getClaimsForAccount, getFirmEmailGroup, releaseClaim } from '@/lib/sheets';

import { composeReleaseReason } from '@/lib/portal-release-reasons';

export async function POST(request: Request) {
  try {
    const email = await getPortalEmail();
    if (!email) {
      return NextResponse.json({ error: 'Sesiunea a expirat. Intră din nou.' }, { status: 401 });
    }

    const body = await request.json();
    const { claimTimestamp, leadId } = body as Record<string, string>;
    if (!claimTimestamp || !leadId) {
      return NextResponse.json({ error: 'Revendicarea nu există.' }, { status: 400 });
    }
    // Motivul e un click; detaliile sunt opționale, mai puțin la „Alt motiv".
    const motiv = composeReleaseReason(String(body?.motivId || ''), String(body?.detalii || ''));
    if (!motiv) {
      return NextResponse.json(
        {
          error: body?.motivId === 'altul'
            ? 'Scrie pe scurt motivul (de ce nu a mers cererea asta).'
            : 'Alege motivul renunțării.',
        },
        { status: 400 },
      );
    }

    const [claims, emails] = await Promise.all([getClaimsForAccount(email), getFirmEmailGroup(email)]);
    const claim = claims.find((c) => c.timestamp === claimTimestamp && c.leadId === leadId);
    if (!claim || !emails.includes(claim.email)) {
      return NextResponse.json({ error: 'Revendicarea nu există.' }, { status: 404 });
    }
    if (claim.releasedAt) {
      return NextResponse.json({ error: 'Ai renunțat deja la această cerere.' }, { status: 409 });
    }

    const updated = await releaseClaim(claimTimestamp, leadId, motiv, claim.proba);
    // Contul de probă n-a ținut niciun loc și n-are de ce să mă anunțe.
    if (claim.proba) return NextResponse.json({ ok: true, releasedAt: updated.releasedAt });

    // Locul cererii s-a eliberat — feedul public trebuie să o arate din nou
    // disponibilă, nu peste 5 minute de ISR.
    revalidatePath('/cereri');
    revalidatePath('/admin/crm');

    // Fără email imediat către mine (9 nov 2026): renunțarea, cu motivul și cu
    // „cererea a rămas fără firmă”, apare seara în rezumatul din
    // cron/revendicari-zi. Pe 9 nov o singură firmă a făcut 6 într-o zi.

    return NextResponse.json({ ok: true, releasedAt: updated.releasedAt });
  } catch (err) {
    console.error('[portal] claim release error:', err);
    return NextResponse.json({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
  }
}
