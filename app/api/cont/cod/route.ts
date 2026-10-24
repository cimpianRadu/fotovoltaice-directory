import { NextResponse } from 'next/server';
import { generateLoginCode, isValidEmail, normalizeEmail } from '@/lib/portal-auth';
import { issueLoginCode } from '@/lib/client-auth';
import { clientAccountLive, clientEmailsLive, getLeadsForEmail } from '@/lib/client-account';
import { sendLoginCodeEmail } from '@/lib/email-cont';
import { recordClientEvent } from '@/lib/client-events';

// Pasul 1 al intrării din /cont: emailul. Codul pleacă doar dacă adresa are o
// cerere, dar răspunsul e același oricum, ca nimeni să nu poată afla din pagină
// ce adrese au trimis cereri.

const SAME_ANSWER = {
  ok: true,
  message: 'Dacă adresa are o cerere la noi, v-am trimis un cod de 6 cifre. Verificați și folderul de spam.',
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const raw = typeof body?.email === 'string' ? body.email : '';
  if (!isValidEmail(raw)) {
    return NextResponse.json({ error: 'Scrieți adresa de email cu care ați trimis cererea.' }, { status: 400 });
  }
  if (!clientAccountLive() || !clientEmailsLive()) {
    return NextResponse.json(
      {
        error:
          'Intrarea cu cod pornește în curând. Până atunci, cererea se vede din browserul din care ați trimis-o.',
      },
      { status: 503 },
    );
  }
  const email = normalizeEmail(raw);
  try {
    const leads = await getLeadsForEmail(email);
    await recordClientEvent(leads[0]?.timestamp ?? null, 'cod_cerut', { areCereri: leads.length > 0 });
    if (!leads.length) return NextResponse.json(SAME_ANSWER);
    const code = generateLoginCode();
    if (!(await issueLoginCode(email, code))) {
      return NextResponse.json(
        { error: 'Ați cerut deja mai multe coduri în ultima oră. Folosiți-l pe cel mai recent sau încercați mai târziu.' },
        { status: 429 },
      );
    }
    await sendLoginCodeEmail(email, code);
    return NextResponse.json(SAME_ANSWER);
  } catch (err) {
    console.error('[cont] cod:', err);
    return NextResponse.json({ error: 'A apărut o eroare. Încercați din nou.' }, { status: 500 });
  }
}
