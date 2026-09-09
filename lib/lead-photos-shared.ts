// Regulile pozelor, partea fără secrete: limite, tipuri acceptate și forma
// căilor din Blob. Stă separat de `lead-photos.ts` fiindcă bucata asta e
// importată și de formular, iar cealaltă are `node:crypto` și SDK-ul de
// server. Aceleași valori de ambele părți, o singură sursă.

/** Câte poze acceptăm pe o cerere. Peste atât nu mai ajută pe nimeni. */
export const LEAD_PHOTO_MAX = 8;

/**
 * 12 MB per fișier. O poză de telefon nescalată trece de 5 MB, iar clientul nu
 * are cum să știe ce înseamnă „comprimă înainte" — mai bine plătim un fișier
 * mare decât să pierdem pozele.
 */
export const LEAD_PHOTO_MAX_BYTES = 12 * 1024 * 1024;

/**
 * Ce acceptăm. `image/heic` și `image/heif` sunt formatul implicit al
 * iPhone-ului: fără ele, jumătate din clienți ar primi „tip nepermis" pentru
 * poze perfect valide.
 */
export const LEAD_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

/**
 * Folderul cererii în Blob. Timestampul ISO conține `:` și `.`, care în cale ar
 * fi legale dar greu de citit în dashboard, așa că sunt înlocuite. Derivarea
 * merge într-un singur sens: nu reconstruim niciodată leadId din cale, îl avem
 * mereu din sesiune sau din token.
 */
export function leadPhotoPrefix(leadId: string): string {
  return `cereri/${leadId.replace(/[:.]/g, '-')}/`;
}

/** Calea aparține chiar cererii ăsteia? Gardul de la servirea pozelor. */
export function isLeadPhotoPath(pathname: string, leadId: string): boolean {
  return pathname.startsWith(leadPhotoPrefix(leadId));
}

/**
 * Numele fișierului, curățat: păstrăm doar ce se poate citi, ca în dashboard să
 * se vadă „acoperis.jpg", nu un id. Extensia rămâne, restul se rescrie.
 */
export function safePhotoName(name: string): string {
  const clean = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-60);
  return clean || 'poza.jpg';
}
