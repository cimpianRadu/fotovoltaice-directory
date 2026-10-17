import { NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/firm-unsubscribe-token';
import { recordUnsubscribe } from '@/lib/firm-unsubscribe';

// Dezabonarea firmelor de la emailurile cu cereri (17 oct 2026). Două intrări,
// amândouă POST, ca un scanner de email care deschide linkul să nu dezaboneze:
//   - butonul de pe /dezabonare (formular, câmpurile e și t);
//   - butonul „Unsubscribe" din Gmail/Outlook (RFC 8058): POST pe URL-ul din
//     antetul List-Unsubscribe, cu e și t în query.

export async function POST(request: Request) {
  const url = new URL(request.url);
  let email = url.searchParams.get('e') || '';
  let token = url.searchParams.get('t') || '';
  const form = await request.formData().catch(() => null);
  const oneClick = form?.get('List-Unsubscribe') === 'One-Click';
  if (!oneClick && form) {
    email = String(form.get('e') || email);
    token = String(form.get('t') || token);
  }

  if (!verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: 'Link invalid.' }, { status: 400 });
  }
  try {
    await recordUnsubscribe(email, oneClick ? 'one-click' : 'pagina');
  } catch (err) {
    console.error('[dezabonare] scriere:', err);
    return NextResponse.json({ error: 'Nu am putut salva. Încearcă din nou.' }, { status: 500 });
  }
  if (oneClick) return NextResponse.json({ ok: true });
  return NextResponse.redirect(new URL(`/dezabonare?gata=1&e=${encodeURIComponent(email)}`, url.origin), 303);
}
