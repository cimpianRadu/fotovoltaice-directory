'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { slugifyCity, getFinancingShort, isRetrofit } from '@/lib/utils-shared';
import LeadCard, { type LeadCardData, type PortalMe } from './LeadCard';
import FilterDropdown, { type FilterOption } from './FilterDropdown';

interface LeadFeedProps {
  cards: LeadCardData[];
  claimCounts: Record<string, number>;
  watchCounts: Record<string, number>;
  maxClaims: number;
}

type AgeFilter = 'toate' | '7' | '14' | '14-30' | '30+';
type SegmentFilter = 'toate' | 'rezidential' | 'comercial';
type SortDir = 'recente' | 'vechi';

/**
 * Fereastra implicită a feedului. Sub ea cererile sunt „proaspete": clientul
 * încă așteaptă oferte, iar firma care sună are cu cine vorbi. Peste ea intri
 * doar apăsând butonul de sub grilă — 41 din cele 63 de cereri de pe 1 sept
 * aveau peste două săptămâni, iar ele dădeau tonul întregii pagini.
 * De ce 14 și nu 10: filtrul pe județ e ce folosesc firmele, iar la 10 zile
 * un instalator din Cluj vedea 2 cereri în județul lui în loc de 5.
 */
const DEFAULT_AGE: AgeFilter = '14';

const AGE_FILTERS: { id: AgeFilter; label: string }[] = [
  { id: '7', label: 'În ultimele 7 zile' },
  { id: '14', label: 'În ultimele 14 zile' },
  { id: '14-30', label: 'Acum 14–30 de zile' },
  { id: '30+', label: 'Acum peste 30 de zile' },
  { id: 'toate', label: 'Oricând' },
];

const SEGMENT_FILTERS: { id: SegmentFilter; label: string }[] = [
  { id: 'toate', label: 'Toate' },
  { id: 'rezidential', label: 'Rezidențial' },
  { id: 'comercial', label: 'Comercial' },
];

/**
 * Termen, finanțare și putere (26 oct 2026): firmele le citeau de pe fiecare
 * card în parte. O firmă care lucrează doar pe fonduri proprii sau doar peste
 * 30 kW trebuia să deschidă cu ochii toate cele 50 de carduri ca să găsească
 * trei. Valoarea goală („nespecificat") e opțiune separată: sunt cererile de
 * dinainte ca formularul să întrebe.
 */
const NESPECIFICAT = 'nespecificat';

const TERMEN_OPTIONS: { value: string; label: string; hint?: string }[] = [
  { value: 'cat-mai-repede', label: 'Cât mai repede' },
  { value: '1-3-luni', label: 'În 1-3 luni' },
  { value: 'peste-3-luni', label: 'Peste 3 luni' },
  { value: 'ma-informez', label: 'Deocamdată se informează' },
  { value: NESPECIFICAT, label: 'Nespecificat' },
];

// Ordinea: întâi cine plătește acum, apoi cine depinde de credit sau program.
const FINANTARE_ORDER = [
  'fonduri-proprii',
  'credit',
  'casa-verde',
  'afm-baterii',
  'electric-up',
  'alt-program',
  'nu-stiu',
  NESPECIFICAT,
];

/**
 * Treptele urmăresc ofertele, nu fizica: până la 10 kW e casa obișnuită
 * (monofazat până pe la 5), 10–30 kW casă mare sau firmă mică, peste 100 kW
 * proiect cu ATR și studiu de soluție. Puterea estimată din consum intră și ea,
 * e același reper pe care îl arată cardul.
 */
const PUTERE_OPTIONS: { value: string; label: string; hint?: string }[] = [
  { value: 'pana-5', label: 'Până la 5 kW' },
  { value: '5-10', label: '5–10 kW' },
  { value: '10-30', label: '10–30 kW' },
  { value: '30-100', label: '30–100 kW' },
  { value: 'peste-100', label: 'Peste 100 kW' },
  { value: 'retrofit', label: 'Baterie sau extindere', hint: 'Are deja sistem montat' },
  { value: NESPECIFICAT, label: 'Nespecificată' },
];

function putereBucket(c: LeadCardData): string {
  if (isRetrofit(c.tipLucrare)) return 'retrofit';
  const kw = c.putereKw;
  if (kw == null) return NESPECIFICAT;
  if (kw <= 5) return 'pana-5';
  if (kw <= 10) return '5-10';
  if (kw <= 30) return '10-30';
  if (kw <= 100) return '30-100';
  return 'peste-100';
}

interface Filters {
  age: AgeFilter;
  segment: SegmentFilter;
  counties: string[];
  termen: string[];
  finantare: string[];
  putere: string[];
}

