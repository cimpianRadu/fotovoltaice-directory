// Emailurile către CLIENT din fluxul „mă informez" (14 sept 2026). Până acum
// clientul nu primea nimic automat după trimitere; cel care bifează „deocamdată
// mă informez" primește de la platformă exact ce a cerut (informare), nu trei
// telefoane. Textele au fost aprobate de Radu pe 14 sept 2026; schimbările de
// copy trec întâi pe la el (vezi feedback_email_draft_review_before_send).
//
// Trei emailuri:
//   1. întâmpinarea, la trimitere (sau a doua zi, prin cron, dacă a sărit pasul 5)
//   2. check-in-ul la 30 și la 60 de zile
//   3. anunțul de deschidere a programului, trimis o dată din /admin/informez
//
// Fiecare poartă butonul „Sunt gata pentru oferte", care deschide pagina de
// actualizare a cererii, și linkul „nu mă mai contactați", care o închide.
//
// Plus, din 21 sept 2026, verificarea „mai căutați oferte?" pentru cererile
// obișnuite (nu „mă informez"), trimisă din /api/admin/confirmare-activa.

import { sendEmail, escapeHtml, PORTAL_BASE_URL } from './email';
import { clientLinkUrl } from './lead-client-token';
import { getKitPriceCurve, medianPricePerKwp } from './kit-price-curve';
import { formatNumber, getProgramName } from './utils-shared';
import type { NewLead } from './sheets';

const REPLY_TO = 'contact@instalatori-fotovoltaice.ro';

/** Ghidurile spre care trimitem, pe segment. Slug-urile sunt cele din data/guides.json. */
const LINKS = {
  pret: `${PORTAL_BASE_URL}/pret-panouri-fotovoltaice`,
  calculator: `${PORTAL_BASE_URL}/calculator-panouri-fotovoltaice`,
  finantare: `${PORTAL_BASE_URL}/finantare`,
  meritaBateria: `${PORTAL_BASE_URL}/ghid/merita-bateria-fotovoltaica-2026-amortizare-astepti-casa-verde`,
  meritaFirma: `${PORTAL_BASE_URL}/ghid/merita-panouri-fotovoltaice-firma-2026`,
  sistemCasa: `${PORTAL_BASE_URL}/ghid/sistem-fotovoltaic-3-5-10-kw-casa-pret-productie-amortizare-2026`,
  sistemFirma: `${PORTAL_BASE_URL}/ghid/sistem-fotovoltaic-50-100-250-kw-firma-pret-suprafata-productie`,
  baterieDimensionare: `${PORTAL_BASE_URL}/ghid/baterie-3-5-10-kw-dimensionare-dupa-puterea-sistemului-2026`,
  casaVerdeBaterii: `${PORTAL_BASE_URL}/ghid/casa-verde-baterii-2026-program-stocare-afm`,
  casaVerde: `${PORTAL_BASE_URL}/ghid/casa-verde-fotovoltaice-2026`,
};

function programGuide(finantare: string): string {
  if (finantare === 'afm-baterii') return LINKS.casaVerdeBaterii;
  if (finantare === 'casa-verde') return LINKS.casaVerde;
  return LINKS.finantare;
}

function a(href: string, text: string): string {
  return `<a href="${href}" style="color:#1d4ed8">${escapeHtml(text)}</a>`;
}

function p(html: string): string {
  return `<p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px">${html}</p>`;
}

function button(href: string, text: string): string {
  return `<div style="text-align:center;margin:8px 0 20px"><a href="${href}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#ffffff;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none">${escapeHtml(text)}</a></div>`;
}

function secondaryButton(href: string, text: string): string {
  return `<a href="${href}" style="display:inline-block;margin:4px;padding:11px 18px;background:#ffffff;border:1px solid #d1d5db;color:#111827;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none">${escapeHtml(text)}</a>`;
}

function fmtDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Cadrul comun: antet, corp, semnătură, subsol cu motivul și linkul de renunț. */
function layout(lead: NewLead, body: string): string {
  const renunt = clientLinkUrl(lead.timestamp, 'renunt');
  return `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="padding:16px 24px;border-bottom:1px solid #e5e7eb;background:#fffbeb;font-size:13px;color:#92400e;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Instalatori Fotovoltaice</div>
    <div style="padding:24px">
      ${body}
      <p style="font-size:15px;line-height:1.6;color:#374151;margin:0">Radu Cîmpian<br><span style="color:#6b7280">instalatori-fotovoltaice.ro</span></p>
    </div>
    <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.5">
      Primiți acest mesaj pentru că ați trimis o cerere pe instalatori-fotovoltaice.ro pe ${escapeHtml(fmtDay(lead.timestamp))}.
      Dacă nu mai doriți să fiți contactat, apăsați aici: <a href="${renunt}" style="color:#6b7280">nu mă mai contactați</a>.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Blocul de preț orientativ: mediana și intervalul din curba de prețuri de pe
 * pagina de preț (oferte publice, cu montaj și TVA), pentru puterea din cerere.
 * Nicio cifră nu e scrisă de mână aici. Fără putere, sau peste 20 kWp (unde
 * curba e subțire și cererea e comercială), rămâne doar linkul.
 */
function priceBlock(lead: NewLead): string {
  const kwp = Number(String(lead.putere).replace(',', '.'));
  const curve = getKitPriceCurve();
  const point = Number.isFinite(kwp) && kwp > 0 && kwp <= 20 ? medianPricePerKwp(curve, kwp) : null;
  if (!point || lead.segment !== 'rezidential') {
    return p(
      `Ofertele publice pe care le urmărim, pe intervale de putere, sunt aici: ${a(LINKS.pret, 'prețuri panouri fotovoltaice cu montaj')}. Cifra exactă v-o poate da doar o ofertă pe casa dumneavoastră, când veți dori una.`,
    );
  }
  const round100 = (n: number) => Math.round(n / 100) * 100;
  const total = round100(point.median * kwp);
  const min = round100(point.min * kwp);
  const max = round100(point.max * kwp);
  return p(
    `Pentru un sistem de ${escapeHtml(lead.putere)} kW, ofertele publice pe care le urmărim au o mediană în jur de <strong>${formatNumber(point.median)} lei pe kW instalat</strong>, cu montaj și TVA, deci un ordin de mărime de <strong>${formatNumber(total)} lei</strong>. Intervalul real e larg, de la circa ${formatNumber(min)} la ${formatNumber(max)} lei, în funcție de echipamente și de acoperiș. Detaliile pe puteri sunt aici: ${a(LINKS.pret, 'prețuri pe intervale de putere')}. Cifra exactă v-o poate da doar o ofertă pe casa dumneavoastră, când veți dori una.`,
  );
}

/** Blocul din mijlocul emailului de întâmpinare, după răspunsul de la pasul 5. */
function blocajBlock(lead: NewLead): string {
  const rezidential = lead.segment === 'rezidential';
  const program = getProgramName(lead.finantare) || 'programul de finanțare';
  switch (lead.blocaj) {
    case 'astept-program':
      return p(
        `Ați bifat că așteptați ${escapeHtml(program)}. Vă anunțăm prin email în ziua în care se deschide sesiunea, cu ce trebuie pregătit înainte. Până atunci, aveți aici pe scurt condițiile cunoscute la această dată: ${a(programGuide(lead.finantare), `ghidul ${program}`)}.`,
      );
    case 'pret':
      return priceBlock(lead);
    case 'merita':
      return p(
        `Cel mai rapid răspuns îl dă calculatorul nostru, cu consumul dumneavoastră lunar și județul: ${a(LINKS.calculator, 'calculatorul de producție și economie')}. ${
          rezidential
            ? `Pentru baterie, am scris separat când merită și când nu: ${a(LINKS.meritaBateria, 'merită bateria fotovoltaică în 2026?')}.`
            : `Pentru o firmă, am scris separat când merită și când nu: ${a(LINKS.meritaFirma, 'merită panourile fotovoltaice pentru firmă?')}.`
        }`,
      );
    case 'buget':
      return p(
        `Am adunat într-un singur loc cum arată piața de finanțare în rate pentru sisteme fotovoltaice, fără să recomandăm un credit anume: ${a(LINKS.finantare, 'finanțare panouri fotovoltaice')}. Dacă aveți nevoie de o ofertă ca să calculați rata, apăsați butonul de mai jos și cereți firmei varianta cu finanțare.`,
      );
    case 'ce-sistem':
      return rezidential
        ? p(
            `Pentru o casă, cele mai frecvente puteri sunt 3, 5 și 10 kW. Am scris ce produce fiecare, cât costă și în cât se amortizează: ${a(LINKS.sistemCasa, 'sistem fotovoltaic de 3, 5 sau 10 kW')}. Dacă aveți deja panouri și vă interesează doar bateria: ${a(LINKS.baterieDimensionare, 'ce baterie se potrivește sistemului')}.`,
          )
        : p(
            `Pentru o firmă, am scris ce produce, cât costă și câtă suprafață cere un sistem de 50, 100 sau 250 kW: ${a(LINKS.sistemFirma, 'sistem fotovoltaic pentru firmă')}.`,
          );
    default:
      return p(
        `Între timp, cele mai citite materiale ale noastre pentru cine se informează: ${a(rezidential ? LINKS.sistemCasa : LINKS.sistemFirma, rezidential ? 'sistem de 3, 5 sau 10 kW' : 'sistem de 50, 100 sau 250 kW')}, ${a(LINKS.pret, 'prețuri cu montaj')}, ${a(LINKS.calculator, 'calculatorul de producție')}.`,
      );
  }
}

function readyBlock(leadId: string): string {
  return (
    p(
      'Când sunteți gata să primiți oferte, apăsați butonul de mai jos. Cererea intră atunci la firmele din județ ca una nouă, iar cele care au urmărit-o între timp vă contactează primele.',
    ) +
    button(clientLinkUrl(leadId, 'actualizare'), 'Sunt gata pentru oferte') +
    p('Dacă între timp aveți întrebări, răspundeți la acest email. Îl citește un om.')
  );
}

/** 1. Întâmpinarea, doar la „mă informez". */
export async function sendInformezWelcomeEmail(lead: NewLead): Promise<{ ok: boolean; reason?: string }> {
  const body =
    p('Bună ziua,') +
    p(
      `Am primit cererea dumneavoastră pentru un sistem fotovoltaic în județul ${escapeHtml(lead.judet)}. Ați bifat că deocamdată vă informați, așa că nu o tratăm ca pe o cerere urgentă: firmele din zonă o văd, dar știu că nu așteptați oferte concrete acum, deci nu vă vor suna insistent.`,
    ) +
    blocajBlock(lead) +
    readyBlock(lead.timestamp);

  const result = await sendEmail({
    to: lead.email,
    subject: 'Cererea dumneavoastră: ce urmează și ce puteți citi între timp',
    html: layout(lead, body),
    replyTo: REPLY_TO,
  });
  if (!result.ok) console.warn('[email-client] întâmpinare netrimisă:', result.reason);
  return result;
}

function elapsedLabel(lead: NewLead, now: number): string {
  const months = Math.max(1, Math.round((now - Date.parse(lead.timestamp)) / (30 * 86_400_000)));
  if (months === 1) return 'o lună';
  if (months === 2) return 'două luni';
  return `${months} luni`;
}

/** 2. Check-in-ul. `attempt` 1 = la 30 de zile, 2 = ultimul, la 60. */
export async function sendInformezCheckinEmail(
  lead: NewLead,
  attempt: number,
  now = Date.now(),
): Promise<{ ok: boolean; reason?: string }> {
  const last = attempt >= 2;
  const body =
    p('Bună ziua,') +
    p(
      `Acum ${elapsedLabel(lead, now)} ați trimis o cerere pe instalatori-fotovoltaice.ro pentru un sistem fotovoltaic în județul ${escapeHtml(lead.judet)} și ne-ați spus că deocamdată vă informați. Nu vrem nici să vă grăbim, nici să vă deranjăm degeaba, așa că vă întrebăm scurt:`,
    ) +
    `<div style="text-align:center;margin:8px 0 20px">
      ${secondaryButton(clientLinkUrl(lead.timestamp, 'actualizare'), 'Sunt gata pentru oferte')}
      ${secondaryButton(clientLinkUrl(lead.timestamp, 'astept'), 'Încă mă informez')}
      ${secondaryButton(clientLinkUrl(lead.timestamp, 'renunt'), 'Nu mai vreau')}
    </div>` +
    p(
      last
        ? 'Un singur click, fără formular. Dacă nu răspundeți, închidem cererea și nu vă mai scriem.'
        : 'Un singur click, fără formular. Dacă nu răspundeți, nu vă mai scriem decât o dată, peste o lună, apoi închidem cererea.',
    );

  const result = await sendEmail({
    to: lead.email,
    subject: 'S-a schimbat ceva cu proiectul dumneavoastră?',
    html: layout(lead, body),
    replyTo: REPLY_TO,
  });
  if (!result.ok) console.warn('[email-client] check-in netrimis:', result.reason);
  return result;
}

/** 3. Deschiderea programului, trimis o dată din /admin/informez celor care îl așteptau. */
export async function sendProgramOpenedEmail(
  lead: NewLead,
  data: { programName: string; openedOn: string; guideUrl?: string },
): Promise<{ ok: boolean; reason?: string }> {
  const guide = data.guideUrl || programGuide(lead.finantare);
  const body =
    p('Bună ziua,') +
    p(
      `Ne-ați spus că așteptați ${escapeHtml(data.programName)} înainte să cereți oferte. Sesiunea s-a deschis ${escapeHtml(data.openedOn)}. Condițiile finale și pașii de înscriere, verificați pe documentele publicate, sunt aici: ${a(guide, `ghidul ${data.programName}`)}.`,
    ) +
    p(
      `Dacă vreți oferte de la firme din județul ${escapeHtml(lead.judet)} acum, apăsați butonul. Cererea dumneavoastră o să fie actualizată cu ultimele informații.`,
    ) +
    button(clientLinkUrl(lead.timestamp, 'actualizare'), 'Sunt gata pentru oferte') +
    p('Dacă preferați să mai așteptați, nu trebuie să faceți nimic.');

  const result = await sendEmail({
    to: lead.email,
    subject: `S-a deschis ${data.programName}: ce faceți acum`,
    html: layout(lead, body),
    replyTo: REPLY_TO,
  });
  if (!result.ok) console.warn('[email-client] anunț program netrimis:', result.reason);
  return result;
}

/**
 * 4. Verificarea „mai căutați oferte?", pe cererile obișnuite (21 sept 2026).
 * „Da" urcă cererea în feed cu data de azi, „am ales o firmă" și „nu mai vreau"
 * o închid. Tăcerea nu închide nimic.
 */
export async function sendActiveCheckEmail(lead: NewLead): Promise<{ ok: boolean; reason?: string }> {
  const putere = lead.putere ? ` de ${escapeHtml(lead.putere)} kW` : '';
  const body =
    p('Bună ziua,') +
    p(
      `Pe ${escapeHtml(fmtDay(lead.timestamp))} ați trimis o cerere pe instalatori-fotovoltaice.ro pentru un sistem fotovoltaic${putere} în județul ${escapeHtml(lead.judet)}. Vrem ca firmele din zonă să vadă doar cereri actuale, așa că vă întrebăm scurt: mai căutați oferte?`,
    ) +
    button(clientLinkUrl(lead.timestamp, 'activa'), 'Da, încă vreau oferte') +
    `<div style="text-align:center;margin:0 0 20px">
      ${secondaryButton(clientLinkUrl(lead.timestamp, 'aleasa'), 'Am ales deja o firmă')}
      ${secondaryButton(clientLinkUrl(lead.timestamp, 'renunt'), 'Nu mai vreau')}
    </div>` +
    p(
      'Dacă apăsați „Da”, cererea urcă din nou în lista firmelor din județ, marcată ca actualizată azi. Un singur click, fără formular. Dacă nu răspundeți, nu se schimbă nimic.',
    ) +
    p('Dacă aveți întrebări, răspundeți la acest email. Îl citește un om.');

  const result = await sendEmail({
    to: lead.email,
    subject: 'Mai căutați oferte pentru sistemul fotovoltaic?',
    html: layout(lead, body),
    replyTo: REPLY_TO,
  });
  if (!result.ok) console.warn('[email-client] verificare activă netrimisă:', result.reason);
  return result;
}
