// Evenimentele contului de client (24 oct 2026), pentru verdictul experimentului
// de peste două săptămâni (/admin/cont-client, secțiunea „Experiment”). Fiecare
// pas al omului, de la blocul văzut după formular până la cererea închisă din
// cont. Scrierea nu are voie să strice nimic: erorile se înghit.

import 'server-only';
import { db } from './db';

export const CLIENT_EVENTS = [
  // ecranul de după formular
  'cta_vazut',
  'cta_click',
  // intrarea în cont
  'intrare_link',
  'cod_cerut',
  'cod_intrat',
  'pagina_cerere',
  // ce face în cont
  'raspuns_firma',
  'notita_firma',
  'retrimitere',
  'inchisa',
  'stergere',
  'oferta_deschisa',
  // emailurile plecate
  'email_trimis',
] as const;
export type ClientEvent = (typeof CLIENT_EVENTS)[number];

/** Evenimentele pe care le poate trimite browserul (restul le scrie doar serverul). */
export const BROWSER_EVENTS: readonly ClientEvent[] = ['cta_vazut', 'cta_click'];

export async function recordClientEvent(
  leadId: string | null,
  event: ClientEvent,
  props?: Record<string, unknown>,
): Promise<void> {
  try {
    await db()`
      INSERT INTO client_events (lead_id, event, props)
      VALUES (${leadId}, ${event}, ${props ? JSON.stringify(props) : null}::jsonb)
    `;
  } catch (err) {
    console.error('[cont] eveniment', event, err);
  }
}
