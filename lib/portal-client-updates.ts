// „Update de la client” pe cardul firmei din /portal (23 nov 2026).
//
// Radu: „dacă un instalator raportează că e de sunat sau în discuții și omul
// confirmă sau zice că nu l-a sunat, să apară clar la cardul cu cererea
// respectivă ce zice omul despre asta”. Și: „dacă sunt mai multe updates, să
// fie ca un timeline”.
//
// Ce intră, toate după ce firma a preluat cererea:
//  - răspunsul clientului pe firma ASTA, din contul lui (client_firm_reports);
//  - ce a bifat pe firma ASTA în emailul „Ați găsit o ofertă bună?”
//    (evenimentul `raspuns_email_firme`, din 23 nov 2026);
//  - „nu m-a sunat nicio firmă”, din același email sau din „Mai căutați
//    oferte?”. Pe 13 nov se hotărâse să NU apară pe card (se lămurea la
//    telefon); din 23 nov apare, la cererea lui Radu;
//  - nota scrisă de Radu din /admin/whatsapp (lead_nota_platforma), aceeași
//    la toate firmele care țin cererea;
//  - alegerea clientului (Radu: „bifă verde” / „când clientul a ales altă
//    firmă, X”): `won` pe firma cu care a semnat sau pe care a ales-o, din cont
//    sau din emailuri; `lost` pe celelalte, când cererea s-a închis pe
//    castigata sau altundeva.
//
// Ce NU intră: notițele clientului din cont (lui i se spune că firma nu le
// vede) și textul brut al răspunsurilor lui pe WhatsApp (Radu alege ce ajunge
// la firme, prin notă).
//
// Fără importuri de server: lista se face pe server, cardul doar o afișează.

import { REFUZ_REASON_OPTIONS } from './client-account-shared';

export type ClientUpdateTone = 'info' | 'ok' | 'warn' | 'won' | 'lost';

export interface ClientUpdate {
  /** ISO. Gol doar la X-ul unei cereri închise de noi din CRM, unde data nu o știm. */
  at: string;
  text: string;
  /** `warn` = clientul contrazice statusul firmei (nu l-a sunat). `won` / `lost` = alegerea lui. */
  tone: ClientUpdateTone;
}

/** Un rând din client_firm_reports. */
export interface ClientFirmReportRow {
  claimTs: string;
  status: string;
  motiv: string | null;
  at: string;
}

/** Un răspuns pe email (evenimentul `raspuns_email_firme`). */
export interface ClientEmailAnswer {
  at: string;
  /** timestampul revendicării → nu | fara-oferta | oferta | refuzata | semnat | aleasa */
  firme?: Record<string, string>;
  /** „Nu m-a sunat nicio firmă.” */
  niciuna?: boolean;
}

// Statusurile în care firma declară că a vorbit cu clientul. Pe ele, „nu m-a
// sunat” e o contradicție și cardul spune ce e de făcut.
const CONTACT_DECLARED = new Set(['discutii', 'ofertat', 'castigat']);

const EMAIL_TO_REPORT: Record<string, string> = {
  nu: 'nesunat',
  'fara-oferta': 'sunat',
  oferta: 'oferta',
  refuzata: 'refuzat',
  semnat: 'semnat',
  aleasa: 'aleasa',
};

function ms(iso: string | null | undefined): number {
  const t = Date.parse(iso || '');
  return Number.isNaN(t) ? 0 : t;
}

function reportUpdate(status: string, motiv: string | null, at: string): ClientUpdate | null {
  switch (status) {
    case 'nesunat':
      return { at, tone: 'warn', text: 'Clientul spune că nu l-ai sunat.' };
    case 'sunat':
      return { at, tone: 'ok', text: 'Clientul confirmă că l-ai sunat. Încă nu a primit oferta ta.' };
    case 'oferta':
      return { at, tone: 'ok', text: 'Clientul confirmă că a primit oferta ta.' };
    case 'refuzat': {
      const label = REFUZ_REASON_OPTIONS.find((o) => o.value === motiv)?.label;
      const reason = label && motiv !== 'altceva' ? `: ${label.charAt(0).toLowerCase()}${label.slice(1)}` : '';
      return { at, tone: 'info', text: `Clientul spune că oferta ta nu i-a convenit${reason}.` };
    }
    case 'semnat':
      return { at, tone: 'won', text: 'Clientul confirmă că a semnat cu tine.' };
    case 'aleasa':
      return { at, tone: 'won', text: 'Clientul confirmă că a ales firma ta.' };
    default:
      return null;
  }
}

