// Emailurile contului de client (23 oct 2026). Textele trec pe la Radu înainte
// să plece (feedback_email_draft_review_before_send); le vede în /admin/cont-client.
//
// Două feluri de funcții:
//   *Email(...)   construiesc subiectul și HTML-ul, fără să trimită: le folosesc
//                 și previzualizările din admin.
//   send*(...)    trimit, doar cu CLIENT_EMAILS=on și o singură dată pe cerere și
//                 fel (tabelul client_emails). Confirmarea și codul pleacă imediat;
//                 anunțurile și emailurile către firme doar în fereastra de lucru
//                 (inMessagingWindow), altfel le trimite cronul în prima dimineață
//                 lucrătoare (lib/client-notify → sendPendingClientEmails).
//
// Formal-cald, cu „dumneavoastră”, ca restul emailurilor către clienți.

import 'server-only';
import { db } from './db';
import { a, button, emailFrame, fmtDay, p, REPLY_TO } from './email-client';
import { escapeHtml, PORTAL_BASE_URL, sendEmail } from './email';
import { clientLinkUrl } from './lead-client-token';
import { accountLink } from './client-auth';
import { clientEmailsLive, describeLead, firmDisplayName, inMessagingWindow } from './client-account';
import type { NewLead } from './sheets';

type LeadForEmail = Pick<NewLead, 'timestamp' | 'numeContact' | 'numeCompanie' | 'email' | 'judet' | 'localitate' | 'tipLucrare' | 'putere'>;

function greeting(lead: LeadForEmail): string {
  const name = (lead.numeContact || '').trim();
  return p(name ? `Bună ziua, ${escapeHtml(name)},` : 'Bună ziua,');
}

function leadFooter(lead: LeadForEmail): string {
  const renunt = clientLinkUrl(lead.timestamp, 'renunt');
  return `Primiți acest mesaj pentru că ați trimis o cerere pe instalatori-fotovoltaice.ro pe ${escapeHtml(fmtDay(lead.timestamp))}.
      Dacă nu mai doriți să fiți contactat, apăsați aici: <a href="${renunt}" style="color:#6b7280">nu mă mai contactați</a>.`;
}

function where(lead: LeadForEmail): string {
  const loc = (lead.localitate || '').trim();
  return loc ? `${escapeHtml(loc)}, județul ${escapeHtml(lead.judet)}` : `județul ${escapeHtml(lead.judet)}`;
}

const NO_PASSWORD = p(
  'Contul e gratuit și nu are parolă: butonul vă duce direct în el. Păstrați emailul, linkul rămâne valabil.',
);

// ---------------------------------------------------------------------------
// 1. Confirmarea, la trimiterea cererii

export function confirmationEmail(lead: LeadForEmail, link: string): { subject: string; html: string } {
  const body =
    greeting(lead) +
    p(
      `Am primit cererea dumneavoastră pentru ${escapeHtml(describeLead(lead))} în ${where(lead)}. O trimitem acum firmelor de instalare care lucrează în județ.`,
    ) +
    p(
      'Pe pagina cererii vedeți unde a ajuns: câte firme au primit-o, care au preluat-o și cum le puteți suna. Tot de acolo ne spuneți dacă v-a contactat cineva. Dacă nu vă sună nimeni, nu așteptați: acolo găsiți și firmele din județ, cu telefonul lor.',
    ) +
    button(link, 'Vedeți cererea') +
    NO_PASSWORD +
    p('Dacă aveți întrebări, răspundeți la acest email. Îl citește un om.');
  return { subject: 'Am primit cererea dumneavoastră', html: emailFrame(body, leadFooter(lead)) };
}

// ---------------------------------------------------------------------------
// 2. O firmă a preluat cererea

export interface FirmForEmail {
  name: string;
  city: string | null;
  phone: string | null;
  profileSlug: string | null;
}

export function claimEmail(lead: LeadForEmail, firm: FirmForEmail, link: string): { subject: string; html: string } {
  const name = escapeHtml(firm.name);
  const from = firm.city ? ` din ${escapeHtml(firm.city)}` : '';
  const profile = firm.profileSlug ? a(`${PORTAL_BASE_URL}/firme/${firm.profileSlug}`, 'fișa firmei') : '';
  const body =
    greeting(lead) +
    p(`<strong>${name}</strong>${from} a preluat cererea dumneavoastră pentru ${escapeHtml(describeLead(lead))} și vă va suna în zilele următoare.`) +
    (firm.phone
      ? p(`Dacă preferați să îi sunați dumneavoastră: <strong>${escapeHtml(firm.phone)}</strong>${profile ? ` · ${profile}` : ''}`)
      : profile
        ? p(`Despre firmă: ${profile}`)
        : '') +
    p('Pe pagina cererii vedeți toate firmele care au preluat-o și ne puteți spune dacă v-a sunat cineva:') +
    button(link, 'Vedeți cererea') +
    NO_PASSWORD;
  return { subject: `${firm.name} a preluat cererea dumneavoastră`, html: emailFrame(body, leadFooter(lead)) };
}

// ---------------------------------------------------------------------------
// 3. O firmă a trimis oferta prin platformă

export function offerEmail(lead: LeadForEmail, firmName: string, link: string): { subject: string; html: string } {
  const body =
    greeting(lead) +
    p(
      `<strong>${escapeHtml(firmName)}</strong> v-a trimis oferta pentru ${escapeHtml(describeLead(lead))}. O găsiți pe pagina cererii, alături de celelalte oferte primite.`,
    ) +
    button(link, 'Vedeți oferta') +
    p('Pentru întrebări despre ofertă, sunați direct firma. Dacă vreți o a doua părere, răspundeți la acest email.');
  return { subject: `${firmName} v-a trimis oferta`, html: emailFrame(body, leadFooter(lead)) };
}

