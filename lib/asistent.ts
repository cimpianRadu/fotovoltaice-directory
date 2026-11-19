// Asistentul de după cerere (pilot 12 nov 2026): clientul discută cu asistentul
// după ce a trimis cererea, iar ce confirmă ajunge la firme ca rezumat. Pilotul
// a pornit doar pe baterie și extindere; din 18 nov 2026 merge pe toate
// lucrările, cu altă listă de întrebări la sistem nou și la doar montaj. Construit după Smile AI de pe gaseste-dentist.ro (unelte pe datele
// noastre, verificare de răspuns cu rescriere, cost pe replică), cu o diferență:
// aici conversația vine DUPĂ cerere și scopul ei e cererea mai completă.
//
// Ce spune asistentul despre dimensionarea bateriei și Casa Verde Baterii vine
// din unelte: tabelul din ghid (`battery-sizing`) și secțiunile ghidului
// principal din `guides.json`. Modelul nu răspunde din memorie la cifre. La
// sistem nou nu are o unealtă de dimensionare, deci doar întreabă și notează:
// puterea și prețul le stabilește firma.

import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import guides from '@/data/guides.json';
import { db } from './db';
import type { NewLead } from './sheets';
import { PROGRAM, bracketFor, kwpNeeded, scoreFor } from './battery-sizing';
import {
  ASISTENT_MAX_MESAJE,
  ASISTENT_TIPURI,
  cerereRetrofit,
  type AsistentCerere,
  type AsistentDate,
  invertorTipDinWatt,
  semnaleCerere,
  valoriEfective,
} from './asistent-shared';
import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { setLeadInvertor } from './sheets';
import { alertError } from './alert';
import {
  getBudgetLabel,
  getConnectionLabel,
  getInvertorLabel,
  getFinancingLabel,
  getRoofTypeLabel,
  getScopLabel,
  getTimelineLabel,
  getWorkTypeShort,
  getYesNoLabel,
} from './utils-shared';

// Sonnet 5.5 din 18 nov 2026 (până atunci Opus 5.5): la proba pe aceleași
// conversații a salvat aceleași date pentru firmă la jumătate de preț pe token.
// Înapoi pe Opus fără cod: ASISTENT_MODEL=claude-opus-5-5 pe Vercel.
export const MODEL = process.env.ASISTENT_MODEL || 'claude-sonnet-5-5';
/** Chat cu replici scurte și câteva unelte: `low` ajunge. */
const EFFORT = (process.env.ASISTENT_EFFORT || 'low') as 'low' | 'medium' | 'high';

