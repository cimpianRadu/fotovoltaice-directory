import { NextResponse } from 'next/server';
import {
  PLATFORM_FEEDBACK_ID,
  getClaims,
  getFullLeadById,
  hasFeedback,
  saveClientFeedback,
  saveFirmFeedback,
} from '@/lib/sheets';
import { verifyFeedbackToken } from '@/lib/feedback-token';
import { escapeHtml, sendEmail } from '@/lib/email';
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
// Tot aici vine și /feedback/platforma: părerea generală a unei firme, fără
// cerere, scrisă în „Feedback firme" cu Lead ID = PLATFORM_FEEDBACK_ID.

function text(v: unknown, max = FEEDBACK_TEXT_MAX): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

// Ce a lipsit din cerere(i): doar slugurile cunoscute, separate prin virgulă.
function dateLipsaList(v: unknown): string {
  return Array.isArray(v) ? v.filter((x): x is string => isOption(DATE_LIPSA_OPTIONS, x)).join(', ') : '';
}

function bad(error: string, field?: string) {
  return NextResponse.json({ error, field }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const role =
      body.role === 'firma' || body.role === 'client' || body.role === 'platforma' ? body.role : null;
    const id = role === 'platforma' ? PLATFORM_FEEDBACK_ID : text(body.id, 100);
    const firma = role === 'firma' || role === 'platforma' ? text(body.firma, 200) : '';
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

    // Obligatoriu din 28 sept 2026: fără text n-avem ce publica, chiar dacă
    // omul zice „da” la publicare (Tomuța Ciprian: 5/5, câmp gol).
    if (!text(body.experienta)) {
      return bad('Scrieți-ne în câteva cuvinte cum vi s-a părut.', 'experienta');
    }

    if (role === 'platforma') {
      if (!isOption(DATE_CORECTE_OPTIONS, body.dateCorecte)) {
        return bad('Spuneți-ne dacă datele din cereri sunt corecte.', 'dateCorecte');
      }
      if (!isOption(DATE_UTILE_OPTIONS, body.dateUtile)) {
        return bad('Spuneți-ne ce puteți face cu datele din cereri.', 'dateUtile');
      }
      if (!isOption(FIRM_TESTIMONIAL_OPTIONS, body.testimonial)) {
        return bad('Alegeți dacă putem publica părerea dumneavoastră.', 'testimonial');
      }
      if (await hasFeedback('firma', id, firma)) {
        return NextResponse.json({ success: true, duplicate: true });
      }
      await saveFirmFeedback({
        leadId: id,
        firma,
        judet: '',
        putere: '',
        dateCorecte: body.dateCorecte,
        dateUtile: body.dateUtile,
        dateLipsa: dateLipsaList(body.dateLipsa),
        satisfactie,
        experienta: text(body.experienta),
        imbunatatiri: text(body.imbunatatiri),
        testimonial: body.testimonial,
      });
      await sendEmail({
        to: 'contact@instalatori-fotovoltaice.ro',
        subject: `[Feedback platformă] ${firma}: ${satisfactie}/5${body.testimonial !== 'nu' ? ', acord de publicare' : ''}`,
        html: `<p><strong>${escapeHtml(firma)}</strong>, părere generală despre platformă</p>
<p>Nota: <strong>${satisfactie}/5</strong> · date corecte: ${escapeHtml(String(body.dateCorecte))} · ce pot face cu ele: ${escapeHtml(String(body.dateUtile))}${dateLipsaList(body.dateLipsa) ? ` · ar mai vrea: ${escapeHtml(dateLipsaList(body.dateLipsa))}` : ''}</p>
<p><strong>Cum e colaborarea:</strong><br>${escapeHtml(text(body.experienta))}</p>
${text(body.imbunatatiri) ? `<p><strong>Ce să îmbunătățim:</strong><br>${escapeHtml(text(body.imbunatatiri))}</p>` : ''}
<p>Publicare: <strong>${escapeHtml(String(body.testimonial))}</strong></p>`,
      });
      return NextResponse.json({ success: true });
    }

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
      // Din 6 oct 2026 chestionarul vine și după „Am semnat cu X" din emailul
      // „Ați găsit o ofertă bună?", unde firma n-a bifat neapărat „câștigat":
      // atunci o luăm din răspunsul clientului (AT: „semnat <ISO> <firma>").
      const fromClaims = (await getClaims())
        .filter((c) => c.leadId === id && c.firmStatus === 'castigat')
        .map((c) => c.numeFirma.trim())
        .filter(Boolean)
        .join(', ');
      const fromClient = lead.raspunsClient.startsWith('semnat ')
        ? lead.raspunsClient.split(' ').slice(2).join(' ').trim()
        : '';
      const firmaSemnata = fromClaims || fromClient;
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
      // Emailul „Ați găsit o ofertă bună?" promite „citesc fiecare răspuns":
      // să nu stea doar în Sheet.
      await sendEmail({
        to: 'contact@instalatori-fotovoltaice.ro',
        subject: `[Feedback client] ${lead.judet}: ${satisfactie}/5${body.testimonial !== 'nu' ? ', acord de publicare' : ''}`,
        html: `<p><strong>${escapeHtml((lead.numeContact || lead.numeCompanie).trim())}</strong>, ${escapeHtml(lead.judet)} (cererea ${escapeHtml(id)})</p>
<p>Nota: <strong>${satisfactie}/5</strong> · oferte primite: ${escapeHtml(String(body.oferte))}${firmaSemnata ? ` · a semnat cu: ${escapeHtml(firmaSemnata)}` : ''}</p>
<p><strong>Cum a fost:</strong><br>${escapeHtml(text(body.experienta))}</p>
${text(body.imbunatatiri) ? `<p><strong>Ce să îmbunătățim:</strong><br>${escapeHtml(text(body.imbunatatiri))}</p>` : ''}
<p>Publicare: <strong>${escapeHtml(String(body.testimonial))}</strong></p>`,
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

      const putereRaw = text(body.putere, 20).replace(',', '.');
      const putere = putereRaw && Number.isFinite(Number(putereRaw)) && Number(putereRaw) > 0 ? putereRaw : '';
      await saveFirmFeedback({
        leadId: id,
        firma,
        judet: lead.judet,
        putere,
        dateCorecte: body.dateCorecte,
        dateUtile: body.dateUtile,
        dateLipsa: dateLipsaList(body.dateLipsa),
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
