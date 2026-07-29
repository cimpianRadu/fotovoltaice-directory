import { NextResponse } from 'next/server';
import { markClaimContacted } from '@/lib/sheets';

function todayBucharest(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
}

/**
 * Confirmă (sau retrage confirmarea) că firma a sunat clientul. Confirmarea
 * eliberează unul din cele MAX_ACTIVE_CLAIMS_PER_FIRM sloturi ale firmei, deci
 * e singurul lucru care o lasă să ia cereri noi.
 */
export async function POST(request: Request) {
  try {
    const { claimTimestamp, leadId, contacted } = (await request.json()) as {
      claimTimestamp?: string;
      leadId?: string;
      contacted?: boolean;
    };

    if (!claimTimestamp || !leadId) {
      return NextResponse.json({ error: 'claimTimestamp și leadId sunt obligatorii' }, { status: 400 });
    }
    if (typeof contacted !== 'boolean') {
      return NextResponse.json({ error: 'contacted trebuie să fie true sau false' }, { status: 400 });
    }

    const claim = await markClaimContacted(
      claimTimestamp,
      leadId,
      contacted ? todayBucharest() : '',
    );
    return NextResponse.json({ ok: true, contactedAt: claim.contactedAt });
  } catch (err) {
    console.error('Claim contact update error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