/** Dimensiunile cu bifă, sincronizate cu parametrul din URL cu același nume. */
type MultiKey = 'termen' | 'finantare' | 'putere';
const MULTI_KEYS: MultiKey[] = ['termen', 'finantare', 'putere'];

function matchesAge(ageDays: number, filter: AgeFilter): boolean {
  switch (filter) {
    case '7':
      return ageDays <= 7;
    case '14':
      return ageDays <= 14;
    case '14-30':
      return ageDays > 14 && ageDays <= 30;
    case '30+':
      return ageDays > 30;
    default:
      return true;
  }
}

function matchesSegment(segment: string, filter: SegmentFilter): boolean {
  if (filter === 'toate') return true;
  // Tot ce nu e explicit rezidențial tratăm ca și comercial (defaultul formularului).
  const seg = segment === 'rezidential' ? 'rezidential' : 'comercial';
  return seg === filter;
}

const inSet = (value: string, set: string[]) => set.length === 0 || set.includes(value);

const INITIAL_FILTERS: Filters = {
  age: DEFAULT_AGE,
  segment: 'toate',
  counties: [],
  termen: [],
  finantare: [],
  putere: [],
};

function matches(c: LeadCardData, f: Filters): boolean {
  return (
    matchesAge(c.ageDays, f.age) &&
    matchesSegment(c.segment, f.segment) &&
    inSet(c.judet, f.counties) &&
    inSet(c.termen || NESPECIFICAT, f.termen) &&
    inSet(c.finantare || NESPECIFICAT, f.finantare) &&
    inSet(putereBucket(c), f.putere)
  );
}

