/**
 * Lista canonică de plasări pentru sloturile de parteneri, împărțită de
 * bannerul public, de panoul de control din /admin/sponsori și de validarea
 * din API. O plasare nouă se adaugă aici, apoi TypeScript cere restul:
 * audiența în `SponsorBanner` (POSITION_AUDIENCE) și eticheta de mai jos.
 */
export const SPONSOR_POSITIONS = [
  'homepage',
  'ghid-index',
  'ghid-topic',
  'calculator',
  'clasament',
  'clasament-featured',
  'firme',
  'cere-oferta',
  'cere-oferta-confirmare',
  'cereri',
  'portal',
  'listeaza-firma',
] as const;

export type SponsorPosition = (typeof SPONSOR_POSITIONS)[number];

/** Etichete pentru admin (analytics + control). Notele spun și ce e Premium. */
export const SPONSOR_POSITION_LABELS: Record<SponsorPosition, string> = {
  homepage: 'Homepage',
  'ghid-index': '/ghid (index)',
  'ghid-topic': '/ghid/[topic]',
  calculator: '/calculator',
  clasament: '/clasament',
  'clasament-featured': '/clasament (featured)',
  firme: '/firme',
  'cere-oferta': '/cere-oferta (formular)',
  'cere-oferta-confirmare': '/cere-oferta (după trimitere) · doar Premium',
  cereri: '/cereri (instalatori) · doar Premium',
  portal: '/portal (instalatori logați) · doar Premium',
  'listeaza-firma': '/listeaza-firma (instalatori)',
};