export function clientUpdatesFor(input: {
  claimTs: string;
  /** De când contează ce spune clientul despre „toate firmele”: deblocarea sau preluarea. */
  since: string;
  firmStatus: string;
  firmStatusLabel: string;
  /** Numele firmei, ca în „semnat <ISO> <firmă>” din `Leads!AT`. */
  firmName: string;
  /** Statusul cererii din CRM. */
  leadCrmStatus: string;
  /** Când a închis clientul cererea (ISO); gol dacă n-o știm. */
  closedAt: string;
  /** Clientul a numit firma asta pe WhatsApp după „altundeva” (de verificat): fără X. */
  maybeChosen: boolean;
  reports: ClientFirmReportRow[];
  emailAnswers: ClientEmailAnswer[];
  /** `Leads!AT`: „necontactat <ISO>” acoperă răspunsurile de dinainte de 23 nov. */
  raspunsClient: string;
  nota: { text: string; la: string } | null;
}): ClientUpdate[] {
  const since = ms(input.since);
  const out: ClientUpdate[] = [];

  for (const r of input.reports) {
    if (r.claimTs !== input.claimTs) continue;
    const u = reportUpdate(r.status, r.motiv, r.at);
    if (u) out.push(u);
  }

  const niciuna: number[] = [];
  for (const a of input.emailAnswers) {
    const mine = a.firme?.[input.claimTs];
    if (mine && EMAIL_TO_REPORT[mine]) {
      const u = reportUpdate(EMAIL_TO_REPORT[mine], null, a.at);
      if (u) out.push(u);
    } else if (a.niciuna && ms(a.at) > since) {
      niciuna.push(ms(a.at));
      out.push({ at: a.at, tone: 'warn', text: 'Clientul spune că nu l-a sunat nicio firmă.' });
    }
  }

  const [code = '', at = ''] = (input.raspunsClient || '').split(' ');
  const legacyAt = ms(at);
  if (
    code === 'necontactat' &&
    legacyAt > since &&
    !niciuna.some((t) => Math.abs(t - legacyAt) < 10 * 60_000) &&
    !input.emailAnswers.some((a) => a.firme?.[input.claimTs] && Math.abs(ms(a.at) - legacyAt) < 10 * 60_000)
  ) {
    out.push({ at, tone: 'warn', text: 'Clientul spune că nu l-a sunat nicio firmă.' });
  }

  // „Am semnat cu X” de dinainte de 23 nov: doar în `Leads!AT`, cu numele firmei.
  const legacyFirm = (input.raspunsClient || '').split(' ').slice(2).join(' ');
  if (
    code === 'semnat' &&
    legacyAt &&
    legacyFirm &&
    legacyFirm === input.firmName &&
    !out.some((u) => u.tone === 'won' && Math.abs(ms(u.at) - legacyAt) < 10 * 60_000)
  ) {
    out.push({ at, tone: 'won', text: 'Clientul confirmă că a semnat cu tine.' });
  }

  const won = out.some((u) => u.tone === 'won');
  if (
    !won &&
    !input.maybeChosen &&
    input.firmStatus !== 'castigat' &&
    (input.leadCrmStatus === 'castigata' || input.leadCrmStatus === 'altundeva')
  ) {
    out.push({
      at: input.closedAt,
      tone: 'lost',
      text:
        input.leadCrmStatus === 'castigata'
          ? 'Clientul a semnat cu altă firmă de pe platformă.'
          : 'Clientul a ales altă firmă.',
    });
  }

  if (input.nota) out.push({ at: input.nota.la, tone: 'info', text: input.nota.text });

  // Închiderea e mereu ultimul lucru întâmplat, chiar fără dată.
  const key = (u: ClientUpdate) => (u.tone === 'lost' && !u.at ? Number.MAX_SAFE_INTEGER : ms(u.at));
  out.sort((a, b) => key(b) - key(a));

  // Contradicția se spune o dată, pe cel mai nou update, și doar dacă el e „nu m-a sunat”.
  const top = out[0];
  if (top && top.tone === 'warn' && CONTACT_DECLARED.has(input.firmStatus)) {
    out[0] = {
      ...top,
      text: `${top.text} Pe card ai marcat „${input.firmStatusLabel}”: sună-l din nou și spune-i de unde ai cererea.`,
    };
  }
  return out;
}

/** X-ul roșu: rândul de închidere de pe card nu mai repetă „a ales altă firmă”. */
export function hasLostUpdate(updates: ClientUpdate[]): boolean {
  return updates.some((u) => u.tone === 'lost');
}

/** Clientul a confirmat firma asta (bifa verde): cererea nu e „semnată cu altă firmă” pentru ea. */
export function isChosenFirm(updates: ClientUpdate[]): boolean {
  return updates.some((u) => u.tone === 'won');
}
