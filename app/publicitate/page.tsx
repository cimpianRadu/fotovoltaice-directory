import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import Button from '@/components/ui/Button';
import AdInquiryForm from '@/components/forms/AdInquiryForm';
import TrafficWidget from '@/components/publicitate/TrafficWidget';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import { getCompanies, getCoveredCounties } from '@/lib/utils';
import { PRICING, SOV, TVA_PCT } from '@/lib/pricing';
import guidesData from '@/data/guides.json';

export const metadata: Metadata = {
  title: 'Publicitate - Promovează-ți Firma pe Instalatori Fotovoltaice',
  description: `Promovare pe Instalatori Fotovoltaice România: listare Free pentru instalatori, Slot Popup ${PRICING.popup.monthly}€/lună (vizibil pe toate paginile), Premium ${PRICING.premium.monthly}€/lună (vizibilitate peste tot + profil complet) și Studiu de caz colaborativ (preț la cerere). Audiență 100% nișată B2B fotovoltaic, preponderent din căutări Google.`,
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

/** Popup preview — popup carousel slot */
function PreviewPopup() {
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

/** Premium preview — vizibilitate peste tot (județ + pagini naționale) */
function PreviewPremium() {
  return (
    <MockBrowser url="instalatori-fotovoltaice.ro (homepage, ghiduri, județ, clasament)">
      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">Vizibilitate peste tot pe site</p>
      <div className="rounded-lg border border-secondary/30 bg-linear-to-r from-secondary/10 to-primary/5 p-2.5 mb-2.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-[10px] font-semibold text-gray-900 truncate">Firma Ta Premium</p>
            <span className="text-[7px] bg-secondary/15 text-secondary-dark px-1 py-0.5 rounded-full font-medium shrink-0">Premium</span>
          </div>
          <p className="text-[9px] text-gray-500">Logo + descriere lungă + social links + badge ANRE</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <div className="p-1.5 rounded border border-gray-100 bg-gray-50">
          <p className="text-[7px] text-gray-400 uppercase tracking-wider">Homepage</p>
          <div className="h-2 bg-gray-100 rounded mt-1" />
        </div>
        <div className="p-1.5 rounded border border-gray-100 bg-gray-50">
          <p className="text-[7px] text-gray-400 uppercase tracking-wider">Top pe județul tău</p>
          <div className="h-2 bg-gray-100 rounded mt-1" />
        </div>
        <div className="p-1.5 rounded border border-gray-100 bg-gray-50">
          <p className="text-[7px] text-gray-400 uppercase tracking-wider">Ghiduri</p>
          <div className="h-2 bg-gray-100 rounded mt-1" />
        </div>
        <div className="p-1.5 rounded border border-gray-100 bg-gray-50">
          <p className="text-[7px] text-gray-400 uppercase tracking-wider">/clasament</p>
          <div className="h-2 bg-gray-100 rounded mt-1" />
        </div>
      </div>
      <p className="text-[8px] text-gray-400 italic">Pool rotativ · share echitabil · rotație random la reload</p>
    </MockBrowser>
  );
}

/** Case study preview — articol colaborativ publicat pe site */
function PreviewCaseStudy() {
  return (
    <MockBrowser url="instalatori-fotovoltaice.ro/ghid/studiu-de-caz-firma-ta">
      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">Articol / studiu de caz publicat</p>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-primary/15" />
          <div className="h-2 bg-gray-100 rounded w-1/3" />
        </div>
        <div className="h-16 rounded-lg bg-linear-to-br from-primary/10 to-secondary/10 border border-gray-100" />
        <div className="space-y-1">
          <div className="h-2 bg-gray-50 rounded w-full" />
          <div className="h-2 bg-gray-50 rounded w-11/12" />
          <div className="h-2 bg-gray-50 rounded w-full" />
          <div className="h-2 bg-gray-50 rounded w-3/4" />
        </div>
        <div className="rounded-md bg-amber-50/60 border border-amber-200/60 p-1.5">
          <p className="text-[8px] text-amber-800">„Proiect realizat de <strong>Firma Ta S.R.L.</strong> → vezi profil"</p>
        </div>
      </div>
      <p className="mt-2 text-[8px] text-gray-400 italic">Conținut indexat Google + citabil de asistenți AI</p>
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
            Listarea în site e <strong>gratuită</strong> pentru instalatori. Dacă vrei vizibilitate
            mai mare, am simplificat la <strong>3 opțiuni</strong>: un slot în bannerul promo (intrare),
            Premium (vizibilitate peste tot pe site) și un studiu de caz colaborativ. Prețuri în EUR,
            facturare în RON la cursul BNR din ziua emiterii facturii.
          </p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <a
              href="#free"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm font-medium text-primary-dark hover:bg-primary/10 transition-colors"
            >
              Free <span className="text-xs text-gray-500">0€</span>
            </a>
            <a
              href="#popup"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm font-medium text-primary-dark hover:bg-primary/10 transition-colors"
            >
              Slot Popup <span className="text-xs text-gray-500">{PRICING.popup.monthly}€</span>
            </a>
            <a
              href="#premium"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg bg-secondary/10 border border-secondary/30 text-sm font-medium text-secondary-dark hover:bg-secondary/15 transition-colors"
            >
              Premium <span className="text-xs text-gray-500">{PRICING.premium.monthly}€</span>
            </a>
            <a
              href="#studiu-de-caz"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-sm font-medium text-primary-dark hover:bg-primary/10 transition-colors"
            >
              Studiu de caz <span className="text-xs text-gray-500">la cerere</span>
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
            informații despre investiții în energie solară. Trafic preponderent din{' '}
            <strong>căutări Google</strong> (intenție mare) — plus oameni care ajung la noi din
            răspunsurile asistenților AI (ChatGPT, Claude, Gemini).
          </p>
        </div>

        {/* Live traffic widget */}
        <TrafficWidget />

        {/* No-risk guarantee */}
        <div className="my-8 rounded-xl border border-green-200 bg-green-50/60 p-4 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-gray-900 mb-1">Anulare gratuită în primele 7 zile</p>
            <p className="text-gray-700 leading-relaxed">
              Activezi Slot Popup sau Premium, îl încerci 7 zile cu date Umami reale, iar dacă nu te
              convinge anulăm fără întrebări — refund 100% pe luna în curs. <strong>Fără contract
              minim</strong>, fără cost ascuns.
            </p>
          </div>
        </div>

        {/* Tier 1: Free */}
        <section id="free" className="mb-10 scroll-mt-20">
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-lg">Free</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Instalatori</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Baza pe care e construit site-ul</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                0 <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <p className="text-xs text-gray-500 mb-5">fără costuri ascunse</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ce primești</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature>Profil în listă cu date contact, certificări, localizare</Feature>
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

        {/* Tier 2: Premium — vizibilitate peste tot */}
        <section id="premium" className="mb-10 scroll-mt-20">
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border-2 border-secondary/50 bg-linear-to-br from-secondary/5 via-white to-primary/5 p-6 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                Cel mai vizibil
              </span>
              <div className="flex items-center gap-2 mb-1 mt-1 flex-wrap">
                <h3 className="font-bold text-gray-900 text-lg">Premium</h3>
                <span className="text-xs bg-secondary/10 text-secondary-dark px-2 py-0.5 rounded-full">Instalatori</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Vizibilitate peste tot pe site + profil complet</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {PRICING.premium.monthly} <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <p className="text-sm text-gray-600 mb-5">+ TVA ({TVA_PCT}%) · Anual {PRICING.premium.annual}€ (2 luni gratis)</p>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Apari peste tot</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature strong>Top „Promovate&quot; pe pagina județului tău</Feature>
                <Feature strong>Pool rotativ pe homepage, ghiduri, <code className="text-xs bg-gray-100 px-1 rounded">/calculator</code> și <code className="text-xs bg-gray-100 px-1 rounded">/clasament</code></Feature>
                <Feature strong>Featured pe <code className="text-xs bg-gray-100 px-1 rounded">/verificare-anre</code> + badge „Promovat&quot;</Feature>
                <Feature>Pool max {SOV.premium.cap} firme · share echitabil · rotație random la reload</Feature>
              </ul>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2">Profil complet</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature strong>Logo proeminent + descriere lungă + social media links</Feature>
                <Feature>Raport lunar: impresii, click-uri profil, click-uri telefon/site</Feature>
              </ul>
              <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Cap — first come, first served:</strong> pool de max {SOV.premium.cap} firme Premium. Dacă e plin, intri pe lista de așteptare.
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

        {/* Tier 3: Slot Popup */}
        <section id="popup" className="mb-10 scroll-mt-20">
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-bold text-gray-900 text-lg">Slot Popup</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Opțiunea de intrare</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Slot în bannerul promo (colț dreapta-jos) — vizibil pe toate paginile</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {PRICING.popup.monthly} <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <p className="text-sm text-gray-600 mb-5">+ TVA ({TVA_PCT}%) · Anual {PRICING.popup.annual}€ (2 luni gratis)</p>
              <div className="mb-4 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                <strong>Pentru cine:</strong> instalatori care vor expunere ieftină de awareness, plus furnizori și distribuitori (panouri, invertoare, structuri, materiale electrice, echipamente, SaaS pentru industrie).
              </div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ce primești</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature strong>Slot în popup carousel — apare {SOV.popup.rotationSeconds} secunde, apoi rotește la următorul</Feature>
                <Feature>Maxim {SOV.popup.cap} parteneri activi simultan — fără diluare</Feature>
                <Feature>Vizibil pe toate paginile site-ului (homepage, ghiduri, firme, etc.)</Feature>
                <Feature>UTM tracking pe linkuri + eveniment Umami dedicat</Feature>
                <Feature>Raport lunar: impresii popup, click-uri, rata dismiss</Feature>
              </ul>
              <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>Cum funcționează popup-ul:</strong> apare după câteva secunde pe toate paginile. Fiecare partener primește {SOV.popup.rotationSeconds} secunde de vizibilitate, apoi se rotește la următorul. Dismissible — userul îl poate închide în sesiune.
              </div>
              <Button href="#ad-inquiry?tier=popup" variant="primary" size="md" className="w-full mt-3">
                Activează Slot Popup
              </Button>
            </div>
            <div className="hidden sm:block">
              <PreviewPopup />
            </div>
          </div>
        </section>

        {/* Tier 4: Studiu de caz */}
        <section id="studiu-de-caz" className="mb-10 scroll-mt-20">
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border-2 border-primary/40 bg-linear-to-br from-primary/5 via-white to-secondary/5 p-6 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                Cel mai bun pentru SEO + AI
              </span>
              <div className="flex items-center gap-2 mb-1 mt-1 flex-wrap">
                <h3 className="font-bold text-gray-900 text-lg">Studiu de caz</h3>
                <span className="text-xs bg-primary/10 text-primary-dark px-2 py-0.5 rounded-full">Articol colaborativ</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Scriem împreună un articol despre un proiect de-al tău, publicat pe site</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                La cerere
              </p>
              <p className="text-sm text-gray-600 mb-5">preț personalizat în funcție de proiect</p>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ce primești</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature strong>Articol / studiu de caz despre un proiect realizat de tine, scris împreună</Feature>
                <Feature strong>Conținut indexat Google — aduce trafic organic pe termen lung</Feature>
                <Feature strong>Citabil de asistenți AI (ChatGPT, Claude, Gemini)</Feature>
                <Feature>Link către profilul firmei tale din articol</Feature>
                <Feature>Rămâne publicat pe site — nu e o reclamă care expiră</Feature>
              </ul>
              <div className="mt-3 p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs text-gray-700 leading-relaxed">
                <strong>De ce merită:</strong> 73% din traficul nostru vine din căutări Google. Un studiu de caz e singura formă de promovare care <em>crește</em> vizibilitatea în loc s-o închirieze — rankează, e citat de AI și te prezintă concret.
              </div>
              <Button href="#ad-inquiry?tier=casestudy" variant="primary" size="md" className="w-full mt-5">
                Cere ofertă studiu de caz
              </Button>
            </div>
            <div className="hidden sm:block">
              <PreviewCaseStudy />
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
              Când avem mai multe firme plătitoare pe același placement, folosim <strong>rotație random
              egală</strong> — fiecare firmă apare pentru o parte din vizitatori. Niciun pachet NU
              promite „mereu primul&quot; (e imposibil când ai 2+ plătitori), ci <strong>share echitabil
              garantat prin cap pe slot</strong>.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Popup rotation */}
              <div className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Slot Popup</span>
                  <span className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-full font-mono">{PRICING.popup.monthly}€</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Popup carousel</p>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  Popup-ul din colț dreapta-jos rotește la fiecare <strong>{SOV.popup.rotationSeconds} secunde</strong> între parteneri. Maxim {SOV.popup.cap} activi simultan.
                </p>
                <div className="text-[11px] text-gray-500 space-y-0.5">
                  <p>• Cap: <strong>max {SOV.popup.cap} parteneri</strong></p>
                  <p>• Share: <strong>~{SOV.popup.sovPct}% din timp</strong> per partener</p>
                  <p>• Rotație: <strong>timp-based, {SOV.popup.rotationSeconds}s</strong></p>
                </div>
              </div>

              {/* Premium rotation */}
              <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary-dark">Premium</span>
                  <span className="text-[10px] bg-secondary/15 text-secondary-dark px-1.5 py-0.5 rounded-full font-mono">{PRICING.premium.monthly}€</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Pool rotativ + top pe județ</p>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  Pe homepage, ghiduri, <code className="text-[10px] bg-white px-1 rounded">/calculator</code>, <code className="text-[10px] bg-white px-1 rounded">/clasament</code> și pe pagina județului tău. La fiecare reload, ordinea e <strong>random</strong>.
                </p>
                <div className="text-[11px] text-gray-500 space-y-0.5">
                  <p>• Cap: <strong>max {SOV.premium.cap} firme</strong></p>
                  <p>• Share: <strong>~{SOV.premium.sovPct}% vizualizări</strong> fiecare</p>
                  <p>• Rotație: <strong>random la reload</strong></p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              <strong>De ce nu garantăm „mereu primul&quot;:</strong> când mai multe firme plătesc același pachet pentru același placement, e matematic imposibil ca toate să fie „primele&quot;. Rotația random egală e singura soluție corectă — toți primesc share comparabil, transparent comunicat. Modelul e folosit de directoare ca G2.com, Houzz Pro, Clutch.co.
            </p>
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
              E slotul <strong>Slot Popup — {PRICING.popup.monthly} EUR/lună + TVA</strong>. Fiecare partener primește {SOV.popup.rotationSeconds} secunde de vizibilitate, apoi se rotește la următorul. Maxim {SOV.popup.cap} parteneri activi simultan, pe tot site-ul.{' '}
              <a href="#popup" className="text-primary-dark hover:underline font-medium">
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
                  <th className="px-4 py-3 font-semibold text-gray-700">Ce primești</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Free</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">0 €</td>
                  <td className="px-4 py-3 text-gray-600">Profil în listă + verificare ANRE live</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Slot Popup</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{PRICING.popup.monthly} €</td>
                  <td className="px-4 py-3 text-gray-600">Popup carousel pe toate paginile (max {SOV.popup.cap} parteneri, {SOV.popup.rotationSeconds}s)</td>
                </tr>
                <tr className="bg-secondary/5">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    Premium <span className="text-[10px] bg-secondary text-white px-1.5 py-0.5 rounded-full ml-1">★</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{PRICING.premium.monthly} €</td>
                  <td className="px-4 py-3 text-gray-600">
                    Vizibilitate peste tot — top pe județ + pool global (homepage, ghiduri, calculator, clasament, max {SOV.premium.cap}) + profil complet
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Studiu de caz</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">La cerere</td>
                  <td className="px-4 py-3 text-gray-600">Articol colaborativ publicat pe site — trafic organic + citări AI</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="sm:hidden space-y-3">
            {[
              { name: 'Free', price: '0 €', desc: 'Profil în listă + verificare ANRE live (instalatori)', highlight: false },
              { name: 'Slot Popup', price: `${PRICING.popup.monthly} € + TVA`, desc: `Popup carousel pe toate paginile (max ${SOV.popup.cap}, ${SOV.popup.rotationSeconds}s)`, highlight: false },
              { name: 'Premium ★', price: `${PRICING.premium.monthly} € + TVA`, desc: `Vizibilitate peste tot — top pe județ + pool global (max ${SOV.premium.cap}) + profil complet`, highlight: false, secondary: true },
              { name: 'Studiu de caz', price: 'La cerere', desc: 'Articol colaborativ publicat pe site — trafic organic + citări AI', highlight: true },
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
                <span>Care e diferența dintre Slot Popup și Premium?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Slot Popup ({PRICING.popup.monthly}€) e expunere de awareness — un slot în bannerul promo din colț, vizibil pe toate paginile, rotativ. Premium ({PRICING.premium.monthly}€) e vizibilitate prioritară peste tot: apari în top pe pagina județului tău, în pool-ul rotativ de pe homepage/ghiduri/calculator/clasament, pe /verificare-anre, plus profil complet (logo, descriere lungă, social links).
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Ce înseamnă „pool rotativ&quot; și „share-of-voice&quot;?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Pe Premium avem un cap pe nr. de firme afișate simultan (max {SOV.premium.cap} în pool). La fiecare reload de pagină, ordinea e randomizată — fiecare firmă plătită apare în top pentru ~1/N din vizitatori, unde N = nr. firme active. Comunicăm transparent share-ul (~{SOV.premium.sovPct}% când pool-ul e plin) — nu promitem „mereu primul&quot;, ci share echitabil.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Cât costă un studiu de caz?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Prețul e personalizat, în funcție de complexitatea proiectului și de cât material (poze, date, interviu) putem folosi. Trimite-ne o cerere prin formular și revenim cu o ofertă. Articolul rămâne publicat pe site — nu e o reclamă care expiră, ci conținut care aduce trafic organic pe termen lung.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Cine se poate înscrie la Slot Popup?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Oricine — instalatori care vor expunere ieftină de awareness, dar și <strong>furnizori și distribuitori</strong> care nu sunt firme de instalare (distribuitori panouri/invertoare/structuri, furnizori materiale electrice, echipamente, SaaS și tools pentru industrie, cursuri/certificări).
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Cum funcționează garanția de 7 zile?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Activezi Slot Popup sau Premium, primești prima factură. În primele 7 zile calendaristice ai dreptul să anulezi din orice motiv — printr-un email simplu. Returnăm 100% din suma facturată pe luna curentă, iar placement-urile se opresc imediat. Garanția se aplică doar la prima activare, nu și la reînnoiri. (Studiul de caz, fiind muncă de producție, se contractează separat.)
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
