/**
 * ANAF — date publice despre firme, gratuite, fără cheie.
 *
 * Folosit ca sursă când targetare.ro nu are credite (pipeline-ul /add-companies).
 *
 * - `anafBilant(cui, an)`: GET webservicesp.anaf.ro/bilant — cifra de afaceri, profit,
 *   salariați, CAEN. Testat 28.11.2026 pe CUI 50002253 (Nexum): I13 = 786.533.
 * - `anafGeneral(cuis)`: POST PlatitorTvaRest/v9/tva — denumire, adresă, telefon, CAEN,
 *   data înregistrării, stare (activ/radiat/inactiv). Până la 100 de CUI pe cerere.
 *   Structura răspunsului e cea din documentația ANAF v9; netestat din sesiunea în care
 *   a fost scris (rețeaua de acolo nu ajungea la anaf.ro), deci verifică la prima rulare.
 *
 * ANAF cere maximum 1 cerere pe secundă; funcțiile așteaptă singure între apeluri.
 */

const BASE = 'https://webservicesp.anaf.ro';
const MIN_GAP_MS = 1100;
let lastCall = 0;

async function throttle() {
  const wait = lastCall + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}

function cleanCui(cui) {
  return String(cui || '').replace(/^RO/i, '').replace(/\D/g, '');
}

const IND = { I13: 'turnover', I18: 'netProfit', I19: 'netLoss', I20: 'employees' };

/** Bilanțul pe un an. Întoarce null dacă ANAF nu are bilanț depus pentru anul ăla. */
async function anafBilant(cui, an) {
  await throttle();
  const res = await fetch(`${BASE}/bilant?an=${an}&cui=${cleanCui(cui)}`);
  if (!res.ok) throw new Error(`ANAF bilant ${res.status} (cui ${cui}, an ${an})`);
  const json = await res.json();
  if (!Array.isArray(json.i) || json.i.length === 0) return null;
  const out = { year: an, name: json.deni || '', caen_code: json.caen ? String(json.caen) : '', caen_label: json.den_caen || '' };
  for (const row of json.i) {
    const key = IND[row.indicator];
    if (key) out[key] = Number(row.val_indicator) || 0;
  }
  if (out.netLoss) out.netProfit = -out.netLoss;
  return out;
}

/** Cel mai recent bilanț disponibil, încercând anii de la `fromYear` în jos. */
async function anafLatestBilant(cui, fromYear = new Date().getFullYear() - 1, depth = 3) {
  for (let an = fromYear; an > fromYear - depth; an--) {
    const b = await anafBilant(cui, an);
    if (b && (b.turnover || b.employees || b.caen_code)) return b;
  }
  return null;
}

/** Date generale (registru TVA v9) pentru o listă de CUI. Întoarce Map<cui, date>. */
async function anafGeneral(cuis) {
  const list = [...new Set(cuis.map(cleanCui).filter(Boolean))];
  const today = new Date().toISOString().slice(0, 10);
  const out = new Map();
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100);
    await throttle();
    const res = await fetch(`${BASE}/api/PlatitorTvaRest/v9/tva`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk.map((cui) => ({ cui: Number(cui), data: today }))),
    });
    if (!res.ok) throw new Error(`ANAF tva v9 ${res.status}`);
    const json = await res.json();
    for (const f of json.found || []) {
      const g = f.date_generale || {};
      const inactiv = f.stare_inactiv || {};
      const cui = String(g.cui || '');
      const stare = g.stare_inregistrare || '';
      out.set(cui, {
        name: g.denumire || '',
        address: g.adresa || '',
        phone: g.telefon || '',
        regCom: g.nrRegCom || '',
        caen_code: g.cod_CAEN ? String(g.cod_CAEN) : '',
        registeredAt: g.data_inregistrare || '',
        year_founded: Number(String(g.data_inregistrare || '').slice(0, 4)) || 0,
        status: stare,
        active: !/radiere|radiat|dizolv/i.test(stare) && !inactiv.statusInactivi,
        vatPayer: !!(f.inregistrare_scop_Tva || {}).scpTVA,
      });
    }
  }
  return out;
}

module.exports = { anafBilant, anafLatestBilant, anafGeneral, cleanCui };
