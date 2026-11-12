'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import sponsorsData from '@/data/sponsors.json';
import {
  POSITION_AUDIENCE,
  type SponsorAudience,
  type SponsorPosition,
} from '@/lib/sponsor-positions';
import { isRunning, type SponsorRun } from '@/lib/sponsor-run';
import { formatPromoDate, isPromoRunning, type SponsorPromo } from '@/lib/sponsor-promo';

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

/**
 * Slot de partener, vândut separat de listarea din director: partenerii NU sunt
 * firme din `companies.json` și nu trebuie să ajungă niciodată acolo. Directorul
 * își ține valoarea din faptul că fiecare firmă listată e un instalator real cu
 * atestat ANRE verificat; un furnizor sau un broker afișat ca „firmă recomandată"
 * ar strica exact asta.
 *
 * Ca să adaugi un partener: o intrare în `data/sponsors.json`, fără cod. Logo-ul
 * trebuie să existe ca fișier (altfel next/image dă 400 și iese imagine ruptă).
 *
 * `messages` are câte un text pe audiență, pentru că paginile site-ului se citesc
 * de două publicuri diferite: clientul care își pune panouri și instalatorul care
 * caută de lucru. Un partener care e relevant pentru amândoi (finanțare pentru
 * clienți, asigurări și garanții de bună execuție pentru firme) are nevoie de
 * mesaje diferite, altfel jumătate din plasări vorbesc pe lângă cine citește.
 * Poziția din pagină decide singură care mesaj se afișează.
 *
 * `positions` e diferența dintre pachete, scrisă în date, nu în cod: un partener
 * obișnuit primește o listă de pagini, Premium primește `"all"`, adică inclusiv
 * cele trei plasări cu cea mai mare intenție, feedul de cereri și portalul (unde
 * citesc doar instalatori) și ecranul de după trimiterea unei cereri (unde omul
 * tocmai a convertit). Ca să vinzi Premium, aia trebuie să fie o diferență reală.
 *
 * `phone`, `whatsapp` și `facebook` sunt opționale și apar ca acțiuni separate
 * sub mesaj. Contează mai ales pe audiența de instalatori: firmele se conving
 * la telefon sau pe WhatsApp, nu dintr-un click pe site. Fiecare are eveniment
 * propriu, deci partenerul primește apeluri și conversații inițiate, nu doar
 * un CTR.
 *
 * Bannerul e un carusel: fiecare partener are slide-ul lui, singur, nu un card
 * lângă alți parteneri. `promo` (vezi `lib/sponsor-promo`) face din slide o
 * pagină mică de ofertă: pachete cu prețuri, poze, PDF. O firmă de instalare
 * din director poate cumpăra și ea un slide; rămâne sub eticheta „Publicitate"
 * și textul e oferta ei, deci nu primește de la noi nicio mențiune ANRE pe care
 * registrul nu o confirmă.
 */
export type { SponsorPosition, SponsorAudience };

// Cine citește pagina, nu ce conține pagina: paginile de instalatori sunt cele
// unde ajunge o firmă care caută de lucru sau se ocupă de propria prezență
// (feedul de cereri, portalul, formularul de listare). Harta stă în
// `lib/sponsor-positions` pentru că o citește și raportul lunar din admin.

interface Sponsor {
  slug: string;
  name: string;
  location: string;
  logo: string;
  baseUrl: string;
  active: boolean;
  /** Perioada contractată. Lipsă = rulează nelimitat, doar pe `active`. */
  run?: SponsorRun;
  /** `"all"` = pachet Premium, apare pe toate plasările. */
  positions: string[] | 'all';
  messages: Record<string, string>;
  /** Textul CTA din popup-ul dreapta-jos; bannerul nu îl folosește. */
  cta?: string;
  /** Opțional, format internațional. Devine buton „Sună" cu eveniment propriu. */
  phone?: string;
  /** Opțional, doar cifre cu prefix de țară (ex: `40763990097`). Devine buton WhatsApp. */
  whatsapp?: string;
  /** Opțional, URL complet de pagină de Facebook. */
  facebook?: string;
  /** Opțional. Transformă cardul în slide de ofertă; vezi `lib/sponsor-promo`. */
  promo?: SponsorPromo;
}

/**
 * Mesajul cu care se deschide conversația de WhatsApp. Numele site-ului în
 * prima propoziție nu e politețe: partenerul vede sursa fiecărei conversații
 * fără să o ceară, deci „câți oameni v-au scris de la noi" se numără singur,
 * chiar și pentru mesajele pe care tracking-ul nostru nu le mai vede.
 */
const WHATSAPP_PREFILL =
  'Bună ziua! V-am găsit pe instalatori-fotovoltaice.ro și aș vrea mai multe detalii.';

