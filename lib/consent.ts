/**
 * Cine are voie să primească o cerere, în funcție de consimțământul pe care
 * l-a dat efectiv omul care a completat formularul.
 *
 * Există pentru că regula asta era ținută minte, nu scrisă: consimțământul s-a
 * lărgit în timp (v2 → v3 → v4), iar textul acceptat diferă de la o cerere la
 * alta. Un export făcut manual către un partener de finanțare ar fi amestecat
 * cereri strânse sub texte diferite, ceea ce e exact felul în care se încalcă
 * un consimțământ fără ca nimeni să vrea. Versiunea se scrie per cerere în
 * coloana R din tabul Leads (vezi CONSENT_VERSION din app/api/leads/route.ts).
 *
 * Consimțământul NU se extinde retroactiv: o cerere strânsă sub v3 rămâne
 * guvernată de textul v3, chiar dacă azi formularul spune altceva.
 */

/** Rute de finanțare acceptate ca „program de sprijin". Acoperite din v3. */
const PROGRAM_ROUTES = ['casa-verde', 'afm-baterii', 'electric-up', 'alt-program'];

/**
 * Rute acoperite abia din v4: creditul bancar și nehotărâtul. Textul v3 spunea
 * „finanțare printr-un program", ceea ce nu acoperă onest un credit obișnuit.
 */
const V4_ONLY_ROUTES = ['credit', 'nu-stiu'];

/** Nu se transmite niciodată unui finanțator, în nicio versiune. */
const NEVER_SHARED = ['fonduri-proprii'];

function consentVersion(consentCell: string): number {
  const m = consentCell.match(/v(\d+)/i);
  return m ? Number(m[1]) : 0;
}

/**
 * Poate cererea să fie transmisă unui partener de finanțare?
 *
 * @param consentCell coloana R, de forma „da (v4-2026-08-17)"
 * @param finantareCell coloana Y, ruta de finanțare declarată
 */
export function canShareWithFinancingPartner(
  consentCell: string,
  finantareCell: string,
): boolean {
  const route = (finantareCell || '').trim().toLowerCase();

  // Fără rută declarată nu există temei: câmpul e opțional în formular, iar
  // tăcerea nu e consimțământ.
  if (!route) return false;
  if (NEVER_SHARED.includes(route)) return false;

  const version = consentVersion(consentCell || '');
  if (version < 3) return false;

  if (PROGRAM_ROUTES.includes(route)) return true;
  if (V4_ONLY_ROUTES.includes(route)) return version >= 4;

  // Rută necunoscută (valoare nouă în formular, typo în Sheet): nu presupunem.
  return false;
}

/** Motivul, pentru rapoarte și pentru depanare când cineva întreabă „de ce nu apare". */
export function financingShareReason(consentCell: string, finantareCell: string): string {
  const route = (finantareCell || '').trim().toLowerCase();
  if (!route) return 'fără rută de finanțare declarată';
  if (NEVER_SHARED.includes(route)) return 'fonduri proprii';
  const version = consentVersion(consentCell || '');
  if (version < 3) return `consimțământ v${version || '?'}, anterior clauzei de finanțare`;
  if (V4_ONLY_ROUTES.includes(route) && version < 4) return `„${route}" acoperit abia din v4`;
  if (!PROGRAM_ROUTES.includes(route) && !V4_ONLY_ROUTES.includes(route)) {
    return `rută necunoscută: „${route}"`;
  }
  return 'permis';
}
