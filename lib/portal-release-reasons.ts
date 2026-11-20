/**
 * Motivele de renunțare din portal, la un click. Firma poate alege unul și
 * poate adăuga detalii, ambele opționale (20 nov 2026). Primele două țin de
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

/** Ce scriem în Sheets când firma confirmă fără să aleagă un motiv. */
export const NO_RELEASE_REASON = 'Fără motiv';

export interface ClosedLeadNotice {
  /** Ce s-a întâmplat, spus explicit, pe rândul din portal. */
  text: string;
  /**
   * Clientul a spus-o el (a ales altă firmă, a semnat cu alta, nu mai face
   * lucrarea): revendicarea se scoate singură din lucru, firma doar află.
   * `false` la „inactiva”: n-a răspuns nouă, dar poate răspunde firmei.
   */
  final: boolean;
  /** Motivul de renunțare care se potrivește cu închiderea. */
  motivId: ReleaseReasonId;
}

/**
 * Cererea s-a închis (de client sau de noi) cât firma o mai avea în lucru.
 * Null pe cererile deschise și pe firma care a semnat chiar ea.
 */
export function closedLeadNotice(crmStatus: string, firmStatus: string): ClosedLeadNotice | null {
  switch (crmStatus) {
    case 'castigata':
      return firmStatus === 'castigat'
        ? null
        : { text: 'Clientul a semnat cu altă firmă de pe platformă.', motivId: 'ales_alta', final: true };
    case 'altundeva':
      return { text: 'Clientul a ales altă firmă.', motivId: 'ales_alta', final: true };
    case 'renuntat':
      return { text: 'Clientul nu mai face lucrarea.', motivId: 'renunta', final: true };
    case 'inactiva':
      return { text: 'Clientul nu a mai răspuns la emailurile noastre.', motivId: 'nu_raspunde', final: false };
    default:
      return null;
  }
}

/**
 * Motivul ca text, cum ajunge în Sheets și în rezumatul de seară: eticheta,
 * apoi detaliile firmei, dacă a scris. Totul e opțional (20 nov 2026): firma
 * care nu alege nimic eliberează locul la fel, cu „Fără motiv”.
 */
export function composeReleaseReason(id: string, details: string): string {
  const reason = RELEASE_REASONS.find((r) => r.id === id);
  const text = details.trim();
  if (!reason) return text || NO_RELEASE_REASON;
  if (reason.id === 'altul') return text || reason.label;
  return text ? `${reason.label}: ${text}` : reason.label;
}
