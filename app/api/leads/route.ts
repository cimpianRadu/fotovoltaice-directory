import { NextResponse } from 'next/server';
import { saveLeadToSheet } from '@/lib/sheets';

// v3 lărgește destinatarii la partenerii de finanțare, DOAR pentru cererile care
// declară o rută de finanțare printr-un program (coloana Y). Cererile pe fonduri
// proprii și cele strânse sub v2 nu sunt acoperite: pe alea nu le trimite nimănui
// în afara firmelor de instalare. Vezi textul din components/forms/LeadForm.tsx.
const CONSENT_VERSION = 'v3-2026-07-29';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // numeCompanie is optional — residential leads have no company name.
    const { numeContact, email, telefon, tipProiect, judet, tipAcoperis, finantare, gdpr } = body;

    if (!numeContact || !email || !telefon || !tipProiect || !judet) {
      return NextResponse.json(
        { error: 'Toate câmpurile obligatorii trebuie completate.' },
        { status: 400 }
      );
    }

    // Dropdown-urile marcate obligatorii în formular se verifică și aici:
    // validarea de browser din SearchableSelect poate fi ocolită (cache vechi,
    // POST direct), iar pe 3 aug 2026 a trecut o cerere fără tip de acoperiș.
    // Mesajul numește câmpul: formularul îl afișează ca atare în toast.
    if (!tipAcoperis) {
      return NextResponse.json(
        { error: 'Alegeți tipul de acoperiș.' },
        { status: 400 }
      );
    }
    if (!finantare) {
      return NextResponse.json(
        { error: 'Alegeți cum finanțați investiția.' },
        { status: 400 }
      );
    }

    if (!gdpr && gdpr !== 'on') {
      return NextResponse.json(
        { error: 'Trebuie să acceptați prelucrarea datelor personale.' },
        { status: 400 }
      );
    }

    // Versiunea textului de consimțământ acceptat — dovadă GDPR per lead.
    const id = await saveLeadToSheet({ ...body, gdprConsent: `da (${CONSENT_VERSION})` });

    // `id` = timestamp-ul rândului, aceeași cheie folosită de /cereri și de
    // revendicări. Se întoarce ca să putem lega de cerere pozele trimise ulterior.
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('Lead API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă. Vă rugăm încercați din nou.' },
      { status: 500 }
    );
  }
}
