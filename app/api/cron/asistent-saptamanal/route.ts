import { NextResponse } from 'next/server';
import { raportAsistent } from '@/lib/asistent';
import { renderRaportAsistent, sendRaportAsistent } from '@/lib/asistent-raport';

// Raportul de luni despre Watt AI (pilot 12 nov 2026), către Radu. Rulează
// luni la 06:00 UTC (vezi vercel.json) și acoperă cele 7 zile de dinainte,
// tăiate la ora fixă, ca o conversație de la limită să nu intre în două
// rapoarte. Citește doar din Neon, nu atinge Sheets.

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get('authorization') !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  } else {
    console.warn('[cron/asistent-saptamanal] CRON_SECRET not set — endpoint is publicly triggerable.');
  }

  const url = new URL(request.url);
  const zile = Number(url.searchParams.get('zile')) || 7;
  // `?preview=1` întoarce emailul ca pagină, fără să-l trimită (verificare locală).
  const preview = url.searchParams.get('preview') === '1';
  const pana = new Date();
  // Trimiterea se taie la ora fixă; previzualizarea arată tot, până acum.
  if (!preview) pana.setUTCMinutes(0, 0, 0);
  const de = new Date(pana.getTime() - zile * 86_400_000);

  try {
    const raport = await raportAsistent(de, pana, preview && url.searchParams.get('teste') === '1');
    if (preview) {
      return new NextResponse(renderRaportAsistent(raport).html, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    const res = await sendRaportAsistent(raport);
    return NextResponse.json({ ok: res.ok, reason: res.reason, incepute: raport.incepute, note: raport.noteUtil + raport.noteNuPrea });
  } catch (err) {
    console.error('[cron/asistent-saptamanal]', err);
    return NextResponse.json({ error: 'raport eșuat' }, { status: 500 });
  }
}
