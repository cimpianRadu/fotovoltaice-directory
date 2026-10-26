// Cererile deschise din județele unei firme, pe email (16-17 oct 2026).
//
// De ce: alerta pe județ pleacă o singură dată, la trimiterea cererii. O firmă
// care bifează județul după aceea nu află niciodată de cererile care erau deja
// acolo, iar una care a ratat emailul nu-l mai primește. Cererea lui Gabriel
// Dănescu (Ilfov, 8 sept: vilă, fonduri proprii, baterie, „cât mai repede") a
// primit-o doar Electro Prahova, singura cu Ilfov bifat atunci; Solar Station,
// titel și IGF au bifat Ilfov după și n-au aflat de ea. A stat 5 săptămâni cu
// loc liber, iar omul a ales singur o firmă.
//
// Trei căi, același email:
//   - rezumatul de luni (/api/cron/firme-saptamanal), doar firmelor cu alertele
//     pe județ pornite (alertele sunt acordul lor pentru emailuri cu cereri) și
//     partenerilor din DIGEST_PARTNERS. Cererile bune încă deschise din ultimele
//     14 zile: Radu voia două pe săptămână (luni și joi), dar pe 21 sept-17 oct
//     au intrat 3-8 cereri bune pe săptămână în toată țara, iar joia nicio firmă
//     n-ar fi trecut de pragul de 3; cele noi le primesc oricum ca alerte;
//   - prima ediție, luni 19 oct, din /api/admin/digest-cereri: și firmelor cu
//     cont dar fără alerte, cu îndemnul să le pornească, pe 30 de zile;
//   - automat, când firma bifează un județ nou în portal: cererile deschise de
//     acolo (`sendOpenLeadsForNewCounties`).
//
// Focusul, cerut de Radu pe 17 oct: cererile cu fonduri proprii și „cât mai
// repede”, oamenii care pot semna luna asta. Restul (alte termene, Casa Verde
// Baterii, care așteaptă încă sesiunea AFM, cei care se informează) apar doar ca
// număr, cu link spre site.

import {
  MAX_CLAIMS_PER_LEAD,
  claimOccupiesLeadSlot,
  getClaims,
  getCountyAlertPrefs,
  getDeactivatedEmailsForAlerts,
  getFirmEmailLinksForAlerts,
  getLeadsSince,
  getPortalAccessEvents,
  isLeadInformez,
  isPubliclyClaimable,
  leadFreshSince,
  resolveEmailGroup,
  resolveGroupAlertPref,
  type LeadClaim,
  type NewLead,
} from './sheets';
import { getUnsubscribedEmails } from './firm-unsubscribe';
import { sendOpenLeadsDigest, type DigestLeadRow, type DigestVariant } from './email';
import { noutatiForWeeklyDigest, type Noutate } from './noutati';
import { logLeadSends } from './lead-sends';
import {
  calendarAgeDays,
  getCounties,
  getFinancingShort,
  getProjectTypeLabel,
  getTimelineLabel,
  getWorkTypeShort,
  isRetrofit,
} from './utils-shared';

/** Comparație de județe tolerantă la diacritice, ca `countyKey` din lib/sheets. */
function countyKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/** Mai vechi de atât nu le mai trimitem: omul probabil și-a găsit deja pe cineva. */
export const DIGEST_MAX_AGE_DAYS = 30;

/** Fereastra rezumatului de luni: o cerere apare în cel mult două rezumate. */
export const DIGEST_WEEKLY_DAYS = 14;

/**
 * Firme fără cont în portal, trecute de mână pe lista rezumatului. JTS (17 oct
 * 2026): lucrează în toată țara; Radu le explică pe WhatsApp dacă întreabă.
 * Fără cont nu pot revendica de pe /cereri, iar emailul îi trimite în portal.
 */
export const DIGEST_PARTNERS: { email: string; firma: string; counties: string[] }[] = [
  { email: 'contact@jtssolar.ro', firma: 'JTS Instal Construct', counties: getCounties() },
];

/**
 * Sub atâtea cereri fierbinți firma nu primește emailul (Radu, 17 oct 2026):
 * un rezumat cu una-două cereri nu merită deschis, iar lunea următoare poate
 * avea mai multe.
 */
export const DIGEST_MIN_HOT = 3;

