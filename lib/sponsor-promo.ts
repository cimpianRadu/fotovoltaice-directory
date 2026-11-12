/**
 * Blocul de promoție al unui partener: ce face din cardul lui un slide întreg
 * în caruselul de parteneri. Opțional; un partener fără `promo` rămâne cardul
 * mic de până acum.
 *
 * Textul e oferta partenerului, nu a noastră: prețurile, pachetele și
 * condițiile se copiază din materialele lui (site, PDF) și se pun doar ce poate
 * dovedi. Afirmațiile pe care nu le putem verifica („peste 100 de clienți",
 * „electricieni atestați ANRE" fără atestat în registru) nu intră aici, chiar
 * dacă le are pe site: slotul e pe domeniul nostru și se citește ca garantat
 * de noi.
 *
 * Pozele și PDF-ul stau în `public/promo/<slug>/`. Pozele JPEG, nu PNG (vezi
 * regula de la imaginile hero); fișierul trebuie să existe, altfel next/image
 * dă 400.
 */
export interface SponsorPromoOffer {
  title: string;
  /** Un rând: puterea, echipamentul principal. */
  detail?: string;
  /** Exact cum îl scrie partenerul, cu „de la" dacă așa e la el. */
  price?: string;
}

export interface SponsorPromoImage {
  src: string;
  alt: string;
  /**
   * `cover` (implicit) umple locul pozei, bun pentru o fotografie. `contain` arată
   * toată imaginea, pentru o copertă de catalog sau un flyer, unde un decupaj ar
   * tăia textul.
   */
  fit?: 'cover' | 'contain';
}

export interface SponsorPromo {
  headline: string;
  offers?: SponsorPromoOffer[];
  /** Condițiile comune ofertelor (TVA, avans, ce include). */
  note?: string;
  images?: SponsorPromoImage[];
  pdf?: { href: string; label: string };
  /**
   * Ultima zi a promoției, `AAAA-LL-ZZ`. După ea slide-ul revine la cardul
   * simplu: o promoție expirată lăsată pe site e o ofertă falsă pe domeniul
   * nostru. Lipsă = ofertă permanentă (pachetele de bază ale firmei).
   */
  validUntil?: string;
}

/** Ziua din `validUntil` contează întreagă, până la miezul nopții, ora vizitatorului. */
export function isPromoRunning(promo: SponsorPromo, now: Date): boolean {
  if (!promo.validUntil) return true;
  const [y, m, d] = promo.validUntil.split('-').map(Number);
  return now < new Date(y, m - 1, d + 1);
}

export function formatPromoDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' });
}