// ---------------------------------------------------------------------------
// 4. Codul de intrare în cont (cerut din /cont)

export function loginCodeEmail(code: string, link: string): { subject: string; html: string } {
  const body =
    p('Bună ziua,') +
    p('Codul pentru a intra în contul dumneavoastră de pe instalatori-fotovoltaice.ro este:') +
    `<p style="font-size:30px;font-weight:700;letter-spacing:6px;text-align:center;color:#111827;margin:8px 0 20px">${escapeHtml(code)}</p>` +
    p('Codul expiră în 15 minute. Puteți intra și direct, cu butonul de mai jos:') +
    button(link, 'Intrați în cont') +
    p('Dacă nu ați cerut dumneavoastră codul, ignorați acest email.');
  return {
    subject: `Codul pentru contul dumneavoastră: ${code}`,
    html: emailFrame(body, 'Primiți acest mesaj pentru că cineva a cerut intrarea în contul legat de această adresă pe instalatori-fotovoltaice.ro.'),
  };
}

// ---------------------------------------------------------------------------
// 5. Către firmă: clientul a deschis oferta

export function offerOpenedFirmEmail(o: {
  firmName: string;
  judet: string;
  descriere: string;
  openedAt: string;
}): { subject: string; html: string } {
  const when = new Date(o.openedAt).toLocaleString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  const body =
    p(`Bună ziua, ${escapeHtml(o.firmName)},`) +
    p(`Clientul din județul ${escapeHtml(o.judet)} a deschis oferta pe care i-ați trimis-o prin platformă pentru ${escapeHtml(o.descriere)}, pe ${escapeHtml(when)}.`) +
    p('Acum e un moment bun să îl sunați. Detaliile cererii sunt în portal:') +
    button(`${PORTAL_BASE_URL}/portal`, 'Deschideți portalul');
  return {
    subject: `Clientul din ${o.judet} a deschis oferta`,
    html: emailFrame(body, 'Primiți acest mesaj pentru că ați trimis o ofertă prin portalul instalatori-fotovoltaice.ro.'),
  };
}

// ---------------------------------------------------------------------------
// Trimiterea

/** Rezervă emailul: true dacă e primul de felul ăsta pe cerere și poate pleca. */
async function claimSlot(leadId: string, kind: string): Promise<boolean> {
  const rows = await db()`
    INSERT INTO client_emails (lead_id, kind) VALUES (${leadId}, ${kind})
    ON CONFLICT DO NOTHING RETURNING lead_id
  `;
  return rows.length > 0;
}

async function releaseSlot(leadId: string, kind: string): Promise<void> {
  await db()`DELETE FROM client_emails WHERE lead_id = ${leadId} AND kind = ${kind}`;
}

const isTestEmail = (email: string) => email.trim().toLowerCase().startsWith('routine-test-');

/** `anunt`: din inițiativa noastră, deci doar în fereastra de lucru. `raspuns`: la ce tocmai a făcut omul. */
type SendKind = 'raspuns' | 'anunt';

async function sendOnce(
  lead: LeadForEmail,
  kind: string,
  build: (link: string) => { subject: string; html: string },
  type: SendKind,
) {
  if (!clientEmailsLive() || !lead.email || isTestEmail(lead.email)) return { ok: false, reason: 'oprit' };
  if (type === 'anunt' && !inMessagingWindow()) return { ok: false, reason: 'în afara ferestrei' };
  if (!(await claimSlot(lead.timestamp, kind))) return { ok: false, reason: 'deja trimis' };
  const { subject, html } = build(await accountLink(lead.email, lead.timestamp));
  const res = await sendEmail({ to: lead.email, subject, html, replyTo: REPLY_TO });
  // Dacă n-a plecat, eliberăm locul, ca o încercare ulterioară să mai poată trimite.
  if (!res.ok) await releaseSlot(lead.timestamp, kind);
  return res;
}

export function sendConfirmationEmail(lead: LeadForEmail) {
  return sendOnce(lead, 'confirmare', (link) => confirmationEmail(lead, link), 'raspuns');
}

export function sendClaimEmail(lead: LeadForEmail, claimTs: string, firm: FirmForEmail) {
  return sendOnce(lead, `preluare:${claimTs}`, (link) => claimEmail(lead, firm, link), 'anunt');
}

export function sendOfferEmail(lead: LeadForEmail, offerId: number, firmName: string) {
  return sendOnce(lead, `oferta:${offerId}`, (link) => offerEmail(lead, firmDisplayName(firmName), link), 'anunt');
}

export async function sendLoginCodeEmail(email: string, code: string) {
  // Pe local (aceeași bază ca producția) și înainte de pornire nu pleacă emailuri reale.
  if (!clientEmailsLive()) return { ok: false, reason: 'oprit' };
  const { subject, html } = loginCodeEmail(code, await accountLink(email));
  return sendEmail({ to: email, subject, html, replyTo: REPLY_TO });
}

/** Către firmă, o singură dată pe ofertă, doar în fereastra de lucru (altfel îl trimite cronul). */
export async function sendOfferOpenedToFirm(
  leadId: string,
  offerId: number,
  to: string,
  o: Parameters<typeof offerOpenedFirmEmail>[0],
) {
  if (!clientEmailsLive() || !inMessagingWindow()) return { ok: false, reason: 'în afara ferestrei' };
  const kind = `deschis:${offerId}`;
  if (!(await claimSlot(leadId, kind))) return { ok: false, reason: 'deja trimis' };
  const { subject, html } = offerOpenedFirmEmail(o);
  const res = await sendEmail({ to, subject, html, replyTo: REPLY_TO });
  if (!res.ok) await releaseSlot(leadId, kind);
  return res;
}
