/**
 * Text de CTA scris pe subiectul ghidului, pentru ghidurile care chiar aduc
 * oameni. Restul primesc textul generic din InstallerCta.
 *
 * De ce doar câteva: din 4.080 de vizite în 30 de zile (18 iul - 17 aug 2026),
 * ghidurile au adus peste jumătate din intrări, iar primele trei singure au
 * adus 1.385, adică 34%. Un text scris pe subiect are sens acolo unde există
 * volum; pe restul, generic e suficient și rămâne ușor de întreținut.
 *
 * Extins pe 24 aug: în săptămâna 17-24 aug ghidurile au ținut din nou peste
 * jumătate din trafic, dar din tot clusterul ghid/* au pornit 5 formulare și au
 * ieșit 2 cereri (Umami, sursa `?sursa=`). Pragul de aici e ~25 de intrări pe
 * săptămână; sub el, textul generic rămâne.
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

  // 104 intrări pe săptămâna 17-24 aug, al treilea ghid ca trafic. Cititorul
  // tocmai a văzut cât primește pe energia dată în rețea; întrebarea următoare
  // e dacă nu iese mai bine păstrată în baterie.
  'pret-kw-prosumator-2026-per-furnizor-eon-hidro-ppc-electrica-premier': {
    title: 'Vă iese mai bine să păstrați surplusul?',
    description:
      'Ați văzut cât plătește furnizorul. O baterie schimbă calculul: energia rămâne la dumneavoastră pentru seară, în loc să plece în rețea. Firmele care montează stocare vă pot spune, pe cifrele dumneavoastră, dacă merită.',
    ctaLabel: 'Cere ofertă pentru baterie',
  },

  // 66 de intrări pe săptămână și cea mai clară intenție dintre toate: omul
  // caută deja o firmă cu care să depună la Casa Verde.
  'lista-firme-autorizate-afm-casa-verde-fotovoltaice-2026': {
    title: 'Căutați o firmă pentru dosarul Casa Verde?',
    description:
      'În loc să sunați firmele din listă una câte una, spuneți o singură dată ce aveți nevoie: cererea ajunge la instalatori din județul dumneavoastră, iar dumneavoastră doar comparați ofertele primite.',
    ctaLabel: 'Cere oferte gratuit',
  },

  // 34 de intrări pe săptămână, public de firme care caută finanțare.
  'fonduri-nerambursabile-panouri-fotovoltaice-imm-2026': {
    title: 'Pregătiți un proiect cu finanțare pentru firmă?',
    description:
      'Orice dosar pornește de la o ofertă dimensionată pe consumul firmei. Primiți oferte de la instalatori care lucrează pe proiecte comerciale, gratuit, și le puteți folosi la fundamentarea cererii de finanțare.',
    ctaLabel: 'Cere ofertă pentru firmă',
  },

  // 27 de intrări pe săptămână, oameni care verifică ce program e deschis.
  // Riscul paginii: cititorul pleacă să aștepte programul. CTA-ul îi dă ce
  // poate face azi.
  'subventii-panouri-fotovoltaice': {
    title: 'Așteptați un program ca să montați?',
    description:
      'Oferta o puteți cere de pe acum, gratuit și fără obligații: aflați cât costă sistemul dumneavoastră și ce ar acoperi subvenția, ca la deschiderea înscrierilor să aveți deja cifrele pregătite.',
    ctaLabel: 'Cere oferte gratuit',
  },

  // 25 de intrări pe săptămână; clusterul „firme autorizate" e oportunitatea
  // #1 din GSC. Cine citește vrea siguranța atestatului, nu o listă de sunat.
  'instalatori-autorizati-anre-panouri-fotovoltaice-2026': {
    title: 'Căutați un instalator atestat în județul dumneavoastră?',
    description:
      'Spuneți-ne ce proiect aveți și primiți oferte de la firme din județul dumneavoastră. Atestatele ANRE de pe paginile firmelor sunt preluate direct din registrul oficial, nu declarate de ele.',
    ctaLabel: 'Cere oferte gratuit',
  },

  // 24 de intrări pe săptămână, același public ca ghidul de preț per kW:
  // prosumatori care își citesc factura. Primește același unghi, stocarea.
  'compensare-prosumator-2026-ppc-eon-electrica-hidroelectrica-premier': {
    title: 'Compensarea nu vă acoperă factura?',
    description:
      'Dacă după compensare tot rămâne de plată, partea aceea se poate reduce cu stocare: surplusul de peste zi acoperă consumul de seară. Spuneți-ne ce sistem aveți și primiți oferte de la firme din județul dumneavoastră.',
    ctaLabel: 'Cere ofertă pentru baterie',
  },
};
