import {
  claimsHeldForLead,
  isLeadClosed,
  isLeadHidden,
  isSameFirm,
  maxClaimsForLead,
  type CrmFirm,
  type LeadClaim,
  type NewLead,
} from '@/lib/sheets';
import { matchFirmsForLead } from '@/lib/lead-match';
import { getProjectTypeLabel, type Company } from '@/lib/utils-shared';
import type { LeadOption } from './GiveLead';

// Cererile pe care le pot da unei firme din /admin/portal. Pagina doar le
// numără; potrivirea cu firma (scor, motive) se calculează abia când se
// deschide „Dă o cerere”, prin /api/admin/portal/dau-cerere (24 nov 2026:
// calculată pe toate cererile × toate firmele la fiecare încărcare, ținea
// pagina ~4 s).

export function leadLabel(lead: NewLead | undefined, leadId: string): string {
  if (!lead) return `cerere ${leadId.slice(0, 10)}`;
  return [getProjectTypeLabel(lead.tipProiect), lead.judet, lead.putere ? `${lead.putere} kW` : '']
    .filter(Boolean)
    .join(' · ');
}

export function openLeadsWithHolders(leads: NewLead[], claims: LeadClaim[]) {
  const open = leads.filter((l) => !isLeadHidden(l) && !isLeadClosed(l.crmStatus));
  const held = new Map(open.map((l) => [l.timestamp, claimsHeldForLead(claims, l.timestamp)]));
  return { open, held };
}

/** Deschise, cu loc liber și fără firma asta (pe identitate sau pe oricare adresă a ei). */
export function eligibleLeads(
  open: NewLead[],
  held: Map<string, LeadClaim[]>,
  identity: { numeFirma: string; telefon: string },
  members: string[],
): NewLead[] {
  return open.filter((l) => {
    const h = held.get(l.timestamp) ?? [];
    if (h.length >= maxClaimsForLead(l.timestamp)) return false;
    return !h.some((c) => isSameFirm(c, identity) || members.includes(c.email));
  });
}

/**
 * Cele mai potrivite 10, cu scorul și motivele din `lib/lead-match` (aceeași
 * potrivire ca în /admin/crm), calculate doar pentru firma asta. Fără firmă în
 * director scorul e 0 și ordinea e cea mai nouă cerere întâi.
 */
export function scoreGiveOptions(
  eligible: NewLead[],
  held: Map<string, LeadClaim[]>,
  company: Company | undefined,
  claims: LeadClaim[],
  firms: CrmFirm[],
): LeadOption[] {
  return eligible
    .map((l) => {
      const m = company
        ? matchFirmsForLead(l, l.timestamp, [company], claims, firms, 1)[0]
        : undefined;
      return {
        id: l.timestamp,
        label: leadLabel(l, l.timestamp),
        slots: maxClaimsForLead(l.timestamp) - (held.get(l.timestamp)?.length ?? 0),
        score: m?.score ?? 0,
        reasons: m?.reasons ?? [],
        warnings: m?.warnings ?? [],
      };
    })
    .sort((a, b) => b.score - a.score || b.id.localeCompare(a.id))
    .slice(0, 10);
}
