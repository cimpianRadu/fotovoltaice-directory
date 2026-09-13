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
  'finantare',
  'finantare-firme',
  'pret',
  'cere-oferta-confirmare',
  'cereri',
  'portal',
  'listeaza-firma',
  'popup',
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
  finantare: '/finantare (panouri în rate)',
  'finantare-firme': '/finantare/firme (proiecte comerciale)',
  pret: '/pret-panouri-fotovoltaice',
  'cere-oferta-confirmare': '/cere-oferta (după trimitere) · doar Premium',
  cereri: '/cereri (instalatori) · doar Premium',
  portal: '/portal (instalatori logați) · doar Premium',
  'listeaza-firma': '/listeaza-firma (instalatori)',
  popup: 'Popup dreapta-jos (toate paginile)',
};

export type SponsorAudience = 'client' | 'instalator';

/**
 * Cui i se adresează fiecare plasare. Trăiește aici, lângă lista de plasări,
 * pentru că o citesc două locuri: `SponsorBanner` (ce mesaj afișează) și
 * raportul lunar per partener (defalcarea pe audiență se deduce din plasare —
 * evenimentele nu poartă o proprietate compusă `slug|audiență`).
 */
export const POSITION_AUDIENCE: Record<SponsorPosition, SponsorAudience> = {
  homepage: 'client',
  'ghid-index': 'client',
  'ghid-topic': 'client',
  clasament: 'client',
  'clasament-featured': 'client',
  calculator: 'client',
  firme: 'client',
  'cere-oferta': 'client',
  'cere-oferta-confirmare': 'client',
  finantare: 'client',
  'finantare-firme': 'client',
  pret: 'client',
  cereri: 'instalator',
  portal: 'instalator',
  'listeaza-firma': 'instalator',
  // Popup-ul dreapta-jos nu se randează prin SponsorBanner (are componenta
  // lui, PartnerCarousel) — intrarea există doar ca Record-ul să fie complet.
  popup: 'client',
};
