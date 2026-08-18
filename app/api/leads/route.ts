import { NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  findSubscriptionForCounty,
  getCountyAlertRecipients,
  getLeadSubscriptions,
  markLeadAlertsSent,
  markLeadPriorityUntil,
  saveLeadToSheet,
} from '@/lib/sheets';
import { sendCountyLeadAlert } from '@/lib/email';
import {
  getFinancingLabel,
  getProjectTypeLabel,
  getRoofTypeLabel,
  getTimelineLabel,
} from '@/lib/utils-shared';

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

    // Finanțarea, termenul și puterea sunt obligatorii din 18 aug 2026, cu
    // răspuns onest de „nu știu" la fiecare. Motivul e măsurat pe cererile din
    // era formularului relaxat: cine sare peste pasul 4 nu mai completează
    // niciodată, iar cererea ajunge la firme fără exact ce întreabă ele prima
    // dată. Restul (acoperiș, consum, suprafață, fazare, stocare, wallbox,
    // localitate) rămâne opțional.
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
    // Listele au „nu știu" printre opțiuni, deci aici cerem doar să existe un
    // răspuns. Un formular vechi din cache poate trimite fără ele, de aceea
    // verificarea e și pe server, cu `field` pentru focus.
    const missingDetail =
      (!body.finantare && 'finantare') || (!body.termen && 'termen') || null;
    if (missingDetail) {
      return NextResponse.json(
        {
          error:
            missingDetail === 'finantare'
              ? 'Alegeți cum finanțați investiția (sau „Nu știu încă").'
              : 'Alegeți cât de repede vreți instalarea (sau „Deocamdată mă informez").',
          field: missingDetail,
        },
        { status: 400 },
      );
    }

    // Puterea e câmp liber, deci n-are „nu știu" în listă: vine ori cifra, ori
    // bifa care dezactivează inputul. În Sheet, bifa rămâne celulă goală —
    // coloana I e numerică peste tot în aval (/cereri, lib/lead-match).
    if (!body.putere && !body.putereNecunoscuta) {
      return NextResponse.json(
        { error: 'Completați puterea dorită sau bifați „Nu știu".', field: 'putere' },
        { status: 400 },
      );
    }

    if (!gdpr && gdpr !== 'on') {
      return NextResponse.json(
        { error: 'Trebuie să acceptați prelucrarea datelor personale.', field: 'gdpr' },
        { status: 400 }
      );
    }

    // Versiunea textului de consimțământ acceptat — dovadă GDPR per lead.
    const id = await saveLeadToSheet({ ...body, gdprConsent: `da (${CONSENT_VERSION})` });

    // Feedul /cereri are ISR de 5 minute, deci fără invalidare cererea abia
    // trimisă nu apare imediat nici după un reload forțat (cache-ul e pe
    // server, nu în browser). La 5-7 cereri pe săptămână, invalidarea costă o
    // regenerare per cerere și scutește firmele de așteptare.
    revalidatePath('/cereri');

    // Alertele pe județ pleacă DUPĂ răspuns: cererea e deja salvată, iar
    // clientul n-are de ce să aștepte după Sheets și Resend. Eșecul lor nu
    // atinge cererea, ca la restul notificărilor.
    after(() => notifyCountyAlerts(body, id).catch((err) =>
      console.error('[leads] alerte județ:', err),
    ));

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

/**
 * Emailul „a intrat o cerere în județul tău" către firmele care au bifat județul
 * în /portal. Datele trimise sunt cele din pasul 4 al formularului (putere,
 * consum, acoperiș, finanțare, termen) — restul (suprafață, fazare, baterie)
 * vin prin /api/leads/enrich, adică după ce alerta a plecat deja, și se văd pe
 * /cereri. Alerta e un semnal de „intră și uită-te", nu fișa completă.
 */
async function notifyCountyAlerts(body: Record<string, string>, leadId: string) {
  // Cererile de test ale rutinei de sănătate (scripts/e2e-forms.mjs) intră pe
  // aceeași rută și se șterg singure din Sheet, dar un email plecat spre firme
  // nu se mai retrage. Prefixul e cel din script.
  if ((body.email || '').trim().toLowerCase().startsWith('routine-test-')) return;

  const judet = (body.judet || '').trim();
  const finantare = (body.finantare || '').trim();
  const payload = {
    judet,
    tipProiectLabel: getProjectTypeLabel((body.tipProiect || '').trim()),
    segment: (body.segment || '').trim(),
    putere: (body.putere || '').trim(),
    consumLunar: (body.consumLunar || '').trim(),
    acoperisLabel: body.tipAcoperis ? getRoofTypeLabel(body.tipAcoperis.trim()) : '',
    finantareSlug: finantare,
    finantareLabel: finantare ? getFinancingLabel(finantare) : '',
    termenLabel: body.termen ? getTimelineLabel(body.termen.trim()) : '',
  };

  // Abonamentul pe județ ia cererea primul, singur, pentru fereastra lui.
  // Coloana AE o scoate din /cereri și blochează revendicările altora; ceilalți
  // primesc alerta abia după expirare, prin cronul zilnic.
  const sub = findSubscriptionForCounty(await getLeadSubscriptions(), judet);
  if (sub) {
    const until = new Date(Date.now() + sub.windowHours * 60 * 60 * 1000).toISOString();
    await markLeadPriorityUntil(leadId, until);
    // Feedul are ISR de 5 minute: fără invalidare, cererea rezervată ar putea
    // apărea public în fereastra dintre salvare și regenerare.
    revalidatePath('/cereri');
    const sent = await sendCountyLeadAlert({ to: sub.email, ...payload, reservedUntil: until });
    console.log(
      `[leads] ${judet}: rezervată pentru ${sub.firma} până ${until} (email: ${sent.ok ? 'trimis' : 'eșuat'})`,
    );
    return;
  }

  const recipients = await getCountyAlertRecipients(judet);
  // Marcajul se scrie și când nu e nimeni abonat pe județ: altfel cronul ar
  // relua la nesfârșit cereri pentru care n-are cui trimite.
  await markLeadAlertsSent(leadId);
  if (!recipients.length) return;

  // Câte un email per firmă, nu un `to` cu toată lista: firmele n-au de ce să
  // vadă cine mai primește cererea.
  const results = await Promise.allSettled(
    recipients.map((to) => sendCountyLeadAlert({ to, ...payload })),
  );
  const failed = results.filter((r) => r.status === 'rejected' || !r.value.ok).length;
  console.log(
    `[leads] alerte județ ${judet}: ${recipients.length - failed}/${recipients.length} trimise`,
  );
}
