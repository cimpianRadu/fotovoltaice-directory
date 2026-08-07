// Lightweight Resend wrapper — uses the REST API directly so we don't need
// an extra dependency. Fails open: if RESEND_API_KEY is not set, sendEmail
// becomes a no-op so form submissions still succeed in environments where
// email isn't configured (local dev, preview deploys without secrets).

import { getFinancingShort, getFinancingTone, type FinancingTone } from './utils-shared';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

// Clienții de email ignoră clasele CSS, deci tonurile de finanțare se scriu inline.
const FINANCING_EMAIL_COLOR: Record<FinancingTone, string> = {
  ready: '#047857',
  credit: '#0369a1',
  program: '#b45309',
  unknown: '#6b7280',
};

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

function segmentBadge(segment: string): string {
  const rez = segment === 'rezidential';
  const ambele = segment === 'ambele';
  const label = rez ? 'Rezidențial' : ambele ? 'Ambele' : 'Comercial';
  const bg = rez ? '#ecfdf5' : ambele ? '#eff6ff' : '#fffbeb';
  const fg = rez ? '#047857' : ambele ? '#1d4ed8' : '#92400e';
  return `<span style="display:inline-block;padding:1px 8px;border-radius:9999px;background:${bg};color:${fg};font-size:11px;font-weight:600">${label}</span>`;
}

interface DigestLead {
  timestamp: string;
  numeCompanie: string;
  numeContact: string;
  email: string;
  telefon: string;
  tipProiect: string;
  judet: string;
  putere: string;
  segment: string;
  /** Slug-ul rutei de finanțare; gol pe cererile dinainte de 29 iul 2026. */
  finantare: string;
}