const ALL_SPONSORS = sponsorsData.sponsors as Sponsor[];
const LIVE_SPONSORS = ALL_SPONSORS.filter((s) => s.active);

/**
 * Ceasul, luat după mount. `data/sponsors.json` intră static în bundle, deci un
 * `new Date()` la nivel de modul ar fi înghețat la momentul build-ului pe HTML-ul
 * prerandat și ar diferi de browser — adică fix o nepotrivire de hidratare pe
 * slotul plătit. Primul render (server + prima trecere în client) ignoră
 * fereastra și arată tot ce e `active`, deci e identic în ambele părți; imediat
 * după mount se aplică perioada, cu ceasul vizitatorului.
 *
 * Consecința asumată: în zilele dintre expirarea unei promovări și următorul
 * deploy, bannerul apare în HTML și dispare la hidratare. E preferabil variantei
 * inverse, în care un partener plătit lipsește din prima pictură a paginii.
 */
function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  return now;
}

/** Un număr aleator ales după mount, din același motiv ca `useNow`: hidratare identică. */
function useMountRandom(): number | null {
  const [value, setValue] = useState<number | null>(null);
  useEffect(() => setValue(Math.random()), []);
  return value;
}

/**
 * Previzualizare pentru un partener care încă nu e live: `?preview=<slug>` pe
 * orice pagină afișează un sponsor cu `active: false`, exact cum ar arăta după
 * semnare. Slug-ul rămâne în `sessionStorage`, deci prospectul poate naviga prin
 * site fără să care parametrul după el; `?preview=off` îl scoate.
 *
 * În preview NU se trimite niciun eveniment. Altfel raportul pe care i-l dai
 * partenerului ar conține impresiile generate chiar de el când s-a uitat la
 * propriul banner, iar prima cifră pe care o vede ar fi deja falsă.
 */
const PREVIEW_KEY = 'sponsor-preview';

function usePreviewSlug(): string | null {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('preview');
    if (fromUrl === 'off') {
      sessionStorage.removeItem(PREVIEW_KEY);
      setSlug(null);
      return;
    }
    if (fromUrl) {
      sessionStorage.setItem(PREVIEW_KEY, fromUrl);
      setSlug(fromUrl);
      return;
    }
    setSlug(sessionStorage.getItem(PREVIEW_KEY));
  }, []);

  return slug;
}

