import { NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  MAX_ACTIVE_CLAIMS_PER_FIRM,
  MAX_CLAIMS_PER_LEAD,
  claimsHeldForLead,
  countActiveClaimsForFirm,
  findSubscriptionForCounty,
  getClaims,
  getFullLeadById,
  getFirmIdentity,
  getLeadSubscriptions,
  hasPortalAccount,
  isLeadClosed,
  isPriorityHeld,
  isSameFirm,
  saveClaimToSheet,
  saveFirmProfile,
} from '@/lib/sheets';
import { isValidEmail, normalizeEmail } from '@/lib/portal-auth';
import { peekPortalEmail } from '@/lib/portal-session';
import { sanitizeAttribution } from '@/lib/attribution';
import { isFirmSource } from '@/lib/utils-shared';
import { sendClaimNotification } from '@/lib/email';
import {
  getConnectionLabel,
  getProjectTypeLabel,
  getRoofTypeLabel,
  getPhaseLabel,
  getBudgetLabel,
  getFinancingLabel,
} from '@/lib/utils-shared';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const leadId = String(body?.leadId || '').trim();
    let { numeFirma, numeContact, telefon, email } = body as Record<string, string>;
    // De unde vine firma: canalul sesiunii (automat) + ce spune ea (opțional).
    // Niciunul nu e condiție: revendicarea pleacă și cu ambele goale.
    const attribution = sanitizeAttribution(body);
    const cumAflatRaw = String(body?.cumAflat || '').trim().toLowerCase();
    const cumAflat = isFirmSource(cumAflatRaw) ? cumAflatRaw : '';

    // Firma cu cont în portal revendică dintr-un click: numele, contactul și
    // telefonul vin din ultima ei revendicare, emailul din sesiune. Nimic din
    // body nu e crezut pe drumul ăsta — altfel un cont ar putea trimite date
    // false sub identitatea lui. Fără sesiune sau fără revendicare anterioară,
    // clientul primește `needsForm` și deschide formularul complet.
    if (body?.fromAccount === true) {
      const sessionEmail = await peekPortalEmail();
      const identity = sessionEmail
        ? await getFirmIdentity(sessionEmail)
        : null;
      if (!sessionEmail || !identity) {
        return NextResponse.json(
          { error: 'Sesiunea a expirat. Completează datele firmei.', needsForm: true },
          { status: 401 },
        );
      }
      email = sessionEmail;
      numeFirma = identity.numeFirma;
      numeContact = identity.numeContact;
      telefon = identity.telefon;
    }

    if (!leadId || !numeFirma?.trim() || !numeContact?.trim() || !telefon?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Toate câmpurile sunt obligatorii.' },
        { status: 400 }
      );
    }

    // Emailul e identitatea firmei în /portal — cu el își vede revendicările,
    // lasă note și renunță. Fără email valid, revendicarea ar rămâne orfană.
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Adresa de email nu este validă.' },
        { status: 400 }
      );
    }

    // Lead-ul trebuie să existe în fereastra publică și să nu fie ascuns —
    // altfel un id inventat ar putea umple sheet-ul cu revendicări orfane.
    const lead = await getFullLeadById(leadId);
    if (!lead) {
      return NextResponse.json(
        { error: 'Cererea nu mai este activă.' },
        { status: 404 }
      );
    }

    // Cererea poate fi închisă între generarea feedului (ISR de 5 minute) și
    // click — clientul a semnat, s-a rezolvat altundeva sau a renunțat.
    if (isLeadClosed(lead.crmStatus)) {
      return NextResponse.json(
        { error: 'Clientul și-a rezolvat deja proiectul. Cererea a fost închisă.' },
        { status: 409 },
      );
    }

    // Cererea rezervată unui abonat nu apare pe /cereri, dar id-ul ei poate fi
    // ghicit (e timestampul) sau reținut dintr-un feed vechi din cache. Fereastra
    // e obligație contractuală, deci se apără și pe server, nu doar prin feed.
    if (isPriorityHeld(lead)) {
      const sub = findSubscriptionForCounty(await getLeadSubscriptions(), lead.judet);
      if (!sub || sub.email !== normalizeEmail(email)) {
        return NextResponse.json(
          { error: 'Cererea nu e disponibilă acum. Revino în câteva ore.' },
          { status: 409 },
        );
      }
    }

    const allClaims = await getClaims();
    // Renunțările nu ocupă locuri — dar rămân în `allClaimsForLead` pentru
    // regula de duplicat: cine a renunțat nu-și mai ia înapoi aceeași cerere
    // singur (ne scrie, o dăm manual — altfel renunțatul devine un buton de
    // ciclat cereri fără niciun apel dat).
    const allClaimsForLead = allClaims.filter((c) => c.leadId === leadId);
    const claimsForLead = claimsHeldForLead(allClaims, leadId);

    if (claimsForLead.length >= MAX_CLAIMS_PER_LEAD) {
      return NextResponse.json(
        { error: 'Cererea a fost deja revendicată de numărul maxim de firme.', full: true },
        { status: 409 }
      );
    }

    // Aceeași regulă de identificare ca la plafonul pe firmă, ca să nu poată o
    // firmă să treacă de una și să cadă în cealaltă cu aceleași date.
    const duplicate = allClaimsForLead.some((c) => isSameFirm(c, { numeFirma, telefon }));
    if (duplicate) {
      return NextResponse.json(
        { error: 'Firma ta a revendicat deja această cerere. Urmărește-o în Portalul Instalatorilor.' },
        { status: 409 }
      );
    }

    // Plafonul pe firmă, verificat DUPĂ duplicat: cine reîncearcă aceeași cerere
    // trebuie să afle că o are deja, nu că e plin. Vezi MAX_ACTIVE_CLAIMS_PER_FIRM.
    const active = countActiveClaimsForFirm(allClaims, { numeFirma, telefon });
    if (active >= MAX_ACTIVE_CLAIMS_PER_FIRM) {
      return NextResponse.json(
        {
          error:
            `Ai deja ${active} cereri pe care nu le-ai mișcat. Sună clienții și ` +
            'mută statusul din Portalul Instalatorilor („În discuții", „Ofertă trimisă"), ' +
            'iar locurile se eliberează pe loc. Scrie-ne la contact@instalatori-fotovoltaice.ro ' +
            'dacă ceva nu merge.',
          firmCapped: true,
        },
        { status: 409 },
      );
    }

    const claim = {
      leadId,
      numeFirma: numeFirma.trim(),
      numeContact: numeContact.trim(),
      telefon: telefon.trim(),
      source: 'self' as const,
      email: normalizeEmail(email),
      attribution,
      cumAflat,
    };
    await saveClaimToSheet(claim);

    // Firma logată care n-are încă profil completează formularul o singură
    // dată: datele de acum devin profilul, iar următoarea revendicare e dintr-un
    // click. Doar când nu există profil, ca „Altă firmă?" să nu-l suprascrie.
    if (body?.fromAccount !== true) {
      const sessionEmail = await peekPortalEmail();
      if (sessionEmail) {
        after(async () => {
          try {
            const existing = await getFirmIdentity(sessionEmail);
            if (!existing?.fromProfile) {
              await saveFirmProfile(sessionEmail, {
                numeFirma: claim.numeFirma,
                numeContact: claim.numeContact,
                telefon: claim.telefon,
              });
            }
          } catch (err) {
            console.error('[claims] profil firmă:', err);
          }
        });
      }
    }

    // Cine are cont în portal nu mai primește apelul de confirmare (regula
    // userului, 15 sept 2026): aprobarea se dă direct din /admin/crm, iar
    // datele clientului apar în portalul firmei. Revendicarea dintr-o sesiune
    // validă e cont prin definiție; restul se verifică în jurnalul de acces.
    const firmHasPortalAccount =
      body?.fromAccount === true || (await hasPortalAccount(claim.email));

    const claimCount = claimsForLead.length + 1;

    // Fără asta, feedul rămâne pe ISR-ul de 5 minute și o altă firmă vede
    // cererea ca nerevendicată imediat după ce a fost luată.
    revalidatePath('/cereri');

    // Fail-open: revendicarea e salvată chiar dacă emailul pică (fără RESEND_API_KEY etc.)
    await sendClaimNotification({
      claim,
      lead: {
        numeCompanie: lead.numeCompanie,
        numeContact: lead.numeContact,
        email: lead.email,
        telefon: lead.telefon,
        tipProiectLabel: getProjectTypeLabel(lead.tipProiect),
        judet: lead.judet,
        putere: lead.putere,
        suprafata: lead.suprafata,
        segment: lead.segment,
        timestamp: lead.timestamp,
        acoperisLabel: lead.tipAcoperis ? getRoofTypeLabel(lead.tipAcoperis) : '',
        fazareLabel: lead.fazare ? getPhaseLabel(lead.fazare) : '',
        consumLunar: lead.consumLunar,
        finantareLabel: lead.finantare ? getFinancingLabel(lead.finantare) : '',
        bransamentLabel: lead.bransament ? getConnectionLabel(lead.bransament) : '',
        bugetLabel: getBudgetLabel(lead.buget),
      },
      claimCount,
      maxClaims: MAX_CLAIMS_PER_LEAD,
      firmHasPortalAccount,
    });

    // `hasAccount` schimbă ce scrie pe ecranul de confirmare: „te sunăm" doar
    // pentru firmele fără cont.
    return NextResponse.json({
      success: true,
      claims: claimCount,
      hasAccount: firmHasPortalAccount,
    });
  } catch (err) {
    console.error('Claims API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă. Vă rugăm încercați din nou.' },
      { status: 500 }
    );
  }
}
