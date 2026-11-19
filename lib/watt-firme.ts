// Watt AI pentru firmele logate (19 nov 2026, ideea lui Radu): o bulă pe site,
// gratuită până pe 10 decembrie, cu cel mult 5 mesaje pe zi de firmă. Două
// scopuri: firmele află repede ce au confirmat clienții (precalificarea, pe care
// o deschideau rar), iar Radu vede în /admin/watt-firme ce întreabă și cum
// vorbesc. Tot din bulă, Radu trimite anunțuri („unele cereri au precalificare,
// ați văzut vreuna?”), la care firma poate răspunde sau nu.
//
// Datele vin doar din unelte: cererile preluate de firmă (cu ce a confirmat
// clientul cu Watt), cererile publice cu precalificare din județele ei (fără
// conținutul precalificării, care se vede după preluare) și ghidul Casa Verde
// Baterii. Datele de contact ale clienților nu intră deloc în model.

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { db } from './db';
import {
  EFFORT,
  MODEL,
  P_NOUTATI_CVB,
  TOOLS as TOOLS_CLIENT,
  conversatiiPentruFirma,
  costUsd,
  dimensionare,
  ghidCvb,
  textDin,
  type Usage,
} from './asistent';
import { rezumatCerere } from './asistent-shared';
import {
  getClaimsForAccount,
  getCountyAlertPref,
  getFirmEmailGroup,
  getFirmIdentity,
  getLeadsSince,
  getPublicLeads,
} from './sheets';
import { CLAIM_STATUS_LABELS, claimOccupiesLeadSlot, maxClaimsForLead } from './sheets-shared';
import { hasReadyAnswers } from './lead-readiness';
import {
  getBudgetLabel,
  getDependentaLabel,
  getFinancingShort,
  getInvertorLabel,
  getTimelineLabel,
  getWorkTypeShort,
} from './utils-shared';
import {
  WATT_FIRME_MESAJE_PE_ZI,
  introWattFirme,
  wattFirmeActiv,
  type WattFirmeMesaj,
  type WattFirmeStare,
} from './watt-firme-shared';

/** Pornit pe producție doar cu WATT_FIRME=on (și până pe 10 dec); local merge oricând. */
export function wattFirmePornit(): boolean {
  const comutator = process.env.WATT_FIRME === 'on' || process.env.NODE_ENV === 'development';
  return comutator && wattFirmeActiv() && Boolean(process.env.ANTHROPIC_API_KEY);
}

const SITE = 'https://instalatori-fotovoltaice.ro';

/** Ziua de azi în România, ca „2026-11-19”: limita de mesaje se socotește pe ea. */
function ziRo(d = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(d);
}

// ---------------------------------------------------------------------------
// Stocare

interface Stocat {
  api: Anthropic.Beta.BetaMessageParam[];
  afisare: WattFirmeMesaj[];
}

interface Conversatie {
  email: string;
  numeFirma: string;
  mesaje: Stocat;
  replici: number;
}

async function conversatie(email: string): Promise<Conversatie | null> {
  const [r] = await db()`SELECT * FROM watt_firme_conversatii WHERE firma_email = ${email}`;
  if (!r) return null;
  const m = (r.mesaje || {}) as Partial<Stocat>;
  return {
    email,
    numeFirma: String(r.nume_firma || ''),
    mesaje: { api: m.api || [], afisare: m.afisare || [] },
    replici: Number(r.replici) || 0,
  };
}

async function salveaza(c: Conversatie, costPlus = 0, replicaNoua = false) {
  await db()`
    INSERT INTO watt_firme_conversatii (firma_email, nume_firma, mesaje, replici, cost_usd)
    VALUES (${c.email}, ${c.numeFirma}, ${JSON.stringify(c.mesaje)}::jsonb, ${replicaNoua ? 1 : 0}, ${costPlus})
    ON CONFLICT (firma_email) DO UPDATE SET
      nume_firma = EXCLUDED.nume_firma,
      mesaje = EXCLUDED.mesaje,
      replici = watt_firme_conversatii.replici + ${replicaNoua ? 1 : 0},
      cost_usd = watt_firme_conversatii.cost_usd + ${costPlus},
      updated_at = now()
  `;
}

async function mesajeAzi(email: string): Promise<number> {
  const [r] = await db()`SELECT mesaje FROM watt_firme_utilizare WHERE firma_email = ${email} AND zi = ${ziRo()}`;
  return Number(r?.mesaje) || 0;
}

async function numaraMesaj(email: string) {
  await db()`
    INSERT INTO watt_firme_utilizare (firma_email, zi, mesaje) VALUES (${email}, ${ziRo()}, 1)
    ON CONFLICT (firma_email, zi) DO UPDATE SET mesaje = watt_firme_utilizare.mesaje + 1
  `;
}