/** USD pe milion de tokeni, din lista de prețuri Anthropic (noiembrie 2026). */
const PRICING: Record<string, { in: number; out: number; cacheRead: number }> = {
  'claude-opus-5-5': { in: 4, out: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { in: 2, out: 10, cacheRead: 0.1 },
  'claude-haiku-5-5': { in: 0.1, out: 0.5, cacheRead: 0.01 },
};

interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

function costUsd(u: Usage): number {
  const p = PRICING[MODEL] || PRICING['claude-sonnet-5-5'];
  return (u.input * p.in + u.cacheRead * p.cacheRead + u.cacheWrite * p.in * 1.25 + u.output * p.out) / 1e6;
}

/**
 * Pornit pe producție doar cu ASISTENT_BATERII=on; local merge oricând. Numele
 * variabilei a rămas de la pilotul pe baterii, deși acum pornește asistentul pe
 * toate lucrările: redenumirea ar cere schimbarea ei și pe Vercel.
 */
export function asistentPornit(): boolean {
  return process.env.ASISTENT_BATERII === 'on' || process.env.NODE_ENV === 'development';
}

export function cerereEligibila(lead: Pick<NewLead, 'tipLucrare'>): boolean {
  return (ASISTENT_TIPURI as readonly string[]).includes(lead.tipLucrare);
}

export function instantaneuCerere(lead: NewLead): AsistentCerere {
  return {
    tipLucrare: lead.tipLucrare,
    judet: lead.judet,
    putere: lead.putere,
    capacitateBaterie: lead.capacitateBaterie,
    consumLunar: lead.consumLunar,
    fazare: lead.fazare,
    finantare: lead.finantare,
    termen: lead.termen,
    buget: lead.buget,
    scop: lead.scop,
    tipAcoperis: lead.tipAcoperis,
    // Mesajul liber poate avea date personale; modelul îl citește ca să nu
    // întrebe din nou ce omul a scris deja, dar nu ajunge în rezumatul firmei.
    mesaj: (lead.mesaj || '').slice(0, 1500),
    segment: lead.segment,
    suprafata: lead.suprafata,
    stocare: lead.stocare,
    wallbox: lead.wallbox,
    bransament: lead.bransament,
    invertorTip: lead.invertorTip,
    invertorModel: lead.invertorModel,
  };
}

// ---------------------------------------------------------------------------
// Prompt

const P_IDENTITATE = `Ești Watt AI, asistentul cererii de pe instalatori-fotovoltaice.ro, platforma care trimite cererile de ofertă la firme de instalare din zona clientului. Dacă omul te întreabă cine ești, spui că ești un asistent AI al platformei, nu un om și nu un instalator.`;

const P_TRECE_IN_CERERE = `Ce afli trece în cerere și îl văd firmele care o preiau. Spune-i asta omului o dată, la început, ca să știe de ce întrebi.`;

const P_CUM_INTREBI = `Întrebi un singur lucru pe replică, cel mult două dacă sunt legate. Nu reîntrebi ce scrie deja în cerere, decât dacă e neclar.`;

const P_NU_STIE = `Dacă omul nu știe ceva, e în regulă: notezi „nu știe” și treci mai departe. Nu insiști. Dacă vrea să se oprească, îi mulțumești și te oprești.`;

/** Baterie pe un sistem existent și extindere: pilotul din 12 nov 2026. */
const P_RETROFIT = `Omul cu care vorbești tocmai a trimis o cerere pentru o baterie de stocare (sau pentru extinderea unui sistem fotovoltaic pe care îl are deja). Cererea e salvată și a plecat deja la firme. Tu ai două treburi, în ordinea asta:

1. Să clarifici câteva lucruri pe care firma le întreabă oricum la primul telefon, ca oferta să fie potrivită din prima.
2. Să-l ajuți să înțeleagă două lucruri care contează la o baterie: cât de mare poate fi față de sistemul pe care îl are și ce cere programul Casa Verde Baterii.

${P_TRECE_IN_CERERE}

## Ce încerci să afli (doar ce lipsește din cerere sau e neclar)

Lista de mai jos e capătul conversației: când e acoperită, închei (vezi „Cum închei”). Nu lungești discuția cu „mai e ceva?” după fiecare răspuns.

- invertorul pe care îl are: dacă e hibrid (are intrare de baterie), apoi marca și modelul. E PRIMUL lucru pe care îl întrebi, înaintea oricărui altul: schimbă cel mai mult prețul ofertei (pe un invertor care nu e hibrid, bateria cere alt invertor). Dacă cererea are deja tipul și modelul din formular, nu le mai întrebi. Dacă omul nu știe, îi spui o singură dată unde găsește modelul: pe eticheta de pe lateralul invertorului sau în aplicația de monitorizare de pe telefon (FusionSolar, SolarMan, Growatt ShinePhone și altele), unde scrie la detaliile dispozitivului. Dacă nici așa nu știe, notezi „nu știe” și treci mai departe;
- fazarea: monofazat sau trifazat (scrie pe contor sau pe siguranța generală);
- puterea sistemului existent, în kWp, dacă lipsește sau pare greșită;
- dacă are deja o baterie, și de ce capacitate;
- consumul lunar, din factură (kWh pe lună);
- ce capacitate de baterie vrea și de ce (punctajul programului, backup la pană de curent, consumul de seara);
- dacă intră în Casa Verde Baterii;
- ce vrea să afle de la firmă (întrebi o singură dată, spre final).

${P_CUM_INTREBI} Un exemplu des întâlnit: oamenii scriu „baterie de 15 kW” când vor să spună 15 kWh; confirmi unitatea.

${P_NU_STIE}

## Ce explici, și de unde

- Raportul dintre baterie și sistem îl iei DOAR din unealta \`dimensionare_baterie\` (tabelul din ghidul nostru). Dacă bateria cerută e mai mare decât poate umple sistemul din surplus, spui asta o dată, simplu, cu cifrele din unealtă, și întrebi dacă s-a gândit la o extindere a panourilor. E o opțiune, nu o recomandare: decizia e a lui și a firmei. Dacă programul îl împinge spre o capacitate mare (punctajul maxim pe capacitate e la ${PROGRAM.capacityForMaxPoints} kWh, minimul finanțat e ${PROGRAM.minKwh} kWh), explică ambele părți fără să alegi tu.
- Despre Casa Verde Baterii răspunzi DOAR din unealta \`ghid_casa_verde_baterii\`, din secțiunea potrivită. Dacă răspunsul nu e acolo, spui că nu ai informația și că o confirmă firma sau AFM.
- Pentru ce nu acoperă uneltele, spui cinstit că o lămurește firma la telefon și treci întrebarea în cerere.`;

/** Sistem nou și doar montaj (din 18 nov 2026): doar întrebări, fără dimensionare. */
function promptSistemNou(cerere: AsistentCerere): string {
  const montaj = cerere.tipLucrare === 'doar-montaj';
  const firma = cerere.segment === 'comercial';
  const ceACerut = montaj
    ? 'montajul unui sistem fotovoltaic pentru care are deja echipamentele cumpărate'
    : firma
      ? 'un sistem fotovoltaic nou pentru o firmă (hală, magazin, birouri, fermă)'
      : 'un sistem fotovoltaic nou';
  const lista = [
    montaj
      ? '- ce echipamente are deja: câte panouri și de ce putere, marca și modelul invertorului, dacă are și structura de prindere și cablurile. E primul lucru pe care îl întrebi;'
      : '',
    '- consumul lunar, din factură (kWh pe lună sau lei pe lună), dacă lipsește din cerere;',
    firma
      ? '- programul de lucru: un schimb sau mai multe, și dacă se lucrează în weekend. De el depinde cât din producție se consumă pe loc;'
      : '- când consumă mai mult curent: ziua, seara și noaptea, sau cam la fel;',
    firma
      ? '- puterea contractată sau aprobată la locul de consum, dacă o știe (scrie în contractul de furnizare sau în avizul de racordare);'
      : '',
    '- consumatori mari pe care îi are sau îi plănuiește: pompă de căldură, mașină electrică, aer condiționat, boiler electric' +
      (firma ? ', utilaje, camere frigorifice' : '') +
      ';',
    '- acoperișul: încotro e orientat (sud, est-vest, altfel) și dacă îl umbrește ceva (copaci, horn, clădirea vecină);',
    '- cât loc liber e pe acoperiș, cu aproximație, dacă știe (metri pătrați sau lungime și lățime) și nu scrie deja în cerere;',
    '- fazarea, doar dacă în cerere lipsește sau e „nu știu”: monofazat sau trifazat (scrie pe contor sau pe siguranța generală);',
    montaj ? '' : '- dacă vrea baterie de la început, mai târziu sau deloc, doar dacă în cerere nu e clar;',
    '- dacă vrea să dea surplusul în rețea, ca prosumator;',
    '- ce vrea să afle de la firmă (întrebi o singură dată, spre final).',
  ].filter(Boolean);

  return `Omul cu care vorbești tocmai a trimis o cerere pentru ${ceACerut}. Cererea e salvată și a plecat deja la firme. Treaba ta e una singură: să clarifici câteva lucruri pe care firma le întreabă oricum la primul telefon, ca oferta să fie potrivită din prima.

${P_TRECE_IN_CERERE}

## Ce încerci să afli (doar ce lipsește din cerere sau e neclar)

Lista de mai jos e capătul conversației: când e acoperită, închei (vezi „Cum închei”). Nu lungești discuția cu „mai e ceva?” după fiecare răspuns.

${lista.join('\n')}

${P_CUM_INTREBI}

${P_NU_STIE}

## Ce explici, și de unde

- Nu spui ce putere îi trebuie, câte panouri încap, cât produce sistemul sau în cât timp se amortizează. Nu ai o unealtă pentru asta: le calculează firma, după consum și acoperiș. Dacă omul întreabă, îi spui asta simplu și treci întrebarea în \`intrebari_pentru_firma\`.
- Dacă vrea și baterie și întreabă ce capacitate i se potrivește, folosești unealta \`dimensionare_baterie\` cu consumul lui. Altfel nu deschizi tu subiectul mărimii bateriei.
- Despre Casa Verde Baterii răspunzi doar dacă întreabă el, și DOAR din unealta \`ghid_casa_verde_baterii\`. Despre alte programe (Casa Verde Fotovoltaice, Electric Up, fonduri europene) nu ai informații: spui că le confirmă firma sau instituția care dă finanțarea.
- Pentru orice altceva, spui cinstit că o lămurește firma la telefon și treci întrebarea în cerere.`;
}

/**
 * Ce s-a schimbat la program, spus o dată în prompt (18 nov 2026, cerut de Radu):
 * oamenii vin cu cifrele vechi, din presă sau din discuții mai vechi cu noi, și
 * modelul trebuie să știe că s-au schimbat înainte să deschidă ghidul. Cifrele
 * în vigoare vin din PROGRAM, nu sunt scrise de mână; de mână sunt doar cele
 * vechi (două criterii de câte 50, maxim la 20 kWh), ca să le recunoască.
 */
const P_NOUTATI_CVB = `## Ce s-a schimbat la Casa Verde Baterii

Oamenii vin des cu cifre vechi. Ține minte ce e în vigoare din 16 noiembrie 2026 (Ordinul nr. 2.314/2026):

- Punctajul are trei criterii, maximum ${PROGRAM.maxPoints.capacity + PROGRAM.maxPoints.contribution + PROGRAM.maxPoints.noPriorFunding} de puncte: capacitatea bateriei, cel mult ${PROGRAM.maxPoints.capacity} de puncte, cu maximul de la ${PROGRAM.capacityForMaxPoints} kWh; contribuția proprie, între ${PROGRAM.minContributionPoints} și ${PROGRAM.maxPoints.contribution} de puncte; și ${PROGRAM.maxPoints.noPriorFunding} de puncte pentru cine nu a mai primit finanțare din fonduri publice pentru o baterie.
- Formula veche, cu două criterii de câte 50 de puncte și maximul pe capacitate la 20 kWh, nu se mai aplică. Dacă omul o pomenește, sau dacă mai devreme în conversație a apărut ea, îi spui simplu că s-a schimbat și îi dai cifrele din unelte.
- Cine a mai primit bani publici pentru o baterie poate cere finanțare pentru una nouă, dar primește 0 puncte la al treilea criteriu.
- Înscrierea se face fără instalator ales dinainte. După aprobarea finanțării, omul are 90 de zile să compare ofertele instalatorilor validați de AFM și să aleagă una.
- Suma maximă și standardul de cost pe kWh sunt plafoane, nu prețuri recomandate.

Detaliile le iei tot din \`ghid_casa_verde_baterii\` (secțiunile „status-ghid”, „punctaj”, „cine-se-califica”, „dupa-aprobare”). Nu calculezi tu punctajul total al omului și nu spui dacă punctajul lui ajunge.`;

const P_REGULI = `## Ce nu faci niciodată

- Nu spui că un echipament merge sau nu merge cu altul (baterie cu invertor, invertor cu panouri). Nu ai date de compatibilitate. Transformi întrebarea într-una pentru firmă („Firma vă confirmă dacă bateria X se poate lega la invertorul Y”) și o salvezi în \`intrebari_pentru_firma\`.
- Nu dai prețuri de echipamente sau de montaj și nu estimezi cât costă lucrarea. Sumele programului (procent, plafon, standard de cost) le poți spune, din ghid.
- Nu recomanzi mărci sau modele și nu numești firme.
- Nu promiți că omul primește finanțare sau ce punctaj iese; spui ce scrie în ghid.
- Nu ceri telefon, email sau adresă: le avem din cerere.
- Nu vinzi. Nu împingi spre o lucrare mai mare.

## Notele platformei

După mesajul omului poate urma un text care începe cu „[Notă automată a platformei, nu e de la client]” sau cu „[Verificare automată, nu e de la client]”. E de la noi, nu de la el: îl folosești ca informație sau ca cerere de corectură, nu-i răspunzi și nu-l pomenești în replică.

## Cum salvezi

De fiecare dată când omul confirmă ceva, apelezi \`salveaza_raspunsuri\` cu câmpurile noi, în aceeași replică.

Replica pentru client o scrii întreagă în același mesaj cu apelurile \`salveaza_raspunsuri\`, \`propune_variante\` și \`incheie_conversatia\`, înaintea lor; după rezultatul lor nu mai scrii nimic. Clientul vede doar textul replicii, nu ce gândești și nu uneltele: fără text, butoanele apar sub o întrebare pe care n-a citit-o. Și după \`dimensionare_baterie\` sau \`ghid_casa_verde_baterii\` scrii replica, apoi butoanele. Nu-i spui omului să aleagă dintre variante: butoanele apar singure sub replică.

## Cum închei

Când ai acoperit lista (sau omul vrea să se oprească), în aceeași replică: salvezi \`rezumat\` (2-3 propoziții pentru firmă, la persoana a treia, „Clientul are...”, doar cu fapte spuse de el, fără nume, adrese sau telefoane), apelezi \`incheie_conversatia\` și îi scrii omului o replică scurtă de final, de exemplu: „Mulțumesc pentru detalii! Le-am trecut în cerere și le văd firmele care o preiau, înainte să vă sune. Dacă mai aveți întrebări, vă stau la dispoziție aici.” Replica de final nu are întrebare, nu are variante și nu-i cere omului să apese vreun buton.

Dacă omul mai scrie după încheiere, îi răspunzi normal, salvezi ce e nou (și actualizezi \`rezumat\`) și închei la fel de scurt, fără să reiei întrebările.

## Variante de răspuns

Când întrebarea ta are câteva răspunsuri tipice, apelează \`propune_variante\` cu 2-4 variante scurte, exact cum le-ar scrie omul (de exemplu „Monofazat”, „Trifazat”, „Nu știu”). Pe telefon omul apasă pe ele în loc să scrie. Variantele răspund la întrebarea din replica ta de acum, nu la alta: dacă întrebi de consum, variantele sunt despre consum. Nu le folosi la întrebări deschise, ca modelul invertorului.

## Stil

Vorbești cu „dumneavoastră”, cald și clar, ca un om care se pricepe și are răbdare. Replici scurte: 2-4 propoziții. Fără liste lungi, fără titluri, fără emoji. Nu folosi linia lungă (—); pune virgulă sau punct. Scrii în română corectă, cu diacritice. Dacă omul întreabă de altceva decât cererea lui, îi răspunzi pe scurt dacă ține de fotovoltaice, altfel îl readuci politicos la cerere.`;

/**
 * Promptul după lucrare. La baterie și extindere e textul pilotului, la care
 * s-a adăugat pe 18 nov 2026 blocul cu ce s-a schimbat la program. La sistem nou și doar montaj lista
 * de întrebări e alta și asistentul nu dimensionează nimic.
 */
export function systemPrompt(cerere: AsistentCerere): string {
  const miez = cerereRetrofit(cerere.tipLucrare) ? P_RETROFIT : promptSistemNou(cerere);
  return `${P_IDENTITATE}\n\n${miez}\n\n${P_NOUTATI_CVB}\n\n${P_REGULI}`;
}

// ---------------------------------------------------------------------------
// Unelte

const SECTIUNI_CVB = [
  'status-ghid',
  'cat-primesti',
  'punctaj',
  'cine-se-califica',
  'cerinte-tehnice',
  'documente',
  'dupa-aprobare',
  'invertor',
  'dimensionare',
] as const;

export const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: 'dimensionare_baterie',
    description:
      'Tabelul de dimensionare din ghidul nostru: ce putere fotovoltaică (kWp) umple din surplus o baterie de o anumită capacitate, ce capacitate se potrivește unui consum lunar și ce punctaj pe capacitate dă Casa Verde Baterii. Folosește-l înainte de orice afirmație despre mărimea bateriei.',
    input_schema: {
      type: 'object',
      properties: {
        capacitate_kwh: { type: 'number', description: 'Capacitatea bateriei discutate, în kWh.' },
        putere_sistem_kwp: { type: 'number', description: 'Puterea sistemului fotovoltaic existent, în kWp.' },
        consum_lunar_kwh: { type: 'number', description: 'Consumul lunar al casei, în kWh.' },
      },
    },
  },
  {
    name: 'ghid_casa_verde_baterii',
    description:
      'O secțiune din ghidul nostru despre Casa Verde Baterii 2026 (ordinul AFM, sesiunea din noiembrie). Singura sursă pentru orice răspuns despre program. Secțiuni: status-ghid (calendarul sesiunii și statutul ordinului), cat-primesti (plafoane și sume), punctaj, cine-se-califica, cerinte-tehnice (bateria eligibilă), documente (dosarul), dupa-aprobare (termene), invertor (invertorul hibrid), dimensionare.',
    input_schema: {
      type: 'object',
      properties: {
        sectiune: { type: 'string', enum: [...SECTIUNI_CVB] },
      },
      required: ['sectiune'],
    },
  },
  {
    name: 'propune_variante',
    description:
      'Butoane cu 2-4 răspunsuri scurte sub replica ta, pe care clientul le apasă în loc să scrie. Doar la întrebări cu răspunsuri tipice.',
    input_schema: {
      type: 'object',
      properties: {
        variante: { type: 'array', items: { type: 'string' }, description: '2-4 variante, câte cel mult 5 cuvinte.' },
      },
      required: ['variante'],
    },
  },
  {
    name: 'incheie_conversatia',
    description:
      'Marchează conversația ca încheiată, în replica de final (după ce ai salvat rezumatul). Sub replică clientul vede apoi întrebarea dacă i-a fost util.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'salveaza_raspunsuri',
    description:
      'Trece în cerere ce a confirmat clientul. Trimite doar câmpurile noi sau schimbate; restul rămân cum erau. Apelează-l în replica în care clientul a răspuns.',
    input_schema: {
      type: 'object',
      properties: {
        fazare: { type: 'string', enum: ['monofazat', 'trifazat', 'nu-stie'] },
        invertor: { type: 'string', description: 'Marca și modelul invertorului, cum le-a dat clientul.' },
        invertor_hibrid: { type: 'string', enum: ['da', 'nu', 'nu-stie'] },
        putere_sistem_kwp: {
          type: 'number',
          description:
            'La baterie și extindere: puterea sistemului existent. La sistem nou: puterea dorită, doar dacă clientul o corectează.',
        },
        baterie_prezenta_kwh: { type: 'number', description: 'Bateria pe care o are deja, dacă are.' },
        consum_lunar_kwh: { type: 'number', description: 'Consumul lunar în kWh. Dacă omul l-a spus în lei, folosește factura_lunara_lei.' },
        factura_lunara_lei: { type: 'number', description: 'Factura lunară de curent, în lei, când omul n-a spus consumul în kWh.' },
        capacitate_dorita_kwh: { type: 'number' },
        motiv_capacitate: { type: 'string', description: 'De ce vrea capacitatea asta, pe scurt.' },
        deschis_extindere: { type: 'string', enum: ['da', 'nu', 'poate'] },
        program_cvb: { type: 'string', enum: ['da', 'nu', 'nu-stie'] },
        orientare_acoperis: { type: 'string', description: 'Încotro e orientat acoperișul, pe scurt: „sud”, „est-vest”.' },
        umbrire: { type: 'string', description: 'Ce umbrește acoperișul, pe scurt, sau „fără umbră”.' },
        suprafata_acoperis_mp: { type: 'number', description: 'Locul liber de pe acoperiș, în metri pătrați.' },
        consum_cand: { type: 'string', enum: ['ziua', 'seara', 'egal', 'nu-stie'] },
        consumatori_mari: {
          type: 'string',
          description: 'Consumatori mari existenți sau planificați, pe scurt. „Niciunul” dacă nu are.',
        },
        vrea_baterie: { type: 'string', enum: ['acum', 'mai-tarziu', 'nu', 'nu-stie'] },
        prosumator: { type: 'string', enum: ['da', 'nu', 'nu-stie'], description: 'Vrea să dea surplusul în rețea.' },
        echipamente_cumparate: {
          type: 'string',
          description: 'Doar montaj: ce echipamente are deja (panouri, invertor, structură, cabluri), cum le-a descris.',
        },
        program_lucru: { type: 'string', description: 'Cereri de la firme: programul de lucru, pe scurt.' },
        putere_contractata_kw: { type: 'number', description: 'Cereri de la firme: puterea contractată sau aprobată, în kW.' },
        intrebari_pentru_firma: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista completă de întrebări pentru firmă (înlocuiește lista de dinainte).',
        },
        rezumat: {
          type: 'string',
          description: '2-3 propoziții pentru firmă, la persoana a treia, fără date de contact.',
        },
      },
    },
  },
];

