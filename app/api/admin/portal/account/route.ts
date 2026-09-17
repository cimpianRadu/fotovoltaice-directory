import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { setAccountsDeactivated } from '@/lib/sheets';

/**
 * Dezactivarea / reactivarea unui cont de portal, din /admin/portal.
 *
 * Primește toate adresele contului (cardul le știe deja, grupate din
 * „Emailuri Firmă"): se scriu toate, ca oricare dintre ele să fie oprită la
 * login fără să mai rezolvăm grupul acolo.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emails: string[] = Array.isArray(body?.emails)
      ? body.emails.map((e: unknown) => String(e || '').trim()).filter(Boolean)
      : [];
    const action = String(body?.action || '');
    if (!emails.length || (action !== 'deactivate' && action !== 'reactivate')) {
      return NextResponse.json({ error: 'Cerere invalidă.' }, { status: 400 });
    }

    await setAccountsDeactivated(emails, action === 'deactivate', String(body?.note || '').slice(0, 300));

    revalidatePath('/admin/portal');
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin] dezactivare cont:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
