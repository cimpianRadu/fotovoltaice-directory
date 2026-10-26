import { NextResponse } from 'next/server';
import { getClaims, getLeadsSince, getWatches } from '@/lib/sheets';
import { getLeadActivityDetail } from '@/lib/admin-cereri';
import { getProjectTypeLabel } from '@/lib/utils-shared';
import { buildTimeline, type CerereActivitate } from '@/app/admin/cereri/timeline';
import { isHot } from '@/app/admin/cereri/shared';

// Cronologia unei cereri pentru modalul din /admin/cereri (26 oct 2026, cerut de
// Radu: „dau click pe un rând și văd cine ce a făcut, ce mesaje a lăsat”).
// Aceeași cronologie ca în fișă, citită doar la click: lista nu citește
// jurnalele pentru toate cererile.

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id lipsă' }, { status: 400 });

  try {
    const [leads, claims, watches] = await Promise.all([
      getLeadsSince(new Date(0)),
      getClaims(),
      getWatches(),
    ]);
    const lead = leads.find((l) => l.timestamp === id);
    if (!lead) return NextResponse.json({ error: 'cererea nu există' }, { status: 404 });

    let dbError = '';
    const activity = await getLeadActivityDetail(lead).catch((err: unknown) => {
      dbError = err instanceof Error ? err.message : String(err);
      return null;
    });

    const body: CerereActivitate = {
      title: [lead.tipProiect ? getProjectTypeLabel(lead.tipProiect) : '(fără tip)', lead.putere && `${lead.putere} kW`]
        .filter(Boolean)
        .join(' · '),
      hot: isHot(lead),
      place: [lead.judet, lead.localitate].filter(Boolean).join(', '),
      contact: lead.numeContact || lead.numeCompanie || '',
      enteredAt: lead.timestamp,
      mesaj: lead.mesaj,
      timeline: buildTimeline(
        lead,
        claims.filter((c) => c.leadId === id),
        watches.filter((w) => w.leadId === id),
        activity,
      ),
      dbError,
    };
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json(
      { error: `Nu am putut citi din Google Sheets: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 },
    );
  }
}
