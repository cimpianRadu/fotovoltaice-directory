// Județele vecine, pentru retrimiterea cererilor către firmele din proximitate
// (decizia lui Radu, 23 oct 2026: „le trimitem dacă are sediul sau e în
// proximitate”). Sursa: Wikidata, proprietatea P47 („shares border with”) pe
// județele României, interogată pe 23 oct 2026; lista e simetrică (102 granițe).
// Numele sunt cele din data/counties.json.

export const JUDETE_VECINE: Record<string, readonly string[]> = {
  "Alba": ["Arad", "Bihor", "Cluj", "Hunedoara", "Mureș", "Sibiu", "Vâlcea"],
  "Arad": ["Alba", "Bihor", "Hunedoara", "Timiș"],
  "Argeș": ["Brașov", "Dâmbovița", "Olt", "Sibiu", "Teleorman", "Vâlcea"],
  "Bacău": ["Covasna", "Harghita", "Neamț", "Vaslui", "Vrancea"],
  "Bihor": ["Alba", "Arad", "Cluj", "Satu Mare", "Sălaj"],
  "Bistrița-Năsăud": ["Cluj", "Maramureș", "Mureș", "Suceava"],
  "Botoșani": ["Iași", "Suceava"],
  "Brașov": ["Argeș", "Buzău", "Covasna", "Dâmbovița", "Harghita", "Mureș", "Prahova", "Sibiu"],
  "Brăila": ["Buzău", "Constanța", "Galați", "Ialomița", "Tulcea", "Vrancea"],
  "București": ["Ilfov"],
  "Buzău": ["Brașov", "Brăila", "Covasna", "Ialomița", "Prahova", "Vrancea"],
  "Caraș-Severin": ["Gorj", "Hunedoara", "Mehedinți", "Timiș"],
  "Călărași": ["Constanța", "Giurgiu", "Ialomița", "Ilfov"],
  "Cluj": ["Alba", "Bihor", "Bistrița-Năsăud", "Maramureș", "Mureș", "Sălaj"],
  "Constanța": ["Brăila", "Călărași", "Ialomița", "Tulcea"],
  "Covasna": ["Bacău", "Brașov", "Buzău", "Harghita", "Vrancea"],
  "Dâmbovița": ["Argeș", "Brașov", "Giurgiu", "Ilfov", "Prahova", "Teleorman"],
  "Dolj": ["Gorj", "Mehedinți", "Olt", "Vâlcea"],
  "Galați": ["Brăila", "Tulcea", "Vaslui", "Vrancea"],
  "Giurgiu": ["Călărași", "Dâmbovița", "Ilfov", "Teleorman"],
  "Gorj": ["Caraș-Severin", "Dolj", "Hunedoara", "Mehedinți", "Vâlcea"],
  "Harghita": ["Bacău", "Brașov", "Covasna", "Mureș", "Neamț", "Suceava"],
  "Hunedoara": ["Alba", "Arad", "Caraș-Severin", "Gorj", "Timiș", "Vâlcea"],
  "Ialomița": ["Brăila", "Buzău", "Călărași", "Constanța", "Ilfov", "Prahova"],
  "Iași": ["Botoșani", "Neamț", "Suceava", "Vaslui"],
  "Ilfov": ["București", "Călărași", "Dâmbovița", "Giurgiu", "Ialomița", "Prahova"],
  "Maramureș": ["Bistrița-Năsăud", "Cluj", "Satu Mare", "Sălaj", "Suceava"],
  "Mehedinți": ["Caraș-Severin", "Dolj", "Gorj"],
  "Mureș": ["Alba", "Bistrița-Năsăud", "Brașov", "Cluj", "Harghita", "Sibiu", "Suceava"],
  "Neamț": ["Bacău", "Harghita", "Iași", "Suceava", "Vaslui"],
  "Olt": ["Argeș", "Dolj", "Teleorman", "Vâlcea"],
  "Prahova": ["Brașov", "Buzău", "Dâmbovița", "Ialomița", "Ilfov"],
  "Satu Mare": ["Bihor", "Maramureș", "Sălaj"],
  "Sălaj": ["Bihor", "Cluj", "Maramureș", "Satu Mare"],
  "Sibiu": ["Alba", "Argeș", "Brașov", "Mureș", "Vâlcea"],
  "Suceava": ["Bistrița-Năsăud", "Botoșani", "Harghita", "Iași", "Maramureș", "Mureș", "Neamț"],
  "Teleorman": ["Argeș", "Dâmbovița", "Giurgiu", "Olt"],
  "Timiș": ["Arad", "Caraș-Severin", "Hunedoara"],
  "Tulcea": ["Brăila", "Constanța", "Galați"],
  "Vaslui": ["Bacău", "Galați", "Iași", "Neamț", "Vrancea"],
  "Vâlcea": ["Alba", "Argeș", "Dolj", "Gorj", "Hunedoara", "Olt", "Sibiu"],
  "Vrancea": ["Bacău", "Brăila", "Buzău", "Covasna", "Galați", "Vaslui"],
};

/** Județul și vecinii lui. Un nume necunoscut întoarce doar numele dat. */
export function judetSiVecini(judet: string): string[] {
  return [judet, ...(JUDETE_VECINE[judet] ?? [])];
}
