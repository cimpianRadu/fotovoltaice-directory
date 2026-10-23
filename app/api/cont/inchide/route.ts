import { NextResponse } from 'next/server';
import { isLeadClosed } from '@/lib/sheets-shared';
import { closeFromAccount, leadForViewer, type CloseRequest } from '@/lib/client-account';

// „Am ales o firmă” / „Nu mai fac lucrarea” din cont.

function parse(body: Record<string, unknown> | null): CloseRequest | null {
  if (body?.kind === 'aleasa') {
    return {
      kind: 'aleasa',
      claimTs: typeof body.claimTs === 'string' ? body.claimTs : undefined,
      firma: typeof body.firma === 'string' ? body.firma : undefined,
    };
  }
  if (body?.kind === 'renunt') {
    const motive = Array.isArray(body.motive) ? body.motive.filter((m): m is string => typeof m === 'string') : [];
    return { kind: 'renunt', motive, altceva: typeof body.altceva === 'string' ? body.altceva : undefined };
  }
  return null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const leadId = typeof body?.leadId === 'string' ? body.leadId : '';
  const req = parse(body);
  if (!req) return NextResponse.json({ error: 'Alegeți o variantă.' }, { status: 400 });
  const access = await leadForViewer(leadId);
  if (!access) return NextResponse.json({ error: 'Intrați în cont ca să continuați.' }, { status: 401 });
  if (isLeadClosed(access.lead.crmStatus)) return NextResponse.json({ ok: true });
  try {
    await closeFromAccount(access.lead, req);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[cont] închide:', err);
    return NextResponse.json({ error: 'Nu am putut închide cererea. Încercați din nou.' }, { status: 500 });
  }
}