async function anuntNevazut(email: string): Promise<{ id: number; text: string } | null> {
  const [r] = await db()`
    SELECT a.id, a.text FROM watt_firme_anunturi a
    WHERE a.activ AND NOT EXISTS (
      SELECT 1 FROM watt_firme_anunt_vazut v WHERE v.anunt_id = a.id AND v.firma_email = ${email}
    )
    ORDER BY a.created_at DESC LIMIT 1
  `;
  return r ? { id: Number(r.id), text: String(r.text) } : null;
}

async function numeFirma(email: string): Promise<string> {
  try {
    return (await getFirmIdentity(email))?.numeFirma || '';
  } catch {
    return '';
  }
}

export async function stareWattFirme(email: string): Promise<WattFirmeStare> {
  const [c, folosite, anunt] = await Promise.all([conversatie(email), mesajeAzi(email), anuntNevazut(email)]);
  const nume = c?.numeFirma || (await numeFirma(email));
  const mesaje = c?.mesaje.afisare.length
    ? c.mesaje.afisare
    : [{ rol: 'asistent' as const, text: introWattFirme(nume), la: new Date().toISOString() }];
  return {
    pornit: true,
    numeFirma: nume,
    mesaje,
    ramase: Math.max(0, WATT_FIRME_MESAJE_PE_ZI - folosite),
    anunt,
  };
}

/**
 * Firma a deschis bula cu anunțul afișat: anunțul intră în conversația ei, ca
 * replică a lui Watt, ca modelul să știe la ce răspunde firma dacă scrie.
 */
export async function marcheazaAnunt(email: string, anuntId: number): Promise<void> {
  const [a] = await db()`SELECT id, text FROM watt_firme_anunturi WHERE id = ${anuntId}`;
  if (!a) return;
  const [nou] = await db()`
    INSERT INTO watt_firme_anunt_vazut (anunt_id, firma_email) VALUES (${anuntId}, ${email})
    ON CONFLICT DO NOTHING RETURNING anunt_id
  `;
  if (!nou) return;
  const c = (await conversatie(email)) || {
    email,
    numeFirma: await numeFirma(email),
    mesaje: { api: [], afisare: [] },
    replici: 0,
  };
  const acum = new Date().toISOString();
  const text = String(a.text);
  if (!c.mesaje.afisare.length) {
    c.mesaje.afisare.push({ rol: 'asistent', text: introWattFirme(c.numeFirma), la: acum });
  }
  c.mesaje.afisare.push({ rol: 'asistent', text, la: acum, anunt: true });
  // Istoricul modelului alternează user/assistant: anunțul vine după un semn
  // că firma a deschis bula, nu lipit de replica de dinainte.
  c.mesaje.api.push(
    { role: 'user', content: '[Firma a deschis bula Watt.]' },
    { role: 'assistant', content: text },
  );
  await salveaza(c);
}

// ---------------------------------------------------------------------------
// Măsurători (Radu, 19 nov 2026: „doar dacă avem și măsurători”)

/** Ce poate nota bula din browser. `mesaj` și `limita` le notează serverul singur. */
export const EVENIMENTE_BULA = ['afisat', 'deschis', 'teaser_afisat', 'teaser_inchis', 'teaser_deschis', 'link', 'nota'] as const;
export type EvenimentBula = (typeof EVENIMENTE_BULA)[number];

/**
 * Un eveniment pe firmă. „afisat” se notează o dată pe zi (ora României), iar
 * „teaser_afisat” o dată pe anunț: altfel fiecare pagină ar umfla cifrele.
 */
export async function noteazaEveniment(email: string, tip: string, detalii = ''): Promise<void> {
  const d = detalii.slice(0, 200);
  if (tip === 'afisat') {
    await db()`
      INSERT INTO watt_firme_evenimente (firma_email, tip, detalii)
      SELECT ${email}, ${tip}, ${d}
      WHERE NOT EXISTS (
        SELECT 1 FROM watt_firme_evenimente
        WHERE firma_email = ${email} AND tip = 'afisat'
          AND (la AT TIME ZONE 'Europe/Bucharest')::date = ${ziRo()}::date
      )
    `;
    return;
  }
  if (tip === 'teaser_afisat') {
    await db()`
      INSERT INTO watt_firme_evenimente (firma_email, tip, detalii)
      SELECT ${email}, ${tip}, ${d}
      WHERE NOT EXISTS (
        SELECT 1 FROM watt_firme_evenimente WHERE firma_email = ${email} AND tip = 'teaser_afisat' AND detalii = ${d}
      )
    `;
    return;
  }
  await db()`INSERT INTO watt_firme_evenimente (firma_email, tip, detalii) VALUES (${email}, ${tip}, ${d})`;
}

// ---------------------------------------------------------------------------
// Unelte

