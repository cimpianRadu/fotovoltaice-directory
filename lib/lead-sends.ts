// Unde a plecat fiecare cerere: un rând pe email trimis unei firme (alerta la
// creare, retrimiterea din „Încă vreau oferte”, rezumatul de luni). Până pe 23 oct
// 2026 se știa doar că alertele plecaseră (coloana AF), nu la cine; din jurnalul
// ăsta vine „Trimisă la N firme” din contul clientului.
//
// Din 27 oct fiecare email are și codul pixelului de deschidere (lib/email.ts,
// openPixel), iar app/api/e/[token] scrie pe rând când a fost deschis.
//
// Scrierea nu are voie să oprească trimiterea: o eroare de bază se înghite.

import 'server-only';
import { db } from './db';

export type LeadSendKind = 'creare' | 'retrimitere' | 'rezumat' | 'deblocare';

/** Adresa firmei, cu codul pixelului din emailul ei dacă emailul îl are. */
export type LeadSend = string | { email: string; openToken?: string };

/**
 * Emailurile plecate dintr-o trimitere în paralel (`Promise.allSettled` pe
 * `recipients`), cu codul pixelului fiecăruia.
 */
export function sentFrom(
  recipients: string[],
  results: PromiseSettledResult<{ ok: boolean; openToken?: string }>[],
): LeadSend[] {
  return recipients.flatMap((email, i) => {
    const r = results[i];
    return r?.status === 'fulfilled' && r.value.ok ? [{ email, openToken: r.value.openToken }] : [];
  });
}

export async function logLeadSends(
  leadId: string,
  sends: LeadSend[],
  kind: LeadSendKind,
  firmName?: string,
): Promise<void> {
  const byEmail = new Map<string, string | null>();
  for (const s of sends) {
    const email = (typeof s === 'string' ? s : s.email).trim().toLowerCase();
    if (email && !byEmail.has(email)) byEmail.set(email, typeof s === 'string' ? null : (s.openToken ?? null));
  }
  if (!byEmail.size) return;
  try {
    await db()`
      INSERT INTO lead_sends (lead_id, firm_email, firm_name, kind, open_token)
      SELECT ${leadId}, e, ${firmName ?? null}, ${kind}, t
      FROM unnest(${[...byEmail.keys()]}::text[], ${[...byEmail.values()]}::text[]) AS s(e, t)
    `;
  } catch (err) {
    console.error('[lead-sends]', err);
  }
}

/** Codul are forma din lib/email.ts (newOpenToken); orice altceva nu ajunge la bază. */
export function isOpenToken(s: string): boolean {
  return /^[A-Za-z0-9_-]{22}$/.test(s);
}

/** Pixelul s-a încărcat: prima deschidere rămâne, restul doar se numără. */
export async function recordEmailOpen(token: string, userAgent: string | null): Promise<void> {
  await db()`
    UPDATE lead_sends SET
      opened_at = coalesce(opened_at, now()),
      last_opened_at = now(),
      opens = opens + 1,
      opened_ua = coalesce(opened_ua, ${userAgent ? userAgent.slice(0, 300) : null})
    WHERE open_token = ${token}
  `;
}

/**
 * Cine a încărcat imaginea, din browserul primei deschideri. Proxy-ul Apple Mail
 * („Mail Privacy Protection”) cere imaginile cu un browser gol, doar
 * „Mozilla/5.0”, și o face singur la primirea emailului, deci acolo deschiderea
 * poate să nu fie a omului.
 */
export function openClientLabel(ua: string | null): { label: string; maybeAuto: boolean } {
  const s = (ua || '').trim();
  if (s === 'Mozilla/5.0') return { label: 'Apple Mail', maybeAuto: true };
  if (/GoogleImageProxy/i.test(s)) return { label: 'Gmail', maybeAuto: false };
  if (/YahooMailProxy/i.test(s)) return { label: 'Yahoo', maybeAuto: false };
  if (/Outlook|Microsoft Office/i.test(s)) return { label: 'Outlook', maybeAuto: false };
  if (/iPhone|iPad|Android|Mobile/i.test(s)) return { label: 'telefon', maybeAuto: false };
  return { label: s ? 'alt client' : 'necunoscut', maybeAuto: false };
}
