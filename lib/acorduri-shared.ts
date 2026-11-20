// Acordurile firmelor cu platforma (20 nov 2026), partea fără server: textele
// bifelor, versiunile și grila, pentru modal, formularul de revendicare,
// portal și termeni.
//
// Până acum firma confirma grila pe email („de acord”), iar nimic din aplicație
// nu verifica asta: o firmă care n-a răspuns putea revendica și contracta fără
// acord. De acum fiecare adresă bifează o dată pe versiune, iar bifa se salvează
// în Neon (`lib/acorduri.ts`).
//
// Regula versiunilor: o schimbare de fond (prețul, termenul de plată, ce
// primește firma din Watt AI, regulile cererilor) primește versiune nouă, cu
// `schimbari` scrise pentru firmă. Atunci toate firmele văd din nou modalul.
// O greșeală de tipar sau o frază reformulată fără efect NU schimbă versiunea.
// Versiunile vechi nu se șterg din istoria git: repo-ul e dovada textului
// acceptat la fiecare versiune, lângă `text_acceptat` din bază.

export type AcordId = 'termeni' | 'comision';

export interface Acord {
  id: AcordId;
  /** Data versiunii, YYYY-MM-DD. Cheia din bază. */
  versiune: string;
  /** Data pentru ochi, „20 noiembrie 2026”. */
  dataVersiunii: string;
  titlu: string;
  href: string;
  /** Textul bifei, exact cum îl vede și îl acceptă firma. Se salvează pe rând. */
  bifa: string;
  /** Ce s-a schimbat față de versiunea dinainte, pentru modal. */
  schimbari: string;
}

/** Plata facturii de comision, în zile de la emitere. */
export const COMISION_TERMEN_PLATA_ZILE = 30;

/** Grila, o singură sursă pentru termeni, /pentru-instalatori, modal și portal. */
export const GRILA_COMISION = [
  { putere: 'sub 10 kW sau doar baterie', comision: '500 lei + TVA', cuTva: '605 lei cu TVA 21%' },
  { putere: '10 – 100 kW', comision: '1.000 lei + TVA', cuTva: '1.210 lei cu TVA 21%' },
  {
    putere: 'peste 100 kW',
    comision: '1–2% + TVA',
    cuTva: 'din valoarea contractului fără TVA; procentul îl stabilim în scris pe proiect',
  },
] as const;

export const ACORDURI: readonly Acord[] = [
  {
    id: 'termeni',
    versiune: '2026-11-20',
    dataVersiunii: '20 noiembrie 2026',
    titlu: 'Termenii și condițiile',
    href: '/termeni-conditii',
    bifa: 'Am citit și accept Termenii și condițiile platformei, inclusiv regulile cererilor și folosirea Watt AI.',
    schimbari:
      'Prima versiune pe care o accepți din cont. Am adăugat în termeni regulile cererilor (cel mult 3 firme pe o cerere, cel mult 5 cereri nesunate odată) și Watt AI pentru firme.',
  },
  {
    id: 'comision',
    versiune: '2026-11-20',
    dataVersiunii: '20 noiembrie 2026',
    titlu: 'Grila de comision',
    href: '/termeni-conditii#comision',
    bifa: `Accept grila de comision de mai sus pentru lucrările pe care le contractez cu clienți primiți prin platformă. Comisionul apare doar la contractul semnat, iar factura se plătește în ${COMISION_TERMEN_PLATA_ZILE} de zile.`,
    schimbari:
      'Aceeași grilă din documentul de colaborare trimis firmelor pe email, acum bifată din cont, o singură dată. Termenul de plată a facturii e de 30 de zile.',
  },
];

/**
 * Bifa din formularul de revendicare fără cont (/cereri): ambele acorduri într-o
 * singură căsuță, ca formularul să rămână scurt. Pe rândurile cu sursa
 * „revendicare” se salvează textul ăsta, nu `bifa` fiecărui acord.
 */
export const BIFA_FORMULAR_REVENDICARE = `Accept termenii platformei și grila de comision: 500 lei + TVA sub 10 kW sau doar baterie, 1.000 lei + TVA între 10 și 100 kW, 1–2% + TVA peste 100 kW. Comisionul apare doar la contractul semnat cu clientul, iar factura se plătește în ${COMISION_TERMEN_PLATA_ZILE} de zile.`;

/**
 * Textul care se salvează în bază la o bifă din modal. Bifa grilei spune „de mai
 * sus”, pentru că tabelul e chiar deasupra ei; ca rândul să fie dovadă și singur,
 * se salvează împreună cu grila.
 */
export function textDeSalvat(acord: Acord): string {
  if (acord.id !== 'comision') return acord.bifa;
  const grila = GRILA_COMISION.map((r) => `${r.putere}: ${r.comision}`).join('; ');
  return `${acord.bifa} Grila: ${grila}.`;
}

/** Promovarea nu se bifează ca să folosești portalul: se acceptă când comanzi un pachet. */
export const DOCUMENT_PROMOVARE = {
  titlu: 'Condițiile de promovare',
  href: '/publicitate',
  nota: 'Doar dacă alegi un pachet plătit (Premium, Slot Popup, studiu de caz). Nu trebuie acceptate ca să folosești portalul.',
} as const;

export function acordDupaId(id: AcordId): Acord {
  return ACORDURI.find((a) => a.id === id)!;
}

/** Paginile pe care modalul nu apare: acolo firma citește chiar documentele. */
export const PAGINI_FARA_MODAL = ['/termeni-conditii', '/publicitate', '/politica-confidentialitate'];

export interface AcordStare {
  id: AcordId;
  titlu: string;
  href: string;
  versiune: string;
  dataVersiunii: string;
  /** Cine din firmă a acceptat versiunea curentă și când (ISO). */
  acceptari: { email: string; la: string; sursa: string }[];
}
