import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import Button from '@/components/ui/Button';
import AdInquiryForm from '@/components/forms/AdInquiryForm';
import TrafficWidget from '@/components/publicitate/TrafficWidget';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import { getCompanies, getCoveredCounties } from '@/lib/utils';
import guidesData from '@/data/guides.json';

export const metadata: Metadata = {
  title: 'Publicitate - Promovează-ți Firma pe Instalatori Fotovoltaice',
  description:
    'Pachete de promovare pe Instalatori Fotovoltaice România: Basic 49€ (furnizori), Plus 99€ și Premium 249€/lună + TVA. Bundle Național Plus 299€ (Plus+Premium, ~14% reducere). Free pentru instalatori. Fiecare pachet are placement-uri proprii — nu se suprapun.',
  alternates: { canonical: '/publicitate' },
};

/* ── Mock-up building blocks ─────────────────────────────────── */

function MockBrowser({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
        <span className="ml-2 text-[10px] text-gray-400 truncate">{url}</span>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

/** Free preview — neutral card among others */
function PreviewFree() {
  return (
    <MockBrowser url="instalatori-fotovoltaice.ro/firme">
      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">În lista de firme</p>
      <div className="space-y-2">
        <div className="p-2.5 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-900">Firma Ta S.R.L.</p>
          <p className="text-[10px] text-gray-500">București, Ilfov</p>
          <div className="mt-1.5 flex gap-1">
            <span className="text-[8px] border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Hale industriale</span>
            <span className="text-[8px] border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">ANRE C2A</span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg border border-gray-100 opacity-70">
          <p className="text-xs font-semibold text-gray-700">Altă Firmă S.R.L.</p>
          <p className="text-[10px] text-gray-400">Cluj-Napoca, Cluj</p>
        </div>
        <div className="p-2.5 rounded-lg border border-gray-100 opacity-70">
          <p className="text-xs font-semibold text-gray-700">Firmă Obișnuită S.R.L.</p>
          <p className="text-[10px] text-gray-400">Timișoara, Timiș</p>
        </div>
      </div>
      <p className="mt-2 text-[9px] text-gray-400 italic">Ordine neutră — alfabetic sau după județ</p>
    </MockBrowser>
  );
}

/** Basic preview — popup carousel slot */
function PreviewBasic() {
  return (
    <MockBrowser url="instalatori-fotovoltaice.ro (orice pagină)">
      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">Popup carousel — colț dreapta-jos</p>
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 bg-gray-100 rounded w-3/4" />
          <div className="h-2 bg-gray-50 rounded w-full" />
          <div className="h-2 bg-gray-50 rounded w-5/6" />
          <div className="h-2 bg-gray-50 rounded w-full" />
          <div className="h-2 bg-gray-50 rounded w-2/3" />
          <div className="h-2 bg-gray-50 rounded w-3/4" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 relative h-14">
        <div className="absolute bottom-0 right-0 w-32 rounded-lg border border-gray-200 bg-white shadow-md p-1.5">
          <div className="absolute top-0.5 right-1 text-gray-300 text-[8px]">×</div>
          <p className="text-[6px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">Partener · 1/4</p>
          <div className="flex items-start gap-1">
            <div className="w-3 h-3 rounded bg-primary/10 shrink-0" />
            <div className="min-w-0">
              <p className="text-[8px] font-semibold text-gray-900 leading-tight">Firma Ta</p>
              <p className="text-[7px] text-primary-dark">Vezi ofertă →</p>
            </div>
          </div>
          <div className="mt-1 h-0.5 bg-gray-100 rounded overflow-hidden">
            <div className="h-full w-1/3 bg-primary/40 rounded" />
          </div>
        </div>
      </div>
      <p className="mt-1 text-[8px] text-gray-400 italic">Carousel: 15s/partener, max 8 active, dismissible</p>
    </MockBrowser>
  );
}

/** Plus preview — top promovate per județ */
function PreviewPlus() {
  return (
    <MockBrowser url="instalatori-fotovoltaice.ro/firme/judet/cluj">
      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">Top „Promovate&quot; pe pagina județului</p>
      <div className="rounded-md bg-amber-50/50 border border-amber-200/60 p-1.5 mb-2">
        <p className="text-[8px] font-semibold uppercase tracking-wider text-amber-700 mb-1">Promovate · max 3 / județ</p>
        <div className="space-y-1.5">
          <div className="p-2 rounded border-2 border-primary/40 bg-white">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-900">Firma Ta Plus S.R.L.</p>
              <span className="text-[7px] bg-primary/10 text-primary-dark px-1.5 py-0.5 rounded-full font-medium">Promovat</span>
            </div>
            <p className="text-[10px] text-gray-500">Cluj-Napoca</p>
          </div>
          <div className="p-2 rounded border border-gray-200 bg-white opacity-80">
            <p className="text-[10px] font-semibold text-gray-700">Altă Firmă Promovată</p>
          </div>
          <div className="p-2 rounded border border-gray-200 bg-white opacity-60">
            <p className="text-[10px] font-semibold text-gray-700">A Treia Firmă Promovată</p>
          </div>
        </div>
      </div>
      <p className="text-[9px] text-gray-400 mb-1">Restul firmelor din județ</p>
      <div className="space-y-1">
        <div className="h-3 bg-gray-50 rounded" />
        <div className="h-3 bg-gray-50 rounded" />
      </div>
      <p className="mt-2 text-[8px] text-gray-400 italic">+ apariție pe /verificare-anre + badge „Promovat&quot;</p>
    </MockBrowser>
  );
}

/** Premium preview — pool rotativ pe pagini globale */
function PreviewPremium() {
  return (
    <MockBrowser url="instalatori-fotovoltaice.ro (homepage, ghiduri, calculator, clasament)">
      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">Pool rotativ pe paginile globale</p>
      <div className="rounded-lg border border-secondary/30 bg-linear-to-r from-secondary/10 to-primary/5 p-2.5 mb-2.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-[10px] font-semibold text-gray-900 truncate">Firma Ta Premium — Top Național</p>
            <span className="text-[7px] bg-secondary/15 text-secondary-dark px-1 py-0.5 rounded-full font-medium shrink-0">Premium</span>
          </div>
          <p className="text-[9px] text-gray-500">Logo + descriere lungă + social links</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <div className="p-1.5 rounded border border-gray-100 bg-gray-50">
          <p className="text-[7px] text-gray-400 uppercase tracking-wider">Homepage</p>
          <div className="h-2 bg-gray-100 rounded mt-1" />
        </div>
        <div className="p-1.5 rounded border border-gray-100 bg-gray-50">
          <p className="text-[7px] text-gray-400 uppercase tracking-wider">Ghiduri</p>
          <div className="h-2 bg-gray-100 rounded mt-1" />
        </div>
        <div className="p-1.5 rounded border border-gray-100 bg-gray-50">
          <p className="text-[7px] text-gray-400 uppercase tracking-wider">/calculator</p>
          <div className="h-2 bg-gray-100 rounded mt-1" />
        </div>
        <div className="p-1.5 rounded border border-gray-100 bg-gray-50">
          <p className="text-[7px] text-gray-400 uppercase tracking-wider">/clasament</p>
          <div className="h-2 bg-gray-100 rounded mt-1" />
        </div>
      </div>
      <p className="text-[8px] text-gray-400 italic">Pool max 5 firme · 20% share-of-voice fiecare · rotație random la reload</p>
    </MockBrowser>
  );
}

/* ── Helpers ──────────────────────────────────────────────────── */

function Check() {
  return <span className="text-green-500 shrink-0">&#10003;</span>;
}

function Feature({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <li className={`flex gap-2 ${strong ? 'font-semibold text-gray-900' : ''}`}>
      <Check />
      <span>{children}</span>
    </li>
  );
}


/* ── Page ─────────────────────────────────────────────────────── */

export default function AdvertisePage() {
  const totalCompanies = getCompanies().length;
  const totalCounties = getCoveredCounties().length;
  const totalGuides = guidesData.guides.length;

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Publicitate', url: '/publicitate' },
        ])}
      />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Publicitate' }]} />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Publicitate pe Instalatori Fotovoltaice
          </h1>
          <p className="text-gray-600 mt-2 max-w-2xl leading-relaxed">
            Pachete cu placement-uri proprii — <strong>nu se suprapun</strong>. Free pentru instalatori (baza directorului), Basic pentru furnizori și distribuitori, Plus + Premium pentru instalatori care vor expunere prioritară. Bundle <strong>Național Plus</strong> combină Plus + Premium cu ~14% reducere. Prețuri în EUR, facturare în RON la cursul BNR din ziua emiterii facturii.
          </p>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Pentru instalatori</p>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <a
              href="#free"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm font-medium text-primary-dark hover:bg-primary/10 transition-colors"
            >
              Free <span className="text-xs text-gray-500">0€</span>
            </a>
            <a
              href="#plus"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm font-medium text-primary-dark hover:bg-primary/10 transition-colors"
            >
              Plus <span className="text-xs text-gray-500">99€</span>
            </a>
            <a
              href="#premium"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm font-medium text-primary-dark hover:bg-primary/10 transition-colors"
            >
              Premium <span className="text-xs text-gray-500">249€</span>
            </a>
            <a
              href="#bundle"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg bg-secondary/10 border border-secondary/30 text-sm font-medium text-secondary-dark hover:bg-secondary/15 transition-colors"
            >
              Național Plus <span className="text-xs text-gray-500">299€ <span className="text-secondary-dark">-14%</span></span>
            </a>
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Pentru furnizori / distribuitori</p>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3">
            <a
              href="#basic"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors sm:col-span-1"
            >
              Basic <span className="text-xs text-gray-500">49€</span>
            </a>
          </div>
        </div>

        {/* Audience */}
        <div className="bg-surface rounded-xl border border-border p-6 mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Audiența Noastră</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-dark">{totalCompanies}</p>
              <p className="text-sm text-gray-500">Firme listate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-dark">{totalCounties}</p>
              <p className="text-sm text-gray-500">Județe acoperite</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-dark">{totalGuides}</p>
              <p className="text-sm text-gray-500">Ghiduri publicate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-dark">B2B</p>
              <p className="text-sm text-gray-500">Focus comercial</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Vizitatorii noștri sunt <strong>manageri de facilități, directori tehnici, antreprenori
            și consultanți energetici</strong> care caută activ instalatori fotovoltaici și
            informații despre investiții în energie solară pentru companii. Audiență 100% nișată pe
            fotovoltaice comerciale și industriale din România.
          </p>
        </div>

        {/* Live traffic widget */}
        <TrafficWidget />

        {/* ═══════════════════════════════════════════════════════════
             Tier-uri NU sunt cumulative — fiecare are placement-urile lui
           ═══════════════════════════════════════════════════════════ */}

        <div className="mb-4 rounded-xl border border-secondary/20 bg-secondary/5 p-4 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-secondary-dark flex-shrink-0 mt-0.5" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-gray-900 mb-1">Pachetele NU sunt cumulative</p>
            <p className="text-gray-700 leading-relaxed">
              Fiecare pachet are placement-uri proprii — nu se suprapun. Plus și Premium sunt complementare (județ vs național) — instalatorii care vor ambele iau <a href="#bundle" className="text-secondary-dark hover:underline font-medium">Național Plus (299€/lună, ~14% reducere)</a>. Basic e dedicat furnizorilor și distribuitorilor.
            </p>
          </div>
        </div>

        {/* No-risk guarantee */}
        <div className="mb-8 rounded-xl border border-green-200 bg-green-50/60 p-4 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-gray-900 mb-1">Anulare gratuită în primele 7 zile</p>
            <p className="text-gray-700 leading-relaxed">
              Activezi orice pachet plătit, îl încerci 7 zile cu date Umami reale, iar dacă nu te convinge anulăm fără întrebări — refund 100% pe luna în curs. <strong>Fără contract minim</strong>, fără cost ascuns, fără ca tu să riști ceva în primele 7 zile.
            </p>
          </div>
        </div>

        {/* Tier 1: Free */}
        <section id="free" className="mb-10 scroll-mt-20">
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-lg">Free</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Doar instalatori</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Baza pe care e construit directorul</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                0 <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <p className="text-xs text-gray-500 mb-5">fără costuri ascunse</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ce primești</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature>Profil în director cu date contact, certificări, localizare</Feature>
                <Feature>Pagină proprie <code className="text-xs bg-gray-100 px-1 rounded">/firme/firma-ta</code> indexată Google</Feature>
                <Feature>Verificare ANRE live din registru oficial</Feature>
                <Feature>Afișare în filtrele după județ, specializare și atestate</Feature>
                <Feature>Apariție în clasament cu date financiare reale</Feature>
              </ul>
              <Button
                href="/listeaza-firma"
                variant="outline"
                size="md"
                className="w-full mt-5"
              >
                Listează-ți firma gratuit
              </Button>
            </div>
            <div className="hidden sm:block">
              <PreviewFree />
            </div>
          </div>
        </section>

        {/* Tier 2: Plus */}
        <section id="plus" className="mb-10 scroll-mt-20">
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border-2 border-primary p-6 relative bg-white">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                Cel mai popular
              </span>
              <div className="flex items-center gap-2 mb-1 mt-1 flex-wrap">
                <h3 className="font-bold text-gray-900 text-lg">Plus</h3>
                <span className="text-xs bg-primary/10 text-primary-dark px-2 py-0.5 rounded-full">Doar instalatori</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Vizibilitate prioritară pe județul tău + verificare ANRE</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                99 <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <p className="text-sm text-gray-600 mb-5">+ TVA (21%) · Anual 990€ (2 luni gratis)</p>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ce primești</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature strong>Top &quot;Promovate&quot; pe pagina județului tău (max 3 firme/județ, rotație random egală)</Feature>
                <Feature strong>Featured pe <code className="text-xs bg-gray-100 px-1 rounded">/verificare-anre</code> (max 5 firme, rotație random)</Feature>
                <Feature strong>Badge „Promovat&quot; vizibil pe profil și în liste</Feature>
                <Feature>Share-of-voice comunicat: ~33% din vizualizările paginii județului</Feature>
                <Feature>Raport lunar: impresii pagină, click-uri pe profil, click-uri telefon/site</Feature>
              </ul>
              <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Cap pe județ — first come, first served:</strong> max 3 firme Plus simultan per județ. Dacă județul tău e plin, intri pe lista de așteptare.
              </div>
              <div className="mt-3 p-3 rounded-lg bg-linear-to-r from-secondary/10 to-primary/10 border border-secondary/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] bg-secondary text-white px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">First-Mover</span>
                  <span className="text-sm font-bold text-gray-900">59€/lună × 6 luni</span>
                  <span className="text-xs text-gray-400 line-through">99€</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Primele <strong>5 firme</strong> care activează Plus primesc <strong>40% reducere pe 6 luni</strong> (59€/lună în loc de 99€). După cele 6 luni trec la 99€ standard. Tu ne ajuți să dovedim modelul, noi îți dăm preț de pionierat. <strong>Sloturi rămase:</strong> primul venit, primul servit.
                </p>
                <p className="text-[11px] text-gray-600 mt-2 leading-relaxed border-t border-secondary/20 pt-2">
                  <strong>Reguli cap:</strong> oferta respectă cap-ul standard de <strong>max 3 firme Plus / județ</strong> și e limitată la <strong>1 First-Mover / județ</strong> ca să nu blocheze o singură zonă. Cele 5 sloturi vor fi distribuite în județe diferite.
                </p>
              </div>
              <Button href="#ad-inquiry?tier=plus-first-mover" variant="primary" size="md" className="w-full mt-3">
                Activează Plus First-Mover (59€)
              </Button>
              <Button href="#ad-inquiry?tier=plus" variant="outline" size="md" className="w-full mt-2">
                Activează Plus standard (99€)
              </Button>
            </div>
            <div className="hidden sm:block">
              <PreviewPlus />
            </div>
          </div>
        </section>

        {/* Tier 3: Premium */}
        <section id="premium" className="mb-10 scroll-mt-20">
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border border-secondary/30 bg-linear-to-br from-secondary/5 via-white to-primary/5 p-6 relative">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold text-gray-900 text-lg">Premium</h3>
                <span className="text-xs bg-secondary/10 text-secondary-dark px-2 py-0.5 rounded-full">Doar instalatori</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Expunere națională + profil complet</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                249 <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <p className="text-sm text-gray-600 mb-5">+ TVA (21%) · Anual 2.490€ (2 luni gratis)</p>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Placement-uri (pool rotativ pe paginile globale)</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature strong>Apariție pe homepage, secțiune „Recomandați&quot;</Feature>
                <Feature strong>Banner pe ghidurile relevante pentru nișa ta</Feature>
                <Feature strong>Featured pe <code className="text-xs bg-gray-100 px-1 rounded">/calculator-panouri-fotovoltaice</code></Feature>
                <Feature strong>Secțiune Partener pe <code className="text-xs bg-gray-100 px-1 rounded">/clasament</code></Feature>
                <Feature>Pool max 5 firme · share-of-voice 20% per pagină · rotație random la reload</Feature>
              </ul>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2">Profil complet</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature strong>Logo proeminent pe profil</Feature>
                <Feature strong>Descriere lungă (~250-300 cuvinte)</Feature>
                <Feature strong>Social media links (Facebook, LinkedIn, Instagram, YouTube)</Feature>
                <Feature>Badge „Premium&quot; vizibil</Feature>
                <Feature>Raport lunar extins: impresii, timp citire, conversii</Feature>
              </ul>
              <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Cap național — first come, first served:</strong> max 5 firme Premium în pool-ul global. Dacă pool-ul e plin, intri pe lista de așteptare.
              </div>
              <Button href="#ad-inquiry?tier=premium" variant="secondary" size="md" className="w-full mt-5">
                Activează Premium
              </Button>
            </div>
            <div className="hidden sm:block">
              <PreviewPremium />
            </div>
          </div>
        </section>

        {/* Rotation & Share-of-Voice explainer */}
        <section className="mb-12">
          <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 via-white to-secondary/5 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <h2 className="text-lg font-bold text-gray-900">Cum funcționează rotația — transparență totală</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              Pe Basic, Plus și Premium avem mai multe firme plătitoare per slot. Ca să fie corect față de toți, folosim <strong>rotație random egală</strong> — fiecare firmă apare pentru o parte din vizitatori, comunicat explicit. Niciun pachet NU promite „mereu primul&quot; (e fizic imposibil când ai 2+ plătitori), ci <strong>share echitabil garantat prin cap pe slot</strong>.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Basic rotation */}
              <div className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Basic</span>
                  <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full font-mono">49€</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Popup carousel</p>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  Popup-ul din colț dreapta-jos rotește la fiecare <strong>15 secunde</strong> între parteneri. Maxim 8 activi simultan. Un ciclu complet = 2 minute.
                </p>
                <div className="text-[11px] text-gray-500 space-y-0.5">
                  <p>• Cap: <strong>max 8 parteneri</strong></p>
                  <p>• Share: <strong>1/8 din timp (~12.5%)</strong> per partener</p>
                  <p>• Rotație: <strong>timp-based, 15s</strong></p>
                </div>
              </div>

              {/* Plus rotation */}
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary-dark">Plus</span>
                  <span className="text-[10px] bg-primary/15 text-primary-dark px-1.5 py-0.5 rounded-full font-mono">99€</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Top „Promovate&quot; pe județ</p>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  Pe pagina județului, secțiunea „Promovate&quot; afișează firmele plătite. La fiecare reload, ordinea e <strong>random</strong> între cele 3 sloturi. Featured pe <code className="text-[10px] bg-white px-1 rounded">/verificare-anre</code> funcționează la fel (pool 5).
                </p>
                <div className="text-[11px] text-gray-500 space-y-0.5">
                  <p>• Cap: <strong>max 3 firme/județ</strong></p>
                  <p>• Share: <strong>~33% vizualizări fiecare</strong></p>
                  <p>• Rotație: <strong>random la reload</strong></p>
                </div>
              </div>

              {/* Premium rotation */}
              <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary-dark">Premium</span>
                  <span className="text-[10px] bg-secondary/15 text-secondary-dark px-1.5 py-0.5 rounded-full font-mono">249€</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Pool global rotativ</p>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  Pe homepage, ghiduri, <code className="text-[10px] bg-white px-1 rounded">/calculator</code> și <code className="text-[10px] bg-white px-1 rounded">/clasament</code> avem un pool unic de max 5 firme. La fiecare reload, ordinea e <strong>random</strong>.
                </p>
                <div className="text-[11px] text-gray-500 space-y-0.5">
                  <p>• Cap: <strong>max 5 firme național</strong></p>
                  <p>• Share: <strong>20% vizualizări fiecare</strong></p>
                  <p>• Rotație: <strong>random la reload</strong></p>
                </div>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-lg bg-white border border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Exemplu concret pentru Plus</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Dacă pagina <code className="text-xs bg-gray-100 px-1 rounded">/firme/judet/cluj</code> are <strong>~3.000 vizualizări/lună</strong> și avem 3 firme Plus active în Cluj, fiecare primește în medie <strong>~1.000 impresii/lună</strong> în secțiunea „Promovate&quot;. Datele exacte le primești în raportul lunar Umami.
              </p>
            </div>

            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              <strong>De ce nu garantăm „mereu primul&quot;:</strong> când 3 firme plătesc același pachet pentru același placement, e matematic imposibil ca toate să fie „primele&quot;. Rotația random egală e singura soluție corectă — toți primesc share comparabil, transparent comunicat. Modelul e folosit de directoare ca G2.com, Houzz Pro, Clutch.co.
            </p>
          </div>
        </section>

        {/* Bundle: Național Plus (Plus + Premium) */}
        <section id="bundle" className="mb-12 scroll-mt-20">
          <div className="rounded-xl border-2 border-secondary/40 bg-linear-to-br from-secondary/10 via-white to-primary/10 p-6 sm:p-8 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
              Economisești ~14%
            </span>
            <div className="grid gap-6 sm:grid-cols-2 items-center">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-gray-900 text-xl">Național Plus</h3>
                  <span className="text-xs bg-secondary/15 text-secondary-dark px-2 py-0.5 rounded-full font-medium">Pentru instalatori cu ambiție regională / națională</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">Plus + Premium simultan — județul tău + paginile globale</p>
                <div className="flex items-baseline gap-3 mb-1">
                  <p className="text-4xl font-bold text-gray-900">
                    299 <span className="text-base font-normal text-gray-500">EUR/lună</span>
                  </p>
                  <p className="text-sm text-gray-400 line-through">348€</p>
                </div>
                <p className="text-sm text-secondary-dark font-medium mb-1">Economisești 49€/lună · 588€/an</p>
                <p className="text-sm text-gray-600 mb-5">+ TVA (21%) · Anual 2.990€ (2 luni gratis vs 348€×12=4.176€ la lunar separat → economie totală 1.186€/an)</p>

                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Include simultan</p>
                <ul className="space-y-2 text-sm text-gray-600 mb-5">
                  <Feature strong>Tot din Plus — top „Promovate&quot; pe județul tău + featured /verificare-anre + badge</Feature>
                  <Feature strong>Tot din Premium — pool global pe homepage, ghiduri, /calculator, /clasament + profil complet</Feature>
                </ul>

                <p className="text-xs font-semibold text-secondary-dark uppercase tracking-wide mb-2">Exclusiv Național Plus (nu se vând separat)</p>
                <ul className="space-y-2 text-sm text-gray-600 mb-5">
                  <Feature strong>Badge „Verified Top&quot; — distinct vizual de Plus/Premium standard, pe profil + în listări</Feature>
                  <Feature strong>Raport săptămânal de trafic (vs lunar pe Plus/Premium) — vezi tendințele aproape real-time</Feature>
                  <Feature strong>Prioritate absolută pe waitlist (Plus + Premium) când se eliberează sloturi</Feature>
                  <Feature>Reducere garantată dacă rămâi pe Național Plus minim 6 luni</Feature>
                </ul>
                <Button href="#ad-inquiry?tier=bundle" variant="secondary" size="lg" className="w-full">
                  Activează Național Plus
                </Button>
              </div>
              <div className="rounded-xl border border-secondary/20 bg-white/60 p-5">
                <p className="text-xs font-semibold text-secondary-dark uppercase tracking-wider mb-3">Defalcare reducere</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Plus</span>
                    <span className="font-mono text-gray-900">99€</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Premium</span>
                    <span className="font-mono text-gray-900">249€</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-700 font-medium">Total separat</span>
                    <span className="font-mono font-semibold text-gray-900">348€</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-secondary-dark font-medium">Reducere Bundle</span>
                    <span className="font-mono font-semibold text-secondary-dark">−49€</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-900 font-bold">Național Plus</span>
                    <span className="font-mono font-bold text-gray-900 text-lg">299€</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-3 leading-relaxed">
                  Reducere ~14% aplicată la suma celor 2 pachete. La plata anuală, încă 2 luni gratis (299€×10 = 2.990€/an). Bundle e dedicat instalatorilor — Basic se cumpără separat de furnizori/distribuitori.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Section break: pentru furnizori / distribuitori ─── */}
        <div className="my-12 flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
            Pentru furnizori și distribuitori
          </p>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        </div>

        {/* Tier 4: Basic (moved to end — furnizori only) */}
        <section id="basic" className="mb-10 scroll-mt-20">
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-lg">Basic</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Furnizori, distribuitori, materiale</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Slot în popup carousel — vizibil pe toate paginile site-ului</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                49 <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <p className="text-sm text-gray-600 mb-5">+ TVA (21%) · Anual 490€ (2 luni gratis)</p>
              <div className="mb-4 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                <strong>Pentru cine:</strong> distribuitori panouri/invertoare/structuri, furnizori materiale electrice, echipamente specializate (batatoare stâlpi, structuri, baterii), SaaS și tools pentru industrie. <em>Instalatorii folosesc Plus sau Premium — placement-urile lor sunt mai relevante.</em>
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ce primești</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature strong>Slot în popup carousel — apare 15 secunde, apoi rotește la următorul</Feature>
                <Feature>Maxim 8 parteneri activi simultan în carousel — fără diluare</Feature>
                <Feature>Vizibil pe toate paginile site-ului (homepage, ghiduri, firme, etc.)</Feature>
                <Feature>UTM tracking pe linkuri + eveniment Umami dedicat</Feature>
                <Feature>Raport lunar: impresii popup, click-uri, rata dismiss</Feature>
              </ul>
              <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Cum funcționează popup-ul:</strong> apare după câteva secunde pe toate paginile site-ului. Fiecare partener primește 15 secunde de vizibilitate, apoi se rotește la următorul. Când ciclul ajunge la capăt, începe iar de la primul. Dismissible — userul îl poate închide în sesiune.
              </div>
              <div className="mt-3 p-3 rounded-lg bg-linear-to-r from-green-50 to-amber-50 border border-green-300">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider">100% SOV</span>
                  <span className="text-sm font-bold text-gray-900">Primii 3 parteneri</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  Pool-ul Basic e abia la început. <strong>Primii 3 plătitori au 100% timp de vizibilitate</strong> în popup până se umple primul ciclu de 4. Practic: cumperi 49€/lună și ești singurul (sau unul din 2-3) afișat pe tot site-ul. Cu cât pool-ul crește, SOV-ul tău scade gradual spre 12.5%, dar reducerea NU se aplică retroactiv — beneficiezi cât timp e gol pool-ul.
                </p>
              </div>
              <Button href="#ad-inquiry?tier=basic" variant="primary" size="md" className="w-full mt-3">
                Activează Basic
              </Button>
            </div>
            <div className="hidden sm:block">
              <PreviewBasic />
            </div>
          </div>
        </section>

        {/* Meta callout — explain the live popup */}
        <div className="mb-8 rounded-xl border border-primary/30 bg-primary/5 p-4 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary-dark flex-shrink-0 mt-0.5" aria-hidden="true">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-gray-900">Popup-ul din colțul dreapta-jos pe care-l vezi acum?</p>
            <p className="text-gray-700 mt-1 leading-relaxed">
              E slotul popup carousel inclus în <strong>Basic — 49 EUR/lună + TVA</strong>, dedicat furnizorilor și distribuitorilor. Fiecare partener primește 15 secunde de vizibilitate, apoi se rotește la următorul. Maxim 8 parteneri activi simultan, pe tot site-ul, pe toate paginile.{' '}
              <a href="#basic" className="text-primary-dark hover:underline font-medium">
                Vezi detaliile →
              </a>
            </p>
          </div>
        </div>

        {/* Comparison table (desktop) + cards (mobile) */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Comparație rapidă</h2>

          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-border text-left">
                  <th className="px-4 py-3 font-semibold text-gray-700">Pachet</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">Preț (+ TVA 21%)</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Placement-uri proprii</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Free</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">0 €</td>
                  <td className="px-4 py-3 text-gray-600">Profil în director + verificare ANRE live</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Basic <span className="text-[10px] text-gray-500 ml-1">furnizori</span></td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">49 €</td>
                  <td className="px-4 py-3 text-gray-600">Popup carousel pe toate paginile (max 8 parteneri, 15s) — pentru furnizori și distribuitori</td>
                </tr>
                <tr className="bg-primary/5">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    Plus <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full ml-1">★</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">99 €</td>
                  <td className="px-4 py-3 text-gray-600">Top &quot;Promovate&quot; pe județ (max 3) + featured /verificare-anre + badge</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Premium</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">249 €</td>
                  <td className="px-4 py-3 text-gray-600">
                    Pool global rotativ (homepage, ghiduri, calculator, clasament — max 5) + profil complet (logo, descriere lungă, SM links)
                  </td>
                </tr>
                <tr className="bg-secondary/5">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    Național Plus <span className="text-[10px] bg-secondary text-white px-1.5 py-0.5 rounded-full ml-1">−14%</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">299 €</td>
                  <td className="px-4 py-3 text-gray-600">
                    Plus + Premium simultan pentru instalatori (economisești 49€/lună)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="sm:hidden space-y-3">
            {[
              { name: 'Free', price: '0 €', desc: 'Profil în director + verificare ANRE live (instalatori)', highlight: false },
              { name: 'Basic (furnizori)', price: '49 € + TVA', desc: 'Popup carousel pe toate paginile (max 8, 15s) — pentru furnizori, distribuitori', highlight: false },
              { name: 'Plus ★', price: '99 € + TVA · 59€ first-mover', desc: 'Top "Promovate" pe județ (max 3) + featured /verificare-anre + badge', highlight: true },
              { name: 'Premium', price: '249 € + TVA', desc: 'Pool global rotativ (homepage, ghiduri, calculator, clasament — max 5) + profil complet', highlight: false },
              { name: 'Național Plus −14%', price: '299 € + TVA', desc: 'Plus + Premium simultan pentru instalatori', highlight: false, secondary: true },
            ].map((row) => (
              <div
                key={row.name}
                className={`rounded-xl border p-4 ${
                  row.secondary
                    ? 'bg-secondary/5 border-secondary/30'
                    : row.highlight
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-white border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <p className="font-semibold text-gray-900 text-sm">{row.name}</p>
                  <p className="font-mono font-bold text-sm text-gray-900 shrink-0">{row.price}</p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{row.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ mini */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Întrebări rapide</h2>
          <div className="space-y-3">
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Pachetele sunt cumulative?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Nu. Fiecare pachet are placement-uri proprii — Basic e popup carousel pentru furnizori, Plus e top pe județul tău + ANRE, Premium e pool pe paginile globale. Pentru instalatori, dacă vrei Plus + Premium simultan, ia <strong>Național Plus (299€/lună, ~14% reducere)</strong>. Modelul ăsta evită blocaje de capacitate — nu există situația în care „Plus a umplut sloturile pentru Premium&quot;.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Ce înseamnă „pool rotativ&quot; și „share-of-voice&quot;?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Pe Plus și Premium avem cap-uri pe nr. de firme afișate simultan (max 3 per județ pentru Plus, max 5 pe pool global pentru Premium). La fiecare reload de pagină, ordinea e randomizată — fiecare firmă plătită apare în top pentru ~1/N din vizitatori, unde N = nr. firme active în pool-ul respectiv. Comunicăm transparent share-ul (~33% pe Plus, 20% pe Premium când pool-ul e plin) — nu promitem „mereu primul&quot;, ci share echitabil.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Ce înseamnă oferta First-Mover pe Plus?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Primele <strong>5 firme</strong> care activează Plus primesc <strong>40% reducere pe primele 6 luni</strong> (59€/lună în loc de 99€). După cele 6 luni trec automat la 99€/lună standard. E o ofertă de pionierat — tu ne ajuți să dovedim modelul cu testimoniale și date reale, noi îți dăm preț preferențial. <strong>Reguli cap:</strong> max 5 sloturi total, max 1 First-Mover / județ (ca să nu blocheze o singură zonă) și respectă cap-ul general de 3 firme Plus / județ. Dacă în județul tău e deja 1 First-Mover sau 3 firme Plus standard, oferta nu mai e disponibilă — first come, first served.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Ce se întâmplă dacă județul/pool-ul Plus sau Premium e plin?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Plus = max 3 firme/județ. Premium = max 5 firme național. Dacă slot-urile sunt ocupate, intri pe lista de așteptare și te anunțăm când se eliberează un loc — first come, first served. Național Plus (Bundle) are prioritate pe waitlist atât pentru Plus cât și pentru Premium.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Cine se poate înscrie la Basic?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Basic e dedicat <strong>furnizorilor și distribuitorilor</strong> care nu sunt firme de instalare — distribuitori panouri/invertoare/structuri, furnizori materiale electrice, echipamente specializate (batatoare stâlpi, structuri, baterii), SaaS și tools pentru industrie, cursuri/certificări. Instalatorii folosesc <strong>Free</strong> (profil de bază) sau <strong>Plus / Premium / Național Plus</strong> (placement-uri prioritare). Logica: instalatorii apar în liste filtrabile, furnizorii apar în popup-ul de awareness.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Ce se întâmplă dacă slotul Basic e plin?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Avem maxim 8 parteneri activi simultan în carousel. Dacă slot-urile sunt ocupate, intri pe lista de așteptare și te anunțăm când se eliberează un loc.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Cine primește rapoartele de trafic?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Toate pachetele plătite primesc raport lunar. Basic — impresii popup, click-uri, dismiss rate. Plus — adaugă vizualizări profil, click-uri telefon/site, sursa traficului. Premium — extins cu impresii pool global, timp citire profil, conversii. Free nu primește rapoarte.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Cum se compară cu Google Ads sau Facebook Ads?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="mt-3 text-sm text-gray-600 leading-relaxed space-y-2">
                <p>
                  Plătesc lucruri diferite. <strong>Google/Facebook Ads</strong> sunt CPC — plătești pentru fiecare click, dar lupți la licitație cu marketing-ul tuturor jucătorilor (inclusiv brand-uri mari care nu au nicio legătură cu fotovoltaice comerciale). Buget realist 99€/lună în Google Ads = 30-50 click-uri pe keyword-uri competitive ca „panouri fotovoltaice firmă&quot;, dintre care 70-80% sunt browser/curioși, nu prospecți reali. Cost lead calificat: 5-15€ × close rate scăzut = ROI imprevizibil.
                </p>
                <p>
                  <strong>Plus 99€/lună la noi</strong> = placement permanent timp de o lună pe pagina județului tău, văzut DOAR de oameni care au căutat activ „instalator fotovoltaic [județ]&quot; și au ajuns pe un director. <strong>Intent-ul e declarat</strong> (caută un instalator, nu citesc un articol generic). Lead-urile sunt mai puține numeric, dar calificate ca volum și mult mai bine convertibile. Plus, beneficiezi de SEO long-term — directory listing-ul tău rămâne indexat în Google și după ce nu mai plătești promovare prioritară.
                </p>
                <p>
                  <strong>Concluzie practică:</strong> Google Ads = volum de click-uri (bun pentru awareness top-funnel). Directory placement = lead-uri calificate bottom-funnel (oameni gata să ceară ofertă). Multe firme le folosesc complementar — nu sunt înlocuitori unul pentru altul.
                </p>
              </div>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Cum funcționează garanția de 7 zile?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Activezi pachetul, primești prima factură. În primele 7 zile calendaristice de la activare ai dreptul să anulezi din orice motiv (sau fără motiv) — printr-un email simplu. Returnăm 100% din suma facturată pe luna curentă, iar placement-urile se opresc imediat. Datele Umami pe care le primești în primele zile rămân la tine ca să-ți confirmi singur dacă merită. Garanția se aplică doar la prima activare, nu și la reînnoiri ulterioare.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Pot trece de pe un pachet pe altul?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Da. Schimbarea între pachete (upgrade sau downgrade) se face oricând prin contact direct — activăm noul pachet în maxim 48h și ajustăm prorata pe luna curentă. Nu există contract minim, poți închide oricând fără taxe ascunse.
              </p>
            </details>
          </div>
        </section>

        {/* Inquiry form */}
        <section id="ad-inquiry" className="mb-12 scroll-mt-20">
          <AdInquiryForm />
          <div className="mt-4 text-center text-sm text-gray-500">
            Preferi telefon? <a href="tel:+40751547174" className="text-primary-dark font-medium hover:underline">0751 547 174</a> · email <a href="mailto:contact@instalatori-fotovoltaice.ro" className="text-primary-dark font-medium hover:underline">contact@instalatori-fotovoltaice.ro</a>
          </div>
        </section>
      </div>
    </>
  );
}