interface DigestListing {
  timestamp: string;
  numeFirma: string;
  cui: string;
  numeContact: string;
  email: string;
  telefon: string;
  judet: string;
  specializare: string;
  anreStatus: string;
  segment: string;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function countBySegment(items: { segment: string }[]): string {
  const rez = items.filter((i) => i.segment === 'rezidential').length;
  const com = items.filter((i) => i.segment !== 'rezidential').length;
  return `${rez} rezidențial / ${com} comercial`;
}

export async function sendSubmissionsDigest(
  leads: DigestLead[],
  listings: DigestListing[],
  lookbackHours: number
): Promise<{ ok: boolean; reason?: string }> {
  const to = process.env.LISTING_NOTIFICATION_EMAIL || 'radu.cimpian94@gmail.com';
  const days = Math.round(lookbackHours / 24);

  const leadCards = leads
    .map(
      (l) => `<div style="padding:12px 0;border-bottom:1px solid #f1f5f9">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">
          <strong style="font-size:14px;color:#111827">${escapeHtml(l.numeContact)}${l.numeCompanie ? ` · ${escapeHtml(l.numeCompanie)}` : ''}</strong>
          ${segmentBadge(l.segment)}
        </div>
        <div style="font-size:13px;color:#374151;margin-top:3px">${escapeHtml(l.tipProiect)} · ${escapeHtml(l.judet)}${l.putere ? ` · ${escapeHtml(l.putere)} kW` : ''}</div>
        ${l.finantare ? `<div style="font-size:12px;margin-top:3px;color:${FINANCING_EMAIL_COLOR[getFinancingTone(l.finantare)]}">${escapeHtml(getFinancingShort(l.finantare))}</div>` : ''}
        <div style="font-size:12px;color:#6b7280;margin-top:3px">
          <a href="mailto:${escapeHtml(l.email)}" style="color:#2563eb">${escapeHtml(l.email)}</a> ·
          <a href="tel:${escapeHtml(l.telefon.replace(/\s/g, ''))}" style="color:#2563eb">${escapeHtml(l.telefon)}</a> ·
          ${escapeHtml(fmtDate(l.timestamp))}
        </div>
      </div>`
    )
    .join('');

  const listingCards = listings
    .map((c) => {
      const anre =
        c.anreStatus === 'verified-pv'
          ? '<span style="color:#15803d;font-weight:600">✓ ANRE PV</span>'
          : c.anreStatus === 'found-no-pv-cert'
            ? '<span style="color:#b45309;font-weight:600">⚠ ANRE fără PV</span>'
            : '<span style="color:#6b7280">ⓘ Negăsit ANRE</span>';
      return `<div style="padding:12px 0;border-bottom:1px solid #f1f5f9">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">
          <strong style="font-size:14px;color:#111827">${escapeHtml(c.numeFirma)}</strong>
          ${segmentBadge(c.segment)}
        </div>
        <div style="font-size:13px;color:#374151;margin-top:3px">${escapeHtml(c.cui)} · ${escapeHtml(c.judet)} · ${escapeHtml(c.specializare)} · ${anre}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:3px">
          ${escapeHtml(c.numeContact)} ·
          <a href="mailto:${escapeHtml(c.email)}" style="color:#2563eb">${escapeHtml(c.email)}</a> ·
          <a href="tel:${escapeHtml(c.telefon.replace(/\s/g, ''))}" style="color:#2563eb">${escapeHtml(c.telefon)}</a> ·
          ${escapeHtml(fmtDate(c.timestamp))}
        </div>
      </div>`;
    })
    .join('');

  const section = (title: string, count: number, breakdown: string, cards: string) =>
    `<div style="padding:18px 24px;border-top:1px solid #e5e7eb">
      <div style="font-size:12px;color:#6b7280;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">${title} · ${count}</div>
      ${count > 0 ? `<div style="font-size:12px;color:#9ca3af;margin-top:2px">${breakdown}</div>${cards}` : '<div style="font-size:13px;color:#9ca3af;margin-top:6px">Nimic nou.</div>'}
    </div>`;

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;margin:0;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="padding:20px 24px;background:#fffbeb">
      <div style="font-size:12px;color:#92400e;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Rezumat submisii · ultimele ${days} zile</div>
      <h1 style="margin:6px 0 0;font-size:20px;color:#111827">${leads.length} leads · ${listings.length} listări</h1>
    </div>
    ${section('Leads (Cere ofertă)', leads.length, countBySegment(leads), leadCards)}
    ${section('Listări firme', listings.length, countBySegment(listings), listingCards)}
    <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
      Sursă: Google Sheets „Leads" + „Listări". Digest automat la 2 zile.
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to,
    subject: `Submisii noi: ${leads.length} leads · ${listings.length} listări (ultimele ${days} zile)`,
    html,
  });
}

interface ClaimNotificationData {
  claim: { numeFirma: string; numeContact: string; telefon: string; email?: string };
  lead: {
    numeCompanie: string;
    numeContact: string;
    email: string;
    telefon: string;
    tipProiectLabel: string;
    judet: string;
    putere: string;
    suprafata: string;
    segment: string;
    timestamp: string;
    acoperisLabel: string;
    fazareLabel: string;
    consumLunar: string;
    finantareLabel: string;
  };
  claimCount: number; // inclusiv revendicarea curentă
  maxClaims: number;
}

