import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { addFirmEmailLink, unlinkFirmEmail } from '@/lib/sheets';

/**
 * Legarea a două adrese de email pe aceeași firmă din portal, din /admin/portal.
 *
 * Numai de aici: legătura face vizibile într-un cont datele de client ale
 * revendicărilor făcute de pe cealaltă adresă, deci decizia rămâne a noastră,
 * după ce știm că cele două adrese sunt chiar ale aceleiași firme.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body?.action || 'link');
    const primary = String(body?.primary || '').trim();
    const alias = String(body?.alias || '').trim();

    if (!primary || !alias) {
      return NextResponse.json({ error: 'Ambele adrese sunt obligatorii.' }, { status: 400 });
    }

    if (action === 'unlink') {
      await unlinkFirmEmail(primary, alias);
    } else {
      await addFirmEmailLink({
        primary,
        alias,
        firma: String(body?.firma || ''),
        note: String(body?.note || ''),
      });
    }

    revalidatePath('/admin/portal');
    revalidatePath('/portal');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin] emailuri legate:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
