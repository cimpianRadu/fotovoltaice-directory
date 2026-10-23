// Detaliile opționale de pe pagina /cerere/raspuns/[action], trimise odată cu
// confirmarea (12 oct 2026). Până atunci un click ne spunea doar „încă mă
// decid" sau „nu mai vreau", fără ce îl ține pe om pe loc, ce firmă l-a sunat
// sau cu cine a semnat. Clientul din Ilfov care avea nevoie de îndrumare și de
// încă o firmă l-am aflat doar la telefon.
//
// Modulul e și pentru client (pagina), și pentru server (validare + notă), deci
// nu importă nimic de pe server. Totul e opțional: fără detalii, răspunsul se
// înregistrează exact ca înainte.

import { TIMELINE_OPTIONS } from './utils-shared';

type Option = { value: string; label: string };

/** „Încă mă decid": ce l-ar ajuta. */
export const DECID_HELP_OPTIONS: readonly Option[] = [
  { value: 'alta-firma', label: 'O ofertă și de la altă firmă' },
  { value: 'explicatii', label: 'Cineva care să-mi explice ofertele' },
  { value: 'scump', label: 'Ofertele mi se par scumpe' },
  { value: 'finantare', label: 'Aștept o finanțare sau un program' },
  { value: 'nu-ma-grabesc', label: 'Nu mă grăbesc' },
];

/** „Încă mă decid" și „Nu m-a contactat nicio firmă": ce a făcut fiecare firmă numită în email. */
export const FIRM_CONTACT_OPTIONS: readonly Option[] = [
  { value: 'nu', label: 'Nu m-a sunat' },
  { value: 'fara-oferta', label: 'M-a sunat, n-am primit ofertă' },
  { value: 'oferta', label: 'Am primit ofertă' },
];

/** Cum apare fiecare variantă în nota din CRM. */
const FIRM_CONTACT_NOTE: Record<string, string> = {
  nu: 'nu l-a sunat',
  'fara-oferta': 'l-a sunat, fără ofertă',
  oferta: 'a trimis ofertă',
};

/** „Nu mai vreau": de ce. `nesunat` nu se arată la cererile „mă informez", unde firmele doar urmăresc. */
export const RENUNT_REASON_OPTIONS: readonly Option[] = [
  { value: 'scump', label: 'Prețurile sunt prea mari' },
  { value: 'program', label: 'Aștept un program de finanțare' },
  { value: 'amanat', label: 'Am amânat investiția' },
  { value: 'nesunat', label: 'Nu m-a sunat nicio firmă' },
];

/** „Da, încă vreau oferte": termenul de acum. „Mă informez" nu are sens aici. */
export const ACTIVA_TERMEN_OPTIONS: readonly Option[] = TIMELINE_OPTIONS.filter((o) => o.value !== 'ma-informez');

export const YES_NO_OPTIONS: readonly Option[] = [
  { value: 'da', label: 'Da' },
  { value: 'nu', label: 'Nu' },
];

export interface ResponseDetails {
  /** decid */
  ajutor?: string[];
  /** decid: vrea să-l sunăm noi */
  suna?: boolean;
  /** decid, necontactat: timestampul revendicării → varianta din FIRM_CONTACT_OPTIONS */
  firme?: Record<string, string>;
  /** renunt */
  motive?: string[];
  /** renunt: text liber */
  altceva?: string;
  /** aleasa: timestampul revendicării firmei alese, dacă e una de la noi */
  firmaClaim?: string;
  /** semnat: puterea din contract, în kW, ca text curat („10" sau „7,5") */
  putere?: string;
  /** activa: termenul nou */
  termen?: string;
  /** activa: l-a sunat vreo firmă până acum */
  contactat?: 'da' | 'nu';
}

const values = (opts: readonly Option[]) => new Set(opts.map((o) => o.value));
const pickList = (raw: unknown, allowed: readonly Option[]): string[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const ok = values(allowed);
  const list = [...new Set(raw.filter((v): v is string => typeof v === 'string' && ok.has(v)))];
  return list.length ? list : undefined;
};
const cleanText = (raw: unknown, max: number): string | undefined => {
  if (typeof raw !== 'string') return undefined;
  const text = raw.replace(/\s+/g, ' ').trim().slice(0, max);
  return text || undefined;
};

/** Ce vine din body, redus la valorile cunoscute. Revendicările se verifică pe server, față de cerere. */
export function parseResponseDetails(raw: unknown): ResponseDetails {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const out: ResponseDetails = {};

  const ajutor = pickList(r.ajutor, DECID_HELP_OPTIONS);
  if (ajutor) out.ajutor = ajutor;
  if (r.suna === true) out.suna = true;

  if (r.firme && typeof r.firme === 'object') {
    const ok = values(FIRM_CONTACT_OPTIONS);
    const firme = Object.fromEntries(
      Object.entries(r.firme as Record<string, unknown>)
        .filter(([k, v]) => k.length <= 40 && typeof v === 'string' && ok.has(v))
        .slice(0, 5),
    ) as Record<string, string>;
    if (Object.keys(firme).length) out.firme = firme;
  }

  const motive = pickList(r.motive, RENUNT_REASON_OPTIONS);
  if (motive) out.motive = motive;
  const altceva = cleanText(r.altceva, 500);
  if (altceva) out.altceva = altceva;

  const firmaClaim = cleanText(r.firmaClaim, 40);
  if (firmaClaim) out.firmaClaim = firmaClaim;

  const putere = normalizeKw(r.putere);
  if (putere) out.putere = putere;

  if (typeof r.termen === 'string' && values(ACTIVA_TERMEN_OPTIONS).has(r.termen)) out.termen = r.termen;
  if (r.contactat === 'da' || r.contactat === 'nu') out.contactat = r.contactat;

  return out;
}

/** „10", „7,5 kW", „7.5" → „10" / „7,5". Orice în afara 0,5–5.000 kW e o greșeală de tastare. */
export function normalizeKw(raw: unknown): string | undefined {
  if (typeof raw !== 'string' && typeof raw !== 'number') return undefined;
  const n = Number(String(raw).replace(/kw/i, '').trim().replace(',', '.'));
  if (!Number.isFinite(n) || n < 0.5 || n > 5000) return undefined;
  return String(Math.round(n * 100) / 100).replace('.', ',');
}

export function optionLabel(opts: readonly Option[], value: string): string {
  return opts.find((o) => o.value === value)?.label ?? value;
}

/** „Firma A: nu l-a sunat; Firma B: a trimis ofertă", pentru notă și emailul intern. */
export function describeFirmContacts(firme: Record<string, string>, names: Record<string, string>): string {
  return Object.entries(firme)
    .filter(([claimTs]) => names[claimTs])
    .map(([claimTs, v]) => `${names[claimTs]}: ${FIRM_CONTACT_NOTE[v] ?? v}`)
    .join('; ');
}