const UNELTE_GHID = TOOLS_CLIENT.filter((t) => t.name === 'ghid_casa_verde_baterii' || t.name === 'dimensionare_baterie');

const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'cererile_mele',
    description:
      'Cererile preluate de firmă (cele mai noi întâi): lucrarea, județul, puterea, bateria, finanțarea, termenul, invertorul, statusul firmei și, unde clientul a vorbit cu Watt AI după trimitere, ce a confirmat (precalificarea), ce semnale am calculat și ce întrebări are pentru firmă. Fără datele de contact: firma le are în portal.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'cereri_cu_precalificare',
    description:
      'Cererile deschise de pe /cereri, nepreluate de firmă, la care clientul a vorbit cu Watt AI (au precalificare). Implicit din județele în care firma primește alerte. Dă doar ce e public pe card și câte detalii are precalificarea; conținutul ei se vede după preluare.',
    input_schema: {
      type: 'object',
      properties: { judet: { type: 'string', description: 'Un județ anume, ex. „Cluj”. Fără el: județele firmei.' } },
    },
  },
  {
    name: 'cereri_potrivite',
    description:
      'Cererile deschise de pe /cereri pe care firma le poate prelua acum (au locuri libere și nu le-a preluat deja), din județele în care primește alerte, ordonate după fapte: întâi cele gata de ofertă (clientul plătește din bani proprii sau credit și vrea montajul în cel mult 3 luni), apoi verificate telefonic, cu precalificare Watt, cu poze, apoi cele mai noi. Pentru fiecare: datele publice de pe card și motivele ordinii. Fără contact.',
    input_schema: {
      type: 'object',
      properties: {
        judet: { type: 'string', description: 'Un județ anume, ex. „Cluj”. Fără el: județele firmei.' },
        segment: { type: 'string', enum: ['rezidential', 'comercial'], description: 'Doar case sau doar firme, dacă firma cere asta.' },
      },
    },
  },
  ...UNELTE_GHID,
];

async function cererileMele(email: string): Promise<string> {
  const [emails, claims, leads, conv] = await Promise.all([
    getFirmEmailGroup(email),
    getClaimsForAccount(email),
    getLeadsSince(new Date(Date.now() - 150 * 24 * 3600 * 1000)),
    conversatiiPentruFirma(email),
  ]);
  const ale = new Set(emails);
  const peLead = new Map(leads.map((l) => [l.timestamp, l]));
  const wattPeLead = new Map(conv.map((c) => [c.leadId, c]));
  const ale_firmei = claims
    .filter((c) => ale.has(c.email) && !c.releasedAt)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 25);
  const cereri = ale_firmei.map((c) => {
    const l = peLead.get(c.leadId);
    const w = wattPeLead.get(c.leadId);
    const r = w ? rezumatCerere(w.cerere, w.date, w.updatedAt) : null;
    return {
      cerere: c.leadId,
      link_portal: `${SITE}/portal`,
      preluata_la: c.timestamp.slice(0, 10),
      status_firma: CLAIM_STATUS_LABELS[c.firmStatus] || c.firmStatus,
      ...(l
        ? {
            judet: l.judet,
            localitate: l.localitate,
            lucrare: getWorkTypeShort(l.tipLucrare) || l.tipLucrare,
            putere_kw: l.putere,
            baterie_kwh: l.capacitateBaterie,
            finantare: getFinancingShort(l.finantare),
            termen: l.termen ? getTimelineLabel(l.termen) : '',
            invertor: getInvertorLabel(l.invertorTip, l.invertorModel),
            consum: l.consumLunar,
          }
        : { nota: 'cererea nu mai e în lista recentă' }),
      precalificare_watt: r
        ? { rezumat: r.rezumat, confirmate: r.confirmate, semnale: r.semnale.map((s) => s.text), intrebari_pentru_firma: r.intrebari }
        : null,
    };
  });
  return JSON.stringify({ total: ale_firmei.length, cereri });
}

