// Sugestiile de localitate din formularul de cerere. Datele stau în
// public/localitati/<județ>.json (generate de scripts/generate-localitati.mjs din
// SIRUTA), câte un fișier pe județ: browserul cere doar județul ales.

/** [nume, unitate, rang] — vezi scripts/generate-localitati.mjs. */
export type LocalitateEntry = [nume: string, unitate: string, rang: number];

/** Numele fișierului pentru un județ. Identic cu regula din script. */
export function countySlug(judet: string): string {
  return judet.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
}

/** Comparare fără diacritice, majuscule și prefixe pe care omul le scrie din reflex. */
export function normalizeLocalitate(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/^\s*(sat(ul)?|com(una)?|ora(s|sul)|mun(icipiul)?)\.?\s+/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Ce se scrie în cerere: „Corlătești, comuna Berceni". Cu unitatea alături, firma
 * găsește satul pe hartă și deosebește cele câteva sate cu același nume din județ.
 */
export function localitateValue([nume, unitate]: LocalitateEntry): string {
  return unitate ? `${nume}, ${unitate}` : nume;
}

const cache = new Map<string, Promise<LocalitateEntry[]>>();

export function loadLocalitati(judet: string): Promise<LocalitateEntry[]> {
  const slug = countySlug(judet);
  let p = cache.get(slug);
  if (!p) {
    p = fetch(`/localitati/${slug}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<LocalitateEntry[]>) : []))
      .catch(() => {
        // Fără listă, câmpul rămâne text liber; o nouă încercare la următorul județ ales.
        cache.delete(slug);
        return [];
      });
    cache.set(slug, p);
  }
  return p;
}

/**
 * Primele `limit` potriviri. Ordinea: numele începe cu ce s-a scris, apoi un
 * cuvânt din nume, apoi comuna/orașul (cine scrie „Berceni" vede și satele
 * comunei), apoi orice conținere; în fiecare grupă orașele întâi, apoi
 * reședințele de comună, apoi satele.
 */
export function searchLocalitati(list: LocalitateEntry[], query: string, limit = 8): LocalitateEntry[] {
  const q = normalizeLocalitate(query);
  if (!q) return [];
  const scored: { e: LocalitateEntry; s: number }[] = [];
  for (const e of list) {
    const n = normalizeLocalitate(e[0]);
    const u = normalizeLocalitate(e[1]);
    let s: number;
    if (n.startsWith(q)) s = 0;
    else if (n.split(' ').some((w) => w.startsWith(q))) s = 1;
    else if (u && u.startsWith(q)) s = 2;
    else if (n.includes(q)) s = 3;
    else continue;
    scored.push({ e, s: s * 10 + e[2] });
  }
  scored.sort((a, b) => a.s - b.s || a.e[0].localeCompare(b.e[0], 'ro'));
  return scored.slice(0, limit).map((x) => x.e);
}
