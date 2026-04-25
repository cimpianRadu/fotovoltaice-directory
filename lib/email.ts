// Lightweight Resend wrapper — uses the REST API directly so we don't need
// an extra dependency. Fails open: if RESEND_API_KEY is not set, sendEmail
// becomes a no-op so form submissions still succeed in environments where
// email isn't configured (local dev, preview deploys without secrets).

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<{ ok: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { ok: false, reason: 'RESEND_API_KEY not set' };
  }

  const from = opts.from || process.env.RESEND_FROM || 'Instalatori Fotovoltaice <onboarding@resend.dev>';

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, reason: `Resend ${res.status}: ${text}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'unknown error' };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface ListingNotificationData {
  numeFirma: string;
  cui: string;
  numeContact: string;
  functie?: string;
  email: string;
  telefon: string;
  judet: string;
  website?: string;
  specializare: string;
  descriere?: string;
  anreFirmName?: string;
  anreCerts?: string;
  anreStatus?: string;
}

export async function sendListingNotification(data: ListingNotificationData): Promise<void> {
  const to = process.env.LISTING_NOTIFICATION_EMAIL || 'radu.cimpian94@gmail.com';

  const anreLine =
    data.anreStatus === 'verified-pv'
      ? `<span style="color:#15803d;font-weight:600">✓ Verificat ANRE</span> — ${escapeHtml(data.anreCerts || '')} (${escapeHtml(data.anreFirmName || '')})`
      : data.anreStatus === 'found-no-pv-cert'
        ? `<span style="color:#b45309;font-weight:600">⚠ În registru ANRE, fără atestat PV activ</span> — ${escapeHtml(data.anreFirmName || '')}`
        : `<span style="color:#6b7280">ⓘ Nu apare în registrul ANRE pentru județul ${escapeHtml(data.judet)}</span>`;

  const rows: [string, string][] = [
    ['Firmă', escapeHtml(data.numeFirma)],
    ['CUI', escapeHtml(data.cui)],
    ['Județ', escapeHtml(data.judet)],
    ['Activitate', escapeHtml(data.specializare)],
    ['Persoană contact', escapeHtml(data.numeContact) + (data.functie ? ` (${escapeHtml(data.functie)})` : '')],
    ['Email', `<a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a>`],
    ['Telefon', `<a href="tel:${escapeHtml(data.telefon.replace(/\s/g, ''))}">${escapeHtml(data.telefon)}</a>`],
    ...(data.website ? [['Website', `<a href="${escapeHtml(data.website)}" target="_blank" rel="noopener">${escapeHtml(data.website)}</a>`] as [string, string]] : []),
    ['Status ANRE', anreLine],
  ];

  const tableRows = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:6px 0;font-size:14px;color:#111827">${value}</td></tr>`
    )
    .join('');

  const descriereBlock = data.descriere
    ? `<div style="margin-top:16px;padding:12px;background:#f9fafb;border-radius:8px;font-size:13px;color:#374151;white-space:pre-wrap">${escapeHtml(data.descriere)}</div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#fffbeb">
      <div style="font-size:12px;color:#92400e;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Cerere nouă de listare</div>
      <h1 style="margin:6px 0 0;font-size:20px;color:#111827">${escapeHtml(data.numeFirma)}</h1>
    </div>
    <div style="padding:20px 24px">
      <table style="border-collapse:collapse;width:100%">
        ${tableRows}
      </table>
      ${descriereBlock}
    </div>
    <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
      Salvat în Google Sheet "Listări". Răspunde direct acestui email pentru a contacta firma.
    </div>
  </div>
</body>
</html>`;

  const result = await sendEmail({
    to,
    subject: `Listare nouă: ${data.numeFirma} (${data.judet})`,
    html,
    replyTo: data.email,
  });

  if (!result.ok) {
    console.warn('[email] Listing notification not sent:', result.reason);
  }
}