async function cereriCuPrecalificare(email: string, judet: string): Promise<string> {
  const [pref, publice, conv, claims, emails] = await Promise.all([
    getCountyAlertPref(email),
    getPublicLeads(),
    conversatiiPentruFirma(email),
    getClaimsForAccount(email),
    getFirmEmailGroup(email),
  ]);
  const ale = new Set(emails);
  const preluate = new Set(claims.filter((c) => ale.has(c.email)).map((c) => c.leadId));
  const wattPeLead = new Map(conv.map((c) => [c.leadId, c]));
  const judete = judet ? [judet] : pref?.counties?.length ? pref.counties : [];
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const inJudete = (j: string) => !judete.length || judete.some((x) => norm(x) === norm(j));
  const cereri = publice
    .filter((l) => wattPeLead.has(l.id) && !preluate.has(l.id) && inJudete(l.judet))
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 15)
    .map((l) => {
      const w = wattPeLead.get(l.id)!;
      const r = rezumatCerere(w.cerere, w.date, w.updatedAt);
      return {
        link: `${SITE}/cereri?cerere=${encodeURIComponent(l.id)}`,
        trimisa_la: l.id.slice(0, 10),
        judet: l.judet,
        lucrare: getWorkTypeShort(l.tipLucrare) || l.tipLucrare,
        putere_kw: l.putere,
        baterie_kwh: l.capacitateBaterie,
        finantare: getFinancingShort(l.finantare),
        termen: l.termen ? getTimelineLabel(l.termen) : '',
        invertor: getInvertorLabel(l.invertorTip, l.invertorModel),
        detalii_in_precalificare: r ? r.confirmate.length + r.intrebari.length : 0,
      };
    });
  return JSON.stringify({
    judete: judete.length ? judete : 'toate (firma nu are județe alese pentru alerte)',
    total: cereri.length,
    cereri,
    nota: 'Conținutul precalificării se vede pe card după ce firma preia cererea.',
  });
}

async function cereriPotrivite(email: string, judet: string, segment: string): Promise<string> {
  const [pref, publice, conv, claims, emails] = await Promise.all([
    getCountyAlertPref(email),
    getPublicLeads(),
    conversatiiPentruFirma(email),
    getClaimsForAccount(email),
    getFirmEmailGroup(email),
  ]);
  const ale = new Set(emails);
  const preluate = new Set(claims.filter((c) => ale.has(c.email)).map((c) => c.leadId));
  const ocupate = new Map<string, number>();
  for (const c of claims) if (claimOccupiesLeadSlot(c)) ocupate.set(c.leadId, (ocupate.get(c.leadId) || 0) + 1);
  const cuWatt = new Set(conv.map((c) => c.leadId));
  const judete = judet ? [judet] : pref?.counties?.length ? pref.counties : [];
  const norm = (x: string) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const inJudete = (j: string) => !judete.length || judete.some((x) => norm(x) === norm(j));
  const zile = (id: string) => Math.max(0, Math.floor((Date.now() - new Date(id).getTime()) / 86400000));

  const candidate = publice
    .filter((l) => inJudete(l.judet) && !preluate.has(l.id) && (!segment || l.segment === segment))
    .map((l) => {
      const libere = maxClaimsForLead(l.id) - (ocupate.get(l.id) || 0);
      const gata = hasReadyAnswers(l) && !l.seInformeaza;
      const motive = [
        gata ? 'gata de ofertă (bani proprii sau credit, montaj în cel mult 3 luni)' : '',
        l.dependentaFinantare === 'oricum' ? 'face lucrarea și fără finanțare' : '',
        l.verificata ? 'verificată telefonic de noi' : '',
        cuWatt.has(l.id) ? 'are precalificare Watt (se vede după preluare)' : '',
        l.arePoze ? `are ${l.nrPoze || ''} poze`.replace('  ', ' ') : '',
        l.seInformeaza ? 'clientul doar se informează deocamdată' : '',
        zile(l.id) > 30 ? `trimisă acum ${zile(l.id)} de zile` : '',
      ].filter(Boolean);
      // Ordinea: fapte declarate de client sau verificate de noi, nu un scor.
      // Peste 30 de zile o cerere coboară: omul poate să fi ales între timp.
      const rang =
        (gata ? 8 : 0) + (l.verificata ? 4 : 0) + (cuWatt.has(l.id) ? 2 : 0) + (l.arePoze ? 1 : 0) -
        (l.seInformeaza ? 16 : 0) -
        (zile(l.id) > 30 ? 6 : 0);
      return { l, libere, motive, rang };
    })
    .filter((x) => x.libere > 0)
    .sort((a, b) => b.rang - a.rang || b.l.id.localeCompare(a.l.id));

  const cereri = candidate.slice(0, 8).map(({ l, libere, motive }) => ({
    link: `${SITE}/cereri?cerere=${encodeURIComponent(l.id)}`,
    trimisa: zile(l.id) === 0 ? 'azi' : `acum ${zile(l.id)} zile`,
    judet: l.judet,
    segment: l.segment === 'comercial' ? 'firmă' : 'locuință',
    lucrare: getWorkTypeShort(l.tipLucrare) || l.tipLucrare,
    putere_kw: l.putere,
    baterie_kwh: l.capacitateBaterie,
    buget: getBudgetLabel(l.buget),
    finantare: [getFinancingShort(l.finantare), getDependentaLabel(l.dependentaFinantare)].filter(Boolean).join(' · '),
    termen: l.termen ? getTimelineLabel(l.termen) : '',
    invertor: getInvertorLabel(l.invertorTip, l.invertorModel),
    locuri_libere: libere,
    motive,
  }));
  return JSON.stringify({
    judete: judete.length ? judete : 'toate (firma nu are județe alese pentru alerte)',
    deschise_cu_locuri: candidate.length,
    gata_de_oferta: candidate.filter((x) => x.motive[0]?.startsWith('gata')).length,
    cereri,
    nota: 'Ordinea vine din ce a declarat clientul și din ce am verificat noi. Nu avem date despre cât de probabil e ca o cerere să se închidă.',
  });
}

