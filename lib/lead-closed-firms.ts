// Când clientul își închide cererea (din cont sau din linkurile din emailuri),
// firmele care o au preluată află pe loc, ca să nu mai sune un om care a spus
// deja că nu mai vrea (6 nov 2026, întrebarea lui Radu: „firmele primesc un
// email?”, până atunci nu primeau nimic). În portal rândul arată același lucru,
// calculat din starea cererii, vezi `closedLeadNotice`.
//
// Fără numele firmei alese: celelalte firme află doar că s-a ales alta.

import 'server-only';
import { PORTAL_BASE_URL, escapeHtml, sendEmail } from './email';
import { getClaims, isLeadClosed, type NewLead } from './sheets';
import { getProjectTypeLabel } from './utils-shared';

export type ClientClosure = 'renuntat' | 'altundeva' | 'castigata';

const HEADLINE: Record<ClientClosure, string> = {
  renuntat: 'Clientul nu mai face lucrarea',
  altundeva: 'Clientul a ales altă firmă',
  castigata: 'Clientul a semnat cu altă firmă de pe platformă',
};

/**
 * Anunță firmele cu revendicare activă că cererea s-a închis. `lead` e cererea
 * de DINAINTEA închiderii: dacă era deja închisă (al doilea click pe același
 * link), nu mai pleacă nimic. Firma aleasă (`winnerClaimTs`) nu primește email.
 * Nu aruncă: închiderea e deja salvată și nu trebuie să pice din cauza asta.
 */
export async function notifyFirmsClientClosed(
  lead: NewLead,
  outcome: ClientClosure,
  winnerClaimTs = '',
): Promise<void> {
  if (isLeadClosed(lead.crmStatus)) return;
  try {
    const claims = (await getClaims()).filter(
      (c) =>
        c.leadId === lead.timestamp &&
        !c.releasedAt &&
        !c.proba &&
        c.timestamp !== winnerClaimTs &&
        c.firmStatus !== 'castigat' &&
        c.email,
    );
    // O firmă cu două revendicări pe aceeași cerere (doi colegi) primește un singur email.
    const recipients = [...new Map(claims.map((c) => [c.email.toLowerCase(), c])).values()];
    const summary = [
      getProjectTypeLabel(lead.tipProiect),
      [lead.localitate, lead.judet].filter(Boolean).join(', '),
      lead.putere ? `${lead.putere} kW` : '',
    ]
      .filter(Boolean)
      .join(' · ');

    for (const claim of recipients) {
      // Numele clientului doar dacă firma i-a primit deja datele.
      const client = claim.approvedAt ? lead.numeContact || lead.numeCompanie : '';
      const result = await sendEmail({
        to: claim.email,
        subject: `Cerere închisă: ${summary}`,
        html: closedEmailHtml({ headline: HEADLINE[outcome], summary, client }),
      });
      if (!result.ok) console.warn('[cerere închisă] email nesosit la', claim.email, result.reason);
    }
  } catch (err) {
    console.error('[cerere închisă] anunțul către firme:', err);
  }
}

function closedEmailHtml({ headline, summary, client }: { headline: string; summary: string; client: string }) {
  return `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#f9fafb">
      <div style="font-size:12px;color:#6b7280;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Cerere închisă</div>
      <h1 style="margin:6px 0 0;font-size:19px;color:#111827">${escapeHtml(headline)}</h1>
    </div>
    <div style="padding:24px">
      <p style="font-size:14px;color:#374151;margin:0 0 14px">
        Cererea <strong>${escapeHtml(summary)}</strong>${client ? ` (${escapeHtml(client)})` : ''} s-a închis,
        la cererea clientului. Nu mai e nevoie să-l suni.
      </p>
      <p style="font-size:14px;color:#374151;margin:0 0 16px">
        În portal o scoți din lucru dintr-un click și ți se eliberează locul pentru o cerere nouă.
      </p>
      <div style="text-align:center">
        <a href="${PORTAL_BASE_URL}/portal" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#ffffff;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none">Deschide portalul</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}
