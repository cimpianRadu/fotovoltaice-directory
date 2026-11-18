import { after, NextRequest, NextResponse } from 'next/server';
import { alertError, appVersion, sendReportEmail } from '@/lib/alert';
import { newReportId, saveReportToSheet, type ReportRow } from '@/lib/report-issue';

/**
 * POST /api/report — raportul din butonul cu gândac (ReportIssueDialog).
 * Scrie un rând în Sheets („Rapoarte”) și trimite un email lui Radu, cu
 * reply-to pe omul care a raportat, dacă și-a lăsat emailul.
 *
 * ⚠️ Fișier IDENTIC în gaseste-dentist, instalatori-fotovoltaice și clinici-estetice.
 */

export const runtime = 'nodejs';

const KINDS: Record<string, string> = {
  bug: 'Ceva nu merge',
  'date-gresite': 'Informație greșită',
  asistent: 'Asistentul AI',
  altceva: 'Altceva',
};

/** Limită în memorie, ca la chat: un proces nou o resetează, dar oprește un bot prostuț. */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_HOUR = 6;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX_PER_HOUR;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Și pe server, nu doar în browser: un token din linkurile private nu ajunge în Sheets. */
function stripSecrets(p: string): string {
  try {
    const url = new URL(p, 'http://x');
    for (const k of [...url.searchParams.keys()]) if (/^(k|t|token|key|cod|code|sig)$/i.test(k)) url.searchParams.delete(k);
    return url.pathname + (url.searchParams.toString() ? `?${url.searchParams}` : '');
  } catch {
    return p.split('?')[0];
  }
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'necunoscut';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Ai trimis deja mai multe rapoarte. Încearcă peste o oră.' }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cerere invalidă.' }, { status: 400 });
  }

  const id = newReportId();
  // Capcana pentru boți: răspundem ca la un raport reușit, dar nu salvăm nimic.
  if (str(body.website, 200)) return NextResponse.json({ ok: true, id });

  const description = str(body.description, 2000);
  if (description.length < 5) {
    return NextResponse.json({ error: 'Scrie, te rog, măcar o propoziție despre ce s-a întâmplat.' }, { status: 400 });
  }
  const email = str(body.email, 200);
  if (email && !EMAIL.test(email)) {
    return NextResponse.json({ error: 'Adresa de email nu pare corectă. Poți s-o lași și goală.' }, { status: 400 });
  }

  const kindId = str(body.kind, 30);
  const kind = KINDS[kindId] ? kindId : 'altceva';
  const ctx = (body.context && typeof body.context === 'object' ? body.context : {}) as Record<string, unknown>;
  const errors = Array.isArray(ctx.errors)
    ? ctx.errors
        .slice(-10)
        .map((e) => {
          const o = (e && typeof e === 'object' ? e : {}) as Record<string, unknown>;
          return `${str(o.at, 30)} ${str(o.message, 300)}${o.where ? ` (${str(o.where, 200)})` : ''}`.trim();
        })
        .join('\n')
    : '';
  const version = appVersion();
  const site = process.env.VERCEL_PROJECT_PRODUCTION_URL || req.headers.get('host') || 'local';

  const row: ReportRow = {
    id,
    at: new Date().toISOString(),
    site,
    kind,
    subject: str(body.subject, 200),
    path: stripSecrets(str(ctx.path, 500)),
    description,
    email,
    source: str(body.source, 40),
    clientCommit: str(ctx.clientCommit, 20),
    serverCommit: version.commit,
    userAgent: str(ctx.userAgent, 400),
    screen: [str(ctx.viewport, 40), str(ctx.screen, 60)].filter(Boolean).join(' · ') + (ctx.online === false ? ' · offline' : ''),
    locale: [str(ctx.language, 20), str(ctx.timezone, 60)].filter(Boolean).join(' · '),
    errors,
    chatSessionId: str(ctx.chatSessionId, 64),
  };

  console.log(JSON.stringify({ tag: 'report', id, site, kind, path: row.path, source: row.source, clientCommit: row.clientCommit, serverCommit: row.serverCommit }));

  const [sheet, mail] = await Promise.allSettled([
    saveReportToSheet(row),
    sendReportEmail({
      id,
      site,
      title: `${KINDS[kind]}${row.subject ? ` · ${row.subject}` : ''} (${id})`,
      replyTo: email || undefined,
      rows: [
        ['Descriere', description],
        ['Pagina', row.path],
        ['Despre', row.subject],
        ['Email', email || '(nu a lăsat)'],
        ['Deschis din', row.source],
        ['Commit client / server', `${row.clientCommit || '?'} / ${row.serverCommit}`],
        ['Browser', row.userAgent],
        ['Ecran', row.screen],
        ['Limba / fus', row.locale],
        ['Erori JS', errors || 'niciuna'],
        ['Chat sid', row.chatSessionId],
      ],
    }),
  ]);

  const savedToSheet = sheet.status === 'fulfilled';
  const emailed = mail.status === 'fulfilled' && mail.value;
  if (!savedToSheet) console.error('[report] Sheets:', sheet.status === 'rejected' ? sheet.reason : '');
  if (!savedToSheet && !emailed) {
    return NextResponse.json({ error: 'Raportul nu s-a putut salva acum. Scrie-ne, te rog, pe email.' }, { status: 500 });
  }
  if (!savedToSheet) {
    // Raportul există doar în email: rutina nu-l vede în Sheets. O alertă, ca să știm.
    after(() => alertError({ area: 'report', kind: 'sheets', message: `Raportul ${id} nu s-a salvat în Sheets (doar pe email)` }));
  }
  return NextResponse.json({ ok: true, id });
}
