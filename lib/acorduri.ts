// Acordurile firmelor, partea cu baza (Neon, `acorduri_firme`). Textele și
// versiunile stau în `lib/acorduri-shared.ts`.
//
// Acceptarea e pe ADRESĂ, nu pe firmă: fiecare coleg care folosește contul
// bifează o dată pe versiune. Comisionul e al firmei, dar dovada e mai curată
// așa (cine a bifat, când, de unde), și nu depinde de cum sunt legate adresele
// în Sheets la un moment dat.
//
// Dacă baza pică, verificarea lasă firma să lucreze (fail-open) și mă anunță:
// un portal blocat pentru toate firmele costă mai mult decât o revendicare fără
// bifă, iar căderile Neon sunt rare.

import 'server-only';
import { db } from './db';
import { alertError } from './alert';
import { ACORDURI, bifaFormular, textDeSalvat, type AcordId, type AcordStare } from './acorduri-shared';
import { normalizeEmail } from './portal-auth';
import { getFirmIdentity } from './sheets';

interface RandAcord {
  email: string;
  acord: string;
  versiune: string;
  sursa: string;
  acceptat_la: string;
}

export interface VerificareAcorduri {
  /** Ce acorduri, la versiunea curentă, n-a acceptat încă adresa. Gol = poate lucra. */
  lipsa: AcordId[];
  /** Dintre cele lipsă, cele la care adresa acceptase o versiune mai veche. */
  actualizate: AcordId[];
}

export async function verificaAcorduri(rawEmail: string): Promise<VerificareAcorduri> {
  const email = normalizeEmail(rawEmail);
  try {
    const rows = (await db()`
      SELECT acord, versiune FROM acorduri_firme WHERE email = ${email}
    `) as Pick<RandAcord, 'acord' | 'versiune'>[];
    const are = new Set(rows.map((r) => `${r.acord}@${r.versiune}`));
    const lipsa = ACORDURI.filter((a) => !are.has(`${a.id}@${a.versiune}`)).map((a) => a.id);
    const actualizate = lipsa.filter((id) => rows.some((r) => r.acord === id));
    return { lipsa, actualizate };
  } catch (err) {
    console.error('[acorduri] citire:', err);
    await alertError({
      area: 'acorduri',
      kind: 'citire',
      message: `Nu pot citi acordurile firmelor din Neon, firmele lucrează fără verificare: ${
        err instanceof Error ? err.message : String(err)
      }`.slice(0, 200),
    });
    return { lipsa: [], actualizate: [] };
  }
}

/** Scurtătura pentru rutele care doar refuză: ce mai are de bifat adresa. */
export async function acorduriLipsa(email: string): Promise<AcordId[]> {
  return (await verificaAcorduri(email)).lipsa;
}

/**
 * Salvează bifele pentru versiunile curente. Aruncă dacă baza pică: cine
 * cheamă decide (modalul arată eroarea, revendicarea merge mai departe).
 */
export async function acceptaAcorduri(opts: {
  email: string;
  ids: AcordId[];
  sursa: 'portal' | 'revendicare';
  /** Numele firmei în numele căreia se bifează; intră în textul salvat. */
  firma: string;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  const email = normalizeEmail(opts.email);
  const ip = (opts.ip || '').slice(0, 100);
  const ua = (opts.userAgent || '').slice(0, 300);
  // Textul pe care l-a văzut firma: în formular, o singură căsuță pentru ambele.
  const text = (acord: (typeof ACORDURI)[number]) =>
    opts.sursa === 'revendicare' ? bifaFormular(opts.firma) : textDeSalvat(acord, opts.firma);
  for (const acord of ACORDURI.filter((a) => opts.ids.includes(a.id))) {
    await db()`
      INSERT INTO acorduri_firme (email, acord, versiune, text_acceptat, sursa, ip, user_agent)
      VALUES (${email}, ${acord.id}, ${acord.versiune}, ${text(acord)}, ${opts.sursa}, ${ip}, ${ua})
      ON CONFLICT (email, acord, versiune) DO NOTHING
    `;
  }
}

/**
 * Numele firmei în numele căreia bifează adresa: profilul firmei, altfel ultima
 * revendicare. Gol dacă nu-l știm (cont nou fără profil): bifa spune atunci
 * „firmei pe care o reprezint”. Citește din Sheets, deci doar cât firma are de bifat.
 */
export async function numeFirmaPentru(email: string): Promise<string> {
  try {
    return (await getFirmIdentity(normalizeEmail(email)))?.numeFirma?.trim() ?? '';
  } catch (err) {
    console.error('[acorduri] numele firmei:', err);
    return '';
  }
}

/** IP-ul și browserul cererii, pentru dovadă. Pe Vercel IP-ul vine în x-forwarded-for. */
export function dovadaCerere(request: Request): { ip: string; userAgent: string } {
  const fwd = request.headers.get('x-forwarded-for') || '';
  return {
    ip: fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || '',
    userAgent: request.headers.get('user-agent') || '',
  };
}

/** Pentru tabul Setări din portal: fiecare acord și cine din firmă l-a acceptat la versiunea curentă. */
export async function stareAcorduriFirma(emails: string[]): Promise<AcordStare[]> {
  const lista = [...new Set(emails.map(normalizeEmail))];
  let rows: RandAcord[] = [];
  try {
    rows = (await db()`
      SELECT email, acord, versiune, sursa, acceptat_la FROM acorduri_firme
      WHERE email = ANY(${lista})
      ORDER BY acceptat_la
    `) as RandAcord[];
  } catch (err) {
    console.error('[acorduri] stare firmă:', err);
  }
  return ACORDURI.map((a) => ({
    id: a.id,
    titlu: a.titlu,
    href: a.href,
    versiune: a.versiune,
    dataVersiunii: a.dataVersiunii,
    acceptari: rows
      .filter((r) => r.acord === a.id && r.versiune === a.versiune)
      .map((r) => ({ email: r.email, la: new Date(r.acceptat_la).toISOString(), sursa: r.sursa })),
  }));
}

/** Pentru /admin/portal: ultima acceptare a versiunii curente, pe adresă și acord. */
export async function acceptariCurente(): Promise<Map<string, Partial<Record<AcordId, string>>>> {
  const out = new Map<string, Partial<Record<AcordId, string>>>();
  const rows = (await db()`
    SELECT email, acord, versiune, acceptat_la FROM acorduri_firme
  `) as RandAcord[];
  for (const r of rows) {
    const acord = ACORDURI.find((a) => a.id === r.acord && a.versiune === r.versiune);
    if (!acord) continue;
    const cur = out.get(r.email) ?? {};
    cur[acord.id] = new Date(r.acceptat_la).toISOString();
    out.set(r.email, cur);
  }
  return out;
}