type GuideSection = { id: string; title: string; content: string };
type Guide = { slug: string; updatedAt?: string; publishedAt?: string; sections: GuideSection[] };

function ghidCvb(sectiune: string): string {
  // `guides.json` e `{ guides: [...] }`, nu o listă. Până pe 18 nov 2026 codul
  // de aici aștepta o listă, găsea zero ghiduri și unealta răspundea mereu
  // „Secțiunea nu există”: Watt n-a putut cita ghidul deloc de la lansare.
  const list = ((guides as unknown as { guides?: Guide[] }).guides ?? []) as Guide[];
  const g = list.find((x) => x.slug === 'casa-verde-baterii-2026-program-stocare-afm');
  const s = g?.sections.find((x) => x.id === sectiune);
  if (!g || !s) return JSON.stringify({ eroare: 'Secțiunea nu există.' });
  return JSON.stringify({
    ghid: '/ghid/casa-verde-baterii-2026-program-stocare-afm',
    actualizat: g.updatedAt || g.publishedAt,
    titlu: s.title,
    continut: s.content,
  });
}

function dimensionare(input: Record<string, unknown>): string {
  const cap = Number(input.capacitate_kwh) || 0;
  const kwp = Number(input.putere_sistem_kwp) || 0;
  const consum = Number(input.consum_lunar_kwh) || 0;
  const out: Record<string, unknown> = { sursa: 'tabelul din ghidul nostru de dimensionare a bateriei' };
  if (cap > 0) {
    const [min, max] = kwpNeeded(cap);
    out.putere_necesara_kwp = { min: Math.round(min * 10) / 10, max: Math.round(max * 10) / 10 };
    out.program = {
      capacitate_minima_finantata_kwh: PROGRAM.minKwh,
      capacitate_punctaj_maxim_kwh: PROGRAM.capacityForMaxPoints,
      puncte_capacitate: scoreFor(cap, PROGRAM.minOwnShare).capacity,
      puncte_capacitate_maxim: PROGRAM.maxPoints.capacity,
      formula_capacitate: '4 × kWh − 20, maximum 40 de la 15 kWh (Ordinul nr. 2.314/2026)',
      // Capacitatea e doar unul dintre cele trei criterii: fără restul, modelul
      // ajunge să prezinte punctele pe capacitate ca pe tot punctajul.
      punctaj_total: {
        maxim:
          PROGRAM.maxPoints.capacity + PROGRAM.maxPoints.contribution + PROGRAM.maxPoints.noPriorFunding,
        criterii: [
          { criteriu: 'capacitatea bateriei', maxim: PROGRAM.maxPoints.capacity },
          {
            criteriu: 'contribuția proprie',
            minim: PROGRAM.minContributionPoints,
            maxim: PROGRAM.maxPoints.contribution,
          },
          {
            criteriu: 'fără finanțare publică anterioară pentru o baterie',
            puncte: PROGRAM.maxPoints.noPriorFunding,
            altfel: 0,
          },
        ],
        in_vigoare_din: '16 noiembrie 2026 (Ordinul nr. 2.314/2026)',
      },
    };
    if (kwp > 0) {
      out.sistemul_umple_bateria = kwp >= min;
      out.explicatie =
        kwp >= min
          ? `Un sistem de ${kwp} kWp umple din surplus o baterie de ${cap} kWh.`
          : `Pentru ${cap} kWh, tabelul cere cam ${min.toFixed(1)}–${max.toFixed(1)} kWp; la ${kwp} kWp bateria se umple doar parțial din surplus.`;
    }
  }
  if (consum > 0) {
    const b = bracketFor(consum);
    out.pentru_consum = {
      consum_lunar_kwh: consum,
      capacitate_recomandata_kwh: { min: b.capacity[0], max: b.capacity[1] },
      consum_seara_noapte_kwh: { min: b.evening[0], max: b.evening[1] },
    };
  }
  return JSON.stringify(out);
}

