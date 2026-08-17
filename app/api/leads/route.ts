import { NextResponse } from 'next/server';
import { saveLeadToSheet } from '@/lib/sheets';

// v3 lărgea destinatarii la partenerii de finanțare, dar bifa spunea „finanțare
// printr-un program", ceea ce lăsa pe dinafară tocmai creditul bancar, adică
// ruta cea mai frecventă. Politica de confidențialitate descria de la început
// domeniul corect (credit, program de sprijin sau nehotărât, cu excluderea
// fondurilor proprii), deci v4 aliniază bifa la politică, nu invers.
//
// Ce NU se schimbă: cererile pe fonduri proprii rămân în afara oricărei
// transmiteri către finanțatori, iar cele strânse sub v2 și v3 păstrează
// domeniul lor mai îngust. Consimțământul nu se extinde retroactiv, de aceea
// versiunea se scrie per cerere în coloana R. Filtrul e în lib/consent.ts.
const CONSENT_VERSION = 'v4-2026-08-17';

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
