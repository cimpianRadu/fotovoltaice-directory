/**
 * Text de CTA scris pe subiectul ghidului, pentru ghidurile care chiar aduc
 * oameni. Restul primesc textul generic din InstallerCta.
 *
 * De ce doar câteva: din 4.080 de vizite în 30 de zile (18 iul - 17 aug 2026),
 * ghidurile au adus peste jumătate din intrări, iar primele trei singure au
 * adus 1.385, adică 34%. Un text scris pe subiect are sens acolo unde există
 * volum; pe restul, generic e suficient și rămâne ușor de întreținut.
 *
 * Stă aici, nu în guides.json, pentru că e text de interfață, nu conținut de
 * articol, iar fișierul de ghiduri n-are nevoie de încă un câmp pe 50 de intrări.
 */
export interface GuideCta {
  title: string;
  description: string;
  ctaLabel: string;
}

export const GUIDE_CTA: Record<string, GuideCta> = {
  // 605 intrări în 30 de zile, cel mai vizitat ghid. Cine îl citește are deja
  // panouri și vrea stocare, deci întrebarea corectă nu e „vreți un sistem".
  'casa-verde-baterii-2026-program-stocare-afm': {
    title: 'Vreți o baterie pe sistemul pe care îl aveți deja?',
    description:
      'Spuneți-ne ce sistem aveți montat și primiți oferte de la firmele care fac montaje cu stocare în județul dumneavoastră. Puteți avea prețurile pregătite înainte să se deschidă înscrierile.',
    ctaLabel: 'Cere ofertă pentru baterie',
  },

  // 474 intrări. Oameni care se lămuresc cum îi afectează compensarea lunară.
  'legea-160-2026-prosumatori-compensare-lunara-gaz-surplus': {
    title: 'Vă gândiți la panouri sau la o baterie?',
    description:
      'Compensarea lunară schimbă cât de repede se amortizează sistemul, iar dimensionarea corectă contează acum mai mult decât înainte. Primiți oferte de la instalatori cu atestat ANRE din județul dumneavoastră.',
    ctaLabel: 'Cere ofertă gratuit',
  },

  // 306 intrări, public de firme: alt vocabular, alt tip de instalator.
  'legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre': {
    title: 'Aveți un consum de acoperit la firmă?',
    description:
      'Regulile de dezechilibru se aplică diferit pentru firme, iar dimensionarea sistemului decide cât plătiți lunar. Primiți oferte de la instalatori cu atestat ANRE C2A care lucrează pe proiecte comerciale.',
    ctaLabel: 'Cere ofertă pentru firmă',
  },
};