const ENUMS: Record<string, readonly string[]> = {
  fazare: ['monofazat', 'trifazat', 'nu-stie'],
  invertor_hibrid: ['da', 'nu', 'nu-stie'],
  deschis_extindere: ['da', 'nu', 'poate'],
  program_cvb: ['da', 'nu', 'nu-stie'],
  consum_cand: ['ziua', 'seara', 'egal', 'nu-stie'],
  vrea_baterie: ['acum', 'mai-tarziu', 'nu', 'nu-stie'],
  prosumator: ['da', 'nu', 'nu-stie'],
};

/** Câmpurile din unealtă în forma salvată. Ce nu trece verificarea se ignoră. */
export function mergeDate(prev: AsistentDate, input: Record<string, unknown>): AsistentDate {
  const next: AsistentDate = { ...prev };
  const str = (v: unknown, max = 300) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 10000 ? v : undefined);
  const en = (k: string) => {
    const v = input[k];
    return typeof v === 'string' && ENUMS[k].includes(v) ? v : undefined;
  };

  const fazare = en('fazare');
  if (fazare) next.fazare = fazare as AsistentDate['fazare'];
  const invertor = str(input.invertor, 120);
  if (invertor) next.invertor = invertor;
  const hibrid = en('invertor_hibrid');
  if (hibrid) next.invertorHibrid = hibrid as AsistentDate['invertorHibrid'];
  const kwp = num(input.putere_sistem_kwp);
  if (kwp) next.putereSistemKwp = kwp;
  const bat = num(input.baterie_prezenta_kwh);
  if (bat) next.bateriePrezentaKwh = bat;
  const consum = num(input.consum_lunar_kwh);
  if (consum) next.consumLunarKwh = consum;
  const factura = num(input.factura_lunara_lei);
  if (factura) next.facturaLunaraLei = factura;
  const cap = num(input.capacitate_dorita_kwh);
  if (cap) next.capacitateDoritaKwh = cap;
  const motiv = str(input.motiv_capacitate, 200);
  if (motiv) next.motivCapacitate = motiv;
  const ext = en('deschis_extindere');
  if (ext) next.deschisExtindere = ext as AsistentDate['deschisExtindere'];
  const cvb = en('program_cvb');
  if (cvb) next.programCvb = cvb as AsistentDate['programCvb'];
  const orientare = str(input.orientare_acoperis, 80);
  if (orientare) next.orientareAcoperis = orientare;
  const umbrire = str(input.umbrire, 160);
  if (umbrire) next.umbrire = umbrire;
  const suprafata = num(input.suprafata_acoperis_mp);
  if (suprafata) next.suprafataAcoperisMp = suprafata;
  const cand = en('consum_cand');
  if (cand) next.consumCand = cand as AsistentDate['consumCand'];
  const consumatori = str(input.consumatori_mari, 200);
  if (consumatori) next.consumatoriMari = consumatori;
  const vreaBaterie = en('vrea_baterie');
  if (vreaBaterie) next.vreaBaterie = vreaBaterie as AsistentDate['vreaBaterie'];
  const prosumator = en('prosumator');
  if (prosumator) next.prosumator = prosumator as AsistentDate['prosumator'];
  const echipamente = str(input.echipamente_cumparate, 300);
  if (echipamente) next.echipamenteCumparate = echipamente;
  const program = str(input.program_lucru, 160);
  if (program) next.programLucru = program;
  const contractata = num(input.putere_contractata_kw);
  if (contractata) next.putereContractataKw = contractata;
  if (Array.isArray(input.intrebari_pentru_firma)) {
    next.intrebariPentruFirma = input.intrebari_pentru_firma
      .map((q) => str(q, 240))
      .filter((q): q is string => Boolean(q))
      .slice(0, 6);
  }
  const rezumat = str(input.rezumat, 600);
  if (rezumat) next.rezumat = rezumat;
  return next;
}

// ---------------------------------------------------------------------------
// Verificarea răspunsului: ce n-are voie să ajungă la client

const COMPATIBILITATE =
  /\b(nu\s+(este|e|sunt)\s+compatibil\w*|(este|e|sunt)\s+compatibil\w*|(nu\s+)?merge\s+(cu|pe)\s+(invertor|baterie|panouri)\w*|(nu\s+)?se\s+poate\s+lega\s+la)\b/i;
const PROMISIUNI = /\b(sigur\s+(primiți|veți\s+primi|intrați)|aveți\s+garantat|garantat\s+(finanțarea|punctajul))\b/i;
const LINIE_LUNGA = /—/;

export function verificaRaspuns(text: string, variante: string[] = []): string[] {
  const probleme: string[] = [];
  // Butoane sub o replică fără întrebare: omul nu știe la ce răspunde. Prins la
  // proba cu Sonnet 5.5 din 18 nov 2026 („Am notat și întrebările pentru firmă.”
  // deasupra butoanelor „Sud / Est-vest / Altfel / Nu știu”).
  if (variante.length && !text.includes('?')) probleme.push('fara-intrebare');
  // „Firma vă confirmă dacă ... se poate lega la ...” e forma corectă: întrebarea
  // pentru firmă, nu verdictul. Regula prinde doar afirmațiile.
  const faraIntrebari = text.replace(/firma\s+(vă\s+)?(confirmă|verifică|spune)[^.?!]*[.?!]/gi, '');
  if (COMPATIBILITATE.test(faraIntrebari)) probleme.push('compatibilitate');
  if (PROMISIUNI.test(text)) probleme.push('promisiune');
  if (LINIE_LUNGA.test(text)) probleme.push('linie-lunga');
  return probleme;
}

