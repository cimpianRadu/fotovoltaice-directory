// Firmele cerute de client cu numele: cât de mari sunt, dacă plătesc pentru
// cereri pe necesit.ro și un scor din 10 pentru „are sens s-o sun pentru cererea
// asta?". Spre deosebire de lead-match, aici nu căutăm pe cine să sunăm: firma
// e aleasă de client, întrebarea e doar dacă merită apelul.
//
// Scorul e suma a cinci criterii de câte 2 puncte, din date pe care le avem deja
// (bilanț ANAF, registrul ANRE, scanarea necesit, lista AFM, comportamentul pe
// platformă). Fiecare criteriu se afișează cu motivul lui: cifra e o sumă de
// reguli, nu o estimare.

import casaVerdeRaw from '@/data/casa-verde-installers.json';
import { getCompanyAnreCerts } from './anre-certs';
import type { MatchClaim, MatchCrmFirm, MatchLead } from './lead-match';
import { allNecesitFirms, type ListingSignal, type NecesitFirm } from './necesit-match';
import {
  FIRM_STATUS_LABELS,
  MAX_ACTIVE_CLAIMS_PER_FIRM,
  claimHoldsFirmSlot,
  isSameFirm,
  normalizeFirmName,
  parseRequestedFirms,
} from './sheets-shared';
import type { Company } from './utils-shared';

export type FirmSize = 'mică' | 'medie' | 'mare' | 'necunoscută';
export type NecesitStatus = 'plateste' | 'listata' | 'absenta';

export interface FitClaim extends MatchClaim {
  /** Emailul cu care firma a revendicat: identitatea ei în portal. */
  email: string;
}

export interface FitCriterion {
  label: string;
  points: 0 | 1 | 2;
  note: string;
}

export interface RequestedFirmFit {
  name: string;
  /** Gol când numele cerut nu mai e în director (firmă redenumită sau scoasă). */
  slug: string;
  place: string;
  phone: string;
  size: FirmSize;
  /** „6,3 mil. lei în 2024 · 28 ang." */
  sizeNote: string;
  /** Anul dinainte, doar când cifra s-a mișcat cu cel puțin o treime. */
  trendNote: string;
  necesit: NecesitStatus;
  necesitNote: string;
  necesitUrl: string;
  /** 0–10, null când firma nu mai e în director și n-avem pe ce scora. */
  score: number | null;
  criteria: FitCriterion[];
  warnings: string[];
  /** Firma a preluat deja cererea asta: scorul nu mai decide nimic. */
  claimedThisLead: boolean;
}

// Praguri pe cifra de afaceri, relative la instalatorii din director, nu la
// definiția UE (după UE aproape toți ar fi „mici"). Banda „medie" e cea a
// firmelor care chiar au lucrat cereri pe platformă (ICP, 21 aug 2026: 4–25M
// lei). În director, pe 26 oct 2026: 41 sub 4M, 96 între 4 și 25M, 52 peste.
const SMALL_MAX_REVENUE = 4_000_000;
const MEDIUM_MAX_REVENUE = 25_000_000;
// Doar când lipsește bilanțul (firme nou-înființate).
const SMALL_MAX_EMPLOYEES = 5;
const MEDIUM_MAX_EMPLOYEES = 49;

// Coduri ANRE cu care firma poate executa montajul. C1A și Bp sunt doar
// proiectare: firma tot are nevoie de altcineva să execute.
const EXECUTE_CODES = ['C2A', 'B', 'BE'];
const DESIGN_CODES = ['C1A', 'BP'];

const RESI_TAGS = ['pv-rezidential', 'casa-verde', 'prosumator', 'afm-validat', 'validat-afm'];
const COM_SPECS = [
  'hale-industriale', 'parcuri-logistice', 'cladiri-birouri', 'retail',
  'agricol', 'spitale', 'scoli', 'hoteluri',
];
const COM_TAGS = ['pv-comercial', 'PV comercial', 'pv-industrial', 'focus-industrial', 'instalatii-industriale', 'EPC'];
const NATIONAL_TAGS = ['acoperire-nationala', 'retea-nationala'];