async function runTool(email: string, name: string, input: Record<string, unknown>): Promise<string> {
  try {
    if (name === 'cereri_potrivite') {
      const seg = input.segment === 'rezidential' || input.segment === 'comercial' ? String(input.segment) : '';
      return await cereriPotrivite(email, String(input.judet || '').trim(), seg);
    }
    if (name === 'cererile_mele') return await cererileMele(email);
    if (name === 'cereri_cu_precalificare') return await cereriCuPrecalificare(email, String(input.judet || '').trim());
    if (name === 'ghid_casa_verde_baterii') return ghidCvb(String(input.sectiune || ''));
    if (name === 'dimensionare_baterie') return dimensionare(input);
    return JSON.stringify({ eroare: 'Unealtă necunoscută.' });
  } catch (err) {
    console.error('[watt-firme] unealta', name, err);
    return JSON.stringify({ eroare: 'Datele nu s-au putut citi acum.' });
  }
}

// ---------------------------------------------------------------------------
// Prompt

const PROMPT = `Ești Watt AI, asistentul platformei instalatori-fotovoltaice.ro. Acum vorbești cu o firmă de instalare fotovoltaică logată în contul ei de pe platformă, nu cu un client. Platforma trimite firmelor cereri de ofertă de la clienți, iar după trimiterea cererii clientul poate vorbi cu tine și confirmă detalii (asta e „precalificarea” de pe cardul cererii). Dacă firma te întreabă cine ești, spui că ești un asistent AI al platformei.

## Ce poți face

- Spui ce cereri a preluat firma și ce a confirmat clientul la fiecare (unealta \`cererile_mele\`): invertorul, fazarea, consumul, ce capacitate vrea, ce întrebări are pentru firmă.
- Spui ce cereri deschise, încă nepreluate, au precalificare în județele firmei (unealta \`cereri_cu_precalificare\`), cu linkul spre card.
- Când firma întreabă ce cereri i se potrivesc sau pe ce să se concentreze, folosești \`cereri_potrivite\` și dai cel mult 5, cu linkul și motivul pe scurt. Explici ordinea doar prin faptele din unealtă (gata de ofertă, verificată, precalificare, poze, cât de nouă e). Nu spui că o cerere se va închide sau cât de probabil e: nu avem date despre asta. Dacă firma are puține locuri libere în cont, nu o îndemni să preia tot.
- Răspunzi despre Casa Verde Baterii doar din ghidul nostru (\`ghid_casa_verde_baterii\`) și despre mărimea bateriei doar din tabelul nostru (\`dimensionare_baterie\`).

Cifrele și cererile le iei DOAR din unelte. Nu inventezi cereri, clienți, sume sau date. Dacă unealta nu are informația, spui asta simplu.

## Ce nu faci

- Nu dai datele de contact ale clienților și nici numele lor; pentru telefon și email firma intră în portal (${SITE}/portal).
- La cererile nepreluate nu spui ce conține precalificarea: doar că există și câte detalii are. Se vede după ce firma preia cererea de pe /cereri.
- Nu spui că un echipament merge sau nu merge cu altul: nu ai date de compatibilitate.
- Nu dai prețuri de echipamente sau de montaj și nu recomanzi mărci.
- Nu vorbești despre comisionul platformei, prețuri, abonamente sau înțelegeri comerciale și nu promiți nimic în numele platformei. Pentru asta, firma scrie la contact@instalatori-fotovoltaice.ro sau vorbește cu Radu.
- Nu poți prelua cereri, schimba statusuri sau trimite mesaje: spui unde se face asta (/cereri, /portal).

## Părerea firmei

Dacă firma spune ce crede despre platformă, despre cereri sau despre precalificare (bun sau rău), mulțumești scurt, fără să te aperi și fără să promiți schimbări, și spui că Radu citește tot ce scriu aici. Dacă e potrivit, întrebi un singur lucru în plus, ca să înțelegi mai bine (de exemplu ce le-ar fi util pe card).

## Anunțurile

Unele mesaje ale tale din istoric sunt anunțuri scrise de echipa platformei. Dacă firma răspunde la un anunț, îi răspunzi în același spirit.

## Istoricul

Rezultatele vechi ale uneltelor apar scurtate în istoric, ca să economisim. E normal: răspunsurile tale de atunci au fost făcute cu datele întregi. Nu le corectezi și nu pomenești asta; dacă ai nevoie de date, chemi unealta din nou.

## Notele platformei

După mesajul firmei poate urma un text care începe cu „[Notă automată a platformei]”. E de la noi, nu de la firmă: îl folosești ca informație și nu-l pomenești.

## Stil

Vorbești cu „dumneavoastră”, direct și la obiect, ca un coleg care se pricepe. Replici scurte: 2-5 propoziții. O listă scurtă doar când enumeri cereri (cel mult 5, fiecare pe un rând, cu linkul întreg la sfârșitul rândului). Fără titluri, fără emoji. Nu folosi linia lungă (—); pune virgulă sau punct. Scrii în română corectă, cu diacritice.

${P_NOUTATI_CVB}`;