// Notificare imediată (nu în digest) — o revendicare e time-sensitive: firma
// așteaptă telefonul de confirmare cât interesul e cald.
export async function sendClaimNotification(data: ClaimNotificationData): Promise<void> {
  const to = process.env.LISTING_NOTIFICATION_EMAIL || 'radu.cimpian94@gmail.com';
  const { claim, lead, claimCount, maxClaims } = data;
  const full = claimCount >= maxClaims;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:5px 12px 5px 0;color:#6b7280;font-size:13px;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:5px 0;font-size:14px;color:#111827">${value}</td></tr>`;

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#fffbeb">
      <div style="font-size:12px;color:#92400e;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Lead revendicat · ${claimCount}/${maxClaims}${full ? ' · COMPLET' : ''}</div>
      <h1 style="margin:6px 0 0;font-size:19px;color:#111827">${escapeHtml(lead.tipProiectLabel)} · ${escapeHtml(lead.judet)}</h1>
    </div>
    <div style="padding:20px 24px">
      <div style="font-size:12px;color:#6b7280;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:6px">Firma care revendică</div>
      <table style="border-collapse:collapse;width:100%">
        ${row('Firmă', escapeHtml(claim.numeFirma))}
        ${row('Contact', escapeHtml(claim.numeContact))}
        ${row('Telefon', `<a href="tel:${escapeHtml(claim.telefon.replace(/\s/g, ''))}" style="color:#2563eb">${escapeHtml(claim.telefon)}</a>`)}
        ${claim.email ? row('Email (portal)', `<a href="mailto:${escapeHtml(claim.email)}" style="color:#2563eb">${escapeHtml(claim.email)}</a>`) : ''}
      </table>
      <div style="font-size:12px;color:#6b7280;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;margin:18px 0 6px">Lead-ul (datele clientului)</div>
      <table style="border-collapse:collapse;width:100%">
        ${row('Client', escapeHtml(lead.numeContact) + (lead.numeCompanie ? ` · ${escapeHtml(lead.numeCompanie)}` : ''))}
        ${row('Email', `<a href="mailto:${escapeHtml(lead.email)}" style="color:#2563eb">${escapeHtml(lead.email)}</a>`)}
        ${row('Telefon', `<a href="tel:${escapeHtml(lead.telefon.replace(/\s/g, ''))}" style="color:#2563eb">${escapeHtml(lead.telefon)}</a>`)}
        ${row('Proiect', `${escapeHtml(lead.tipProiectLabel)} · ${escapeHtml(lead.judet)}${lead.putere ? ` · ${escapeHtml(lead.putere)} kW` : ''}${lead.suprafata ? ` · ${escapeHtml(lead.suprafata)} mp` : ''}`)}
        ${lead.acoperisLabel ? row('Acoperiș', escapeHtml(lead.acoperisLabel)) : ''}
        ${lead.fazareLabel ? row('Alimentare', escapeHtml(lead.fazareLabel)) : ''}
        ${lead.consumLunar ? row('Consum lunar', escapeHtml(lead.consumLunar)) : ''}
        ${lead.finantareLabel ? row('Finanțare', `<strong>${escapeHtml(lead.finantareLabel)}</strong>`) : ''}
        ${row('Segment', escapeHtml(lead.segment))}
        ${row('Depus', escapeHtml(fmtDate(lead.timestamp)))}
      </table>
    </div>
    <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
      Sună firma pentru confirmare, apoi decide livrarea. Salvat în tabul „Revendicări".${full ? ' Cererea e acum marcată Complet pe /cereri.' : ''}
    </div>
  </div>
</body>
</html>`;

  const result = await sendEmail({
    to,
    subject: `Lead revendicat (${claimCount}/${maxClaims}): ${lead.tipProiectLabel} · ${lead.judet} — ${claim.numeFirma}`,
    html,
  });

  if (!result.ok) {
    console.warn('[email] Claim notification not sent:', result.reason);
  }
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

// ── Portal instalatori ──────────────────────────────────────────────────────

const PORTAL_BASE_URL = 'https://instalatori-fotovoltaice.ro';

/**
 * Emailul de login: link de acces direct + cod de 6 cifre. Codul există pentru
 * clienții de email care rup linkurile (Yahoo pe mobil) — oricare din cele două
 * ajunge. Ambele expiră împreună, TTL-ul vine din portal-auth.
 */
export async function sendPortalLoginEmail(data: {
  to: string;
  code: string;
  verifyUrl: string;
  ttlMinutes: number;
}): Promise<{ ok: boolean; reason?: string }> {
  const html = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#fffbeb">
      <div style="font-size:12px;color:#92400e;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Portal Instalatori</div>
      <h1 style="margin:6px 0 0;font-size:19px;color:#111827">Codul tău de acces</h1>
    </div>
    <div style="padding:24px">
      <div style="text-align:center;margin-bottom:20px">
        <div style="display:inline-block;padding:12px 28px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;font-size:30px;font-weight:700;letter-spacing:0.35em;color:#111827">${escapeHtml(data.code)}</div>
      </div>
      <p style="font-size:14px;color:#374151;margin:0 0 16px;text-align:center">
        Introdu codul în pagina de login sau apasă butonul de mai jos.
      </p>
      <div style="text-align:center;margin-bottom:8px">
        <a href="${escapeHtml(data.verifyUrl)}" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#ffffff;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none">Intră în portal</a>
      </div>
    </div>
    <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
      Linkul și codul expiră în ${data.ttlMinutes} minute. Dacă nu ai cerut acest email, îl poți ignora.
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: data.to,
    subject: `Cod de acces Portal Instalatori: ${data.code}`,
    html,
  });
}

/**
 * Notificare către noi când o firmă renunță la o revendicare din portal —
 * clientul rămâne fără firmă pe locul eliberat, deci trebuie sunat.
 */
export async function sendClaimReleaseNotification(data: {
  numeFirma: string;
  email: string;
  motiv: string;
  leadSummary: string;
  leadId: string;
}): Promise<void> {
  const to = process.env.LISTING_NOTIFICATION_EMAIL || 'radu.cimpian94@gmail.com';

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;margin:0;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#fef2f2">
      <div style="font-size:12px;color:#b91c1c;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Renunțare la revendicare</div>
      <h1 style="margin:6px 0 0;font-size:19px;color:#111827">${escapeHtml(data.numeFirma)}</h1>
    </div>
    <div style="padding:20px 24px">
      <p style="font-size:14px;color:#374151;margin:0 0 12px">${escapeHtml(data.leadSummary)}</p>
      <div style="padding:12px;background:#f9fafb;border-radius:8px;font-size:13px;color:#374151;white-space:pre-wrap"><strong>Motiv:</strong> ${escapeHtml(data.motiv)}</div>
      <p style="font-size:12px;color:#6b7280;margin:12px 0 0">Firma: ${escapeHtml(data.email)} · Lead: ${escapeHtml(data.leadId)}</p>
    </div>
    <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
      Locul s-a eliberat pe /cereri. Verifică dacă clientul trebuie sunat sau realocat.
    </div>
  </div>
</body>
</html>`;

  const result = await sendEmail({
    to,
    subject: `Renunțare: ${data.numeFirma} · ${data.leadSummary}`,
    html,
  });

  if (!result.ok) {
    console.warn('[email] Release notification not sent:', result.reason);
  }
}