const CERERE_REPLICA_LIPSA =
  '[Verificare automată, nu e de la client] N-ai scris replica pentru client: el vede doar butoanele, fără întrebare. Scrie acum replica (ce ai notat, dacă e cazul, și întrebarea la care răspund butoanele propuse), fără să pomenești verificarea și fără să te scuzi: pentru client conversația a mers normal.';

function cerereRescriere(probleme: string[]): string {
  const motive: string[] = [];
  if (probleme.includes('compatibilitate')) {
    motive.push(
      'ai spus că un echipament merge sau nu merge cu altul; nu avem date de compatibilitate, deci formulează ca întrebare pe care o confirmă firma și salveaz-o în intrebari_pentru_firma',
    );
  }
  if (probleme.includes('promisiune')) motive.push('ai promis un rezultat al programului; spune doar ce scrie în ghid');
  if (probleme.includes('linie-lunga')) motive.push('ai folosit linia lungă (—); înlocuiește-o cu virgulă sau punct');
  if (probleme.includes('fara-intrebare')) {
    motive.push(
      'ai pus butoane de răspuns, dar replica nu are nicio întrebare, deci omul nu știe la ce răspunde; scrie replica întreagă: ce ai notat, răspunsul la ce a întrebat el, apoi întrebarea la care răspund butoanele',
    );
  }
  return `[Verificare automată, nu e de la client] Rescrie ultima replică pentru client: ${motive.join('; ')}. Scrie doar replica nouă, fără să pomenești verificarea.`;
}

// ---------------------------------------------------------------------------
// Conversația

export interface MesajAfisat {
  rol: 'client' | 'asistent';
  text: string;
  la: string;
  /** Butoanele de răspuns propuse sub replica asistentului. */
  variante?: string[];
}

interface Stocat {
  api: Anthropic.Beta.BetaMessageParam[];
  afisare: MesajAfisat[];
}

export interface Conversatie {
  leadId: string;
  cerere: AsistentCerere;
  mesaje: Stocat;
  date: AsistentDate;
  replici: number;
  costUsd: number;
  incheiataLa: string | null;
  /** Nota clientului după încheiere (din 13 nov 2026). */
  notaClient: 'util' | 'nu_prea' | null;
  motivClient: string;
  updatedAt: string;
}

function rowToConv(r: Record<string, unknown>): Conversatie {
  const mesaje = (r.mesaje || {}) as Partial<Stocat>;
  return {
    leadId: String(r.lead_id),
    cerere: r.cerere as AsistentCerere,
    mesaje: { api: mesaje.api || [], afisare: mesaje.afisare || [] },
    date: (r.date || {}) as AsistentDate,
    replici: Number(r.replici) || 0,
    costUsd: Number(r.cost_usd) || 0,
    incheiataLa: r.incheiata_la ? new Date(String(r.incheiata_la)).toISOString() : null,
    notaClient: r.nota_client === 'util' || r.nota_client === 'nu_prea' ? r.nota_client : null,
    motivClient: String(r.motiv_client || ''),
    updatedAt: new Date(String(r.updated_at)).toISOString(),
  };
}

export async function getConversatie(leadId: string): Promise<Conversatie | null> {
  const rows = await db()`SELECT * FROM asistent_conversatii WHERE lead_id = ${leadId}`;
  return rows[0] ? rowToConv(rows[0]) : null;
}

export async function startConversatie(leadId: string, cerere: AsistentCerere): Promise<Conversatie> {
  await db()`
    INSERT INTO asistent_conversatii (lead_id, cerere)
    VALUES (${leadId}, ${JSON.stringify(cerere)}::jsonb)
    ON CONFLICT (lead_id) DO NOTHING
  `;
  const c = await getConversatie(leadId);
  if (!c) throw new Error('Conversația nu s-a putut crea.');
  return c;
}

export async function incheieConversatie(leadId: string): Promise<void> {
  await db()`
    UPDATE asistent_conversatii SET incheiata_la = now(), updated_at = now()
    WHERE lead_id = ${leadId} AND incheiata_la IS NULL
  `;
}

export async function noteazaConversatia(leadId: string, nota: 'util' | 'nu_prea', motiv: string): Promise<void> {
  await db()`
    UPDATE asistent_conversatii SET
      nota_client = ${nota},
      motiv_client = ${motiv},
      nota_client_la = now(),
      incheiata_la = coalesce(incheiata_la, now())
    WHERE lead_id = ${leadId}
  `;
}

/** Prima replică, scrisă de noi, nu de model: nu costă nimic dacă omul nu răspunde. */
export function mesajIntro(cerere: AsistentCerere): string {
  const cap = cerere.capacitateBaterie ? `bateria de ${cerere.capacitateBaterie} kWh` : 'baterie';
  const putere = parseFloat(String(cerere.putere || '').replace(',', '.'));
  const sistem = putere > 0 ? `sistemul fotovoltaic de ${String(cerere.putere).trim()} kW` : 'sistemul fotovoltaic';
  const ce =
    cerere.tipLucrare === 'extindere'
      ? 'extinderea sistemului'
      : cerere.tipLucrare === 'doar-baterie'
        ? cap
        : cerere.tipLucrare === 'doar-montaj'
          ? 'montajul sistemului fotovoltaic'
          : sistem;
  return `Bună ziua! Sunt Watt AI, asistentul platformei. Am primit cererea pentru ${ce} și a plecat deja la firmele din zonă. Dacă aveți 2-3 minute, vă pun câteva întrebări pe care firma le pune oricum la primul telefon, ca oferta să fie potrivită din prima. Ce îmi spuneți intră în cerere și îl văd firmele care o preiau. Putem începe?`;
}

/**
 * Cache-ul e pe prefix: tot ce stă înaintea istoricului trebuie să rămână la fel
 * de la o replică la alta, altfel istoricul se plătește întreg de fiecare dată
 * (până pe 18 nov 2026 așa era: nota de mai jos stătea în `system` și se schimba
 * la fiecare mesaj, deci peste jumătate din cost era istoricul retrimis).
 *
 * De aceea contextul e în două bucăți:
 * - `contextCerere`: ce a scris omul în formular. Nu se schimbă în conversație,
 *   stă în `system`, după prompt.
 * - `notaReplica`: ce se schimbă (semnalele din cifre, numărul mesajului). Se
 *   pune după mesajul clientului și rămâne în istoric, neatinsă: istoricul doar
 *   crește la capăt. Ce s-a salvat deja nu mai e repetat aici, fiindcă fiecare
 *   rezultat al uneltei `salveaza_raspunsuri` din istoric întoarce starea întreagă.
 */
function contextCerere(x: AsistentCerere): string {
  const retrofit = cerereRetrofit(x.tipLucrare);
  const ePutere = retrofit ? 'Puterea sistemului existent' : 'Puterea dorită';
  const linii = [
    `Lucrare: ${getWorkTypeShort(x.tipLucrare) || x.tipLucrare}`,
    x.segment ? `Cererea e pentru: ${x.segment === 'comercial' ? 'o firmă' : 'o locuință'}` : '',
    `Județ: ${x.judet}`,
    x.putere ? `${ePutere} (din formular): ${x.putere} kW` : `${ePutere}: necompletată`,
    x.capacitateBaterie
      ? `Capacitate de baterie cerută (din formular): ${x.capacitateBaterie} kWh`
      : retrofit
        ? 'Capacitate de baterie: necompletată'
        : '',
    !retrofit && x.stocare ? `Baterie (din formular): ${getYesNoLabel(x.stocare)}` : '',
    !retrofit && x.wallbox ? `Stație de încărcare auto (din formular): ${getYesNoLabel(x.wallbox)}` : '',
    x.suprafata ? `Suprafață disponibilă (din formular): ${x.suprafata}` : '',
    x.bransament ? `Branșament electric: ${getConnectionLabel(x.bransament)}` : '',
    x.consumLunar ? `Consum lunar (din formular): ${x.consumLunar}` : 'Consum lunar: necompletat',
    x.fazare ? `Fazare (din formular): ${x.fazare}` : 'Fazare: necompletată',
    retrofit
      ? x.invertorTip || x.invertorModel
        ? `Invertorul existent (din formular): ${getInvertorLabel(x.invertorTip || '', x.invertorModel || '')}${x.invertorTip === 'nu-stiu' ? ' (tipul nu îl știe)' : ''}`
        : 'Invertorul existent: necompletat'
      : '',
    `Finanțare: ${getFinancingLabel(x.finantare) || x.finantare || 'necompletată'}`,
    x.termen ? `Termen: ${getTimelineLabel(x.termen)}` : '',
    x.buget ? `Buget: ${getBudgetLabel(x.buget)}` : '',
    x.scop ? `Vrea să rezolve: ${getScopLabel(x.scop)}` : '',
    x.tipAcoperis ? `Acoperiș: ${getRoofTypeLabel(x.tipAcoperis)}` : '',
    x.mesaj ? `Mesajul lui din formular: „${x.mesaj}”` : 'Mesaj: niciunul',
  ].filter(Boolean);
  return ['# Cererea clientului', ...linii].join('\n');
}

