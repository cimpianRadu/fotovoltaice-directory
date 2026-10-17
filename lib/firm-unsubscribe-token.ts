// Linkul „Nu mai vreau emailuri cu cereri" din emailurile către firme (17 oct
// 2026): rezumatul de luni și alertele pe județ. Legea 506/2004 cere în fiecare
// mesaj o cale simplă de oprire, iar Gmail penalizează expeditorii fără ea.
//
// Tokenul e semnat cu PORTAL_SECRET peste adresă, fără expirare: un link de
// dezabonare dintr-un email vechi trebuie să meargă oricând. Nu deschide nimic
// altceva decât oprirea emailurilor pentru adresa respectivă.

import { createHmac, timingSafeEqual } from 'node:crypto';

const BASE_URL = 'https://instalatori-fotovoltaice.ro';

function sign(email: string): string {
  const secret = process.env.PORTAL_SECRET;
  if (!secret) throw new Error('PORTAL_SECRET lipsește: nu pot semna linkurile de dezabonare.');
  return createHmac('sha256', secret).update(`dezabonare-firma:${email}`).digest('hex');
}

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(sign(normalize(email)));
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function query(email: string): string {
  const e = normalize(email);
  return `e=${encodeURIComponent(e)}&t=${sign(e)}`;
}

/** Pagina cu butonul de confirmare, pentru linkul din subsolul emailului. */
export function unsubscribePageUrl(email: string): string {
  return `${BASE_URL}/dezabonare?${query(email)}`;
}

/**
 * Antetele RFC 8058: Gmail și Outlook arată butonul lor „Unsubscribe", care
 * face POST direct aici, fără pagină. Linkul din corpul emailului rămâne pe
 * pagina cu buton, fiindcă scannerele de email deschid singure linkurile.
 */
export function unsubscribeHeaders(email: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${BASE_URL}/api/dezabonare?${query(email)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}