/** Plătește din banii lui și vrea montajul acum: cererea care se poate semna luna asta. */
export function isHotLead(l: NewLead): boolean {
  return l.finantare === 'fonduri-proprii' && l.termen === 'cat-mai-repede' && !isLeadInformez(l);
}

/** Cererile deschise din județe, fără cele pe care firma (oricare adresă a ei) le-a revendicat deja. */
export function openLeadsForFirm(
  leads: NewLead[],
  claims: LeadClaim[],
  counties: string[],
  group: string[],
  now = new Date(),
  maxAgeDays = DIGEST_MAX_AGE_DAYS,
): NewLead[] {
  const keys = new Set(counties.map(countyKey));
  const members = new Set(group);
  const taken = new Map<string, number>();
  const mine = new Set<string>();
  for (const c of claims) {
    if (members.has((c.email || '').trim().toLowerCase())) mine.add(c.leadId);
    if (claimOccupiesLeadSlot(c)) taken.set(c.leadId, (taken.get(c.leadId) || 0) + 1);
  }
  return leads
    .filter(isPubliclyClaimable)
    .filter((l) => keys.has(countyKey(l.judet || '')))
    .filter((l) => !mine.has(l.timestamp) && (taken.get(l.timestamp) || 0) < MAX_CLAIMS_PER_LEAD)
    .filter((l) => calendarAgeDays(leadFreshSince(l), now) <= maxAgeDays)
    .sort((a, b) => leadFreshSince(b).localeCompare(leadFreshSince(a)));
}