const casaVerdeCuis = new Set((casaVerdeRaw as { cui: string }[]).map((f) => String(f.cui)));

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

function last9(phone: string): string {
  return (phone || '').replace(/\D/g, '').slice(-9);
}

function parseKw(putere: string): number {
  const n = parseFloat((putere || '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function fmtLei(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} mil. lei`;
  return `${Math.round(n / 1000)} mii lei`;
}

function firmSize(c: Company): FirmSize {
  const revenue = c.financials?.revenue ?? 0;
  if (revenue > 0) {
    if (revenue < SMALL_MAX_REVENUE) return 'mică';
    return revenue <= MEDIUM_MAX_REVENUE ? 'medie' : 'mare';
  }
  if (c.employees > 0) {
    if (c.employees <= SMALL_MAX_EMPLOYEES) return 'mică';
    return c.employees <= MEDIUM_MAX_EMPLOYEES ? 'medie' : 'mare';
  }
  return 'necunoscută';
}

/**
 * Firma din director pe necesit. necesit nu dă CUI, deci potrivim pe nume
 * normalizat sau pe telefon în județul firmei, ori pe numele ANRE (scanarea îl
 * leagă doar pe potrivire exactă), care e destul de specific și peste județe.
 */
function findOnNecesit(c: Company): NecesitFirm | undefined {
  const firms = allNecesitFirms();
  const county = norm(c.location.county);
  const name = normalizeFirmName(c.name);
  const phone = last9(c.contact.phone);
  return (
    firms.find(
      (f) =>
        norm(f.county) === county &&
        (normalizeFirmName(f.name) === name || (phone.length === 9 && last9(f.phone) === phone)),
    ) ?? (c.anreMatch ? firms.find((f) => f.anreName && f.anreName === c.anreMatch?.societate) : undefined)
  );
}

export function fitRequestedFirms(
  lead: MatchLead,
  leadId: string,
  companies: Company[],
  ctx: {
    claims: FitClaim[];
    crmFirms: MatchCrmFirm[];
    portalAccounts: Set<string>;
    listings: ListingSignal[];
  },
): RequestedFirmFit[] {
  const kw = parseKw(lead.putere);
  const rezidential = (lead.segment || 'comercial') === 'rezidential';
  const leadCounty = norm(lead.judet || '');
  // „Proiect mic" = ce face o echipă de 2-3 oameni: o casă, sau un acoperiș
  // comercial mic. Peste 100 kW contează să aibă oameni și bani pentru stoc.
  const smallProject = rezidential || (kw > 0 && kw <= 30);
  const largeProject = kw > 100;
  const projectLabel = rezidential ? `o casă${kw ? ` de ${kw} kW` : ''}` : kw ? `${kw} kW comercial` : 'comercial';

  return parseRequestedFirms(lead.preselectedCompany).map((requestedName): RequestedFirmFit => {
    const c = companies.find((x) => normalizeFirmName(x.name) === normalizeFirmName(requestedName));
    if (!c) {
      return {
        name: requestedName,
        slug: '',
        place: '',
        phone: '',
        size: 'necunoscută',
        sizeNote: 'nu mai e în director',
        trendNote: '',
        necesit: 'absenta',
        necesitNote: '',
        necesitUrl: '',
        score: null,
        criteria: [],
        warnings: [],
        claimedThisLead: false,
      };
    }

    const criteria: FitCriterion[] = [];
    const warnings: string[] = [];
    const ident = { numeFirma: c.name, telefon: c.contact.phone };

    // ── Mărimea ────────────────────────────────────────────────────────────
    const size = firmSize(c);
    const fin = c.financials;
    const sizeNote = [
      fin?.revenue > 0 && `${fmtLei(fin.revenue)} în ${fin.year}`,
      fin?.revenue > 0 && fin.profit < 0 && `pierdere ${fmtLei(-fin.profit)}`,
      c.employees > 0 && `${c.employees} ang.`,
    ]
      .filter(Boolean)
      .join(' · ');
    const prev = fin?.history?.find((h) => h.year === fin.year - 1);
    const trendNote =
      prev && prev.revenue > 0 && fin.revenue > 0 && Math.abs(fin.revenue / prev.revenue - 1) >= 1 / 3
        ? `${prev.year}: ${fmtLei(prev.revenue)}`
        : '';

    // ── necesit.ro ─────────────────────────────────────────────────────────
    const nf = findOnNecesit(c);
    const necesit: NecesitStatus = !nf ? 'absenta' : nf.partner ? 'plateste' : 'listata';
    const necesitNote = nf?.partner
      ? [nf.offers && `${nf.offers} oferte trimise`, nf.responds && `răspunde în ${nf.responds}`]
          .filter(Boolean)
          .join(', ')
      : '';

    // 1. Poate executa montajul?
    const codes = getCompanyAnreCerts(c.anreMatch).map((x) => x.code);
    const exec = EXECUTE_CODES.find((code) => codes.includes(code));
    const design = DESIGN_CODES.find((code) => codes.includes(code));
    criteria.push(
      exec
        ? { label: 'Atestat ANRE', points: 2, note: `${exec === 'BE' ? 'Be' : exec} activ` }
        : design
          ? { label: 'Atestat ANRE', points: 1, note: `doar ${design === 'BP' ? 'Bp' : design} (proiectare)` }
          : { label: 'Atestat ANRE', points: 0, note: 'niciun atestat activ' },
    );

    // 2. Cât de aproape e de client?
    if (!leadCounty) {
      criteria.push({ label: 'Distanță', points: 1, note: 'cererea n-are județ' });
    } else if (norm(c.location.county) === leadCounty) {
      criteria.push({ label: 'Distanță', points: 2, note: `sediul în ${c.location.county}` });
    } else if (c.coverage.some((j) => norm(j) === leadCounty)) {
      criteria.push({ label: 'Distanță', points: 1, note: `din ${c.location.county}, acoperă ${lead.judet}` });
    } else if (c.tags?.some((t) => NATIONAL_TAGS.includes(t))) {
      criteria.push({ label: 'Distanță', points: 1, note: 'acoperire națională' });
    } else {
      criteria.push({ label: 'Distanță', points: 0, note: `din ${c.location.county}, nu acoperă ${lead.judet}` });
    }

    // 3. Proiectul e pe măsura firmei? Întrebarea „nu sunt prea mari?".
    let sizeFit: FitCriterion;
    if (size === 'necunoscută') {
      sizeFit = { label: 'Mărime', points: 1, note: 'fără bilanț' };
    } else if (smallProject) {
      sizeFit =
        size === 'mare'
          ? { label: 'Mărime', points: 1, note: `firmă mare pentru ${projectLabel}` }
          : { label: 'Mărime', points: 2, note: `${size}, potrivită pentru ${projectLabel}` };
    } else if (largeProject) {
      sizeFit =
        size === 'mică'
          ? { label: 'Mărime', points: 0, note: `firmă mică pentru ${projectLabel}` }
          : { label: 'Mărime', points: 2, note: `${size}, duce ${projectLabel}` };
    } else {
      sizeFit =
        size === 'mică'
          ? { label: 'Mărime', points: 1, note: `mică, ${projectLabel}` }
          : { label: 'Mărime', points: 2, note: `${size}, ${projectLabel}` };
    }
    criteria.push(sizeFit);

    // 4. Lucrează segmentul și gama de kW a cererii? 0 doar pe dovadă contrară
    // (gama declarată în director), nu pe lipsă de date.
    const min = c.capacity.minProjectKw > 0 ? c.capacity.minProjectKw : 0;
    const max = c.capacity.maxProjectKw > 0 ? c.capacity.maxProjectKw : Infinity;
    const segment = c.segment ?? 'comercial';
    if (kw > 0 && kw < min) {
      criteria.push({ label: 'Profil', points: 0, note: `lucrează de la ${min} kW` });
    } else if (kw > max) {
      criteria.push({ label: 'Profil', points: 0, note: `lucrează până la ${max} kW` });
    } else if (rezidential) {
      if (casaVerdeCuis.has(c.cui.replace(/^RO/i, ''))) {
        criteria.push({ label: 'Profil', points: 2, note: 'validată AFM Casa Verde' });
      } else if (
        segment !== 'comercial' ||
        c.specializations.includes('rezidential') ||
        c.tags?.some((t) => RESI_TAGS.includes(t))
      ) {
        criteria.push({ label: 'Profil', points: 2, note: 'face rezidențial' });
      } else {
        criteria.push({ label: 'Profil', points: 1, note: 'rezidențial nedovedit, în director e comercială' });
      }
    } else if (
      segment !== 'rezidential' ||
      c.specializations.some((s) => COM_SPECS.includes(s)) ||
      c.tags?.some((t) => COM_TAGS.includes(t))
    ) {
      criteria.push({ label: 'Profil', points: 2, note: 'face comercial' });
    } else {
      criteria.push({ label: 'Profil', points: 1, note: 'comercial nedovedit, în director e rezidențială' });
    }

    // 5. Ia cereri? Orice semn că firma cumpără, revendică sau a cerut singură
    // să fie listată. Fără niciunul, apelul e la rece.
    const firmClaims = ctx.claims.filter((cl) => isSameFirm(cl, ident));
    const claimedThisLead = firmClaims.some((cl) => cl.leadId === leadId);
    const hasPortal =
      ctx.portalAccounts.has((c.contact.email || '').trim().toLowerCase()) ||
      firmClaims.some((cl) => ctx.portalAccounts.has((cl.email || '').trim().toLowerCase()));
    const askedListing = ctx.listings.some((l) => isSameFirm(l, ident));
    const crm = ctx.crmFirms.find((f) => isSameFirm(f, ident));
    const signals = [
      necesit === 'plateste' && 'plătește pe necesit',
      hasPortal && 'cont în portal',
      firmClaims.length > 0 &&
        `${firmClaims.length} ${firmClaims.length === 1 ? 'cerere preluată' : 'cereri preluate'} la noi`,
      askedListing && 'a cerut singură listare',
      (crm?.status === 'client' || crm?.status === 'interesat' || crm?.status === 'discutii') &&
        `CRM: ${FIRM_STATUS_LABELS[crm.status]}`,
    ].filter((s): s is string => Boolean(s));
    if (crm?.status === 'refuzat') {
      criteria.push({ label: 'Ia cereri', points: 0, note: 'a refuzat (CRM firme)' });
      warnings.push('refuzată în CRM firme');
    } else if (signals.length > 0) {
      criteria.push({ label: 'Ia cereri', points: 2, note: signals.join(', ') });
    } else {
      criteria.push({ label: 'Ia cereri', points: 0, note: 'niciun semn, apel la rece' });
    }
    if (crm?.status === 'nu_raspunde') warnings.push('nu răspunde la telefon (CRM firme)');
    const active = firmClaims.filter((cl) => claimHoldsFirmSlot({ ...cl, noteCount: cl.firmNotes.length })).length;
    if (active >= MAX_ACTIVE_CLAIMS_PER_FIRM) warnings.push(`plafon plin (${active} revendicări nemișcate)`);

    return {
      name: c.name,
      slug: c.slug,
      place: c.location.city === c.location.county ? c.location.city : `${c.location.city}, ${c.location.county}`,
      phone: c.contact.phone,
      size,
      sizeNote,
      trendNote,
      necesit,
      necesitNote,
      necesitUrl: nf?.url ?? '',
      score: criteria.reduce((n, cr) => n + cr.points, 0),
      criteria,
      warnings,
      claimedThisLead,
    };
  });
}
