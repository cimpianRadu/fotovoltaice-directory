// Ofertele urcate de firme din portal (etapa 2 a contului de client, 23 oct 2026).
// Firma urcă PDF-ul sau pozele în portal, clientul le vede în cont, iar firma află
// când le-a deschis clientul. Asta e ce câștigă firma: pe email sau WhatsApp nu
// știe dacă oferta a fost văzută. Noi aflăm ce s-a ofertat și la ce preț.
//
// Pornit doar pentru firmele din pilot (OFFER_PILOT_FIRMS), după apelurile lui Radu.
// Nicio firmă nu vede ofertele altei firme: clientul le vede pe toate ale lui,
// firma doar pe a ei, adminul pe toate.

import 'server-only';
import { get, head } from '@vercel/blob';
import { db } from './db';
import { normalizeFirmName } from './sheets-shared';
import type { OfferFile } from './oferte-shared';
import { getClaims, getFirmEmailGroup, type LeadClaim } from './sheets';
import { clientOffersLive, deliveredClaims } from './client-account';

/**
 * Firmele din pilot (decizia din 22-23 oct 2026): cele mai active pe cereri în
 * ultimele 60 de zile. Potrivirea se face pe numele normalizat din revendicare.
 */
export const OFFER_PILOT_FIRMS = ['Energia Verde Casa', 'Electro Prahova', 'AXIONET IoT'];

export function isOfferPilotFirm(numeFirma: string): boolean {
  const name = normalizeFirmName(numeFirma);
  return OFFER_PILOT_FIRMS.some((f) => {
    const pilot = normalizeFirmName(f);
    return name === pilot || name.startsWith(`${pilot} `);
  });
}

export interface OfferForClient {
  id: number;
  claimTs: string;
  firmName: string;
  createdAt: string;
  files: Omit<OfferFile, 'pathname'>[];
  valoareFaraTva: number | null;
  putereKw: number | null;
  mesaj: string | null;
  /** Prima deschidere a unui fișier de către client. */
  clientOpenedAt: string | null;
}

type Row = Record<string, unknown>;

function toOffer(r: Row): OfferForClient {
  const files = (r.files as OfferFile[]) ?? [];
  return {
    id: Number(r.id),
    claimTs: String(r.claim_ts),
    firmName: String(r.firm_name),
    createdAt: new Date(r.created_at as string).toISOString(),
    files: files.map(({ name, size, contentType }) => ({ name, size, contentType })),
    valoareFaraTva: r.valoare_fara_tva === null || r.valoare_fara_tva === undefined ? null : Number(r.valoare_fara_tva),
    putereKw: r.putere_kw === null || r.putere_kw === undefined ? null : Number(r.putere_kw),
    mesaj: (r.mesaj as string | null) ?? null,
    clientOpenedAt: r.client_opened_at ? new Date(r.client_opened_at as string).toISOString() : null,
  };
}

export async function offersForLead(leadId: string): Promise<OfferForClient[]> {
  const rows = await db()`
    SELECT o.*, (SELECT min(v.at) FROM offer_views v WHERE v.offer_id = o.id AND v.viewer = 'client') AS client_opened_at
    FROM offers o WHERE o.lead_id = ${leadId} AND o.withdrawn_at IS NULL
    ORDER BY o.created_at
  `;
  return rows.map(toOffer);
}

/** Ofertele unei firme (toate adresele ei din portal), pe cereri. */
export async function offersForFirm(emails: string[]): Promise<(OfferForClient & { leadId: string })[]> {
  if (!emails.length) return [];
  const rows = await db()`
    SELECT o.*, (SELECT min(v.at) FROM offer_views v WHERE v.offer_id = o.id AND v.viewer = 'client') AS client_opened_at
    FROM offers o WHERE o.firm_email = ANY(${emails}) AND o.withdrawn_at IS NULL
    ORDER BY o.created_at DESC
  `;
  return rows.map((r) => ({ ...toOffer(r), leadId: String(r.lead_id) }));
}

export async function getOffer(id: number): Promise<(OfferForClient & { leadId: string; firmEmail: string; filesFull: OfferFile[] }) | null> {
  const [r] = await db()`
    SELECT o.*, (SELECT min(v.at) FROM offer_views v WHERE v.offer_id = o.id AND v.viewer = 'client') AS client_opened_at
    FROM offers o WHERE o.id = ${id} AND o.withdrawn_at IS NULL
  `;
  if (!r) return null;
  return { ...toOffer(r), leadId: String(r.lead_id), firmEmail: String(r.firm_email), filesFull: (r.files as OfferFile[]) ?? [] };
}

export async function createOffer(o: {
  leadId: string;
  claimTs: string;
  firmName: string;
  firmEmail: string;
  files: OfferFile[];
  valoareFaraTva: number | null;
  putereKw: number | null;
  mesaj: string | null;
}): Promise<number> {
  const [row] = await db()`
    INSERT INTO offers (lead_id, claim_ts, firm_name, firm_email, files, valoare_fara_tva, putere_kw, mesaj)
    VALUES (${o.leadId}, ${o.claimTs}, ${o.firmName}, ${o.firmEmail}, ${JSON.stringify(o.files)}::jsonb,
            ${o.valoareFaraTva}, ${o.putereKw}, ${o.mesaj})
    RETURNING id
  `;
  return Number(row.id);
}

/** Notează deschiderea. Întoarce true dacă e prima deschidere a clientului pe oferta asta. */
export async function recordOfferView(offerId: number, fileIndex: number, viewer: 'client' | 'firma' | 'admin'): Promise<boolean> {
  const rows = await db()`
    WITH prev AS (SELECT count(*)::int AS n FROM offer_views WHERE offer_id = ${offerId} AND viewer = 'client')
    INSERT INTO offer_views (offer_id, file_index, viewer) SELECT ${offerId}, ${fileIndex}, ${viewer}
    RETURNING (SELECT n FROM prev) AS before
  `;
  return viewer === 'client' && Number(rows[0]?.before ?? 1) === 0;
}

/** Ca la poze: OIDC pe Vercel, tokenul din .env.local în `next dev`. */
function blobAuth() {
  return process.env.VERCEL ? {} : { token: process.env.BLOB_READ_WRITE_TOKEN };
}

export async function headOfferFile(pathname: string) {
  return head(pathname, blobAuth());
}

/** Singurul loc din care ies fișierele de ofertă; cine îl apelează a verificat deja cine întreabă. */
export async function readOfferFile(pathname: string) {
  const result = await get(pathname, { access: 'private', ...blobAuth() });
  if (!result || result.statusCode !== 200) return null;
  return result;
}

/**
 * Revendicarea prin care firma logată poate trimite ofertă pe cerere: a ei
 * (orice adresă a firmei), cu datele clientului deblocate, neretrasă, firmă din
 * pilot, după pornirea contului de client. Altfel null.
 */
export async function offerClaimFor(firmEmail: string, leadId: string): Promise<LeadClaim | null> {
  if (!clientOffersLive()) return null;
  const [group, claims] = await Promise.all([getFirmEmailGroup(firmEmail), getClaims()]);
  const mine = new Set(group.map((e) => e.toLowerCase()));
  const claim = deliveredClaims(claims, leadId).find((c) => mine.has((c.email || '').toLowerCase()));
  return claim && isOfferPilotFirm(claim.numeFirma) ? claim : null;
}
