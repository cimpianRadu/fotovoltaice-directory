'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import sponsorsData from '@/data/sponsors.json';
import { type SponsorPosition } from '@/lib/sponsor-positions';
import { isRunning, type SponsorRun } from '@/lib/sponsor-run';

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
 */
export type SponsorAudience = 'client' | 'instalator';

export type { SponsorPosition };

// Cine citește pagina, nu ce conține pagina. Paginile de instalatori sunt cele
// unde ajunge o firmă care caută de lucru sau se ocupă de propria prezență:
// feedul de cereri, portalul revendicărilor, formularul de listare.
const POSITION_AUDIENCE: Record<SponsorPosition, SponsorAudience> = {
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

  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (isPreview) return;
    if (sponsors.length === 0) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !tracked.current) {
            tracked.current = true;
            sponsors.forEach((sponsor) => {
              window.umami?.track('sponsor-impression', trackingProps(sponsor, position, audience));
            });
            obs.disconnect();
          }
        });
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [position, audience, sponsors, isPreview]);

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

  return (
    <>
      {isPreview && <PreviewPill />}
      <div ref={ref} className="@container rounded-xl border border-primary/15 bg-primary/5 p-5">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Publicitate</p>
        <p className="text-xs font-semibold text-primary-dark uppercase tracking-wider mb-3">
          {title}
        </p>
        {/* Cu doi parteneri și loc destul, cardurile stau unul lângă altul.
            Pragul e pe lățimea BANNERULUI (container query), nu a ecranului:
            sidebarul din /ghid rămâne pe o coloană și la viewport lat. */}
        <div className={`grid gap-2.5 ${sponsors.length > 1 ? '@2xl:grid-cols-2' : ''}`}>
          {sponsors.map((sponsor) => (
            <SponsorCard
              key={sponsor.slug}
              sponsor={sponsor}
              position={position}
              audience={audience}
              preview={isPreview}
            />
          ))}
        </div>
        <a
          href="/publicitate"
          className="block mt-3 text-xs text-gray-500 hover:text-primary-dark transition-colors text-center"
        >
          Firma ta aici? Află mai multe →
        </a>
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
  const props = trackingProps(sponsor, position, audience);
  const attrs = (event: 'sponsor-click' | 'sponsor-call' | 'sponsor-whatsapp' | 'sponsor-social') =>
    preview
      ? {}
      : {
          'data-umami-event': event,
          'data-umami-event-sponsor': props.sponsor,
          'data-umami-event-position': props.position,
          'data-umami-event-audience': props.audience,
          'data-umami-event-sp': props.sp,
        };

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