/**
 * Către firmă, după ce aprobăm revendicarea din /admin/crm: datele clientului
 * s-au deblocat în portal. Fail-open ca restul notificărilor.
 */
export async function sendClaimApprovedEmail(data: {
  to: string;
  leadSummary: string;
}): Promise<void> {
  const html = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;margin:0;padding:24px">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
    <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;background:#ecfdf5">
      <div style="font-size:12px;color:#047857;font-weight:600;letter-spacing:0.05em;text-transform:uppercase">Revendicare confirmată</div>
      <h1 style="margin:6px 0 0;font-size:19px;color:#111827">Datele clientului sunt disponibile</h1>
    </div>
    <div style="padding:24px">
      <p style="font-size:14px;color:#374151;margin:0 0 16px">
        Revendicarea pentru <strong>${escapeHtml(data.leadSummary)}</strong> a fost confirmată.
        Găsești datele de contact ale clientului în portal.
      </p>
      <div style="text-align:center">
        <a href="${PORTAL_BASE_URL}/portal" style="display:inline-block;padding:12px 24px;background:#f59e0b;color:#ffffff;border-radius:10px;font-size:15px;font-weight:600;text-decoration:none">Deschide portalul</a>
      </div>
    </div>
    <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
      Sună clientul cât e caldă cererea. Locul tău se eliberează după ce clientul confirmă apelul.
    </div>
  </div>
</body>
</html>`;

  const result = await sendEmail({
    to: data.to,
    subject: `Datele clientului sunt disponibile: ${data.leadSummary}`,
    html,
  });

  if (!result.ok) {
    console.warn('[email] Claim approved email not sent:', result.reason);
  }
}
