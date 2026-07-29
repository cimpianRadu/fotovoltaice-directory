import { NextResponse } from 'next/server';
import { LEAD_STATUSES, updateLeadCrm, type LeadStatus } from '@/lib/sheets';

function todayBucharest(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
}

export async function POST(request: Request) {
  try {
    const { id, status, note } = (await request.json()) as {
      id?: string;
      status?: string;
      note?: string;
    };

    if (!id) return NextResponse.json({ error: 'id lipsă' }, { status: 400 });
    if (status && !(LEAD_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'status necunoscut' }, { status: 400 });
    }
    if (!status && !note?.trim()) {
      return NextResponse.json({ error: 'nimic de salvat' }, { status: 400 });
    }

    const fields = await updateLeadCrm(id, {
      status: status as LeadStatus | undefined,
      note,
      today: todayBucharest(),
    });
    return NextResponse.json({ ok: true, ...fields });
  } catch (err) {
    console.error('Lead CRM update error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
