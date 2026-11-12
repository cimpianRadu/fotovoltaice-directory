/**
 * Regulile după care un comentariu spune că o cerere se poate închide (12 nov
 * 2026, cerut de Radu: „candidații de închidere și motivul identificat”).
 * Fără importuri: le folosesc și pagina din /admin/inchideri și scripturile.
 *
 * Regula de fond e cea din septembrie–octombrie: se închide doar ce spune că
 * omul A ALES deja sau a renunțat („a montat cu altcineva”, „nu mai e
 * interesat”). Ce ține de firmă sau de intenție rămâne deschis: „nu răspunde”,
 * „scump”, „prea departe”, „are alte oferte”, „se gândește”. Aici doar se
 * propune; închiderea o face Radu, din pagină.
 */

export type ClosingOutcome = 'altundeva' | 'renuntat' | 'castigata';

export interface TextVerdict {
  outcome: ClosingOutcome;
  /** Bucata de text care a declanșat potrivirea, ca s-o vezi pe card. */
  match: string;
  /** Ce din același text spune că poate nu e închisă (amânare, contraofertă). */
  doubts: string[];
}

/** Fără diacritice, litere mici, spații simple: firmele scriu în ambele feluri. */
export function normalizeRo(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ş/g, 's')
    .replace(/ţ/g, 't')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// A ales deja pe altcineva sau are deja sistemul. Verbul la trecut e cheia:
// „vrea să instaleze cu o firmă vecină” e intenție și nu intră.
const CHOSE: RegExp[] = [
  /clientul a ales alta firma/,
  /\ba (ales|semnat|montat|instalat|facut|lucrat|mers|colaborat)( deja)? (cu|la|prin) (alt|alta|altcineva|alcineva|altii|alte|concurent|o alta|un alt|firma)/,
  /\ba ales (alta|o alta|un alt|alt) (firma|oferta|instalator|companie)/,
  /\b(a|si-a|si a) (montat|instalat|pus) (deja|panourile|sistemul|singur)/,
  /\b(are|avea) deja (sistem|panouri|instalat|montat|fotovoltaic|o firma|contract)/,
  /\bdeja (montat|instalat|semnat|rezolvat)/,
  /\bs-a (rezolvat|hotarat cu|decis pentru) (cu |pe )?(alt|alta|altcineva)/,
  /\bs-a rezolvat\b/,
  /\ba gasit (deja )?(o |alta |un )?(firma|instalator|oferta)/,
];

// Nu mai face investiția. Doar la persoana a treia: „doresc să renunț” sau
// „nu mă interesează lucrarea” sunt ale firmei, nu ale clientului.
const GAVE_UP: RegExp[] = [
  /clientul nu mai face investitia/,
  /\bnu mai (doreste|face|este interesat|e interesat|intentioneaza|investeste|monteaza)/,
  /\bnu mai vrea(?!\s*(sa\s+)?\d)/,
  /\bnu (doreste|este interesat|e interesat)\b(?! de oferta noastra)/,
  /\b(a|au) renuntat\b/,
  /\brenunta la (investitie|proiect|lucrare|sistem)/,
  /\bnu mai are nevoie/,
];

// Spun doar că firma a pierdut, nu și că omul a ales: apar, dar mereu „de verificat”.
const WEAK_CHOSE: RegExp[] = [/\bnu a ales oferta (noastra|nostra|mea)/, /\boferta mai buna\b/];

// Același text, dar cu semn că omul încă se gândește sau că firma încă încearcă.
const DOUBTS: { re: RegExp; label: string }[] = [
  { re: /\b(refac|refacem|reofert|alta oferta mai|o noua oferta)/, label: 'firma încă reofertează' },
  { re: /\b(analizeaza|se gandeste|nu e decis|nu este decis|nu e hotarat|nu este hotarat|in studiu)/, label: 'încă se gândește' },
  { re: /\b(amana|amanat|la anu|anul viitor|la primavara|mai tarziu|revine|ne auzim|ma va suna|suna inapoi|asteapta)/, label: 'amânare, nu renunțare' },
  { re: /\b(scump|pret|buget|fonduri|bani)/, label: 'ține de preț sau buget' },
  { re: /\b(alte oferte|mai multe oferte|compara)/, label: 'compară oferte, n-a ales' },
  { re: /\b(departe|zona|vecin)/, label: 'ține de distanța firmei' },
];

function firstMatch(text: string, list: RegExp[]): string | null {
  for (const re of list) {
    const m = text.match(re);
    if (m) return m[0];
  }
  return null;
}

/** Null când textul nu spune nimic despre închidere. */
export function classifyClosingText(raw: string): TextVerdict | null {
  const text = normalizeRo(raw);
  if (!text) return null;
  const chose = firstMatch(text, CHOSE);
  const gaveUp = chose ? null : firstMatch(text, GAVE_UP);
  const weak = chose || gaveUp ? null : firstMatch(text, WEAK_CHOSE);
  const match = chose || gaveUp || weak;
  if (!match) return null;
  const doubts = DOUBTS.filter((d) => d.re.test(text)).map((d) => d.label);
  if (weak) doubts.unshift('spune că firma a pierdut, nu și că omul a ales');
  return { outcome: gaveUp ? 'renuntat' : 'altundeva', match, doubts };
}

export const OUTCOME_LABELS: Record<ClosingOutcome, string> = {
  altundeva: 'A ales altundeva',
  renuntat: 'Nu mai face investiția',
  castigata: 'Câștigată (a semnat prin noi)',
};

/**
 * Prefixul notei din CRM scrise la „Lasă deschisă”. Semnalele de dinainte de
 * nota asta nu mai apar; unul nou, de după, aduce cererea înapoi în listă.
 */
export const KEEP_OPEN_PREFIX = 'Rămâne deschisă după verificare';
