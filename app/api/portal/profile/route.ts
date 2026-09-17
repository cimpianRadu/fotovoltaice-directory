import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPortalEmail } from '@/lib/portal-session';
import { saveFirmProfile } from '@/lib/sheets';

// Datele cu care revendică firma dintr-un click: nume, persoană de contact,
// telefon. Se salvează pe adresa logată și valorează pentru toată firma.

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request: Request) {
  const email = await getPortalEmail();
  if (!email) {
    return NextResponse.json({ error: 'Sesiune expirată. Intră din nou în portal.' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const profile = {
      numeFirma: clean(body?.numeFirma, 120),
      numeContact: clean(body?.numeContact, 80),
      telefon: clean(body?.telefon, 30),
    };
    if (!profile.numeFirma || !profile.numeContact || !profile.telefon) {
      return NextResponse.json({ error: 'Completează numele firmei, persoana de contact și telefonul.' }, { status: 400 });
    }
    if (profile.telefon.replace(/\D/g, '').length < 9) {
      return NextResponse.json({ error: 'Telefonul pare incomplet.' }, { status: 400 });
    }
    await saveFirmProfile(email, profile);
    revalidatePath('/portal');
    return NextResponse.json({ ok: true, profile });
  } catch (err) {
    console.error('[portal] profil firmă:', err);
    return NextResponse.json({ error: 'Nu am putut salva. Încearcă din nou.' }, { status: 500 });
  }
}
