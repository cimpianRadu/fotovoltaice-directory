import {
  getClaims,
  getCountyAlertPrefs,
  getFirmProfiles,
  getLeadsSince,
  getPortalAccessEvents,
  resolveGroupAlertPref,
  resolveGroupProfile,
  type NewLead,
} from '@/lib/sheets';
import { parseRequestedFirms } from '@/lib/sheets-shared';
import {
  getBudgetLabel,
  getCallWindowLabel,
  getConnectionLabel,
  getFinancingLabel,
  getPhaseLabel,
  getRoofTypeLabel,
  getScopLabel,
  getTimelineLabel,
  getWorkTypeLabel,
  getYesNoLabel,
} from '@/lib/utils-shared';
import { precalificareActivitate } from '@/lib/asistent';
import type { ClaimLeadDetail } from './ApproveClaims';
import { leadLabel } from './give-options';
import { buildMovements, type Movement } from './movements';
import { fmtDateTime } from './MovementText';

// Ce se încarcă pe cardul din /admin/portal abia când îl deschizi (24 nov
// 2026): detaliile cererii din modalul unei revendicări și istoricul complet al
// contului. Trimise cu pagina, pe toate cardurile, o făceau de câțiva MB.

/**
 * Cererea pentru modalul din card, cu etichetele rezolvate aici, pe server.
 * Aceleași câmpuri ca mesajul de partajare din /admin/crm (formatLead.ts),
 * fără notele interne: aici te uiți cine e clientul, nu ce am scris noi.
 */
export function leadDetail(lead: NewLead | undefined): ClaimLeadDetail | undefined {
  if (!lead) return undefined;
  const spec = (label: string, value: string) =>
    value.trim() ? [{ label, value: value.trim() }] : [];
  const requested = parseRequestedFirms(lead.preselectedCompany);
  return {
    when: fmtDateTime(lead.timestamp),
    numeContact: lead.numeContact,
    numeCompanie: lead.numeCompanie,
    telefon: lead.telefon,
    email: lead.email,
    localitate: lead.localitate,
    intervalApel: lead.intervalApel ? getCallWindowLabel(lead.intervalApel) : '',
    specs: [
      ...spec('Segment', lead.segment === 'rezidential' ? 'Rezidențial' : lead.segment ? 'Comercial' : ''),
      ...spec('Tip lucrare', lead.tipLucrare ? getWorkTypeLabel(lead.tipLucrare) : ''),
      ...spec('Putere', lead.putere ? `${lead.putere} kW` : ''),
      ...spec('Suprafață', lead.suprafata ? `${lead.suprafata} mp` : ''),
      ...spec('Consum lunar', lead.consumLunar ? `${lead.consumLunar} kWh` : ''),
      ...spec('Acoperiș', lead.tipAcoperis ? getRoofTypeLabel(lead.tipAcoperis) : ''),
      ...spec('Fazare', lead.fazare ? getPhaseLabel(lead.fazare) : ''),
      ...spec('Branșament', lead.bransament ? getConnectionLabel(lead.bransament) : ''),
      ...spec('Baterie', lead.stocare ? getYesNoLabel(lead.stocare) : ''),
      ...spec('Capacitate baterie', lead.capacitateBaterie ? `${lead.capacitateBaterie} kWh` : ''),
      ...spec('Wallbox', lead.wallbox ? getYesNoLabel(lead.wallbox) : ''),
      ...spec('Termen', lead.termen ? getTimelineLabel(lead.termen) : ''),
      ...spec('Finanțare', lead.finantare ? getFinancingLabel(lead.finantare) : ''),
      ...spec('Buget', getBudgetLabel(lead.buget)),
      ...spec('Vrea', getScopLabel(lead.scop, lead.scopDetalii)),
      ...spec('Firme cerute', requested.join(', ')),
      ...spec('Poze', lead.poze ? 'da' : ''),
    ],
    mesaj: lead.mesaj.trim(),
    crmHref: `/admin/crm#${encodeURIComponent(lead.timestamp)}`,
  };
}

/** Istoricul complet al unui cont (toate adresele lui), ca pe card. */
export async function loadAccountMovements(members: string[]): Promise<Movement[]> {
  const [events, claims, prefs, profiles, leads] = await Promise.all([
    getPortalAccessEvents(),
    getClaims(),
    getCountyAlertPrefs(),
    getFirmProfiles(),
    getLeadsSince(new Date(0)),
  ]);
  // Ca pe pagină: fără Neon, istoricul iese fără precalificare.
  const precalificare = await precalificareActivitate().catch(() => null);
  const leadById = new Map(leads.map((l) => [l.timestamp, l]));
  return buildMovements({
    events: events
      .filter((e) => e.email && members.includes(e.email))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    claims: claims.filter((c) => members.includes(c.email)),
    alerts: resolveGroupAlertPref(prefs, members),
    profile: resolveGroupProfile(profiles, members),
    precalificare: precalificare && {
      vizualizari: precalificare.vizualizari.filter((v) => members.includes(v.email)),
      note: precalificare.note.filter((n) => members.includes(n.email)),
    },
    leadLabel: (id) => leadLabel(leadById.get(id), id),
  });
}
