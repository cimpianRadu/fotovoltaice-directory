// Regulile ofertelor urcate de firme din portal, partea fără secrete: limite,
// tipuri și forma căilor din Blob. Importată și de formularul din portal, ca
// browserul și serverul să aibă aceleași valori (ca la lead-photos-shared).

/** Câte fișiere are o ofertă. De obicei unul; uneori oferta plus fișa tehnică. */
export const OFFER_MAX_FILES = 5;

/** 15 MB pe fișier: un PDF de ofertă cu poze din simulare trece ușor de 5 MB. */
export const OFFER_MAX_BYTES = 15 * 1024 * 1024;

/** PDF-ul e regula; pozele acoperă oferta fotografiată sau trimisă pe WhatsApp. */
export const OFFER_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/** Folderul ofertelor unei cereri în Blob. Ca la poze: leadId nu se reconstruiește din cale. */
export function offerPrefix(leadId: string): string {
  return `oferte/${leadId.replace(/[:.]/g, '-')}/`;
}

export function isOfferPath(pathname: string, leadId: string): boolean {
  return pathname.startsWith(offerPrefix(leadId)) && !pathname.includes('..');
}

export function safeOfferName(name: string): string {
  const clean = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-80);
  return clean || 'oferta.pdf';
}

export interface OfferFile {
  pathname: string;
  name: string;
  size: number;
  contentType: string;
}

export function fileSizeLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
