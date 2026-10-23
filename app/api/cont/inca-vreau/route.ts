import { NextResponse } from 'next/server';
import { bumpLead, leadForViewer } from '@/lib/client-account';

// „Încă vreau oferte” din cont: cererea urcă în capul listei și pleacă din nou la
// firmele din județ și din vecine. De 2 ori în 7 zile (lib/client-account).

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { leadId?: unknown } | null;
  const leadId = typeof body?.leadId === 'string' ? body.leadId : '';
  const access = await leadForViewer(leadId);
  if (!access) return NextResponse.json({ error: 'Intrați în cont ca să continuați.' }, { status: 401 });
  try {
    const result = await bumpLead(access.lead, access.viewer.email ?? access.lead.email);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ ok: true, firms: result.firms });
  } catch (err) {
    console.error('[cont] încă vreau:', err);
    return NextResponse.json({ error: 'A apărut o eroare. Încercați din nou.' }, { status: 500 });
  }
}