const NOTA_PREFIX = '[Notă automată a platformei, nu e de la client]';

function notaReplica(c: Conversatie): string {
  const v = valoriEfective(c.cerere, c.date);
  const semnale = semnaleCerere(c.cerere, c.date).map((s) => `- ${s.text}`);
  return [
    NOTA_PREFIX,
    `Mesajul clientului cu numărul ${c.replici + 1} din maximum ${ASISTENT_MAX_MESAJE}.`,
    semnale.length ? `Ce vedem noi din cifre acum (de verificat cu clientul, nu de recitat):\n${semnale.join('\n')}` : '',
    v.cvb ? 'Clientul pare să meargă pe Casa Verde Baterii.' : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function logReplica(data: Record<string, unknown>) {
  console.log(JSON.stringify({ tag: 'asistent', at: new Date().toISOString(), ...data }));
}

const UNELTE_CARE_SCRIU = new Set(['salveaza_raspunsuri', 'propune_variante', 'incheie_conversatia']);

function runTool(
  name: string,
  input: Record<string, unknown>,
  state: { date: AsistentDate; variante: string[]; incheie: boolean },
): string {
  if (name === 'dimensionare_baterie') return dimensionare(input);
  if (name === 'incheie_conversatia') {
    state.incheie = true;
    return JSON.stringify({ incheiata: true });
  }
  if (name === 'propune_variante') {
    state.variante = (Array.isArray(input.variante) ? input.variante : [])
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .map((v) => v.trim().slice(0, 40))
      .slice(0, 4);
    return JSON.stringify({ afisat: true });
  }
  if (name === 'ghid_casa_verde_baterii') return ghidCvb(String(input.sectiune || ''));
  if (name === 'salveaza_raspunsuri') {
    state.date = mergeDate(state.date, input);
    return JSON.stringify({ salvat: true, date: state.date });
  }
  return JSON.stringify({ eroare: 'Unealtă necunoscută.' });
}

function textDin(content: Anthropic.Beta.BetaContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

export class AsistentEroare extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/**
 * O replică: mesajul clientului intră, răspunsul și datele salvate ies.
 * Conversația se scrie în baza o singură dată, la final.
 */
export async function raspunde(c: Conversatie, mesaj: string): Promise<{ raspuns: string; conv: Conversatie }> {
  const started = Date.now();
  const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID?.trim();
  const client = new Anthropic({
    defaultHeaders: workspaceId ? { 'anthropic-workspace-id': workspaceId } : undefined,
  });

  // Prima replică a modelului vine după intro-ul nostru: îl punem în istoric ca
  // replică a asistentului, ca modelul să știe ce a văzut omul.
  const api: Anthropic.Beta.BetaMessageParam[] = c.mesaje.api.length
    ? [...c.mesaje.api]
    : [
        { role: 'user', content: '[Pagina de confirmare a cererii s-a deschis.]' },
        { role: 'assistant', content: mesajIntro(c.cerere) },
      ];
  // Mesajul clientului și nota platformei, ca două blocuri ale aceleiași replici.
  api.push({
    role: 'user',
    content: [
      { type: 'text', text: mesaj },
      { type: 'text', text: notaReplica(c) },
    ],
  });

  const state = { date: c.date, variante: [] as string[], incheie: false };
  const usage: Usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  const unelte: string[] = [];
  const contextNote = contextCerere(c.cerere);
  let raspuns = '';
  let stop = '';

  const call = (messages: Anthropic.Beta.BetaMessageParam[], toolChoice?: Anthropic.Beta.BetaToolChoice) =>
    client.beta.messages.create({
      ...(toolChoice ? { tool_choice: toolChoice } : {}),
      model: MODEL,
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      // Două puncte de cache: promptul (comun tuturor conversațiilor de același
      // fel, marcat mai jos) și, automat, ultimul bloc al istoricului, care
      // avansează cu fiecare cerere. Replica următoare citește din cache tot
      // ce s-a spus până atunci, dacă vine în 5 minute.
      cache_control: { type: 'ephemeral' },
      system: [
        { type: 'text', text: systemPrompt(c.cerere), cache_control: { type: 'ephemeral' } },
        { type: 'text', text: contextNote },
      ],
      output_config: { effort: EFFORT },
      tools: TOOLS,
      messages,
    });

  const addUsage = (res: Anthropic.Beta.BetaMessage) => {
    usage.input += res.usage.input_tokens;
    usage.output += res.usage.output_tokens;
    usage.cacheRead += res.usage.cache_read_input_tokens ?? 0;
    usage.cacheWrite += res.usage.cache_creation_input_tokens ?? 0;
  };

  try {
    for (let step = 0; step < 5; step++) {
      const res = await call(api);
      addUsage(res);
      stop = res.stop_reason ?? '';
      api.push({ role: 'assistant', content: res.content });

      if (res.stop_reason === 'refusal') {
        raspuns = 'Nu vă pot ajuta cu asta aici. Firma care preia cererea vă poate lămuri la telefon.';
        break;
      }
      const toolUses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
      // Replica vine de obicei în același mesaj cu apelurile de unelte, iar
      // după rezultat modelul nu mai scrie nimic. Textele se adună pe tot
      // parcursul replicii, altfel cel de lângă `salveaza_raspunsuri` se pierde.
      const text = textDin(res.content);
      if (text) raspuns = raspuns ? `${raspuns}\n\n${text}` : text;
      if (!toolUses.length) break;

      api.push({
        role: 'user',
        content: toolUses.map((t) => {
          unelte.push(t.name);
          return {
            type: 'tool_result' as const,
            tool_use_id: t.id,
            content: runTool(t.name, (t.input || {}) as Record<string, unknown>, state),
          };
        }),
      });

      // Uneltele care doar scriu (salvarea, butoanele) nu aduc nimic de care
      // modelul să aibă nevoie ca să răspundă. Dacă replica e deja scrisă, nu-l
      // mai chemăm o dată: un apel în minus (jumătate din așteptare) și nicio
      // propoziție în plus lipită după butoane. Rezultatele rămân în istoric,
      // iar mesajul următor al clientului vine după ele.
      if (raspuns && toolUses.every((t) => UNELTE_CARE_SCRIU.has(t.name))) break;
      // Doar butoane sau salvare, fără niciun cuvânt pentru client: nu-l mai
      // lăsăm să încerce singur. Pe 19 nov 2026 (Timiș, mesajul 7) a pus de
      // două ori aceleași butoane fără text, iar la al treilea apel a scris
      // „Scuzați, am încurcat ceva pe parcurs”. Cererea de replică de mai jos
      // vine o singură dată, fără unelte.
      if (!raspuns && toolUses.every((t) => UNELTE_CARE_SCRIU.has(t.name))) break;
    }

    // Modelul a pus butoanele dar a scris întrebarea doar în thinking (13 nov,
    // de trei ori într-o conversație). Îi cerem o dată replica, fără unelte,
    // ca butoanele să nu stea sub un text de rezervă.
    if (!raspuns) {
      // Dacă ultimul mesaj e cu rezultatele uneltelor, cererea intră în el,
      // ca bloc de text după ele: două mesaje `user` la rând nu trimitem.
      const ultim = api[api.length - 1];
      if (ultim?.role === 'user' && Array.isArray(ultim.content)) {
        api[api.length - 1] = {
          role: 'user',
          content: [...ultim.content, { type: 'text', text: CERERE_REPLICA_LIPSA }],
        };
      } else {
        api.push({ role: 'user', content: CERERE_REPLICA_LIPSA });
      }
      const res = await call(api, { type: 'none' });
      addUsage(res);
      api.push({ role: 'assistant', content: res.content });
      raspuns = textDin(res.content);
      logReplica({ level: 'warn', leadId: c.leadId, replicaLipsa: true, recuperata: Boolean(raspuns) });
    }

    // O singură rescriere, ca la Smile AI: dacă și a doua încalcă regula,
    // pleacă oricum (logul o arată), nu blocăm omul într-o buclă.
    const probleme = raspuns ? verificaRaspuns(raspuns, state.variante) : [];
    if (probleme.length) {
      api.push({ role: 'user', content: cerereRescriere(probleme) });
      const res = await call(api);
      addUsage(res);
      api.push({ role: 'assistant', content: res.content });
      const nou = textDin(res.content);
      if (nou) raspuns = nou;
      // Rescrierea pentru „compatibilitate” îi cere să salveze întrebarea pentru
      // firmă, deci replica poate veni cu `salveaza_raspunsuri`. Fără rezultat,
      // istoricul rămâne cu un tool_use orfan și următorul mesaj al clientului
      // primește 400 de la API (prins pe conversația demo, 13 nov 2026).
      const toolUses = res.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
      if (toolUses.length) {
        api.push({
          role: 'user',
          content: toolUses.map((t) => {
            unelte.push(t.name);
            return {
              type: 'tool_result' as const,
              tool_use_id: t.id,
              content: runTool(t.name, (t.input || {}) as Record<string, unknown>, state),
            };
          }),
        });
      }
    }
  } catch (err) {
    logReplica({ level: 'error', leadId: c.leadId, err: err instanceof Error ? err.message : String(err) });
    if (err instanceof Anthropic.RateLimitError) {
      throw new AsistentEroare('Asistentul e ocupat acum. Încercați peste un minut.', 503);
    }
    if (err instanceof Anthropic.APIError) {
      throw new AsistentEroare('Asistentul nu răspunde acum. Cererea dumneavoastră e salvată oricum.', 502);
    }
    throw err;
  }

  // Rezerva de ultimă instanță, dacă și apelul de mai sus a ieșit gol. Nu
  // pune o întrebare proprie: pe 13 nov „Mai e ceva ce ați vrea să afle
  // firma?” a apărut de trei ori deasupra unor butoane despre altceva.
  if (!raspuns) {
    raspuns = state.variante.length
      ? 'Am notat. Alegeți mai jos varianta potrivită sau scrieți-mi răspunsul.'
      : 'Am notat. Mai aveți ceva de adăugat pentru firmă?';
  }

  const acum = new Date().toISOString();
  const afisare: MesajAfisat[] = [
    ...(c.mesaje.afisare.length ? c.mesaje.afisare : [{ rol: 'asistent' as const, text: mesajIntro(c.cerere), la: acum }]),
    { rol: 'client', text: mesaj, la: acum },
    { rol: 'asistent', text: raspuns, la: acum, ...(state.variante.length ? { variante: state.variante } : {}) },
  ];
  const cost = costUsd(usage);

  await db()`
    UPDATE asistent_conversatii SET
      mesaje = ${JSON.stringify({ api, afisare })}::jsonb,
      date = ${JSON.stringify(state.date)}::jsonb,
      replici = replici + 1,
      cost_usd = cost_usd + ${cost},
      incheiata_la = CASE WHEN ${state.incheie} THEN coalesce(incheiata_la, now()) ELSE incheiata_la END,
      updated_at = now()
    WHERE lead_id = ${c.leadId}
  `;

  sincronizeazaInvertor(c, state.date);

  logReplica({
    leadId: c.leadId,
    replica: c.replici + 1,
    ms: Date.now() - started,
    model: MODEL,
    unelte,
    stop,
    usage,
    costUsd: Math.round(cost * 100000) / 100000,
  });

  return {
    raspuns,
    conv: {
      ...c,
      mesaje: { api, afisare },
      date: state.date,
      replici: c.replici + 1,
      costUsd: c.costUsd + cost,
      incheiataLa: c.incheiataLa || (state.incheie ? acum : null),
      updatedAt: acum,
    },
  };
}

/**
 * Invertorul confirmat în conversație trece în cerere (coloanele BE-BG), ca să
 * apară pe card direct, ca cel din formular (19 nov 2026, Radu). Doar la
 * retrofit și doar când s-a schimbat față de replica de dinainte. După răspuns:
 * clientul nu așteaptă după Sheets.
 */
function sincronizeazaInvertor(c: Conversatie, date: AsistentDate) {
  if (!cerereRetrofit(c.cerere.tipLucrare) || c.leadId.startsWith('test-')) return;
  // Fără notele lui Watt din paranteză („(model exact necunoscut)”): pe card intră doar modelul.
  const curat = (m?: string) => (m || '').replace(/\s*\([^)]*\)/g, '').trim();
  const tip = invertorTipDinWatt(date.invertorHibrid);
  const model = curat(date.invertor);
  if (tip === invertorTipDinWatt(c.date.invertorHibrid) && model === curat(c.date.invertor)) return;
  after(async () => {
    try {
      const scris = await setLeadInvertor(
        c.leadId,
        { tip, model },
        { tip: c.cerere.invertorTip || '', model: c.cerere.invertorModel || '' },
      );
      if (scris) revalidatePath('/cereri');
    } catch (err) {
      console.error('[asistent] invertor în cerere:', err);
      await alertError({
        area: 'asistent',
        kind: 'invertor-sheet',
        message: `Invertorul confirmat cu Watt AI nu a ajuns în cerere (${c.leadId}): ${err instanceof Error ? err.message : String(err)}`.slice(0, 200),
      });
    }
  });
}

/** Mod de probă, doar local (ASISTENT_MOCK=1): fără apel la Anthropic, ca să se vadă UI-ul. */
export async function raspundeMock(c: Conversatie, mesaj: string): Promise<{ raspuns: string; conv: Conversatie }> {
  const date = mergeDate(c.date, {
    fazare: /tri/i.test(mesaj) ? 'trifazat' : /mono/i.test(mesaj) ? 'monofazat' : undefined,
    invertor: /huawei|deye|growatt|fronius|sungrow|solis/i.test(mesaj) ? mesaj.slice(0, 80) : undefined,
    invertor_hibrid: /\bhibrid/i.test(mesaj) ? 'da' : undefined,
    orientare_acoperis: /\b(sud|est|vest|nord)\b/i.test(mesaj) ? mesaj.slice(0, 80) : undefined,
    rezumat: 'Clientul a confirmat câteva detalii în modul de probă.',
  });
  const incheie = c.replici + 1 >= 3;
  const raspuns = incheie
    ? '[Mod de probă] Mulțumesc pentru detalii! Le-am trecut în cerere și le văd firmele care o preiau, înainte să vă sune. Dacă mai aveți întrebări, vă stau la dispoziție aici.'
    : cerereRetrofit(c.cerere.tipLucrare)
      ? '[Mod de probă] Am notat. Ce invertor aveți acum, marca și modelul?'
      : '[Mod de probă] Am notat. Încotro e orientat acoperișul?';
  const acum = new Date().toISOString();
  const afisare: MesajAfisat[] = [
    ...(c.mesaje.afisare.length ? c.mesaje.afisare : [{ rol: 'asistent' as const, text: mesajIntro(c.cerere), la: acum }]),
    { rol: 'client', text: mesaj, la: acum },
    { rol: 'asistent', text: raspuns, la: acum },
  ];
  await db()`
    UPDATE asistent_conversatii SET
      mesaje = ${JSON.stringify({ api: c.mesaje.api, afisare })}::jsonb,
      date = ${JSON.stringify(date)}::jsonb,
      replici = replici + 1,
      incheiata_la = CASE WHEN ${incheie} THEN coalesce(incheiata_la, now()) ELSE incheiata_la END,
      updated_at = now()
    WHERE lead_id = ${c.leadId}
  `;
  sincronizeazaInvertor(c, date);
  return {
    raspuns,
    conv: {
      ...c,
      mesaje: { api: c.mesaje.api, afisare },
      date,
      replici: c.replici + 1,
      incheiataLa: c.incheiataLa || (incheie ? acum : null),
      updatedAt: acum,
    },
  };
}

// ---------------------------------------------------------------------------
// Rezumatele pentru firme, notele și setarea pe cont

export async function rezumatPornit(email: string): Promise<boolean> {
  const rows = await db()`SELECT rezumat_ai FROM firma_setari WHERE email = ${email}`;
  return rows[0] ? Boolean(rows[0].rezumat_ai) : true;
}

export async function setRezumatPornit(email: string, pornit: boolean): Promise<void> {
  await db()`
    INSERT INTO firma_setari (email, rezumat_ai, updated_at) VALUES (${email}, ${pornit}, now())
    ON CONFLICT (email) DO UPDATE SET rezumat_ai = EXCLUDED.rezumat_ai, updated_at = now()
  `;
}

/** Conversațiile cu ceva salvat din ultimele 90 de zile, cu nota firmei dacă a dat una. */
export async function conversatiiPentruFirma(
  email: string,
): Promise<{ leadId: string; cerere: AsistentCerere; date: AsistentDate; updatedAt: string; nota: string | null }[]> {
  const rows = await db()`
    SELECT c.lead_id, c.cerere, c.date, c.updated_at, n.nota
    FROM asistent_conversatii c
    LEFT JOIN asistent_note n ON n.lead_id = c.lead_id AND n.firma_email = ${email}
    WHERE c.date <> '{}'::jsonb AND c.updated_at > now() - interval '90 days'
  `;
  return rows.map((r) => ({
    leadId: String(r.lead_id),
    cerere: r.cerere as AsistentCerere,
    date: r.date as AsistentDate,
    updatedAt: new Date(String(r.updated_at)).toISOString(),
    nota: r.nota ? String(r.nota) : null,
  }));
}

export async function noteazaRezumat(leadId: string, email: string, nota: 'util' | 'nu_prea', motiv: string) {
  await db()`
    INSERT INTO asistent_note (lead_id, firma_email, nota, motiv) VALUES (${leadId}, ${email}, ${nota}, ${motiv})
    ON CONFLICT (lead_id, firma_email) DO UPDATE SET nota = EXCLUDED.nota, motiv = EXCLUDED.motiv, created_at = now()
  `;
}

// ---------------------------------------------------------------------------
// Vizualizările firmelor și raportul pilotului (raportul de luni + /admin/asistent)

export async function logVizualizare(leadId: string, email: string, sursa: string): Promise<void> {
  await db()`
    INSERT INTO asistent_vizualizari (lead_id, firma_email, sursa) VALUES (${leadId}, ${email}, ${sursa})
    ON CONFLICT (lead_id, firma_email) DO UPDATE SET
      vizualizari = asistent_vizualizari.vizualizari + 1,
      ultima_la = now(),
      sursa = EXCLUDED.sursa
  `;
}

/**
 * Ce au făcut firmele cu precalificarea, pe toate cererile (fără cele de
 * probă): pentru istoricul firmei din /admin/portal. Tabelul ține prima și
 * ultima deschidere plus numărul lor, nu fiecare deschidere în parte.
 */
export interface PrecalificareActivitate {
  vizualizari: {
    leadId: string;
    email: string;
    sursa: string;
    de: number;
    primaLa: string;
    ultimaLa: string;
  }[];
  note: { leadId: string; email: string; nota: string; motiv: string; la: string }[];
}

export async function precalificareActivitate(): Promise<PrecalificareActivitate> {
  const [viz, note] = await Promise.all([
    db()`SELECT * FROM asistent_vizualizari WHERE lead_id NOT LIKE 'test-%'`,
    db()`SELECT * FROM asistent_note WHERE lead_id NOT LIKE 'test-%'`,
  ]);
  return {
    vizualizari: viz.map((v) => ({
      leadId: String(v.lead_id),
      email: String(v.firma_email).trim().toLowerCase(),
      sursa: String(v.sursa || ''),
      de: Number(v.vizualizari) || 1,
      primaLa: new Date(String(v.prima_la)).toISOString(),
      ultimaLa: new Date(String(v.ultima_la)).toISOString(),
    })),
    note: note.map((n) => ({
      leadId: String(n.lead_id),
      email: String(n.firma_email).trim().toLowerCase(),
      nota: String(n.nota),
      motiv: String(n.motiv || ''),
      la: new Date(String(n.created_at)).toISOString(),
    })),
  };
}

export interface RaportConversatie {
  leadId: string;
  cerere: AsistentCerere;
  date: AsistentDate;
  afisare: MesajAfisat[];
  replici: number;
  costUsd: number;
  rescrieri: number;
  incheiata: boolean;
  notaClient: 'util' | 'nu_prea' | null;
  motivClient: string;
  createdAt: string;
  updatedAt: string;
  vizualizari: { firma: string; sursa: string; de: number; primaLa: string }[];
  note: { firma: string; nota: string; motiv: string; la: string }[];
}

export interface RaportAsistent {
  de: string;
  pana: string;
  afisate: number;
  incepute: number;
  terminate: number;
  mesajeClient: number;
  costUsd: number;
  rescrieri: number;
  completate: Record<string, number>;
  firmeCareAuVazut: number;
  rezumateVazute: number;
  noteUtil: number;
  noteNuPrea: number;
  /** Notele clienților, pe conversațiile din fereastră. */
  clientiUtil: number;
  clientiNuPrea: number;
  conversatii: RaportConversatie[];
}

const CAMPURI_RAPORT: [keyof AsistentDate, string][] = [
  ['invertor', 'invertor'],
  ['fazare', 'fazare'],
  ['consumLunarKwh', 'consum'],
  ['facturaLunaraLei', 'factura în lei'],
  ['capacitateDoritaKwh', 'capacitate'],
  ['motivCapacitate', 'motivul capacității'],
  ['deschisExtindere', 'extindere'],
  ['orientareAcoperis', 'orientarea acoperișului'],
  ['umbrire', 'umbrire'],
  ['consumCand', 'când consumă'],
  ['consumatoriMari', 'consumatori mari'],
  ['vreaBaterie', 'baterie da sau nu'],
  ['prosumator', 'prosumator'],
  ['echipamenteCumparate', 'echipamente cumpărate'],
  ['intrebariPentruFirma', 'întrebări pentru firmă'],
  ['rezumat', 'rezumat'],
];

/**
 * Conversațiile pornite în fereastră, cu tot ce au făcut firmele pe rezumatele
 * lor până acum. Totalurile de vizualizări și note numără ce s-a întâmplat în
 * fereastră, inclusiv pe rezumatele din conversații mai vechi. Cererile de
 * probă (`test-…`) nu intră.
 */
export async function raportAsistent(de: Date, pana: Date, cuTeste = false): Promise<RaportAsistent> {
  // `cuTeste` aduce și cererile de probă, doar pentru verificarea locală.
  const filtru = cuTeste ? 'zzz-nimic-%' : 'test-%';
  const [convs, viz, note] = await Promise.all([
    db()`
      SELECT * FROM asistent_conversatii
      WHERE created_at >= ${de.toISOString()} AND created_at < ${pana.toISOString()}
        AND lead_id NOT LIKE ${filtru}
      ORDER BY created_at DESC
    `,
    db()`SELECT * FROM asistent_vizualizari WHERE lead_id NOT LIKE ${filtru}`,
    db()`SELECT * FROM asistent_note WHERE lead_id NOT LIKE ${filtru}`,
  ]);

  const inWindow = (iso: unknown) => {
    const t = new Date(String(iso)).getTime();
    return t >= de.getTime() && t < pana.getTime();
  };

  const conversatii: RaportConversatie[] = convs.map((r) => {
    const c = rowToConv(r);
    const rescrieri = c.mesaje.api.filter(
      (m) => m.role === 'user' && typeof m.content === 'string' && m.content.startsWith('[Verificare automată'),
    ).length;
    return {
      leadId: c.leadId,
      cerere: c.cerere,
      date: c.date,
      afisare: c.mesaje.afisare,
      replici: c.replici,
      costUsd: c.costUsd,
      rescrieri,
      incheiata: Boolean(c.incheiataLa),
      notaClient: c.notaClient,
      motivClient: c.motivClient,
      createdAt: new Date(String(r.created_at)).toISOString(),
      updatedAt: c.updatedAt,
      vizualizari: viz
        .filter((v) => v.lead_id === c.leadId)
        .map((v) => ({
          firma: String(v.firma_email),
          sursa: String(v.sursa),
          de: Number(v.vizualizari) || 1,
          primaLa: new Date(String(v.prima_la)).toISOString(),
        })),
      note: note
        .filter((n) => n.lead_id === c.leadId)
        .map((n) => ({
          firma: String(n.firma_email),
          nota: String(n.nota),
          motiv: String(n.motiv || ''),
          la: new Date(String(n.created_at)).toISOString(),
        })),
    };
  });

  const completate: Record<string, number> = {};
  for (const [k, eticheta] of CAMPURI_RAPORT) {
    completate[eticheta] = conversatii.filter((c) => {
      const v = c.date[k];
      return Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '';
    }).length;
  }

  const vizInWindow = viz.filter((v) => inWindow(v.ultima_la));
  const noteInWindow = note.filter((n) => inWindow(n.created_at));

  return {
    de: de.toISOString(),
    pana: pana.toISOString(),
    afisate: conversatii.length,
    incepute: conversatii.filter((c) => c.replici > 0).length,
    terminate: conversatii.filter((c) => c.incheiata).length,
    mesajeClient: conversatii.reduce((s, c) => s + c.replici, 0),
    costUsd: conversatii.reduce((s, c) => s + c.costUsd, 0),
    rescrieri: conversatii.reduce((s, c) => s + c.rescrieri, 0),
    completate,
    firmeCareAuVazut: new Set(vizInWindow.map((v) => v.firma_email)).size,
    rezumateVazute: new Set(vizInWindow.map((v) => v.lead_id)).size,
    noteUtil: noteInWindow.filter((n) => n.nota === 'util').length,
    noteNuPrea: noteInWindow.filter((n) => n.nota === 'nu_prea').length,
    clientiUtil: conversatii.filter((c) => c.notaClient === 'util').length,
    clientiNuPrea: conversatii.filter((c) => c.notaClient === 'nu_prea').length,
    conversatii,
  };
}