function buildUrl(baseUrl: string, position: SponsorPosition, audience: SponsorAudience) {
  const params = new URLSearchParams({
    utm_source: 'instalatori-fotovoltaice',
    utm_medium: 'sponsor-banner',
    utm_campaign: 'listing-sponsor',
    utm_content: position,
    utm_term: audience,
  });
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Umami întoarce valorile unei singure proprietăți odată, agregate peste tot.
 * Cu doi parteneri pe aceleași pagini, „impresii pe /cereri" nu mai spune ale
 * cui sunt. `sp` = `slug|poziție` într-un singur câmp face raportul per partener
 * per plasare posibil fără să schimbăm modul în care interoghează Umami.
 */
function trackingProps(sponsor: Sponsor, position: SponsorPosition, audience: SponsorAudience) {
  return {
    sponsor: sponsor.slug,
    position,
    audience,
    sp: `${sponsor.slug}|${position}`,
  };
}

type SponsorEvent =
  | 'sponsor-click'
  | 'sponsor-call'
  | 'sponsor-whatsapp'
  | 'sponsor-social'
  | 'sponsor-pdf';

/** Atributele Umami de pe un link de partener; în preview niciunul. */
function eventAttrs(
  sponsor: Sponsor,
  position: SponsorPosition,
  audience: SponsorAudience,
  preview: boolean,
  event: SponsorEvent,
) {
  if (preview) return {};
  const props = trackingProps(sponsor, position, audience);
  return {
    'data-umami-event': event,
    'data-umami-event-sponsor': props.sponsor,
    'data-umami-event-position': props.position,
    'data-umami-event-audience': props.audience,
    'data-umami-event-sp': props.sp,
  };
}

/**
 * Cât stă un slide pe ecran înainte să treacă singur la următorul. Mai lung
 * decât popup-ul: un slide de ofertă are trei pachete cu prețuri de citit.
 */
const ROTATION_MS = 10_000;

export default function SponsorBanner({
  position,
  title = 'Parteneri Recomandați',
}: {
  position: SponsorPosition;
  title?: string;
}) {
  const audience = POSITION_AUDIENCE[position];
  const previewSlug = usePreviewSlug();
  const now = useNow();

  // Memoizat: fără asta lista are altă identitate la fiecare render, iar efectul
  // de mai jos ar reconstrui observerul la nesfârșit.
  const sponsors = useMemo(() => {
    const live = LIVE_SPONSORS.filter(
      (s) =>
        (s.positions === 'all' || s.positions.includes(position)) &&
        // `now === null` = încă nu s-a montat; vezi `useNow`.
        (now === null || isRunning(s.run, now)),
    );
    // Premium (`positions: "all"`) stă mereu primul: plătește pachetul cel mai
    // mare, deci ia și primul loc când slotul afișează mai mulți parteneri.
    live.sort((a, b) => Number(b.positions === 'all') - Number(a.positions === 'all'));
    if (!previewSlug) return live;

    const pending = ALL_SPONSORS.find((s) => s.slug === previewSlug && !s.active);
    if (!pending) return live;
    if (!(pending.positions === 'all' || pending.positions.includes(position))) return live;
    return [pending, ...live];
  }, [position, previewSlug, now]);

  const isPreview = Boolean(previewSlug) && sponsors.some((s) => s.slug === previewSlug);

  // Primul slide, ales după mount. Fără asta, partenerul de pe locul doi e
  // văzut doar de cine stă pe pagină cel puțin o rotație; pornind de la un
  // slide aleator, fiecare e primul pentru ~1/N din vizitatori (ca la popup).
  // Excepții: Premium rămâne primul, fiindcă asta plătește, iar în preview
  // partenerul previzualizat e deja pus primul.
  const rand = useMountRandom();
  const offset =
    rand === null || isPreview || sponsors.length < 2 || sponsors[0].positions === 'all'
      ? 0
      : Math.floor(rand * sponsors.length);
  const slides = useMemo(
    () => [...sponsors.slice(offset), ...sponsors.slice(0, offset)],
    [sponsors, offset],
  );

  // Slide-ul curent ține de ordinea slide-urilor: când ordinea se schimbă
  // (startul aleator, un partener expirat scos după mount), zona de derulare
  // se remontează pe `slidesKey` și pornește de la primul.
  const slidesKey = slides.map((s) => s.slug).join('|');
  const [current, setCurrent] = useState({ key: '', index: 0 });
  const active = current.key === slidesKey ? current.index : 0;

  const ref = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  // `paused` = mouse sau focus pe banner, revine. `stopped` = omul a navigat
  // singur (săgeată, punct, swipe), deci de acum el decide ce vede.
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      if (!track || slides.length === 0) return;
      const target = (i + slides.length) % slides.length;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      track.scrollTo({ left: target * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
    },
    [slides.length],
  );

  // Rotația merge doar cât bannerul e pe ecran: altfel slide-urile s-ar
  // schimba nevăzute, iar omul ar ajunge la banner pe un slide oarecare.
  // „Pe ecran" = jumătate din banner, sau jumătate din ecran când bannerul e
  // mai înalt decât ecranul (pe telefon, cu un slide de ofertă, se întâmplă).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        const need = Math.min(entry.boundingClientRect.height, window.innerHeight) * 0.5;
        setInView(entry.isIntersecting && entry.intersectionRect.height >= need);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || paused || stopped || !inView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setTimeout(() => goTo(active + 1), ROTATION_MS);
    return () => clearTimeout(timer);
  }, [active, paused, stopped, inView, slides.length, goTo]);

  // Impresia se numără pe slide, nu pe banner: un partener de pe slide-ul doi
  // nu e văzut doar pentru că bannerul a intrat în ecran. Observerul are ca
  // rădăcină viewport-ul, iar zona de derulare a caruselului taie slide-urile
  // din afara ei, deci se numără doar slide-ul afișat, o dată pe vizită.
  const trackedSlugs = useRef(new Set<string>());

  useEffect(() => {
    if (isPreview) return;
    const track = trackRef.current;
    if (!track) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const sponsor = slides.find((s) => s.slug === (entry.target as HTMLElement).dataset.sponsor);
          if (!sponsor || trackedSlugs.current.has(sponsor.slug)) return;
          trackedSlugs.current.add(sponsor.slug);
          window.umami?.track('sponsor-impression', trackingProps(sponsor, position, audience));
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.5 },
    );
    track.querySelectorAll<HTMLElement>('[data-sponsor]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [position, audience, slides, isPreview]);

  // Niciun partener pe audiența asta. Slotul nu dispare, devine anunț propriu:
  // un spațiu gol nu se poate vinde, iar cine ar cumpăra trebuie să vadă unde
  // ar apărea. Fără logo inventat și fără partener fictiv.
  if (sponsors.length === 0) {
    return (
      <a
        href="/publicitate"
        className="block rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 text-center transition-colors hover:border-primary/50 hover:bg-primary/10"
      >
        <p className="text-[10px] uppercase tracking-wider text-gray-400">Publicitate</p>
        <p className="mt-1 text-sm font-semibold text-primary-dark">Spațiu disponibil</p>
        <p className="mt-1 text-xs text-gray-600 leading-relaxed">
          {audience === 'instalator'
            ? 'Vinzi echipamente sau servicii pentru instalatori? Aici te văd firmele care caută lucrări.'
            : 'Firma ta aici, în fața oamenilor care caută un instalator. Vezi pachetele →'}
        </p>
      </a>
    );
  }

  const many = slides.length > 1;

  return (
    <>
      {isPreview && <PreviewPill />}
      <div
        ref={ref}
        role={many ? 'region' : undefined}
        aria-roledescription={many ? 'carusel' : undefined}
        aria-label={many ? title : undefined}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="@container rounded-xl border border-primary/15 bg-primary/5"
      >
        {/* Două forme, după lățimea bannerului, nu a ecranului. Îngust (telefon,
            coloana din /ghid): secțiune verticală. De la 672px (homepage, ghid):
            bandă joasă, cu eticheta, săgețile și linkul „Firma ta aici?" pe un
            singur rând, ca să nu împingă pagina în jos cu un ecran întreg. */}
        <div className="p-5 @2xl:px-4 @2xl:py-3">
          <div className="flex items-start @2xl:items-center justify-between gap-3 mb-3 @2xl:mb-2">
            <div className="@2xl:flex @2xl:items-baseline @2xl:gap-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1 @2xl:mb-0">Publicitate</p>
              <p className="text-xs font-semibold text-primary-dark uppercase tracking-wider">{title}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="/publicitate"
                className="hidden @2xl:inline text-xs text-gray-500 hover:text-primary-dark transition-colors"
              >
                Firma ta aici? Află mai multe →
              </a>
              {many && (
                <div className="flex items-center gap-1">
                  <CarouselArrow
                    dir="prev"
                    onClick={() => {
                      setStopped(true);
                      goTo(active - 1);
                    }}
                  />
                  <span className="text-[11px] tabular-nums text-gray-500 w-9 text-center" aria-live="polite">
                    {active + 1}/{slides.length}
                  </span>
                  <CarouselArrow
                    dir="next"
                    onClick={() => {
                      setStopped(true);
                      goTo(active + 1);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Un partener pe slide, pe toată lățimea, cu derulare nativă (swipe pe
              telefon, scroll-snap). Slide-urile au aceeași înălțime, a celui mai
              înalt, ca bannerul să nu sară la fiecare rotație; pe un slide mai
              scurt conținutul stă centrat pe verticală. */}
          <div
            key={slidesKey}
            ref={trackRef}
            onScroll={(e) => {
              const t = e.currentTarget;
              setCurrent({ key: slidesKey, index: Math.round(t.scrollLeft / t.clientWidth) });
            }}
            onPointerDown={() => setStopped(true)}
            className="flex overflow-x-auto snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {slides.map((sponsor, i) => {
              // În carusel fiecare partener are slide întreg: fără promoție, slide-ul
              // lui e mesajul ca titlu, altfel cardul mic ar sta pierdut în
              // înălțimea slide-ului cu oferte. Singur pe banner rămâne cardul mic.
              const running =
                sponsor.promo && (now === null || isPromoRunning(sponsor.promo, now))
                  ? sponsor.promo
                  : null;
              const promo =
                running ??
                (many
                  ? { headline: sponsor.messages[audience] ?? sponsor.messages.client }
                  : null);
              return (
                <div
                  key={sponsor.slug}
                  data-sponsor={sponsor.slug}
                  role={many ? 'group' : undefined}
                  aria-roledescription={many ? 'slide' : undefined}
                  aria-label={many ? `${i + 1} din ${slides.length}: ${sponsor.name}` : undefined}
                  className="w-full shrink-0 snap-start flex flex-col"
                >
                  {promo ? (
                    <PromoSlide
                      sponsor={sponsor}
                      promo={promo}
                      position={position}
                      audience={audience}
                      preview={isPreview}
                    />
                  ) : (
                    <SponsorCard
                      sponsor={sponsor}
                      position={position}
                      audience={audience}
                      preview={isPreview}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {many && (
            <div className="mt-3 flex @2xl:hidden justify-center gap-1.5">
              {slides.map((sponsor, i) => (
                <button
                  key={sponsor.slug}
                  type="button"
                  onClick={() => {
                    setStopped(true);
                    goTo(i);
                  }}
                  aria-label={`Slide ${i + 1}: ${sponsor.name}`}
                  aria-current={i === active ? 'true' : undefined}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? 'w-5 bg-primary' : 'w-1.5 bg-primary/25 hover:bg-primary/50'
                  }`}
                />
              ))}
            </div>
          )}
          <a
            href="/publicitate"
            className="block @2xl:hidden mt-3 text-xs text-gray-500 hover:text-primary-dark transition-colors text-center"
          >
            Firma ta aici? Află mai multe →
          </a>
        </div>
      </div>
    </>
  );
}

/**
 * Cardul e un `div`, nu un `<a>`: cu telefon și Facebook alături de link-ul spre
 * site avem trei destinații, iar link-uri imbricate sunt HTML invalid și strică
 * navigarea cu tastatura. Zona de titlu rămâne link principal, acțiunile stau
 * separat sub ea.
 */
function SponsorCard({
  sponsor,
  position,
  audience,
  preview,
}: {
  sponsor: Sponsor;
  position: SponsorPosition;
  audience: SponsorAudience;
  preview: boolean;
}) {
  const attrs = (event: SponsorEvent) => eventAttrs(sponsor, position, audience, preview, event);

  const hasActions = Boolean(sponsor.phone || sponsor.whatsapp || sponsor.facebook);

  return (
    // flex-col + flex-1 pe link: în grila pe două coloane cardurile au aceeași
    // înălțime, iar rândul de acțiuni stă lipit de baza cardului la amândouă.
    <div className="flex flex-col rounded-lg bg-white border border-gray-100 overflow-hidden transition-all hover:border-primary/30 hover:shadow-sm">
      <a
        href={buildUrl(sponsor.baseUrl, position, audience)}
        target="_blank"
        rel="noopener noreferrer sponsored"
        {...attrs('sponsor-click')}
        className="flex flex-1 items-center gap-3 p-3 group"
      >
        <Image
          src={sponsor.logo}
          alt={sponsor.name}
          width={48}
          height={48}
          className="w-12 h-12 rounded object-contain shrink-0"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-dark transition-colors">
            {sponsor.name}
          </p>
          <p className="text-xs text-gray-500 leading-snug">
            {sponsor.messages[audience] ?? sponsor.messages.client}
          </p>
        </div>
        <svg
          className="w-4 h-4 text-gray-300 group-hover:text-primary shrink-0 ml-auto transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </a>

      {/* Trei destinații pe un card care coboară până la ~200px (sidebarul din
          /ghid): doar telefonul păstrează text, pentru că numărul în sine e
          informația. WhatsApp și Facebook rămân iconițe în culorile lor, mai
          recunoscute decât numele scrise și singurul mod în care încap toate. */}
      {hasActions && (
        <div className="flex items-stretch border-t border-gray-100 divide-x divide-gray-100">
          {sponsor.phone && (
            <a
              href={`tel:${sponsor.phone.replace(/\s+/g, '')}`}
              {...attrs('sponsor-call')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-primary-dark hover:bg-primary/5 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              {sponsor.phone}
            </a>
          )}
          {sponsor.whatsapp && (
            <a
              href={`https://wa.me/${sponsor.whatsapp}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Scrie pe WhatsApp"
              title="Scrie pe WhatsApp"
              {...attrs('sponsor-whatsapp')}
              className="flex items-center justify-center px-5 py-2.5 text-[#25D366] hover:bg-primary/5 transition-colors"
            >
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          )}
          {sponsor.facebook && (
            <a
              href={sponsor.facebook}
              target="_blank"
              rel="noopener noreferrer sponsored"
              aria-label="Pagina de Facebook"
              title="Pagina de Facebook"
              {...attrs('sponsor-social')}
              className="flex items-center justify-center px-5 py-2.5 text-[#1877F2] hover:bg-primary/5 transition-colors"
            >
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const PHONE_ICON =
  'M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z';
const WHATSAPP_ICON =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

function CarouselArrow({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'prev' ? 'Partenerul anterior' : 'Partenerul următor'}
      className="w-7 h-7 rounded-full border border-primary/20 bg-white flex items-center justify-center text-primary-dark hover:border-primary/50 hover:bg-primary/5 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={dir === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
        />
      </svg>
    </button>
  );
}

/**
 * Slide-ul de ofertă: partenerul singur pe toată lățimea bannerului, cu
 * pachetele lui, poze și PDF. Acțiunile sunt butoane reale, ca la
 * `SponsorFeature`, pentru că aici omul a citit deja oferta și vrea să sune.
 *
 * Container queries pe lățimea bannerului. În coloana din /ghid și pe telefon e o
 * secțiune verticală, cu poza sus și un pachet plus restul la cerere. De la 672px
 * e o bandă joasă, cu poza în stânga, ca reclamele din coloana Facebook, și
 * telefonul la dreapta, pe primul rând.
 */
function PromoSlide({
  sponsor,
  promo,
  position,
  audience,
  preview,
}: {
  sponsor: Sponsor;
  promo: SponsorPromo;
  position: SponsorPosition;
  audience: SponsorAudience;
  preview: boolean;
}) {
  const attrs = (event: SponsorEvent) => eventAttrs(sponsor, position, audience, preview, event);
  const images = promo.images ?? [];
  const offers = promo.offers ?? [];
  const [photo, setPhoto] = useState<number | null>(null);
  // Îngust, slide-ul arată primul pachet și restul la cerere: toate trei pe
  // rând ar duce slide-ul (și, prin înălțimea comună, pe al celorlalți
  // parteneri) la peste un ecran de telefon.
  const [expanded, setExpanded] = useState(false);
  const half = sponsor.whatsapp && promo.pdf ? 'col-span-1' : 'col-span-2';
  // Fără pachete și fără poze (partenerul fără promoție, în carusel) slide-ul
  // devine afiș centrat: are înălțimea slide-ului cu oferte, iar un card aliniat
  // la stânga ar lăsa o jumătate de ecran goală sub el.
  const poster = offers.length === 0 && images.length === 0;

  const openPhoto = (i: number) => {
    setPhoto(i);
    if (!preview) window.umami?.track('sponsor-photo', trackingProps(sponsor, position, audience));
  };

  return (
    <div className="flex-1 flex flex-col @2xl:flex-row rounded-lg bg-white border border-gray-100 overflow-hidden">
      {/* O singură poză vizibilă, restul în lightbox: pe bandă nu e loc de miniaturi. */}
      {images.length > 0 && (
        <button
          type="button"
          onClick={() => openPhoto(0)}
          className="relative block shrink-0 w-full aspect-video @2xl:w-40 @2xl:aspect-auto @4xl:w-52 overflow-hidden bg-gray-100 cursor-zoom-in"
          aria-label={`Mărește poza: ${images[0].alt}`}
        >
          <Image
            src={images[0].src}
            alt={images[0].alt}
            fill
            sizes="(min-width: 768px) 320px, 100vw"
            className={images[0].fit === 'contain' ? 'object-contain p-1' : 'object-cover'}
          />
          {images.length > 1 && (
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
              {images.length === 2 ? '+1 poză' : `+${images.length - 1} poze`}
            </span>
          )}
        </button>
      )}

      <div
        className={`flex-1 min-w-0 p-4 @md:p-5 flex flex-col justify-center gap-3 @2xl:grid @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:content-center @2xl:gap-x-4 @2xl:gap-y-1.5 @2xl:p-3 ${
          poster ? 'items-center text-center @2xl:text-left' : ''
        }`}
      >
        <a
          href={buildUrl(sponsor.baseUrl, position, audience)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          {...attrs('sponsor-click')}
          className={`group flex items-center gap-3 @2xl:gap-2 @2xl:col-start-1 ${poster ? 'flex-col @2xl:flex-row' : ''}`}
        >
          <Image
            src={sponsor.logo}
            alt={sponsor.name}
            width={poster ? 80 : 48}
            height={poster ? 80 : 48}
            className={`${poster ? 'w-20 h-20 @2xl:w-10 @2xl:h-10' : 'w-12 h-12 @2xl:w-8 @2xl:h-8'} rounded object-contain shrink-0`}
          />
          <span className="min-w-0 @2xl:flex @2xl:flex-wrap @2xl:items-baseline @2xl:gap-x-2">
            <span className="block text-sm font-semibold text-gray-900 group-hover:text-primary-dark transition-colors">
              {sponsor.name}
            </span>
            {sponsor.location && (
              <span className="block text-xs text-gray-500">{sponsor.location}</span>
            )}
          </span>
        </a>

        <p className="text-base @md:text-lg @2xl:text-[15px] @4xl:text-base font-bold text-gray-900 leading-snug @2xl:col-start-1">
          {promo.headline}
        </p>

        {offers.length > 0 && (
          <ul className={`grid gap-2 @2xl:col-span-2 ${offers.length > 1 ? '@xl:grid-cols-3' : ''}`}>
            {/* Îngust (telefon, coloană): rânduri compacte cu prețul lângă titlu.
                Mediu: trei carduri cu prețul jos. Pe toată lățimea homepage-ului
                prețul încape din nou lângă titlu. Pe bandă detaliul stă pe un rând:
                începe cu puterea, deci ce contează rămâne vizibil. */}
            {offers.map((offer, i) => (
              <li
                key={offer.title}
                className={`min-w-0 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 @xl:p-3 @2xl:px-2.5 @2xl:py-1.5 flex-col ${
                  i === 0 || expanded ? 'flex' : 'hidden @xl:flex'
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 leading-snug">{offer.title}</p>
                  {offer.price && (
                    <p className="@xl:hidden @4xl:block shrink-0 text-sm font-bold text-primary-dark">
                      {offer.price}
                    </p>
                  )}
                </div>
                {offer.detail && (
                  <p className="mt-0.5 text-xs text-gray-600 leading-snug @2xl:truncate" title={offer.detail}>
                    {offer.detail}
                  </p>
                )}
                {offer.price && (
                  <p className="hidden @xl:block @4xl:hidden mt-auto pt-2 @2xl:pt-0.5 text-sm font-bold text-primary-dark">
                    {offer.price}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {offers.length > 1 && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="@xl:hidden -mt-1 self-start text-xs font-semibold text-primary-dark hover:text-primary"
          >
            {expanded ? 'Mai puține pachete ▴' : `Toate pachetele (${offers.length}) ▾`}
          </button>
        )}

        {promo.note && (
          <p
            className={`text-xs text-gray-500 leading-relaxed @2xl:leading-snug @2xl:col-span-2 ${
              expanded ? '' : 'line-clamp-2 @xl:line-clamp-none'
            }`}
          >
            {promo.note}
          </p>
        )}
        {promo.validUntil && (
          <p className="text-xs font-medium text-gray-700 @2xl:col-span-2">
            Ofertă valabilă până pe {formatPromoDate(promo.validUntil)}.
          </p>
        )}

        {/* Îngust: telefonul pe tot rândul, WhatsApp și PDF-ul alături. Linkul
            spre site e deja pe nume și logo, deci dispare de aici pe telefon și
            pe banda îngustă. */}
        <div
          className={`grid grid-cols-2 gap-2 pt-1 @md:flex @md:flex-wrap @md:items-center @2xl:flex-nowrap @2xl:pt-0 @2xl:col-start-2 @2xl:row-start-1 @2xl:row-span-2 ${
            poster ? 'w-full max-w-sm @md:justify-center @2xl:w-auto @2xl:max-w-none' : ''
          }`}
        >
          {sponsor.phone && (
            <a
              href={`tel:${sponsor.phone.replace(/\s+/g, '')}`}
              {...attrs('sponsor-call')}
              className="col-span-2 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-4 py-2.5 @2xl:px-3 @2xl:py-2 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d={PHONE_ICON} />
              </svg>
              {sponsor.phone}
            </a>
          )}
          {sponsor.whatsapp && (
            <a
              href={`https://wa.me/${sponsor.whatsapp}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`}
              target="_blank"
              rel="noopener noreferrer"
              {...attrs('sponsor-whatsapp')}
              className={`${half} inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-gray-200 hover:border-[#25D366] hover:bg-[#25D366]/5 text-gray-800 font-semibold text-sm px-4 py-2.5 @2xl:px-3 @2xl:py-2 transition-colors`}
            >
              <svg className="w-4 h-4 shrink-0 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                <path d={WHATSAPP_ICON} />
              </svg>
              WhatsApp
            </a>
          )}
          {promo.pdf && (
            <a
              href={promo.pdf.href}
              target="_blank"
              rel="noopener noreferrer"
              {...attrs('sponsor-pdf')}
              className={`${half} inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 hover:border-primary/50 hover:bg-primary/5 text-gray-800 font-semibold text-sm leading-tight text-center @2xl:whitespace-nowrap px-3 @md:px-4 py-2.5 @2xl:px-3 @2xl:py-2 transition-colors`}
            >
              <svg className="w-4 h-4 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              {promo.pdf.label}
            </a>
          )}
          {/* Fără telefon, site-ul e singura acțiune, deci devine butonul principal. */}
          <a
            href={buildUrl(sponsor.baseUrl, position, audience)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            {...attrs('sponsor-click')}
            className={
              sponsor.phone
                ? 'hidden @md:inline @2xl:hidden @4xl:inline whitespace-nowrap text-sm font-semibold text-primary-dark hover:text-primary px-1 py-2.5 @2xl:py-2 transition-colors'
                : 'col-span-2 inline-flex items-center justify-center rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-4 py-2.5 transition-colors'
            }
          >
            Vezi site-ul →
          </a>
        </div>
      </div>

      {photo !== null && (
        <PromoLightbox images={images} index={photo} onIndex={setPhoto} onClose={() => setPhoto(null)} />
      )}
    </div>
  );
}

/**
 * Pozele la mărime mare, în `<dialog>` nativ: Escape, focusul și fundalul
 * blocat vin de la browser, iar dialogul stă în top layer, deasupra zonei de
 * derulare a caruselului care altfel l-ar tăia.
 */
function PromoLightbox({
  images,
  index,
  onIndex,
  onClose,
}: {
  images: { src: string; alt: string }[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const img = images[index];
  const step = (d: number) => onIndex((index + d + images.length) % images.length);

  useEffect(() => {
    if (!ref.current?.open) ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
      }}
      className="m-auto w-[min(96vw,1100px)] rounded-xl bg-gray-950 p-0 text-white backdrop:bg-black/70"
    >
      <div className="relative w-full h-[min(75vh,720px)]">
        <Image
          src={img.src}
          alt={img.alt}
          fill
          sizes="(min-width: 1150px) 1100px, 96vw"
          className="object-contain"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Poza anterioară"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Poza următoare"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
      <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
        <p className="text-white/85 leading-snug">{img.alt}</p>
        <div className="flex items-center gap-3 shrink-0">
          {images.length > 1 && (
            <span className="tabular-nums text-white/60">
              {index + 1}/{images.length}
            </span>
          )}
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="rounded-md border border-white/25 px-3 py-1 font-semibold hover:bg-white/10"
          >
            Închide
          </button>
        </div>
      </div>
    </dialog>
  );
}

/**
 * Varianta „featured" a slotului de partener: UN singur partener (primul după
 * sortarea Premium), gândit pentru capul paginii, cu acțiunile ca butoane
 * reale, nu iconițe. Există pentru plasările vândute ca poziție principală;
 * bannerul obișnuit rămâne pentru sloturile de listă. Aceleași evenimente,
 * același `sp`, aceeași logică de preview, deci raportul lunar din
 * /admin/analytics/sponsori nu se schimbă.
 *
 * Fără partener activ pe poziție nu se randează nimic: în capul paginii un
 * „spațiu disponibil" ar împinge conținutul în jos fără să aducă nimic.
 */
export function SponsorFeature({ position }: { position: SponsorPosition }) {
  const audience = POSITION_AUDIENCE[position];
  const previewSlug = usePreviewSlug();
  const now = useNow();

  const sponsor = useMemo(() => {
    if (previewSlug) {
      const pending = ALL_SPONSORS.find((s) => s.slug === previewSlug && !s.active);
      if (pending && (pending.positions === 'all' || pending.positions.includes(position))) {
        return pending;
      }
    }
    const live = LIVE_SPONSORS.filter(
      (s) =>
        (s.positions === 'all' || s.positions.includes(position)) &&
        (now === null || isRunning(s.run, now)),
    );
    live.sort((a, b) => Number(b.positions === 'all') - Number(a.positions === 'all'));
    return live[0] ?? null;
  }, [position, previewSlug, now]);

  const isPreview = Boolean(previewSlug) && sponsor?.slug === previewSlug;

  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (isPreview || !sponsor) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !tracked.current) {
            tracked.current = true;
            window.umami?.track('sponsor-impression', trackingProps(sponsor, position, audience));
            obs.disconnect();
          }
        });
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [sponsor, position, audience, isPreview]);

  if (!sponsor) return null;

  const props = trackingProps(sponsor, position, audience);
  const attrs = (event: 'sponsor-click' | 'sponsor-call' | 'sponsor-whatsapp') =>
    isPreview
      ? {}
      : {
          'data-umami-event': event,
          'data-umami-event-sponsor': props.sponsor,
          'data-umami-event-position': props.position,
          'data-umami-event-audience': props.audience,
          'data-umami-event-sp': props.sp,
        };

  return (
    <>
      {isPreview && <PreviewPill />}
      <div
        ref={ref}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary-dark via-secondary to-secondary-light p-5 sm:p-6"
      >
        {/* Un halo amber discret în colț, ca panoul să nu fie un dreptunghi mort. */}
        <div
          aria-hidden
          className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-primary/25 blur-3xl"
        />
        <p className="relative text-[10px] uppercase tracking-wider text-white/40">Publicitate</p>

        <div className="relative mt-3 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <a
            href={buildUrl(sponsor.baseUrl, position, audience)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            {...attrs('sponsor-click')}
            className="group flex items-center gap-4 flex-1 min-w-0"
          >
            <span className="w-14 h-14 rounded-xl bg-white p-1.5 shrink-0 flex items-center justify-center">
              <Image
                src={sponsor.logo}
                alt={sponsor.name}
                width={56}
                height={56}
                className="w-full h-full object-contain"
              />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-bold text-white leading-tight group-hover:text-primary-light transition-colors">
                {sponsor.name}
              </span>
              <span className="mt-1 block text-sm text-white/70 leading-snug">
                {sponsor.messages[audience] ?? sponsor.messages.client}
              </span>
            </span>
          </a>

          <div className="flex flex-wrap gap-2 shrink-0">
            {sponsor.phone && (
              <a
                href={`tel:${sponsor.phone.replace(/\s+/g, '')}`}
                {...attrs('sponsor-call')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-4 py-2.5 transition-colors"
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {sponsor.phone}
              </a>
            )}
            {sponsor.whatsapp && (
              <a
                href={`https://wa.me/${sponsor.whatsapp}?text=${encodeURIComponent(WHATSAPP_PREFILL)}`}
                target="_blank"
                rel="noopener noreferrer"
                {...attrs('sponsor-whatsapp')}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 hover:bg-white/10 text-white font-semibold text-sm px-4 py-2.5 transition-colors"
              >
                <svg className="w-4 h-4 shrink-0 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function PreviewPill() {
  return (
    <div className="fixed bottom-4 left-4 z-50 rounded-full bg-amber-500 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg">
      Previzualizare partener · nu e live ·{' '}
      <a href="?preview=off" className="underline">
        ieși
      </a>
    </div>
  );
}
