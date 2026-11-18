/**
 * Alerte de eroare pe email: când ceva pică în producție, Radu află în câteva
 * minute, nu când deschide panoul (18 nov. 2026: creditele Anthropic s-au
 * terminat și Smile AI a răspuns cu „eroare” două zile fără să știe nimeni).
 *
 * ⚠️ Fișierul e IDENTIC în gaseste-dentist, instalatori-fotovoltaice și
 * clinici-estetice (`lib/alert.ts`). Dacă îl schimbi într-unul, copiază-l și
 * în celelalte două. Nu importă nimic din proiect, ca să poată fi copiat ca
 * atare, și merge și pe Edge (doar `fetch` + `process.env`).
 *
 * Cum funcționează:
 * - O linie JSON în log-uri (`"tag":"alert"`) la fiecare apel, oriunde.
 * - Email prin Resend doar în producție (`VERCEL_ENV=production`) sau cu
 *   `ALERT_FORCE=1` local, ca să-l poți testa.
 * - Cel mult un email la 6 ore pentru același `area` + `kind`, pe toate
 *   instanțele Vercel: cheia de idempotență Resend e site:area:kind:fereastra
 *   (00–06, 06–12, 12–18, 18–24 UTC), iar Resend nu retrimite un email cu
 *   aceeași cheie în 24 de ore. La o pană lungă ies cel mult 4 emailuri pe zi
 *   pe tip, nu 24: cota Resend e mică (18 nov. 2026). Fără bază de
 *   date și fără memorie în proces (care se pierde la fiecare cold start).
 *   De asta `kind` trebuie să fie stabil: tipul erorii, nu mesajul cu id-uri.
 * - Versiunea aplicației vine din variabilele de sistem Vercel: commit, mesajul
 *   commit-ului, deployment-ul și regiunea.
 *
 * Nu aruncă niciodată. Nu pune date personale în `details` (emailuri,
 * telefoane, textul conversațiilor): emailul de alertă nu e locul pentru ele.
 *
 * Tot aici, `sendReportEmail`: rapoartele trimise de oameni din butonul cu
 * gândac (`components/report/`, `/api/report`), cu același format de email.
 *
 * Destinatar: ALERT_EMAIL, altfel LISTING_NOTIFICATION_EMAIL, altfel Radu.
 */

export interface AlertInput {
  /** Zona: 'chat', 'leads', 'request', 'asistent'… */
  area: string;
  /** Tipul stabil al erorii, pentru deduplicare: 'anthropic-400', 'sheets'. */
  kind: string;
  /** Ce s-a întâmplat, într-o frază. */
  message: string;
  /** Context tehnic, fără date personale. */
  details?: Record<string, unknown>;
}

const DEFAULT_TO = 'radu.cimpian94@gmail.com';

export function appVersion() {
  return {
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local',
    commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split('\n')[0]?.slice(0, 120) || undefined,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'necunoscut',
    deployment: process.env.VERCEL_URL || undefined,
    region: process.env.VERCEL_REGION || undefined,
  };
}

function siteName(): string {
  return process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.ALERT_SITE || 'local';
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function show(v: unknown): string {
  if (v === undefined || v === null || v === '') return '';
  return typeof v === 'string' ? v : JSON.stringify(v, null, 2);
}

export async function alertError({ area, kind, message, details = {} }: AlertInput): Promise<void> {
  try {
    const site = siteName();
    const version = appVersion();
    const at = new Date();
    console.error(JSON.stringify({ tag: 'alert', at: at.toISOString(), site, area, kind, message, version, ...details }));

    const enabled = process.env.VERCEL_ENV === 'production' || process.env.ALERT_FORCE === '1';
    if (!enabled) return;

    // Fereastra de 6 ore: 2026-11-18T06 acoperă 06:00–11:59 UTC.
    const iso = at.toISOString();
    const slot = `${iso.slice(0, 11)}${String(Math.floor(at.getUTCHours() / 6) * 6).padStart(2, '0')}`;
    await deliver({
      subject: `⚠️ ${site} · ${area}: ${message}`,
      message,
      rows: [
        ['Site', site],
        ['Zona', area],
        ['Tip', kind],
        ['Ora (UTC)', at.toISOString()],
        ['Commit', version.commitMessage ? `${version.commit} · ${version.commitMessage}` : version.commit],
        ['Mediu', version.env],
        ['Deployment', version.deployment],
        ['Regiune', version.region],
        ...Object.entries(details),
      ],
      footer: 'Alte erori de același tip din următoarele ore (până la 6) nu mai trimit email; le găsești în Vercel → Logs, căutând <code>"tag":"alert"</code>.',
      idempotencyKey: `${site}:${area}:${kind}:${slot}`,
    });
  } catch (err) {
    console.error('[alert] alerta n-a plecat:', err);
  }
}

/**
 * Raportul trimis de un om din butonul cu gândac (`/api/report`). Spre
 * deosebire de alerte, nu se deduplică: fiecare raport e un email. `replyTo`
 * e emailul omului, dacă l-a lăsat, ca să-i poți răspunde direct din Gmail.
 * Întoarce `true` dacă emailul a plecat. Merge și local (fără `ALERT_FORCE`).
 */
export async function sendReportEmail(r: {
  id: string;
  site: string;
  title: string;
  rows: [string, unknown][];
  replyTo?: string;
}): Promise<boolean> {
  try {
    return await deliver({
      subject: `🐞 ${r.site} · ${r.title}`,
      message: r.title,
      rows: r.rows,
      footer: `Raportul ${r.id} e și în Google Sheets, tab-ul „Rapoarte”. Scrie „rezolvat” în coloana Status când l-ai închis.`,
      idempotencyKey: `${r.site}:raport:${r.id}`,
      replyTo: r.replyTo,
    });
  } catch (err) {
    console.error('[alert] raportul n-a plecat pe email:', err);
    return false;
  }
}

async function deliver(m: {
  subject: string;
  message: string;
  rows: [string, unknown][];
  footer: string;
  idempotencyKey: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[alert] lipsește RESEND_API_KEY — emailul nu pleacă.');
    return false;
  }
  const site = siteName();
  const table = m.rows
    .map(([k, v]) => [k, show(v)] as const)
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#64748b;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td><td style="padding:4px 0"><pre style="margin:0;white-space:pre-wrap;font:13px ui-monospace,monospace">${escapeHtml(v)}</pre></td></tr>`)
    .join('');
  const html = `<div style="font-family:system-ui,sans-serif;font-size:14px;color:#0f172a">
<p style="margin:0 0 12px"><strong>${escapeHtml(m.message)}</strong></p>
<table style="border-collapse:collapse">${table}</table>
<p style="margin:16px 0 0;color:#64748b;font-size:12px">${m.footer}</p>
</div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': m.idempotencyKey.replace(/[^\w.:/-]/g, '_').slice(0, 256),
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || `Alerte ${site} <onboarding@resend.dev>`,
      to: [process.env.ALERT_EMAIL || process.env.LISTING_NOTIFICATION_EMAIL || DEFAULT_TO],
      subject: m.subject.slice(0, 160),
      html,
      ...(m.replyTo ? { reply_to: m.replyTo } : {}),
    }),
    signal: AbortSignal.timeout(5000),
  });
  // 409 = aceeași cheie în ultimele 24h: emailul a plecat deja. Normal.
  if (res.ok || res.status === 409) return true;
  console.error('[alert] Resend a refuzat emailul:', res.status, await res.text().catch(() => ''));
  return false;
}
