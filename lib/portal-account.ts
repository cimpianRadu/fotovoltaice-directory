// Contul nou în portal, semnalat pe email.
//
// Portalul n-are înscriere: identitatea e emailul, iar „și-a făcut cont"
// înseamnă prima autentificare reușită (primul `intrat` din jurnalul „Portal
// Acces"). Momentul cere reacție de la noi, pentru că firma ajunge în portal
// tocmai când i-am promis o cerere, iar datele clientului stau după gate-ul
// telefonic. Fără semnal, contul se descoperea abia la următoarea deschidere a
// /admin/portal.

import { getClaims, getPortalEventCounts, isSameFirm } from './sheets';
import { sendNewPortalAccountNotification } from './email';
import { getCompanies } from './utils';

/**
 * De chemat DUPĂ scrierea evenimentului `intrat`, din `after()`: nu aruncă
 * niciodată, ca un Sheets sau un Resend picat să nu strice un login reușit.
 * Tăcut dacă adresa mai intrase (jurnalul are deja alt `intrat`).
 */
export async function notifyIfNewPortalAccount(
  email: string,
  method: 'link' | 'cod',
): Promise<void> {
  const key = email.trim().toLowerCase();
  try {
    const counts = await getPortalEventCounts(key);
    // 1 = rândul tocmai scris. 0 înseamnă că scrierea în jurnal a eșuat, caz în
    // care nu putem ști dacă e cont nou, deci tăcem în loc să anunțăm greșit.
    if (counts.intrat !== 1) return;

    const claims = (await getClaims()).filter((c) => c.email === key && !c.releasedAt);

    // Adresa din portal e des una personală, nu cea publicată în director
    // (costi@, abuzdea@), deci potrivirea pe email singură ratează firma și
    // emailul ar avea în subiect o adresă în loc de un nume. A doua încercare
    // merge pe numele și telefonul declarate la revendicare, ca în /admin/portal.
    const companies = getCompanies();
    const claimIdentity = claims.find((c) => c.numeFirma);
    const company =
      companies.find((c) => (c.contact.email || '').trim().toLowerCase() === key) ??
      (claimIdentity
        ? companies.find((c) =>
            isSameFirm({ numeFirma: c.name, telefon: c.contact.phone }, claimIdentity),
          )
        : undefined);

    await sendNewPortalAccountNotification({
      email: key,
      method,
      firmName: company?.name || claimIdentity?.numeFirma,
      firmSlug: company?.slug,
      judet: company?.location.county,
      requests: counts.cerut,
      activeClaims: claims.length,
      pendingClaims: claims.filter((c) => !c.approvedAt).length,
    });
  } catch (err) {
    console.error('[portal] notificare cont nou:', err);
  }
}
