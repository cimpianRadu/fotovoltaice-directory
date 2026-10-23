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
import { clientAccountLive, companyForClaim, firmDisplayName } from './client-account';
import { sendClaimEmail } from './email-cont';

export async function notifyClientFirmTook(leadId: string, claimTs: string): Promise<void> {
  // Înainte de pornire nu citim nimic din Sheets: limita de citiri e comună cu site-ul.
  if (!clientAccountLive()) return;
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
