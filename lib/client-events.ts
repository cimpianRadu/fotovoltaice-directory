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
  // WhatsApp „ofertă bună?" (12 nov 2026): Radu a deschis mesajul din
  // /admin/cereri, apoi clientul a deschis linkul din el
  'whatsapp_deschis',
  'verificare_deschisa',
  // WhatsApp „cu ce firmă ați lucrat?" (13 nov 2026), pe cererile închise pe
  // „altundeva": Radu a deschis mesajul, apoi clientul a răspuns pe pagină
  'whatsapp_firma_deschis',
  'firma_aleasa_raspuns',
  // WhatsApp „mai căutați?” (18 nov 2026), pe cererile deschise ținute de o
  // firmă fără nicio mișcare de 7+ zile: Radu a deschis mesajul
  'whatsapp_status_deschis',
  // Ce a scris clientul înapoi pe WhatsApp (17 nov 2026), notat de Radu din
  // /admin/whatsapp sau de rutina de dimineață: props { text, la }. Ultimul
  // rând pe cerere e răspunsul valabil; text gol = șters.
  'whatsapp_raspuns',
  // A doua încercare pe WhatsApp (18 nov 2026, Radu: „nu agresiv, dar nu aș
  // vrea să-i las așa de ușor”), o singură dată pe mesaj: props { kind, motiv }.
  // kind = mesajul la care revine (oferta / firma); motiv = oferta sau firma
  // (n-a răspuns deloc) ori nume_firma (a zis că a montat, fără firmă).
  'whatsapp_revenire',
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
