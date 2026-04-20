import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import Button from '@/components/ui/Button';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import { getCompanies, getCoveredCounties } from '@/lib/utils';
import guidesData from '@/data/guides.json';

export const metadata: Metadata = {
  title: 'Publicitate - Promovează-ți Firma pe Instalatori Fotovoltaice',
  description:
    'Opțiuni de publicitate pe platforma Instalatori Fotovoltaice România. Profil Premium, bannere pe ghiduri și listing sponsor pentru furnizori de echipamente.',
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

/** Listing Sponsor preview — sidebar card on guide pages */
function PreviewListingSponsor() {
  return (
    <MockBrowser url="instalatori-fotovoltaice.ro/ghid/electric-up-2026-ghid-aplicare">
      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">Pe fiecare pagină de ghid</p>
      <div className="flex gap-3">
        {/* Fake article content */}
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 bg-gray-100 rounded w-3/4" />
          <div className="h-2 bg-gray-50 rounded w-full" />
          <div className="h-2 bg-gray-50 rounded w-5/6" />
          <div className="h-2 bg-gray-50 rounded w-full" />
          <div className="h-2 bg-gray-50 rounded w-2/3" />
        </div>
        {/* Sponsor sidebar */}
        <div className="w-36 shrink-0">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5">
            <p className="text-[9px] font-semibold text-primary-dark uppercase tracking-wider mb-2">Furnizori Recomandați</p>
            <div className="flex items-center gap-2 p-1.5 rounded bg-white border border-gray-100">
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-[9px] font-semibold text-gray-900">Firma Ta</p>
                <p className="text-[8px] text-primary-dark underline">site-ul-tau.ro →</p>
              </div>
            </div>
            <div className="mt-1.5 flex items-center gap-2 p-1.5 rounded bg-white border border-dashed border-gray-200">
              <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center shrink-0">
                <div className="w-3 h-3 rounded bg-gray-200" />
              </div>
              <div>
                <p className="text-[9px] text-gray-300">Firma ta aici</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MockBrowser>
  );
}

/** Profil Premium preview — company card with badge + priority */
function PreviewProfilPremium() {
  return (
    <MockBrowser url="instalatori-fotovoltaice.ro/firme">
      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">În lista de firme</p>
      <div className="space-y-2">
        {/* Premium card — highlighted */}
        <div className="p-2.5 rounded-lg border-2 border-primary/40 bg-primary/5 relative">
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-gray-900">Firma Ta Premium S.R.L.</p>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-semibold bg-green-50 text-green-700">
                  ✓ Partener Verificat
                </span>
              </div>
              <p className="text-[10px] text-gray-500">București, Ilfov</p>
            </div>
            <span className="text-[8px] bg-primary/10 text-primary-dark px-1.5 py-0.5 rounded-full font-medium">★ Premium</span>
          </div>
          <p className="text-[10px] text-gray-600 mb-1.5">Instalare sisteme fotovoltaice comerciale și industriale, proiecte EPC la cheie...</p>
          <div className="flex gap-1">
            <span className="text-[8px] border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Hale industriale</span>
            <span className="text-[8px] border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Clădiri birouri</span>
          </div>
        </div>
        {/* Regular cards — faded */}
        <div className="p-2.5 rounded-lg border border-gray-100 opacity-50">
          <p className="text-xs font-semibold text-gray-400">Altă Firmă S.R.L.</p>
          <p className="text-[10px] text-gray-300">Cluj-Napoca, Cluj</p>
        </div>
        <div className="p-2.5 rounded-lg border border-gray-100 opacity-50">
          <p className="text-xs font-semibold text-gray-400">Firmă Obișnuită S.R.L.</p>
          <p className="text-[10px] text-gray-300">Timișoara, Timiș</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <svg className="w-3 h-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
        <p className="text-[9px] text-primary-dark font-medium">Apare mereu primul în rezultate</p>
      </div>
    </MockBrowser>
  );
}

/** Sidebar Popup preview — dismissible floating card, bottom-right */
function PreviewSidebarPopup() {
  return (
    <MockBrowser url="instalatori-fotovoltaice.ro">
      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">
        Popup discret, dismissible — pe tot site-ul
      </p>
      <div className="relative bg-gray-50 rounded-lg p-3 h-[160px] overflow-hidden">
        {/* Fake page content */}
        <div className="space-y-1.5">
          <div className="h-2.5 bg-gray-200 rounded w-2/3" />
          <div className="h-2 bg-gray-100 rounded w-full" />
          <div className="h-2 bg-gray-100 rounded w-5/6" />
          <div className="h-2 bg-gray-100 rounded w-full" />
          <div className="h-2 bg-gray-100 rounded w-3/4" />
          <div className="h-2 bg-gray-100 rounded w-full" />
        </div>
        {/* Fake popup — bottom right */}
        <div className="absolute bottom-2 right-2 w-44 rounded-lg border border-gray-200 bg-white shadow-md p-2">
          <div className="absolute top-1 right-1 w-3 h-3 text-gray-300 text-[10px] leading-3">×</div>
          <p className="text-[7px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
            Un alt proiect
          </p>
          <div className="flex items-start gap-1.5">
            <div className="w-5 h-5 rounded bg-primary/10 border border-primary/20 shrink-0" />
            <div className="min-w-0">
              <p className="text-[9px] font-semibold text-gray-900">Firma Ta</p>
              <p className="text-[8px] text-gray-500 leading-tight">Descriere scurtă a proiectului tău</p>
              <p className="text-[8px] font-semibold text-primary-dark mt-0.5">Vezi mai mult →</p>
            </div>
          </div>
        </div>
      </div>
    </MockBrowser>
  );
}

/** Enterprise preview — banner on guide + premium card */
function PreviewEnterprise() {
  return (
    <MockBrowser url="instalatori-fotovoltaice.ro/ghid/stocare-energie-baterii-firme">
      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">Banner pe ghiduri + articol dedicat</p>
      {/* Banner mock */}
      <div className="rounded-lg border border-primary/30 bg-linear-to-r from-primary/10 to-primary/5 p-2.5 mb-2.5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold text-gray-900">Firma Ta Enterprise — Instalări Fotovoltaice la Cheie</p>
          <p className="text-[9px] text-gray-500">Proiecte comerciale în toată România • Solicită ofertă gratuită →</p>
        </div>
        <span className="text-[7px] text-gray-400 shrink-0">SPONSOR</span>
      </div>
      {/* Fake article lines */}
      <div className="space-y-1.5 mb-3">
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-2 bg-gray-50 rounded w-full" />
        <div className="h-2 bg-gray-50 rounded w-5/6" />
        <div className="h-2 bg-gray-50 rounded w-full" />
      </div>
      {/* Sponsored article teaser */}
      <div className="rounded-lg border border-dashed border-primary/30 p-2.5 bg-primary/5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-[8px] bg-primary/10 text-primary-dark px-1.5 py-0.5 rounded-full font-medium">Articol Sponsor</span>
        </div>
        <p className="text-[10px] font-semibold text-gray-900">Cum am instalat 500 kWp pe hala din Pitești — Studiu de Caz</p>
        <p className="text-[9px] text-gray-500">Articol dedicat despre proiectele și expertiza firmei tale</p>
      </div>
    </MockBrowser>
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

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Publicitate' }]} />

        <div className="mt-6 mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Publicitate pe Instalatori Fotovoltaice
          </h1>
          <p className="text-gray-500 mt-2 max-w-2xl">
            Ajunge direct la decidenții care caută soluții fotovoltaice pentru hale industriale, clădiri de birouri și spații comerciale din România.
          </p>
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
            Vizitatorii noștri sunt <strong>manageri de facilități, directori tehnici, antreprenori și consultanți energetici</strong> care caută activ instalatori fotovoltaici și informații despre investiții în energie solară pentru companii. Audiență 100% nișată pe fotovoltaice comerciale și industriale din România.
          </p>
        </div>

        {/* ── Plan 1: Listing Sponsor ──────────────────────── */}
        <h2 className="text-lg font-bold text-gray-900 mb-6">Opțiuni de Publicitate</h2>

        <div className="space-y-10 mb-10">
          {/* Listing Sponsor */}
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border border-border p-6">
              <h3 className="font-bold text-gray-900">Listing Sponsor</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">Pentru furnizori de echipamente și materiale</p>
              <p className="text-2xl font-bold text-gray-900 mb-4">
                29 <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Afișare în secțiunea &quot;Furnizori Recomandați&quot; pe ghiduri
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Logo + link direct către site-ul tău
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Vizibil pe pagina principală și pe toate ghidurile
                </li>
              </ul>
            </div>
            <PreviewListingSponsor />
          </div>

          {/* Sidebar Popup */}
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border border-border p-6">
              <h3 className="font-bold text-gray-900">Sidebar Popup</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Card discret în dreapta jos, pe tot site-ul
              </p>
              <p className="text-2xl font-bold text-gray-900 mb-4">
                39 <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Apare după 15 secunde, pe toate paginile
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Dismissible — user-ul nu mai e deranjat o dată ce a închis
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Logo + titlu + descriere scurtă + CTA către site-ul tău
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Tracking impresii, click-uri și dismiss via Umami
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Exclusiv — un singur sponsor activ la un moment dat
                </li>
              </ul>
            </div>
            <PreviewSidebarPopup />
          </div>

          {/* Profil Premium */}
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border-2 border-primary p-6 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                Popular
              </span>
              <h3 className="font-bold text-gray-900">Profil Premium</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">Pentru firme de instalare fotovoltaice</p>
              <p className="text-2xl font-bold text-gray-900 mb-4">
                49 <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Badge &quot;Partener Verificat&quot; pe profil
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Poziție prioritară în rezultatele de căutare
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Primești lead-uri din formularul &quot;Cere Ofertă&quot;
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Portofoliu extins cu imagini și studii de caz
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Statistici vizualizări profil
                </li>
              </ul>
            </div>
            <PreviewProfilPremium />
          </div>

          {/* Enterprise */}
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border border-border p-6">
              <h3 className="font-bold text-gray-900">Enterprise</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">Vizibilitate maximă, pachet complet</p>
              <p className="text-2xl font-bold text-gray-900 mb-4">
                99 <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Tot din Profil Premium
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Banner promoțional pe ghiduri relevante
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Articol sponsorizat dedicat (studiu de caz)
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Menționare pe pagina principală
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  Vizibilitate pe toate paginile de județ
                </li>
              </ul>
            </div>
            <PreviewEnterprise />
          </div>
        </div>

        {/* Placeholder Partners */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Partenerii Noștri</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed border-gray-300 p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-400">Firma ta aici</p>
                <p className="text-sm text-gray-400">Firmă de instalare panouri fotovoltaice</p>
                <p className="text-xs text-gray-300 mt-1">Profil Premium sau Enterprise</p>
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-gray-300 p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-400">Furnizorul tău aici</p>
                <p className="text-sm text-gray-400">Furnizor de echipamente și materiale fotovoltaice</p>
                <p className="text-xs text-gray-300 mt-1">Listing Sponsor</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary/5 rounded-xl border border-primary/10 p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Vrei să fii vizibil pe platforma noastră?
          </h2>
          <p className="text-sm text-gray-600 mb-6 max-w-lg mx-auto">
            Contactează-ne pentru a discuta opțiunile de publicitate și a găsi pachetul potrivit pentru afacerea ta.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button href="mailto:contact@instalatori-fotovoltaice.ro" variant="primary" size="lg">
              Contactează-ne
            </Button>
            <Button href="tel:+40751547174" variant="outline" size="lg">
              0751 547 174
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
