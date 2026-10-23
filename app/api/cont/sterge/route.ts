import { NextResponse } from 'next/server';
import { CLIENT_LEAD_COOKIE, CLIENT_SESSION_COOKIE, getClientViewer } from '@/lib/client-auth';
import { getLeadsForEmail, requestAccountDeletion } from '@/lib/client-account';

// „Ștergeți contul și datele mele”. Cere emailul dovedit (link sau cod), nu doar
// cookie-ul de după formular: ștergerea e a adresei, nu a unei cereri.

export async function POST() {
  const viewer = await getClientViewer();
  if (!viewer.email) {
    return NextResponse.json(
      { error: 'Pentru ștergere, intrați în cont din linkul primit pe email sau cu un cod.' },
      { status: 401 },
    );
  }
  try {
    await requestAccountDeletion(viewer.email, await getLeadsForEmail(viewer.email));
    const res = NextResponse.json({ ok: true });
    res.cookies.delete(CLIENT_SESSION_COOKIE);
    res.cookies.delete(CLIENT_LEAD_COOKIE);
    return res;
  } catch (err) {
    console.error('[cont] ștergere:', err);
    return NextResponse.json({ error: 'A apărut o eroare. Scrieți-ne la contact@instalatori-fotovoltaice.ro.' }, { status: 500 });
  }
}
