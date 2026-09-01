import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPortalEmail } from '@/lib/portal-session';
import { getClaims, getFirmEmailGroup, getFullLeadById, releaseClaim } from '@/lib/sheets';
import { sendClaimReleaseNotification } from '@/lib/email';
import { getProjectTypeLabel } from '@/lib/utils-shared';

/** Un „nu mai vreau" fără explicație nu ne spune nimic — motivul e minimul de politețe. */
const MIN_REASON_LENGTH = 10;

export async function POST(request: Request) {
  try {
    const email = await getPortalEmail();
    if (!email) {
      return NextResponse.json({ error: 'Sesiunea a expirat. Intră din nou.' }, { status: 401 });
    }

    const body = await request.json();
    const { claimTimestamp, leadId } = body as Record<string, string>;
    const motiv = String(body?.motiv || '').trim();
    if (!claimTimestamp || !leadId) {
      return NextResponse.json({ error: 'Revendicarea nu există.' }, { status: 400 });
    }
    if (motiv.length < MIN_REASON_LENGTH) {
      return NextResponse.json(
        { error: 'Scrie pe scurt motivul renunțării (de ce nu a mers cererea asta).' },
        { status: 400 },
      );
    }

    const [claims, emails] = await Promise.all([getClaims(), getFirmEmailGroup(email)]);
    const claim = claims.find((c) => c.timestamp === claimTimestamp && c.leadId === leadId);
    if (!claim || !emails.includes(claim.email)) {
      return NextResponse.json({ error: 'Revendicarea nu există.' }, { status: 404 });
    }
    if (claim.releasedAt) {
      return NextResponse.json({ error: 'Ai renunțat deja la această cerere.' }, { status: 409 });
    }

    const updated = await releaseClaim(claimTimestamp, leadId, motiv);

    // Locul cererii s-a eliberat — feedul public trebuie să o arate din nou
    // disponibilă, nu peste 5 minute de ISR.
    revalidatePath('/cereri');
    revalidatePath('/admin/crm');

    // Fail-open: renunțarea e salvată chiar dacă emailul de notificare pică.
    const lead = await getFullLeadById(leadId);
    const leadSummary = lead
      ? `${getProjectTypeLabel(lead.tipProiect)} · ${lead.judet}${lead.putere ? ` · ${lead.putere} kW` : ''}`
      : leadId;
    await sendClaimReleaseNotification({
      numeFirma: claim.numeFirma,
      email,
      motiv,
      leadSummary,
      leadId,
    });

    return NextResponse.json({ ok: true, releasedAt: updated.releasedAt });
  } catch (err) {
    console.error('[portal] claim release error:', err);
    return NextResponse.json({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
  }
}
