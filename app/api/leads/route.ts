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
    const { numeContact, email, telefon, tipProiect, judet, gdpr } = body;

    // `field` = atributul name al controlului din formular: LeadForm scrollează
    // și focusează direct câmpul vinovat, mesajul rămâne și în toast.
    const missingBase =
      (!numeContact && 'numeContact') || (!email && 'email') || (!telefon && 'telefon') ||
      (!tipProiect && 'tipProiect') || (!judet && 'judet') || null;
    if (missingBase) {
      return NextResponse.json(
        { error: 'Toate câmpurile obligatorii trebuie completate.', field: missingBase },
        { status: 400 }
      );
    }

    // Restul câmpurilor (acoperiș, fazare, suprafață, putere, finanțare,
    // stocare, wallbox, termen, localitate) NU mai sunt obligatorii aici.
    // Din 17 aug 2026 cererea se trimite cu setul minim vandabil, iar detaliile
    // se strâng după trimitere, prin /api/leads/enrich, pe ecranul de
    // confirmare. Motivul e măsurat: din 182 de afișări ale formularului în
    // 30 de zile au ieșit 29 de cereri, deci 84% abandonau peretele de 15
    // câmpuri obligatorii. Un lead cu nume, telefon și județ e contactabil;
    // unul abandonat nu e nimic.
    //
    // În Sheet, câmpurile necompletate rămân celule goale — la fel ca vechea
    // bifă „Nu știu". Tot ce citește în aval (feedul /cereri, LeadCard,
    // lib/lead-match) tratează deja golul ca lipsă, nu ca eroare.
    if (!gdpr && gdpr !== 'on') {
      return NextResponse.json(
        { error: 'Trebuie să acceptați prelucrarea datelor personale.', field: 'gdpr' },
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
