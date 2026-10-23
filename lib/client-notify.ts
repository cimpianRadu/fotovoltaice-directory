// „Firma X a preluat cererea dumneavoastră”: emailul către client în momentul în
// care firma primește datele lui. Sunt două locuri unde se întâmplă asta: la
// revendicare, dacă firma e deja confirmată (app/api/claims), și la aprobarea
// manuală din admin (app/api/admin/claims/approve). Ambele cheamă funcția de aici.
//
// Nu pleacă la „mă informez” (firmele doar urmăresc, nu sună), nici la cererile
// închise. O singură dată pe revendicare, chiar dacă aprobarea e scoasă și pusă la loc.

import 'server-only';
import { getClaims, getFullLeadById, isLeadInformez } from './sheets';
import { isLeadClosed } from './sheets-shared';
import {
  clientEmailsLive,
  companyForClaim,
  describeLead,
  firmDisplayName,
  inMessagingWindow,
  NOTIFY_EVENTS_SINCE,
} from './client-account';
import { sendClaimEmail, sendOfferEmail, sendOfferOpenedToFirm } from './email-cont';
import { db } from './db';

export async function notifyClientFirmTook(leadId: string, claimTs: string): Promise<void> {
  // Fără emailuri pornite sau în afara ferestrei nu citim nimic din Sheets (limita
  // de citiri e comună cu site-ul): îl trimite cronul, în prima dimineață lucrătoare.
  if (!clientEmailsLive() || !inMessagingWindow()) return;
  try {
    const [lead, claims] = await Promise.all([getFullLeadById(leadId), getClaims()]);
    if (!lead || isLeadInformez(lead) || isLeadClosed(lead.crmStatus)) return;
    const claim = claims.find((c) => c.timestamp === claimTs && c.leadId === leadId);
    if (!claim || claim.releasedAt || !claim.approvedAt) return;
    const company = companyForClaim(claim);
    await sendClaimEmail(lead, claim.timestamp, {
      name: company?.name ?? firmDisplayName(claim.numeFirma),
      city: company?.location.city ?? null,
      phone: company?.contact.phone || null,
      profileSlug: company?.slug ?? null,
    });
  } catch (err) {
    console.error('[cont] email preluare:', err);
  }
}

/**
 * Ce n-a plecat la timp (weekend, noapte, emailurile încă oprite): anunțurile de
 * preluare, de ofertă trimisă și „clientul a deschis oferta”. Rulează din cronul
 * de dimineață (app/api/cron/claim-nudge) și trimite doar în fereastra de lucru.
 * Doar evenimentele din ultimele 7 zile și de după NOTIFY_EVENTS_SINCE: un anunț
 * despre ceva de acum o lună nu mai ajută pe nimeni.
 */
export async function sendPendingClientEmails(now = new Date()): Promise<{ preluari: number; oferte: number; deschise: number }> {
  const out = { preluari: 0, oferte: 0, deschise: 0 };
  if (!clientEmailsLive() || !inMessagingWindow(now)) return out;
  const since = new Date(Math.max(now.getTime() - 7 * 86_400_000, Date.parse(NOTIFY_EVENTS_SINCE))).toISOString();
  const sent = new Set(
    (await db()`SELECT lead_id || '|' || kind AS k FROM client_emails WHERE sent_at > ${since}::timestamptz - interval '1 day'`).map(
      (r) => String(r.k),
    ),
  );

  // 1. Preluări aprobate fără anunț.
  const claims = (await getClaims()).filter(
    (c) => c.approvedAt && c.approvedAt >= since && !c.releasedAt && !sent.has(`${c.leadId}|preluare:${c.timestamp}`),
  );
  for (const c of claims) {
    await notifyClientFirmTook(c.leadId, c.timestamp);
    out.preluari++;
  }

  // 2. Oferte fără anunț către client, 3. oferte deschise fără anunț către firmă.
  const offers = await db()`
    SELECT o.id, o.lead_id, o.firm_name, o.firm_email,
           (SELECT min(at) FROM offer_views v WHERE v.offer_id = o.id AND v.viewer = 'client') AS opened
    FROM offers o WHERE o.withdrawn_at IS NULL AND o.created_at > ${since}
  `;
  for (const o of offers) {
    const leadId = String(o.lead_id);
    const needsOffer = !sent.has(`${leadId}|oferta:${o.id}`);
    const needsOpened = o.opened && !sent.has(`${leadId}|deschis:${o.id}`);
    if (!needsOffer && !needsOpened) continue;
    const lead = await getFullLeadById(leadId);
    if (!lead) continue;
    if (needsOffer) {
      await sendOfferEmail(lead, Number(o.id), String(o.firm_name));
      out.oferte++;
    }
    if (needsOpened) {
      await sendOfferOpenedToFirm(leadId, Number(o.id), String(o.firm_email), {
        firmName: String(o.firm_name),
        judet: lead.judet,
        descriere: describeLead(lead),
        openedAt: new Date(o.opened as string).toISOString(),
      });
      out.deschise++;
    }
  }
  return out;
}
