// Ce intră în alerta pe județ, construit dintr-un rând de cerere. Până pe
// 14 sept 2026 același payload se construia de mână în două locuri (ruta de
// cereri, din corpul formularului, și cronul, din rând), iar fluxul „mă
// informez" adăuga al treilea. Un singur loc, ca prefixul „[Se informează]" și
// motivul clientului să nu lipsească dintr-una din alerte.

import type { NewLead } from './sheets';
import { isLeadInformez } from './sheets';
import {
  getBlocajShort,
  getCallWindowLabel,
  getConnectionLabel,
  getFinancingLabel,
  getProgramName,
  getProjectTypeLabel,
  getRoofTypeLabel,
  getTimelineLabel,
  getWorkTypeShort,
  isRetrofit,
} from './utils-shared';

/** Motivul scurt de pe card și din alertă: „așteaptă Casa Verde Baterii", „vrea un preț orientativ". */
export function informezMotiv(lead: Pick<NewLead, 'blocaj' | 'finantare'>): string {
  if (lead.blocaj === 'astept-program') {
    const program = getProgramName(lead.finantare);
    return program ? `așteaptă ${program}` : getBlocajShort(lead.blocaj);
  }
  return getBlocajShort(lead.blocaj);
}

export function countyAlertPayloadFromLead(lead: NewLead) {
  return {
    judet: lead.judet,
    tipProiectLabel: getProjectTypeLabel(lead.tipProiect),
    segment: lead.segment,
    tipLucrareLabel:
      lead.tipLucrare && lead.tipLucrare !== 'sistem-nou' ? getWorkTypeShort(lead.tipLucrare) : '',
    retrofit: isRetrofit(lead.tipLucrare),
    putere: lead.putere,
    consumLunar: lead.consumLunar,
    acoperisLabel: lead.tipAcoperis ? getRoofTypeLabel(lead.tipAcoperis) : '',
    bransamentLabel: lead.bransament ? getConnectionLabel(lead.bransament) : '',
    finantareSlug: lead.finantare,
    finantareLabel: lead.finantare ? getFinancingLabel(lead.finantare) : '',
    termenLabel: lead.termen ? getTimelineLabel(lead.termen) : '',
    intervalApelLabel: lead.intervalApel ? getCallWindowLabel(lead.intervalApel) : '',
    ...(isLeadInformez(lead) ? { informez: { motiv: informezMotiv(lead) } } : {}),
  };
}

/** „Rezidențial · Cluj · 8 kW", cum apare în subiectele emailurilor către firme. */
export function leadSummary(lead: NewLead): string {
  return [getProjectTypeLabel(lead.tipProiect), lead.judet, lead.putere ? `${lead.putere} kW` : '']
    .filter(Boolean)
    .join(' · ');
}