export function digestRow(l: NewLead, now = new Date()): DigestLeadRow {
  const retrofit = isRetrofit(l.tipLucrare);
  return {
    id: l.timestamp,
    judet: l.judet,
    titlu: [
      getProjectTypeLabel(l.tipProiect),
      l.tipLucrare && l.tipLucrare !== 'sistem-nou' ? getWorkTypeShort(l.tipLucrare) : '',
      // „-5” a intrat din formular pe o cerere din Iași; un minus în email arată a eroare de-a noastră.
      Number.parseFloat(l.putere) > 0 ? `${retrofit ? 'are ' : ''}${l.putere} kW` : '',
    ]
      .filter(Boolean)
      .join(' · '),
    detalii: [
      l.finantare ? getFinancingShort(l.finantare) : '',
      isLeadInformez(l) ? 'se informează' : l.termen ? getTimelineLabel(l.termen) : '',
      l.consumLunar ? `consum ${l.consumLunar}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
    ageDays: calendarAgeDays(leadFreshSince(l), now),
  };
}

export interface DigestPlanItem {
  /** Adresele firmei, fără cele dezabonate; fiecare primește emailul ei. */
  to: string[];
  /** Numele firmei din revendicări, doar pentru previzualizare. */
  firma: string;
  counties: string[];
  variant: DigestVariant;
  /** Fonduri proprii + „cât mai repede”, cele din email. */
  hot: DigestLeadRow[];
  /** Restul cererilor deschise din aceleași județe, doar numărate. */
  restCount: number;
  /** Noutățile platformei din săptămâna dinainte, aceleași pentru toate firmele. */
  noutati: Noutate[];
}

/**
 * Cine ce primește. Firmele = adresele care au intrat măcar o dată în portal,
 * grupate pe firmă. Cu alerte active: județele bifate. Fără alerte (doar când
 * `withoutAlerts`): județele cererilor pe care le-a revendicat. Sub
 * DIGEST_MIN_HOT cereri fierbinți deschise firma nu primește nimic.
 */
export async function planOpenLeadsDigest(
  opts: { withoutAlerts?: boolean; maxAgeDays?: number; now?: Date } = {},
): Promise<DigestPlanItem[]> {
  const now = opts.now ?? new Date();
  const maxAgeDays = opts.maxAgeDays ?? DIGEST_WEEKLY_DAYS;
  const [leads, claims, prefs, links, deactivated, events, unsubscribed] = await Promise.all([
    getLeadsSince(new Date(0)),
    getClaims(),
    getCountyAlertPrefs(),
    getFirmEmailLinksForAlerts(),
    getDeactivatedEmailsForAlerts(),
    getPortalAccessEvents(),
    getUnsubscribedEmails(),
  ]);
  const off = new Set(deactivated);
  const noutati = noutatiForWeeklyDigest(now);
  const leadById = new Map(leads.map((l) => [l.timestamp, l]));

  const seen = new Set<string>();
  const plan: DigestPlanItem[] = [];
  for (const e of events) {
    if (e.event !== 'intrat') continue;
    const group = resolveEmailGroup(links, e.email);
    if (!group.length || seen.has(group[0])) continue;
    seen.add(group[0]);
    if (group.some((m) => off.has(m))) continue;

    const own = claims.filter((c) => group.includes((c.email || '').trim().toLowerCase()));
    const pref = resolveGroupAlertPref(prefs, group);
    const hasAlerts = Boolean(pref?.active && pref.counties.length);
    if (!hasAlerts && !opts.withoutAlerts) continue;
    const counties = hasAlerts
      ? pref!.counties
      : [...new Set(own.map((c) => leadById.get(c.leadId)?.judet || '').filter(Boolean))];
    if (!counties.length) continue;

    const to = group.filter((m) => !unsubscribed.has(m));
    if (!to.length) continue;
    const open = openLeadsForFirm(leads, claims, counties, group, now, maxAgeDays);
    const hot = open.filter(isHotLead);
    if (hot.length < DIGEST_MIN_HOT) continue;
    plan.push({
      to,
      firma: own.at(-1)?.numeFirma || '',
      counties,
      variant: hasAlerts ? 'saptamanal' : 'fara-alerte',
      hot: hot.map((l) => digestRow(l, now)),
      restCount: open.length - hot.length,
      noutati,
    });
  }

  for (const p of DIGEST_PARTNERS) {
    const group = resolveEmailGroup(links, p.email);
    if (group.some((m) => seen.has(m)) || unsubscribed.has(p.email)) continue;
    const open = openLeadsForFirm(leads, claims, p.counties, group, now, maxAgeDays);
    const hot = open.filter(isHotLead);
    if (hot.length < DIGEST_MIN_HOT) continue;
    plan.push({
      to: [p.email],
      firma: p.firma,
      counties: p.counties,
      variant: 'partener',
      hot: hot.map((l) => digestRow(l, now)),
      restCount: open.length - hot.length,
      noutati,
    });
  }
  return plan;
}

/** Trimite planul: câte un email pe adresă, fiecare cu linkul lui de dezabonare. */
export async function sendOpenLeadsDigestPlan(plan: DigestPlanItem[]) {
  const results: { to: string; ok: boolean; reason?: string }[] = [];
  for (const item of plan) {
    for (const to of item.to) {
      const r = await sendOpenLeadsDigest(digestEmailData(item, to));
      results.push({ to, ...r });
      // „Trimisă la N firme” din contul clientului numără și rezumatul de luni.
      if (r.ok) for (const l of item.hot) await logLeadSends(l.id, [to], 'rezumat', item.firma || undefined);
    }
  }
  return results;
}

export function digestEmailData(item: DigestPlanItem, to: string) {
  return {
    to,
    leads: item.hot,
    restCount: item.restCount,
    variant: item.variant,
    maxFirms: MAX_CLAIMS_PER_LEAD,
    noutati: item.noutati,
  };
}

/**
 * Firma a bifat județe noi în portal: primește pe loc cererile deschise de
 * acolo, nu doar pe cele care vor intra de acum încolo. Aici toate, nu doar
 * cele fierbinți: e prima privire a firmei peste județ. Eșecul nu strică
 * salvarea, se vede în loguri.
 */
export async function sendOpenLeadsForNewCounties(email: string, previous: string[], next: string[]) {
  const before = new Set(previous.map(countyKey));
  const added = next.filter((c) => !before.has(countyKey(c)));
  if (!added.length) return;
  try {
    const [leads, claims, links] = await Promise.all([
      getLeadsSince(new Date(0)),
      getClaims(),
      getFirmEmailLinksForAlerts(),
    ]);
    const group = resolveEmailGroup(links, email);
    const open = openLeadsForFirm(leads, claims, added, group.length ? group : [email]);
    if (!open.length) return;
    const hot = open.filter(isHotLead);
    const rest = open.filter((l) => !isHotLead(l));
    for (const to of group.length ? group : [email]) {
      await sendOpenLeadsDigest({
        to,
        leads: [...hot, ...rest].map((l) => digestRow(l)),
        restCount: 0,
        variant: 'judet-nou',
        maxFirms: MAX_CLAIMS_PER_LEAD,
      });
    }
  } catch (err) {
    console.error('[alerte] cereri deschise pentru județe noi:', err);
  }
}
