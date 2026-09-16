import { NextResponse } from 'next/server';
import { getClaims, getFullLeadById, hasFeedback, saveClientFeedback, saveFirmFeedback } from '@/lib/sheets';
import { verifyFeedbackToken } from '@/lib/feedback-token';
import {
  DATE_CORECTE_OPTIONS,
  DATE_LIPSA_OPTIONS,
  DATE_UTILE_OPTIONS,
  FEEDBACK_TEXT_MAX,
  FIRM_TESTIMONIAL_OPTIONS,
  OFERTE_OPTIONS,
  PRIMUL_CONTACT_OPTIONS,
  SATISFACTIE_VALUES,
  TESTIMONIAL_OPTIONS,
  isOption,
} from '@/lib/feedback-shared';

// Feedbackul de după concretizare, trimis de pe /feedback/client sau
// /feedback/firma. Tokenul din link dovedește cine răspunde; fără el nu se
// scrie nimic. Nu atinge cererea, doar adaugă un rând în tabul de feedback.

function text(v: unknown, max = FEEDBACK_TEXT_MAX): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function bad(error: string, field?: string) {
  return NextResponse.json({ error, field }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const role = body.role === 'firma' ? 'firma' : body.role === 'client' ? 'client' : null;
    const id = text(body.id, 100);
    const firma = role === 'firma' ? text(body.firma, 200) : '';
    const token = typeof body.token === 'string' ? body.token : '';
    if (!role || !id || !token || !verifyFeedbackToken(token, role, id, firma)) {
      return NextResponse.json(
        { error: 'Legătura a expirat sau nu este validă. Scrieți-ne și o refacem.' },
        { status: 403 },
      );
    }

    const satisfactie = (SATISFACTIE_VALUES as readonly string[]).includes(String(body.satisfactie))
      ? String(body.satisfactie)
      : '';
    if (!satisfactie) return bad('Alegeți o notă de la 1 la 5.', 'satisfactie');

    const lead = await getFullLeadById(id);
    if (!lead) return NextResponse.json({ error: 'Cererea nu mai există.' }, { status: 404 });

    if (await hasFeedback(role, id, firma)) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    if (role === 'client') {
      if (!isOption(OFERTE_OPTIONS, body.oferte)) return bad('Spuneți-ne câte oferte ați primit.', 'oferte');
      const primulContact = isOption(PRIMUL_CONTACT_OPTIONS, body.primulContact) ? body.primulContact : '';
      if (body.oferte !== '0' && !primulContact) {
        return bad('Spuneți-ne în cât timp v-a contactat prima firmă.', 'primulContact');
      }
      if (!isOption(TESTIMONIAL_OPTIONS, body.testimonial)) {
        return bad('Alegeți dacă putem folosi răspunsul.', 'testimonial');
      }
      // Firma cu care a semnat nu se mai întreabă (16 sept 2026): linkul pleacă
      // abia după ce revendicarea ei e pe „câștigat", deci o citim de acolo.
      const firmaSemnata = (await getClaims())
        .filter((c) => c.leadId === id && c.firmStatus === 'castigat')
        .map((c) => c.numeFirma.trim())
        .filter(Boolean)
        .join(', ');
      await saveClientFeedback({
        leadId: id,
        client: (lead.numeContact || lead.numeCompanie).trim(),
        judet: lead.judet,
        oferte: body.oferte,
        primulContact,
        firmaSemnata,
        satisfactie,
        experienta: text(body.experienta),
        imbunatatiri: text(body.imbunatatiri),
        testimonial: body.testimonial,
      });
    } else {
      if (!isOption(DATE_CORECTE_OPTIONS, body.dateCorecte)) {
        return bad('Spuneți-ne dacă datele din cerere erau corecte.', 'dateCorecte');
      }
      if (!isOption(DATE_UTILE_OPTIONS, body.dateUtile)) {
        return bad('Spuneți-ne ce ați putut face cu datele din cerere.', 'dateUtile');
      }
      if (!isOption(FIRM_TESTIMONIAL_OPTIONS, body.testimonial)) {
        return bad('Alegeți dacă putem publica părerea dumneavoastră.', 'testimonial');
      }
      const dateLipsa = Array.isArray(body.dateLipsa)
        ? body.dateLipsa.filter((v): v is string => isOption(DATE_LIPSA_OPTIONS, v))
        : [];
      const putereRaw = text(body.putere, 20).replace(',', '.');
      const putere = putereRaw && Number.isFinite(Number(putereRaw)) && Number(putereRaw) > 0 ? putereRaw : '';
      await saveFirmFeedback({
        leadId: id,
        firma,
        judet: lead.judet,
        putere,
        dateCorecte: body.dateCorecte,
        dateUtile: body.dateUtile,
        dateLipsa: dateLipsa.join(', '),
        satisfactie,
        experienta: text(body.experienta),
        imbunatatiri: text(body.imbunatatiri),
        testimonial: body.testimonial,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Feedback API error:', err);
    return NextResponse.json({ error: 'Eroare internă. Vă rugăm încercați din nou.' }, { status: 500 });
  }
}
