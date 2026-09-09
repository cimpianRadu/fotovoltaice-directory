// Partea de server a pozelor pe cerere: tokenul care autorizează încărcarea și
// citirea fișierului din store-ul privat. Regulile care trebuie știute și în
// browser (limite, tipuri, forma căilor) stau în `lead-photos-shared`.
//
// Fișierele nu au URL public. Încărcarea se face direct din browser în Blob
// (client upload) — singura variantă care nu plătește transfer de date la
// urcare și nu se lovește de limita de body a funcțiilor — iar citirea trece
// numai prin rutele noastre, după verificarea sesiunii.

import { createHmac } from 'node:crypto';
import { get, head } from '@vercel/blob';
import { safeEqual } from './portal-auth';

export {
  LEAD_PHOTO_MAX,
  LEAD_PHOTO_MAX_BYTES,
  LEAD_PHOTO_TYPES,
  isLeadPhotoPath,
  leadPhotoPrefix,
  safePhotoName,
} from './lead-photos-shared';

/**
 * Tokenul care dovedește că cel care încarcă e chiar cel care tocmai a trimis
 * cererea. Fără el, ruta de încărcare ar fi un depozit gratuit deschis pe
 * internet, pe factura noastră.
 *
 * Folosește `PORTAL_SECRET`, secretul care există deja în producție. Prefixul
 * din payload separă întrebuințările: un token de poze nu poate fi rejucat ca
 * sesiune de portal, fiindcă semnătura acoperă și prefixul.
 */
function secret(): string {
  const value = process.env.PORTAL_SECRET;
  if (!value) throw new Error('PORTAL_SECRET lipsește: nu pot semna tokenul de poze.');
  return value;
}

function sign(leadId: string, exp: number): string {
  return createHmac('sha256', secret()).update(`lead-photos:${leadId}:${exp}`).digest('hex');
}

/**
 * Fereastra de încărcare. Ecranul de confirmare e deschis acum, în fața
 * omului; o zi acoperă și cazul „mă duc până la tablou și revin", fără ca un
 * token scăpat să fie util săptămâni întregi.
 */
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function createLeadPhotoToken(leadId: string): string {
  const exp = Date.now() + TOKEN_TTL_MS;
  return `${exp}.${sign(leadId, exp)}`;
}

export function verifyLeadPhotoToken(token: string, leadId: string): boolean {
  const dot = token.indexOf('.');
  if (dot === -1) return false;
  const exp = Number(token.slice(0, dot));
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  return safeEqual(token.slice(dot + 1), sign(leadId, exp));
}

/**
 * Cum se autentifică SDK-ul la store. Pe Vercel lăsăm OIDC, calea recomandată:
 * token scurt, care se rotește singur, fără credențial de lungă durată în cod.
 *
 * Local nu merge, și nu fiindcă lipsește ceva: `next dev` injectează el un
 * `VERCEL_OIDC_TOKEN` pentru proiectul legat, dar OIDC nu e activ pe mediul
 * „development", așa că SDK-ul crapă cu „OIDC is enabled for this project, but
 * not for the development environment". De aceea decizia se ia după `VERCEL`
 * (setat în toate rulările de pe Vercel), nu după prezența tokenului OIDC —
 * altfel dev-ul alege tocmai calea care nu funcționează.
 */
function blobAuth() {
  return process.env.VERCEL ? {} : { token: process.env.BLOB_READ_WRITE_TOKEN };
}

/** `head`, cu aceeași autentificare ca restul: verifică dacă fișierul există. */
export async function headLeadPhoto(pathname: string) {
  return head(pathname, blobAuth());
}

/**
 * Descarcă poza din store-ul privat. Singurul loc din care ies pozele; cine îl
 * apelează a verificat deja CINE întreabă. Întoarce null când fișierul nu mai
 * există, ca ruta să răspundă 404 în loc să arunce.
 */
export async function readLeadPhoto(pathname: string) {
  const result = await get(pathname, { access: 'private', ...blobAuth() });
  if (!result || result.statusCode !== 200) return null;
  return result;
}
