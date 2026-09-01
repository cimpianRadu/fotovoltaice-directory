import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  addFirmEmailLink,
  FirmEmailInputError,
  renameFirmEmailAlias,
  unlinkFirmEmail,
} from '@/lib/sheets';

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
    } else if (action === 'rename') {
      await renameFirmEmailAlias(primary, alias, String(body?.newAlias || '').trim());
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
    // Adresa greșit tastată e răspunsul așteptat al formularului, nu o
    // defecțiune — 400 cu mesajul ei, fără să umple logurile cu 500-uri.
    if (err instanceof FirmEmailInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[admin] emailuri legate:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