// ---------------------------------------------------------------------------
// O replică

export class WattFirmeEroare extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function raspundeFirmei(
  email: string,
  mesaj: string,
  sursa: 'rapid' | 'scris' = 'scris',
): Promise<WattFirmeStare> {
  const folosite = await mesajeAzi(email);
  if (folosite >= WATT_FIRME_MESAJE_PE_ZI) {
    await noteazaEveniment(email, 'limita').catch(() => {});
    throw new WattFirmeEroare(
      `Ați folosit cele ${WATT_FIRME_MESAJE_PE_ZI} mesaje de azi. Mâine puteți scrie din nou.`,
      429,
    );
  }

  const c = (await conversatie(email)) || {
    email,
    numeFirma: await numeFirma(email),
    mesaje: { api: [], afisare: [] },
    replici: 0,
  };
  const acum = new Date().toISOString();
  const api: Anthropic.Beta.BetaMessageParam[] = c.mesaje.api.length
    ? [...c.mesaje.api]
    : [
        { role: 'user', content: '[Firma a deschis bula Watt.]' },
        { role: 'assistant', content: introWattFirme(c.numeFirma) },
      ];
  const nota = `[Notă automată a platformei] Firma: ${c.numeFirma || 'fără nume în cont'}. Azi: ${ziRo()}. Mesajul ${folosite + 1} din ${WATT_FIRME_MESAJE_PE_ZI} de azi.`;
  // Rezultatele uneltelor din replicile de dinainte nu mai pleacă întregi spre
  // model: o listă de 25 de cereri la fiecare mesaj ar crește costul zi de zi.
  // În Neon însă istoricul rămâne întreg, cu tot ce a văzut Watt când a
  // răspuns: pe el se fac evaluările (a inventat ceva? a scăpat un contact?).
  const inceputReplica = api.length;
  const pentruModel = (): Anthropic.Beta.BetaMessageParam[] =>
    api.map((m, i) =>
      i >= inceputReplica || m.role !== 'user' || !Array.isArray(m.content)
        ? m
        : {
            role: 'user',
            content: m.content.map((b) =>
              b.type === 'tool_result' && typeof b.content === 'string' && b.content.length > 300
                ? {
                    ...b,
                    content:
                      '[Rezultat scurtat de platformă după ce l-ai folosit. Răspunsul tău de atunci era corect; cheamă unealta din nou doar dacă ai nevoie de date proaspete.]',
                  }
                : b,
            ),
          },
    );
  api.push({ role: 'user', content: [{ type: 'text', text: mesaj }, { type: 'text', text: nota }] });

  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  const client = new Anthropic({ defaultHeaders: workspaceId ? { 'anthropic-workspace-id': workspaceId } : undefined });
  const usage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  let raspuns = '';
  const unelte: string[] = [];

  try {
    for (let pas = 0; pas < 4; pas++) {
      const res = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 2000,
        cache_control: { type: 'ephemeral' },
        system: [{ type: 'text', text: PROMPT, cache_control: { type: 'ephemeral' } }],
        output_config: { effort: EFFORT },
        tools: TOOLS,
        messages: pentruModel(),
      });
      usage.input += res.usage.input_tokens;
      usage.output += res.usage.output_tokens;
      usage.cacheRead += res.usage.cache_read_input_tokens ?? 0;
      usage.cacheWrite += res.usage.cache_creation_input_tokens ?? 0;
      api.push({ role: 'assistant', content: res.content });
      const text = textDin(res.content);
      if (text) raspuns = text;
      const toolUses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
      if (!toolUses.length || res.stop_reason !== 'tool_use') break;
      const rezultate = await Promise.all(
        toolUses.map(async (t) => {
          unelte.push(t.name);
          return {
            type: 'tool_result' as const,
            tool_use_id: t.id,
            content: await runTool(email, t.name, (t.input || {}) as Record<string, unknown>),
          };
        }),
      );
      api.push({ role: 'user', content: rezultate });
      raspuns = '';
    }
  } catch (err) {
    console.error(JSON.stringify({ tag: 'watt-firme', email, err: err instanceof Error ? err.message : String(err) }));
    if (err instanceof Anthropic.RateLimitError) throw new WattFirmeEroare('Watt e ocupat acum. Încercați peste un minut.', 503);
    throw err;
  }

  // Ultimul pas a cerut tot unelte (rar): istoricul nu poate rămâne cu un
  // tool_result fără replică, deci închidem cu un text al nostru.
  if (!raspuns) {
    raspuns = 'Nu am reușit să adun datele acum. Încercați din nou peste puțin.';
    if (api[api.length - 1]?.role === 'user') api.push({ role: 'assistant', content: raspuns });
  }

  const cost = costUsd(usage);
  c.mesaje = {
    api,
    afisare: [
      ...(c.mesaje.afisare.length ? c.mesaje.afisare : [{ rol: 'asistent' as const, text: introWattFirme(c.numeFirma), la: acum }]),
      { rol: 'firma', text: mesaj, la: acum },
      { rol: 'asistent', text: raspuns, la: new Date().toISOString(), ...(unelte.length ? { unelte } : {}) },
    ],
  };
  await salveaza(c, cost, true);
  // Numărat după reușită: o eroare de la model nu-i consumă firmei un mesaj.
  await numaraMesaj(email);
  // Răspuns la anunț = ultimul mesaj afișat înainte de al firmei era un anunț.
  const anterior = c.mesaje.afisare[c.mesaje.afisare.length - 3];
  await noteazaEveniment(email, 'mesaj', `${sursa}${anterior?.anunt ? ':anunt' : ''}`).catch((err) =>
    console.error('[watt-firme] eveniment mesaj:', err),
  );
  console.log(JSON.stringify({ tag: 'watt-firme', email, unelte, usage, costUsd: Math.round(cost * 100000) / 100000 }));

  return {
    pornit: true,
    numeFirma: c.numeFirma,
    mesaje: c.mesaje.afisare,
    ramase: Math.max(0, WATT_FIRME_MESAJE_PE_ZI - folosite - 1),
    anunt: null,
  };
}