export default function LeadFeed({ cards, claimCounts, watchCounts, maxClaims }: LeadFeedProps) {
  // Firma logată în portal (cookie httpOnly, deci se află doar de la server).
  // Pagina e ISR, așa că nu se poate citi cookie-ul la randare; un singur
  // apel la încărcare, iar până răspunde cardurile arată formularul complet.
  const [me, setMe] = useState<PortalMe | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/portal/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { me: null }))
      .then((j) => {
        if (!cancelled && j?.me?.email) setMe(j.me as PortalMe);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const { age, segment, counties } = filters;
  const [sort, setSort] = useState<SortDir>('recente');
  // Cererea spre care s-a dat click în altă parte a site-ului (teaserul de pe
  // prima pagină, un link trimis pe email unei firme). Cardul ei se aduce în
  // ecran și se marchează, altfel omul aterizează într-o listă de zeci de
  // carduri și trebuie să caute singur exact cererea pe care tocmai a apăsat-o.
  const [focusId, setFocusId] = useState<string | null>(null);

  // Filtrele din URL (`/cereri?judet=galati,braila&termen=cat-mai-repede`) se
  // citesc după montare, nu în starea inițială: pagina e prerandată fără
  // parametri, iar o stare diferită între server și client ar da eroare de
  // hidratare.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const list = (key: string) =>
      new Set((params.get(key) || '').split(',').map((s) => s.trim()).filter(Boolean));

    // `?cerere=<id>` — linkul direct spre o cerere anume. Filtrele implicite au
    // voie să ascundă orice, în afară de cererea cerută explicit: fereastra de
    // 14 zile se deschide dacă e mai veche de atât.
    const wantedId = params.get('cerere');
    const target = wantedId ? cards.find((c) => c.id === wantedId) : undefined;

    const judete = list('judet');
    const next: Filters = {
      ...INITIAL_FILTERS,
      counties: [...new Set(cards.map((c) => c.judet).filter(Boolean))].filter((j) =>
        judete.has(slugifyCity(j)),
      ),
      termen: TERMEN_OPTIONS.map((o) => o.value).filter((v) => list('termen').has(v)),
      finantare: FINANTARE_ORDER.filter((v) => list('finantare').has(v)),
      putere: PUTERE_OPTIONS.map((o) => o.value).filter((v) => list('putere').has(v)),
    };
    // Cu filtre și cerere în același link, cererea numită explicit decide: dacă
    // filtrele ar ascunde-o, nu se aplică.
    const keepFilters = !target || matches(target, { ...next, age: 'toate' });
    if (target) {
      setFocusId(target.id);
      if (!matchesAge(target.ageDays, DEFAULT_AGE)) next.age = 'toate';
    }
    setFilters(keepFilters ? next : { ...INITIAL_FILTERS, age: next.age });
    // Doar la montare: după aceea URL-ul îl scriem noi, nu-l mai citim.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Selecția merge în URL ca să poată fi trimisă mai departe: linkul „cererile
   * din Galați" ajunge direct în emailul sau mesajul către firmă. `replaceState`
   * în loc de router: parametrul nu schimbă nimic pe server, iar o navigare ar
   * reface pagina (deci și citirea din Sheets) degeaba.
   */
  const update = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    const params = new URLSearchParams(window.location.search);
    const put = (key: string, values: string[]) => {
      if (values.length) params.set(key, values.join(','));
      else params.delete(key);
    };
    put('judet', next.counties.map(slugifyCity));
    for (const key of MULTI_KEYS) put(key, next[key]);
    // Virgula rămâne virgulă (nu %2C): linkul se citește în email, unde e trimis
    // manual, iar parsarea e identică.
    const qs = params.toString().replace(/%2C/g, ',');
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  };

  // Counterele pe fiecare dimensiune țin cont de filtrele celorlalte (faceted):
  // „Fonduri proprii (4)" înseamnă 4 cereri în județele și termenul deja alese.
  const countWith = (patch: Partial<Filters>) =>
    cards.filter((c) => matches(c, { ...filters, ...patch })).length;

  // Opțiunile cu zero cereri dispar, ca să nu fie de ales un filtru care golește
  // pagina. Rămân doar cele de bază ale termenului și puterii (gri, cu 0): acolo
  // lipsa e o informație, „nimic peste 100 kW săptămâna asta".
  const options = (
    key: MultiKey,
    list: { value: string; label: string; hint?: string }[],
    alwaysShown: (value: string) => boolean,
  ): FilterOption[] =>
    list
      .map((o) => ({ ...o, count: countWith({ [key]: [o.value] }) }))
      .filter((o) => o.count > 0 || filters[key].includes(o.value) || alwaysShown(o.value));

  const countyOptions: FilterOption[] = [...new Set(cards.map((c) => c.judet).filter(Boolean))]
    .map((name) => ({ value: name, label: name, count: countWith({ counties: [name] }) }))
    .filter((o) => o.count > 0 || counties.includes(o.value))
    .sort((a, b) => a.label.localeCompare(b.label, 'ro'));
  const termenOptions = options('termen', TERMEN_OPTIONS, (v) => v !== NESPECIFICAT);
  const finantareOptions = options(
    'finantare',
    FINANTARE_ORDER.map((v) => ({
      value: v,
      label: v === NESPECIFICAT ? 'Nespecificată' : getFinancingShort(v),
    })),
    () => false,
  );
  // Puterea estimată de noi din consum se numără în trepte, dar nu se ascunde
  // în ele: fiecare treaptă spune câte din cererile ei sunt estimarea
  // platformei, nu cifra clientului.
  const putereOptions = options(
    'putere',
    PUTERE_OPTIONS,
    (v) => v !== NESPECIFICAT && v !== 'retrofit',
  ).map((o) => {
    const estimate = cards.filter(
      (c) => c.putereEstimata && matches(c, { ...filters, putere: [o.value] }),
    ).length;
    if (!estimate) return o;
    const hint =
      estimate === o.count
        ? 'toate estimate de platformă'
        : `${estimate} ${estimate === 1 ? 'estimată' : 'estimate'} de platformă`;
    return { ...o, hint };
  });
  const ageOptions: FilterOption[] = AGE_FILTERS.map((f) => ({
    value: f.id,
    label: f.label,
    count: countWith({ age: f.id }),
  }));

  const visible = cards
    .filter((c) => matches(c, filters))
    .sort((a, b) => (sort === 'recente' ? a.ageDays - b.ageDays : b.ageDays - a.ageDays));

  // Câte cereri ascunde fereastra implicită, în restul filtrelor alese. Zero
  // înseamnă că nu există „mai vechi" de arătat, deci nici buton.
  const olderCount =
    age === DEFAULT_AGE
      ? cards.filter(
          (c) => !matchesAge(c.ageDays, DEFAULT_AGE) && matches(c, { ...filters, age: 'toate' }),
        ).length
      : 0;

  const disponibile = visible.filter((c) => (claimCounts[c.id] || 0) < maxClaims).length;

  const filtered =
    age !== DEFAULT_AGE ||
    segment !== 'toate' ||
    counties.length > 0 ||
    MULTI_KEYS.some((k) => filters[k].length > 0);
  const resetFilters = () => update(INITIAL_FILTERS);

  return (
    <>
      {/* Firma logată vede că e recunoscută și că revendică dintr-un click,
          înainte să dea de primul card. Fără nume și telefon (n-a revendicat
          niciodată) prima revendicare trece încă prin formular. */}
      {me && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
          <div className="min-w-0 text-sm">
            <p className="truncate text-gray-800">
              Conectat ca <strong>{me.numeFirma || me.email}</strong>
            </p>
            <p className="text-xs text-emerald-800">
              {me.numeFirma && me.telefon
                ? typeof me.activeClaims === 'number' && me.maxActiveClaims
                  ? `Revendici dintr-un click · ${me.activeClaims} din ${me.maxActiveClaims} locuri ocupate`
                  : 'Revendici dintr-un click'
                : 'Prima revendicare îți cere datele firmei, apoi merge dintr-un click'}
            </p>
          </div>
          <Link
            href="/portal"
            className="shrink-0 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Contul meu
          </Link>
        </div>
      )}

      <div className="mb-4 rounded-xl border border-border bg-white p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex w-full items-center gap-1 rounded-full border border-border bg-surface p-1 sm:w-auto">
            {SEGMENT_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => update({ segment: f.id })}
                aria-pressed={segment === f.id}
                className={`flex-1 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-medium transition-colors sm:flex-none sm:px-3 ${
                  segment === f.id
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-gray-600 hover:text-secondary-dark'
                }`}
              >
                {f.label}{' '}
                <span className={segment === f.id ? 'opacity-75' : 'text-gray-400'}>
                  {countWith({ segment: f.id })}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1">
            {(
              [
                { id: 'recente', label: 'Cele mai recente' },
                { id: 'vechi', label: 'Cele mai vechi' },
              ] as { id: SortDir; label: string }[]
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setSort(s.id)}
                aria-pressed={sort === s.id}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  sort === s.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pe telefon grilă de două coloane: în rând liber, cinci pastile cu
            lățimi diferite ocupau patru rânduri. */}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 sm:flex sm:flex-wrap sm:items-center">
          <FilterDropdown
            title="Județ"
            allLabel="Toate"
            options={countyOptions}
            selected={counties}
            onChange={(next) => update({ counties: next })}
          />
          <FilterDropdown
            title="Termen"
            allLabel="Oricare"
            options={termenOptions}
            selected={filters.termen}
            onChange={(next) => update({ termen: next })}
          />
          <FilterDropdown
            title="Finanțare"
            allLabel="Oricare"
            options={finantareOptions}
            selected={filters.finantare}
            onChange={(next) => update({ finantare: next })}
          />
          <FilterDropdown
            title="Putere"
            allLabel="Oricare"
            options={putereOptions}
            selected={filters.putere}
            onChange={(next) => update({ putere: next })}
            note="Unde clientul n-a spus puterea, folosim estimarea platformei, calculată din consumul lui. Pe card e marcată „Estimare”."
          />
          <FilterDropdown
            title="Primită"
            allLabel=""
            single
            className="col-span-2"
            options={ageOptions}
            selected={[age]}
            onChange={([next]) => update({ age: next as AgeFilter })}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm text-gray-500">
          {visible.length} {visible.length === 1 ? 'cerere' : 'cereri'}
          {age === DEFAULT_AGE ? ' din ultimele două săptămâni' : ''}
          {disponibile < visible.length ? `, ${disponibile} încă disponibile` : ''}
          {olderCount > 0 ? ` · ${cards.length} primite în total` : ''}
        </p>
        {filtered && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm text-primary-dark underline hover:no-underline"
          >
            Șterge filtrele
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center text-sm text-gray-500">
          {olderCount > 0
            ? 'Nicio cerere din ultimele două săptămâni pentru filtrele selectate.'
            : 'Nicio cerere pentru filtrele selectate.'}
          {filtered && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 block w-full text-primary-dark underline hover:no-underline"
            >
              Arată toate cererile
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((card) => (
            <LeadCard
              key={card.id}
              lead={card}
              initialClaims={claimCounts[card.id] || 0}
              initialWatches={watchCounts[card.id] || 0}
              maxClaims={maxClaims}
              focused={card.id === focusId}
              me={me}
            />
          ))}
        </div>
      )}

      {/* Restul arhivei e la un click, nu ascunsă: firma care caută în județul
          ei trebuie să poată vedea și cererile mai vechi, doar că nu ele sunt
          primul lucru pe care îl vede pe pagină. */}
      {olderCount > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => update({ age: 'toate' })}
            className="px-5 py-2.5 rounded-full text-sm font-medium border border-border bg-white text-secondary-dark hover:border-secondary/40 hover:bg-surface transition-colors"
          >
            Vezi și cererile mai vechi ({olderCount})
          </button>
          <p className="mt-2 text-xs text-gray-400">
            Sunt cereri de peste două săptămâni, unde clientul poate să fi ales deja o firmă.
          </p>
        </div>
      )}
    </>
  );
}
