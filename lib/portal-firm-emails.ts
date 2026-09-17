// Adresele firmei, gestionate de firmă din /portal (self-service, 17 sept 2026).
//
// Până acum legarea adreselor se făcea doar din /admin/portal. Firma își poate
// acum adăuga un coleg sau își poate schimba emailul singură: intră cu adresa
// nouă, o adaugă, apoi o scoate pe cea veche. Adăugarea e directă, fără cod pe
// adresa nouă (decizie de produs: mai ușor pentru firme), iar /admin/portal
// rămâne locul din care corectăm orice.
//
// Reguli:
// - Nu se adaugă o adresă care are deja urme proprii (cont, revendicări,
//   alerte, urmăriri, abonament, altă firmă legată). Altfel o firmă ar putea
//   lipi peste contul ei cererile altei firme doar tastându-i adresa.
// - Orice adresă a firmei poate scoate altă adresă, dar nu pe ea însăși (ar
//   rămâne logată într-un cont care nu mai e al ei) și nu adresa abonamentului.
// - Ce era pe adresa scoasă (revendicări, urmăriri, județele de alertă) trece
//   pe adresa care a scos-o, ca firma să nu piardă nimic la schimbarea emailului.

import {
  addFirmEmailLink,
  getClaims,
  getCountyAlertPrefs,
  getFirmEmailLinks,
  getLeadSubscriptions,
  getPortalAccessEvents,
  getWatches,
  latestClaimIdentity,
  reassignClaimsEmail,
  reassignWatchesEmail,
  resolveEmailGroup,
  resolveGroupAlertPref,
  saveCountyAlertPrefs,
  unlinkFirmEmail,
  type FirmEmailLink,
} from './sheets';
import { isValidEmail, normalizeEmail } from './portal-auth';

/** Greșeală a firmei (adresă invalidă, deja pe cont), nu defecțiune: 400 cu mesajul ei. */
export class PortalFirmEmailError extends Error {}

/** Destul pentru o firmă de 6-20 de angajați; peste, e mai probabil o greșeală sau un abuz. */
export const MAX_FIRM_EMAILS = 5;

export interface PortalFirmEmailChange {
  /** Adresa adăugată sau scoasă. */
  email: string;
  /** Adresa logată care a făcut schimbarea. */
  by: string;
  /** Numele firmei de pe revendicări, dacă există. */
  firma: string;
  /** Adresele firmei după schimbare. */
  addresses: string[];
  /** Doar la scoatere: câte revendicări au trecut pe adresa logată. */
  movedClaims?: number;
}

export async function addPortalFirmEmail(
  sessionEmail: string,
  rawEmail: string,
): Promise<PortalFirmEmailChange> {
  const by = normalizeEmail(sessionEmail);
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    throw new PortalFirmEmailError('Adresa nu pare un email valid.');
  }

  const [links, claims, events, prefs, watches, subs] = await Promise.all([
    getFirmEmailLinks(),
    getClaims(),
    getPortalAccessEvents(),
    getCountyAlertPrefs(),
    getWatches(),
    getLeadSubscriptions(),
  ]);

  const group = resolveEmailGroup(links, by);
  if (group.includes(email)) {
    throw new PortalFirmEmailError('Adresa e deja pe contul firmei.');
  }
  if (group.length >= MAX_FIRM_EMAILS) {
    throw new PortalFirmEmailError(
      `Contul are deja ${MAX_FIRM_EMAILS} adrese. Scoate una înainte să adaugi alta.`,
    );
  }

  const hasFootprint =
    resolveEmailGroup(links, email).length > 1 ||
    claims.some((c) => c.email === email) ||
    events.some((e) => e.email === email && e.event === 'intrat') ||
    prefs.some((p) => p.email === email) ||
    watches.some((w) => w.email === email) ||
    subs.some((s) => normalizeEmail(s.email) === email);
  if (hasFootprint) {
    throw new PortalFirmEmailError(
      'Adresa are deja cont în portal sau cereri proprii. Scrie-ne la contact@instalatori-fotovoltaice.ro și unim noi conturile.',
    );
  }

  const firma = latestClaimIdentity(claims, group)?.numeFirma || '';
  await addFirmEmailLink({
    primary: group[0],
    alias: email,
    firma,
    note: `adăugat din portal de ${by}`,
  });

  return { email, by, firma, addresses: [...group, email] };
}

export async function removePortalFirmEmail(
  sessionEmail: string,
  rawEmail: string,
): Promise<PortalFirmEmailChange> {
  const by = normalizeEmail(sessionEmail);
  const email = normalizeEmail(rawEmail);
  if (email === by) {
    throw new PortalFirmEmailError(
      'Nu poți scoate adresa cu care ești conectat. Intră cu altă adresă a firmei și scoate-o de acolo.',
    );
  }

  const [links, claims, prefs, subs] = await Promise.all([
    getFirmEmailLinks(),
    getClaims(),
    getCountyAlertPrefs(),
    getLeadSubscriptions(),
  ]);

  const group = resolveEmailGroup(links, by);
  if (!group.includes(email)) {
    throw new PortalFirmEmailError('Adresa nu e pe contul firmei.');
  }
  if (subs.some((s) => s.active && normalizeEmail(s.email) === email)) {
    throw new PortalFirmEmailError(
      'Pe adresa asta primiți cererile din abonament. Scrie-ne și o schimbăm noi.',
    );
  }

  const firma = latestClaimIdentity(claims, group)?.numeFirma || '';
  const note = `scos din portal de ${by}`;

  // 1. Datele adresei trec pe cea logată, ÎNAINTE de ruperea legăturii: dacă
  // pică ceva la jumătate, datele sunt tot în contul firmei, nu pierdute.
  const groupPref = resolveGroupAlertPref(prefs, group);
  if (groupPref?.email === email) {
    await saveCountyAlertPrefs(by, groupPref.active ? groupPref.counties : []);
  }
  const movedClaims = await reassignClaimsEmail(email, by);
  await reassignWatchesEmail(email, by);

  // 2. Cine rămâne legat doar prin adresa scoasă (A-B, A-C, se scoate A) se
  // leagă direct de adresa logată, altfel B și C s-ar despărți.
  const touches = (l: FirmEmailLink) => l.active && (l.primary === email || l.alias === email);
  const linksAfter = links.map((l) => (touches(l) ? { ...l, active: false } : l));
  const stillConnected = new Set(resolveEmailGroup(linksAfter, by));
  for (const member of group) {
    if (member === email || stillConnected.has(member)) continue;
    await addFirmEmailLink({ primary: by, alias: member, firma, note: `relegat când ${note}` });
  }

  // 3. Legăturile adresei scoase.
  for (const l of links.filter(touches)) {
    await unlinkFirmEmail(l.primary, l.alias, note);
  }

  // 4. Adresa scoasă nu mai primește alerte: rândul ei rămâne, oprit.
  if (prefs.some((p) => p.email === email)) {
    await saveCountyAlertPrefs(email, []);
  }

  return {
    email,
    by,
    firma,
    addresses: group.filter((e) => e !== email),
    movedClaims,
  };
}