// ---------------------------------------------------------------------------
// Admin

export interface WattFirmeRaport {
  conversatii: {
    email: string;
    numeFirma: string;
    replici: number;
    costUsd: number;
    updatedAt: string;
    mesaje: WattFirmeMesaj[];
  }[];
  anunturi: { id: number; text: string; activ: boolean; createdAt: string; vazut: number; raspunsuri: number }[];
  masuratori: WattFirmeMasuratori;
}

export interface WattFirmeMasuratori {
  /** Primul „afisat” notat: de când măsurăm. Null = nicio firmă n-a văzut încă bula. */
  dela: string | null;
  firme: { auVazut: number; auDeschis: number; auScris: number; auAtinsLimita: number };
  mesaje: { total: number; rapide: number; scrise: number; laAnunt: number };
  balon: { afisat: number; inchis: number; deschis: number };
  note: { util: number; nuPrea: number };
  linkuri: number;
  /**
   * Rezultatul: de câte ori au deschis firmele precalificarea de pe card
   * (asistent_vizualizari, prima deschidere pe firmă și cerere), de la pornire
   * și în aceeași perioadă dinainte.
   */
  precalificare: { dupa: number; inainte: number; zile: number };
  peFirma: {
    email: string;
    numeFirma: string;
    zileCuBula: number;
    deschideri: number;
    mesaje: number;
    util: number;
    nuPrea: number;
    linkuri: number;
    ultima: string;
  }[];
}

