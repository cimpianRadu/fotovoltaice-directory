import type {
  CountyAlertPref,
  FirmProfile,
  LeadClaim,
  PortalAccessEvent,
} from '@/lib/sheets';
import type { PrecalificareActivitate } from '@/lib/asistent';
import { bucharestIso } from '../cereri/timeline';

// Tot ce s-a mișcat pe un cont de portal, adunat din coloanele care au o dată:
// jurnalul de acces, revendicările (revendicat / aprobat / apel / ofertă /
// renunțat / note), județele bifate și profilul. Nimic nu se scrie, se
// recompune la fiecare deschidere. Din 16 nov 2026, ca să se poată citi pe zi.

/**
 * Cine a făcut mișcarea. `noi` = aprobarea, cererea dată de mână, apelul
 * confirmat: apar în istoric, dar nu mută firma în sus la „ultima mișcare",
 * care e despre ce a făcut ea.
 */
export type MovementBy = 'firma' | 'noi';

export interface Movement {
  /** ISO. */
  at: string;
  /** Doar ziua e sigură (note vechi fără oră, apel confirmat pe zi). */
  dayOnly?: boolean;
  by: MovementBy;
  text: string;
  detail?: string;
  /** Cererea de care ține mișcarea, pentru link. */
  leadId?: string;
}

function valid(iso: string | undefined): iso is string {
  return !!iso && Number.isFinite(Date.parse(iso));
}

/** Coloanele scrise doar cu ziua (YYYY-MM-DD) devin prânzul zilei în ora României. */
function at(value: string): { at: string; dayOnly?: boolean } {
  return value.length === 10 ? { at: bucharestIso(value), dayOnly: true } : { at: value };
}

export function buildMovements({
  events,
  claims,
  alerts,
  profile,
  precalificare,
  leadLabel,
}: {
  events: PortalAccessEvent[];
  claims: LeadClaim[];
  alerts: CountyAlertPref | null;
  profile: FirmProfile | null;
  /** Deja filtrată pe adresele contului; null = Neon n-a răspuns. */
  precalificare: PrecalificareActivitate | null;
  leadLabel: (leadId: string) => string;
}): Movement[] {
  const out: Movement[] = [];

  for (const e of events) {
    if (!valid(e.timestamp)) continue;
    out.push({
      at: e.timestamp,
      by: 'firma',
      text:
        e.event === 'cerut'
          ? 'a cerut acces la portal'
          : e.event === 'intrat'
            ? `s-a autentificat (${e.method === 'cod' ? 'cod' : 'link'})`
            : 'a deschis portalul',
    });
  }

  for (const c of claims) {
    const label = leadLabel(c.leadId);
    if (valid(c.timestamp)) {
      out.push({
        ...at(c.timestamp),
        by: c.source === 'self' ? 'firma' : 'noi',
        text:
          c.source === 'manual'
            ? `i-ai dat cererea ${label}`
            : c.source === 'abonament'
              ? `a primit din abonament ${label}`
              : `a revendicat ${label}`,
        leadId: c.leadId,
      });
    }
    if (valid(c.approvedAt)) {
      // Deblocarea e de cele mai multe ori automată, în același minut cu
      // revendicarea; „ai aprobat" ar spune că ai apăsat tu.
      out.push({
        ...at(c.approvedAt),
        by: 'noi',
        text: `datele clientului deblocate pe ${label}`,
        leadId: c.leadId,
      });
    }
    if (valid(c.contactedAt)) {
      out.push({
        ...at(c.contactedAt),
        by: 'noi',
        text: `apel către client confirmat pe ${label}`,
        leadId: c.leadId,
      });
    }
    if (valid(c.offeredAt)) {
      out.push({ ...at(c.offeredAt), by: 'firma', text: `a trimis oferta pe ${label}`, leadId: c.leadId });
    }
    if (valid(c.releasedAt)) {
      out.push({
        ...at(c.releasedAt),
        by: 'firma',
        text: `a renunțat la ${label}`,
        detail: c.releaseReason || undefined,
        leadId: c.leadId,
      });
    }
    for (const n of c.firmNotes) {
      const iso = bucharestIso(n.date, n.time);
      if (!valid(iso)) continue;
      out.push({
        at: iso,
        dayOnly: !n.time,
        by: 'firma',
        text: `notă pe ${label}`,
        detail: n.text,
        leadId: c.leadId,
      });
    }
  }

  // Precalificarea Watt AI (din Neon). Tabelul ține doar prima și ultima
  // deschidere, deci la mai multe apar două rânduri, cu totalul pe ultimul.
  for (const v of precalificare?.vizualizari ?? []) {
    const label = leadLabel(v.leadId);
    const where = v.sursa === 'portal' ? 'din portal' : v.sursa === 'cereri' ? 'din /cereri' : '';
    if (valid(v.primaLa)) {
      out.push({
        at: v.primaLa,
        by: 'firma',
        text: `a deschis precalificarea pe ${label}`,
        detail: v.de === 1 ? where || undefined : undefined,
        leadId: v.leadId,
      });
    }
    if (v.de > 1 && valid(v.ultimaLa) && v.ultimaLa !== v.primaLa) {
      out.push({
        at: v.ultimaLa,
        by: 'firma',
        text: `a redeschis precalificarea pe ${label}`,
        detail: `${v.de}× în total${where ? `, ultima dată ${where}` : ''}`,
        leadId: v.leadId,
      });
    }
  }
  for (const n of precalificare?.note ?? []) {
    if (!valid(n.la)) continue;
    out.push({
      at: n.la,
      by: 'firma',
      text: `a notat precalificarea pe ${leadLabel(n.leadId)}: ${n.nota === 'util' ? '👍 util' : '👎 nu prea'}`,
      detail: n.motiv || undefined,
      leadId: n.leadId,
    });
  }

  if (alerts && valid(alerts.updatedAt)) {
    out.push({
      at: alerts.updatedAt,
      by: 'firma',
      text:
        alerts.active && alerts.counties.length > 0
          ? `și-a salvat județele pentru alerte (${alerts.counties.length})`
          : 'și-a oprit alertele pe județ',
      detail: alerts.active ? alerts.counties.join(', ') : undefined,
    });
  }

  if (profile && valid(profile.updatedAt)) {
    out.push({ at: profile.updatedAt, by: 'firma', text: 'și-a completat profilul firmei' });
  }

  return out.sort((a, b) => b.at.localeCompare(a.at));
}

/** Ziua calendaristică în România (YYYY-MM-DD) a unui moment ISO. */
export function bucharestDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Bucharest' });
}

/** Ziua de dinainte / de după, pe calendar (fără fus orar: e doar o dată). */
export function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
