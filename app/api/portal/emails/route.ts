import { NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPortalEmail } from '@/lib/portal-session';
import {
  addPortalFirmEmail,
  PortalFirmEmailError,
  removePortalFirmEmail,
} from '@/lib/portal-firm-emails';
import {
  sendPortalEmailAddedEmail,
  sendPortalEmailRemovedEmail,
  sendPortalFirmEmailChangeNotification,
} from '@/lib/email';

// Adresele firmei, din portal: adaugă un coleg sau scoate o adresă veche.
// Regulile (ce nu se poate adăuga, ce se mută la scoatere) sunt în
// lib/portal-firm-emails.ts; ruta doar verifică sesiunea și trimite emailurile.

export async function POST(request: Request) {
  const sessionEmail = await getPortalEmail();
  if (!sessionEmail) {
    return NextResponse.json({ error: 'Sesiune expirată. Intră din nou în portal.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body?.action === 'remove' ? 'remove' : 'add';
    const email = String(body?.email || '');

    const change =
      action === 'add'
        ? await addPortalFirmEmail(sessionEmail, email)
        : await removePortalFirmEmail(sessionEmail, email);

    // Emailurile pleacă după răspuns: un Resend picat nu anulează o schimbare
    // deja scrisă în Sheets.
    after(async () => {
      const notice = { to: change.email, by: change.by, firma: change.firma };
      await Promise.allSettled([
        action === 'add' ? sendPortalEmailAddedEmail(notice) : sendPortalEmailRemovedEmail(notice),
        sendPortalFirmEmailChangeNotification({ action, ...change }),
      ]);
    });

    revalidatePath('/portal');
    revalidatePath('/admin/portal');
    return NextResponse.json({ ok: true, addresses: change.addresses });
  } catch (err) {
    if (err instanceof PortalFirmEmailError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[portal] adresele firmei:', err);
    return NextResponse.json({ error: 'Nu am putut salva. Încearcă din nou.' }, { status: 500 });
  }
}
