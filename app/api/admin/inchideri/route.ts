import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { notifyFirmsClientClosed } from '@/lib/lead-closed-firms';
import { KEEP_OPEN_PREFIX, OUTCOME_LABELS, type ClosingOutcome } from '@/lib/inchideri-rules';
import { bucharestStamp } from '@/lib/portal-session';
import { getClaims, getLeadsSince, isLeadClosed, updateLeadCrm } from '@/lib/sheets';

const OUTCOMES = Object.keys(OUTCOME_LABELS) as ClosingOutcome[];

/**
 * Decizia din /admin/inchideri. „inchide” = starea cererii + nota cu citatul,
 * apoi, dacă e bifat, emailul „Cerere închisă” către firmele încă pe ea (același
 * ca la închiderea de către client). „pastreaza” = doar o notă, care scoate
 * semnalele de până acum din listă.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      action?: string;
      status?: string;
      motiv?: string;
      anunta?: boolean;
    };
    const id = String(body.id || '');
    const motiv = String(body.motiv || '').replace(/\s+/g, ' ').trim().slice(0, 400);
    if (!id) return NextResponse.json({ error: 'id lipsă' }, { status: 400 });

    const lead = (await getLeadsSince(new Date(0))).find((l) => l.timestamp === id);
    if (!lead) return NextResponse.json({ error: 'Cererea nu există.' }, { status: 404 });
    if (isLeadClosed(lead.crmStatus)) {
      return NextResponse.json({ error: `Cererea e deja închisă (${lead.crmStatus}).` }, { status: 409 });
    }

    if (body.action === 'pastreaza') {
      await updateLeadCrm(id, {
        note: `${KEEP_OPEN_PREFIX}${motiv ? `: ${motiv}` : ''}.`,
        by: 'admin',
        ...bucharestStamp(),
      });
      revalidatePath('/admin/inchideri');
      return NextResponse.json({ ok: true });
    }

    if (body.action !== 'inchide') {
      return NextResponse.json({ error: 'acțiune necunoscută' }, { status: 400 });
    }
    const status = body.status as ClosingOutcome;
    if (!OUTCOMES.includes(status)) {
      return NextResponse.json({ error: 'stare necunoscută' }, { status: 400 });
    }

    await updateLeadCrm(id, {
      status,
      note: `Închisă din „De închis”: ${OUTCOME_LABELS[status].toLowerCase()}${motiv ? `. ${motiv}` : ''}.`,
      by: 'admin',
      ...bucharestStamp(),
    });

    let notified = false;
    if (body.anunta) {
      // Firma care a semnat nu primește „s-a ales altă firmă”.
      const winner =
        status === 'castigata'
          ? (await getClaims()).find((c) => c.leadId === id && !c.releasedAt && c.firmStatus === 'castigat')
          : undefined;
      // `lead` e starea de dinainte: fără ea, funcția ar crede că e deja închisă și n-ar trimite.
      await notifyFirmsClientClosed(lead, status, winner?.timestamp ?? '');
      notified = true;
    }

    revalidatePath('/cereri');
    revalidatePath('/admin/crm');
    revalidatePath('/admin/inchideri');
    return NextResponse.json({ ok: true, notified });
  } catch (err) {
    console.error('[inchideri] decizie:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
