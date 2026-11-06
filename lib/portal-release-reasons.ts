/**
 * Motivele de renunțare din portal, la un click. Firma alege unul și poate
 * adăuga detalii, opțional; doar „Alt motiv" cere text. Primele două țin de
 * client și spun că cererea se poate închide (vezi LEAD_CLOSED_STATUSES):
 * „a ales altă firmă" = `altundeva` sau `castigata`, „nu mai face" = `renuntat`.
 * Restul țin de firmă și cererea rămâne deschisă pentru altele.
 *
 * Fără importuri: îl folosesc și cardul din portal ('use client') și ruta.
 */
export const RELEASE_REASONS = [
  { id: 'ales_alta', label: 'Clientul a ales altă firmă' },
  { id: 'renunta', label: 'Clientul nu mai face investiția' },
  { id: 'nu_raspunde', label: 'Clientul nu răspunde' },
  { id: 'buget', label: 'Bugetul nu se potrivește' },
  { id: 'tehnic', label: 'Nu se poate tehnic' },
  { id: 'zona', label: 'E prea departe de noi' },
  { id: 'altul', label: 'Alt motiv' },
] as const;

export type ReleaseReasonId = (typeof RELEASE_REASONS)[number]['id'];

/** Sub atât, textul de la „Alt motiv" nu spune nimic. */
export const MIN_OTHER_REASON_LENGTH = 10;

/**
 * Motivul ca text, cum ajunge în Sheets și în emailul de renunțare:
 * eticheta, apoi detaliile firmei, dacă a scris. Null dacă nu e valid.
 */
export function composeReleaseReason(id: string, details: string): string | null {
  const reason = RELEASE_REASONS.find((r) => r.id === id);
  const text = details.trim();
  if (!reason) return null;
  if (reason.id === 'altul') return text.length >= MIN_OTHER_REASON_LENGTH ? text : null;
  return text ? `${reason.label}: ${text}` : reason.label;
}