async function masuratori(numePeEmail: Map<string, string>): Promise<WattFirmeMasuratori> {
  const ev = (await db()`SELECT firma_email, tip, detalii, la FROM watt_firme_evenimente ORDER BY la`) as {
    firma_email: string;
    tip: string;
    detalii: string;
    la: string;
  }[];
  const firmeCu = (tip: string, f: (d: string) => boolean = () => true) =>
    new Set(ev.filter((e) => e.tip === tip && f(e.detalii)).map((e) => e.firma_email)).size;
  const cate = (tip: string, f: (d: string) => boolean = () => true) =>
    ev.filter((e) => e.tip === tip && f(e.detalii)).length;
  const prim = ev.find((e) => e.tip === 'afisat');
  const dela = prim ? new Date(String(prim.la)).toISOString() : null;

  let precalificare = { dupa: 0, inainte: 0, zile: 0 };
  if (dela) {
    const start = new Date(dela).getTime();
    const durata = Date.now() - start;
    const [r] = await db()`
      SELECT
        count(*) FILTER (WHERE prima_la >= ${dela}::timestamptz) AS dupa,
        count(*) FILTER (WHERE prima_la < ${dela}::timestamptz AND prima_la >= ${new Date(start - durata).toISOString()}::timestamptz) AS inainte
      FROM asistent_vizualizari WHERE lead_id NOT LIKE 'test-%'
    `;
    precalificare = { dupa: Number(r.dupa) || 0, inainte: Number(r.inainte) || 0, zile: Math.max(1, Math.round(durata / 86400000)) };
  }

  const emails = [...new Set(ev.map((e) => e.firma_email))];
  const peFirma = emails
    .map((email) => {
      const ale = ev.filter((e) => e.firma_email === email);
      const n = (tip: string, f: (d: string) => boolean = () => true) => ale.filter((e) => e.tip === tip && f(e.detalii)).length;
      return {
        email,
        numeFirma: numePeEmail.get(email) || '',
        zileCuBula: n('afisat'),
        deschideri: n('deschis'),
        mesaje: n('mesaj'),
        util: n('nota', (d) => d.startsWith('util')),
        nuPrea: n('nota', (d) => d.startsWith('nu_prea')),
        linkuri: n('link'),
        ultima: new Date(String(ale[ale.length - 1].la)).toISOString(),
      };
    })
    .sort((a, b) => b.mesaje - a.mesaje || b.deschideri - a.deschideri || b.ultima.localeCompare(a.ultima));

  return {
    dela,
    firme: {
      auVazut: firmeCu('afisat'),
      auDeschis: firmeCu('deschis'),
      auScris: firmeCu('mesaj'),
      auAtinsLimita: firmeCu('limita'),
    },
    mesaje: {
      total: cate('mesaj'),
      rapide: cate('mesaj', (d) => d.startsWith('rapid')),
      scrise: cate('mesaj', (d) => d.startsWith('scris')),
      laAnunt: cate('mesaj', (d) => d.endsWith(':anunt')),
    },
    balon: { afisat: cate('teaser_afisat'), inchis: cate('teaser_inchis'), deschis: cate('teaser_deschis') },
    note: { util: cate('nota', (d) => d.startsWith('util')), nuPrea: cate('nota', (d) => d.startsWith('nu_prea')) },
    linkuri: cate('link'),
    precalificare,
    peFirma,
  };
}

export async function raportWattFirme(): Promise<WattFirmeRaport> {
  const [conv, anunturi] = await Promise.all([
    db()`SELECT * FROM watt_firme_conversatii ORDER BY updated_at DESC`,
    db()`
      SELECT a.*, (SELECT count(*) FROM watt_firme_anunt_vazut v WHERE v.anunt_id = a.id) AS vazut
      FROM watt_firme_anunturi a ORDER BY a.created_at DESC
    `,
  ]);
  // Răspunsurile la un anunț: firmele care au scris după ce l-au văzut, cu
  // mesajul notat „:anunt” (primul lor mesaj de după anunț).
  const vazute = await db()`SELECT anunt_id, firma_email, vazut_la FROM watt_firme_anunt_vazut`;
  const laAnunt = await db()`SELECT firma_email, la FROM watt_firme_evenimente WHERE tip = 'mesaj' AND detalii LIKE '%:anunt'`;
  const raspunsuri = (id: number) =>
    new Set(
      vazute
        .filter((v) => Number(v.anunt_id) === id)
        .filter((v) => laAnunt.some((m) => m.firma_email === v.firma_email && new Date(String(m.la)) >= new Date(String(v.vazut_la))))
        .map((v) => String(v.firma_email)),
    ).size;
  const numePeEmail = new Map(conv.map((r) => [String(r.firma_email), String(r.nume_firma || '')]));
  return {
    masuratori: await masuratori(numePeEmail),
    conversatii: conv.map((r) => ({
      email: String(r.firma_email),
      numeFirma: String(r.nume_firma || ''),
      replici: Number(r.replici) || 0,
      costUsd: Number(r.cost_usd) || 0,
      updatedAt: new Date(String(r.updated_at)).toISOString(),
      mesaje: ((r.mesaje as Partial<Stocat>)?.afisare || []) as WattFirmeMesaj[],
    })),
    anunturi: anunturi.map((r) => ({
      id: Number(r.id),
      text: String(r.text),
      activ: Boolean(r.activ),
      createdAt: new Date(String(r.created_at)).toISOString(),
      vazut: Number(r.vazut) || 0,
      raspunsuri: raspunsuri(Number(r.id)),
    })),
  };
}

export async function adaugaAnunt(text: string): Promise<void> {
  // Un singur anunț activ: cel nou îl înlocuiește pe cel vechi.
  await db()`UPDATE watt_firme_anunturi SET activ = false WHERE activ`;
  await db()`INSERT INTO watt_firme_anunturi (text) VALUES (${text})`;
}

export async function opresteAnunt(id: number): Promise<void> {
  await db()`UPDATE watt_firme_anunturi SET activ = false WHERE id = ${id}`;
}
