// Locul lucrării pe cerere, în Neon (tabelul din migrarea 014). Regulile pe
// care le știe și browserul (format, linkul de hartă) stau în
// `lead-location-shared`.

import 'server-only';
import { db } from './db';

export interface LeadLocation {
  adresa: string;
  coordonate: string;
}

// Migrația 014 încă neaplicată: nicio locație, nu eroare. Pagina cererii și
// portalul merg mai departe fără ea.
function missingTable(err: unknown): boolean {
  return (err as { code?: string }).code === '42P01';
}

export async function getLeadLocation(leadId: string): Promise<LeadLocation | null> {
  return (await getLeadLocations([leadId])).get(leadId) ?? null;
}

/** Locațiile mai multor cereri dintr-o singură interogare (portalul firmei). */
export async function getLeadLocations(leadIds: string[]): Promise<Map<string, LeadLocation>> {
  const out = new Map<string, LeadLocation>();
  if (!leadIds.length) return out;
  try {
    const rows = await db()`
      SELECT lead_id, adresa, coordonate FROM lead_locatii WHERE lead_id = ANY(${leadIds})
    `;
    for (const r of rows) {
      out.set(r.lead_id as string, { adresa: r.adresa as string, coordonate: r.coordonate as string });
    }
  } catch (err) {
    if (!missingTable(err)) throw err;
  }
  return out;
}

/**
 * Scrie și valori goale: clientul își poate corecta sau șterge adresa din cont.
 * Autorizarea (tokenul de detalii) o face ruta, nu funcția asta.
 */
export async function setLeadLocation(leadId: string, location: LeadLocation): Promise<void> {
  await db()`
    INSERT INTO lead_locatii (lead_id, adresa, coordonate, updated_at)
    VALUES (${leadId}, ${location.adresa}, ${location.coordonate}, now())
    ON CONFLICT (lead_id) DO UPDATE
      SET adresa = EXCLUDED.adresa, coordonate = EXCLUDED.coordonate, updated_at = now()
  `;
}
