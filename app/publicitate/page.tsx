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
    'Opțiuni de publicitate pe platforma Instalatori Fotovoltaice România. 3 pachete pentru firmele de instalare (gratuit, Premium 49€, Enterprise 99€) + Listing Sponsor pentru furnizorii de echipamente.',
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

/** Free listing preview — neutral card among others */
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

/** Enterprise preview — banner on guide + premium card + sidebar popup */
function PreviewEnterprise() {
  return (
    <MockBrowser url="instalatori-fotovoltaice.ro/ghid/stocare-energie-baterii-firme">
      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">Banner + popup + articol sponsor</p>
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
      <div className="space-y-1.5 mb-3 relative">
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-2 bg-gray-50 rounded w-full" />
        <div className="h-2 bg-gray-50 rounded w-5/6" />
        <div className="h-2 bg-gray-50 rounded w-full" />
        {/* Sidebar popup mock — floating bottom-right of article */}
        <div className="absolute -bottom-1 right-0 w-32 rounded-lg border border-gray-200 bg-white shadow-md p-1.5">
          <div className="flex items-start gap-1">
            <div className="w-4 h-4 rounded bg-primary/10 shrink-0" />
            <div className="min-w-0">
              <p className="text-[8px] font-semibold text-gray-900 leading-tight">Firma Ta</p>
              <p className="text-[7px] text-primary-dark">Vezi proiecte →</p>
            </div>
          </div>
        </div>
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

/** Listing Sponsor preview — sidebar card on guide pages */
function PreviewListingSponsor() {
  return (
    <MockBrowser url="instalatori-fotovoltaice.ro/ghid/electric-up-2026-ghid-aplicare">
      <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-wider font-semibold">Pe fiecare pagină de ghid</p>
      <div className="flex gap-3">
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 bg-gray-100 rounded w-3/4" />
          <div className="h-2 bg-gray-50 rounded w-full" />
          <div className="h-2 bg-gray-50 rounded w-5/6" />
          <div className="h-2 bg-gray-50 rounded w-full" />
          <div className="h-2 bg-gray-50 rounded w-2/3" />
        </div>
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
            Ajunge direct la decidenții care caută soluții fotovoltaice pentru hale industriale,
            clădiri de birouri și spații comerciale din România. Două produse distincte — în funcție
            de ce oferi.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <a href="#instalatori" className="text-primary hover:underline font-medium">
              → Pentru firme de instalare
            </a>
            <span className="text-gray-300">·</span>
            <a href="#furnizori" className="text-primary hover:underline font-medium">
              → Pentru furnizori de echipamente
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

        {/* ═══════════════════════════════════════════════════════════
             SECTION A: Pentru firme de instalare (3 tiered plans)
           ═══════════════════════════════════════════════════════════ */}
        <section id="instalatori" className="mb-16 scroll-mt-20">
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Pentru firme de instalare fotovoltaică
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
              Trei pachete cumulative — fiecare conține tot ce e în pachetul anterior, plus beneficii
              suplimentare. Începe gratuit, upgradează când ești gata pentru mai multă vizibilitate.
            </p>
          </div>

          {/* Tier 1: Free */}
          <div className="grid gap-6 sm:grid-cols-2 items-start mb-10">
            <div className="rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-lg">Listare Gratuită</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Nivel 1</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Baza pe care e construit directorul</p>
              <p className="text-3xl font-bold text-gray-900 mb-5">
                0 <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ce primești</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature>Profil în director cu date contact, certificări, localizare</Feature>
                <Feature>Pagină proprie <code className="text-xs bg-gray-100 px-1 rounded">/firme/firma-ta</code> indexată Google</Feature>
                <Feature>Verificare ANRE live din registru oficial</Feature>
                <Feature>Afișare în filtrele după județ, specializare și atestate</Feature>
                <Feature>Apariție în clasament cu date financiare reale</Feature>
              </ul>
              <p className="text-xs text-gray-400 mt-4 italic">
                Pentru a fi listat, folosește formularul de la /listeaza-firma
              </p>
            </div>
            <PreviewFree />
          </div>

          {/* Tier 2: Premium */}
          <div className="grid gap-6 sm:grid-cols-2 items-start mb-10">
            <div className="rounded-xl border-2 border-primary p-6 relative">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                Cel mai popular
              </span>
              <div className="flex items-center gap-2 mb-1 mt-1">
                <h3 className="font-bold text-gray-900 text-lg">Profil Premium</h3>
                <span className="text-xs bg-primary/10 text-primary-dark px-2 py-0.5 rounded-full">Nivel 2</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Vizibilitate prioritară + lead-uri</p>
              <p className="text-3xl font-bold text-gray-900 mb-5">
                49 <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Tot din Listare Gratuită, plus:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature strong>Badge &quot;Partener Verificat&quot; vizibil pe profil și în listă</Feature>
                <Feature strong>Poziție prioritară — apari mereu primul în rezultate</Feature>
                <Feature strong>Primești lead-urile din formularul „Cere Ofertă"</Feature>
                <Feature strong>Raport lunar de trafic: vizualizări profil, click-uri pe telefon și site, sursa traficului</Feature>
                <Feature>Portofoliu extins cu imagini și studii de caz</Feature>
                <Feature>Link direct către CV-ul firmei în clasament</Feature>
              </ul>
            </div>
            <PreviewProfilPremium />
          </div>

          {/* Tier 3: Enterprise */}
          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border border-secondary/30 bg-linear-to-br from-secondary/5 via-white to-primary/5 p-6 relative">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-lg">Enterprise</h3>
                <span className="text-xs bg-secondary/10 text-secondary-dark px-2 py-0.5 rounded-full">Nivel 3</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Vizibilitate maximă pe tot site-ul</p>
              <p className="text-3xl font-bold text-gray-900 mb-5">
                99 <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>

              {/* Headline feature — popup */}
              <div className="rounded-lg border border-secondary/30 bg-white p-3 mb-4">
                <p className="text-[10px] font-semibold text-secondary-dark uppercase tracking-wider mb-1">
                  🎯 Inventar exclusiv
                </p>
                <p className="text-sm font-semibold text-gray-900 leading-snug">
                  Slotul popup din colțul dreapta-jos — <span className="text-primary-dark">un singur sponsor activ pe tot site-ul</span>
                </p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Apare după 15 secunde pe toate paginile, se poate închide. Dacă e ocupat, intri pe listă de așteptare.
                </p>
              </div>

              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Tot din Profil Premium, plus:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature strong>Slot popup exclusiv (descris mai sus)</Feature>
                <Feature strong>Banner promoțional pe ghidurile relevante din nișa ta</Feature>
                <Feature strong>Articol sponsorizat dedicat — studiu de caz pe un proiect al tău</Feature>
                <Feature>Featured pe homepage, secțiune „Firme Recomandate"</Feature>
                <Feature>Menționare pe toate paginile de județ în care operezi</Feature>
                <Feature>Raport performanță campanii: impresii banner, click popup, timp citire articol</Feature>
              </ul>
            </div>
            <PreviewEnterprise />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
             SECTION B: Pentru furnizori (separate audience)
           ═══════════════════════════════════════════════════════════ */}
        <section id="furnizori" className="mb-12 scroll-mt-20">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Pentru furnizori de echipamente și materiale
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl leading-relaxed">
              Produs separat pentru firmele care vând panouri, invertoare, structuri de montaj sau
              materiale electrice — nu pentru instalatori. Audiența ajunge direct din ghidurile
              noastre tehnice (acolo unde manageri și instalatori caută soluții).
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 items-start">
            <div className="rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-lg">Listing Sponsor</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Furnizori</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Vizibil pe toate ghidurile, lângă conținut</p>
              <p className="text-3xl font-bold text-gray-900 mb-5">
                29 <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Ce primești</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <Feature>Afișare în secțiunea „Furnizori Recomandați" pe toate ghidurile</Feature>
                <Feature>Logo + nume firmă + link direct către site-ul tău</Feature>
                <Feature>Vizibil pe homepage și pe pagina index a ghidurilor</Feature>
                <Feature>UTM tracking pe linkuri + eveniment Umami dedicat</Feature>
                <Feature>Contract anual cu 2 luni gratuit (290 EUR/an în loc de 348)</Feature>
              </ul>
            </div>
            <PreviewListingSponsor />
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
              Exact acela e <strong>slotul exclusiv din pachetul Enterprise</strong>. Momentan îl folosim
              pentru un proiect al nostru — locul e liber pentru primul sponsor plătitor. Un singur
              client activ la un moment dat, pe tot site-ul, pe toate paginile.
            </p>
          </div>
        </div>

        {/* Comparison table */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Comparație rapidă</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-border text-left">
                  <th className="px-4 py-3 font-semibold text-gray-700">Pachet</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Pentru cine</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">Preț</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Rezumat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Listare Gratuită</td>
                  <td className="px-4 py-3 text-gray-600">Instalatori</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">0 €</td>
                  <td className="px-4 py-3 text-gray-600">Profil de bază + verificare ANRE</td>
                </tr>
                <tr className="bg-primary/5">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    Profil Premium <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full ml-1">★</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">Instalatori</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">49 €</td>
                  <td className="px-4 py-3 text-gray-600">+ badge, poziție prioritară, lead-uri</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Enterprise</td>
                  <td className="px-4 py-3 text-gray-600">Instalatori</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">99 €</td>
                  <td className="px-4 py-3 text-gray-600">
                    + <strong className="text-gray-900">popup exclusiv</strong>, banner ghiduri, articol sponsor, featured
                  </td>
                </tr>
                <tr className="border-t-2 border-border">
                  <td className="px-4 py-3 font-medium text-gray-900">Listing Sponsor</td>
                  <td className="px-4 py-3 text-gray-600">Furnizori</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">29 €</td>
                  <td className="px-4 py-3 text-gray-600">Logo + link pe toate ghidurile</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

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

        {/* FAQ mini */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Întrebări rapide</h2>
          <div className="space-y-3">
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Pot începe cu Gratuit și upgrada oricând?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Da. Toate firmele listate pe directorul nostru primesc automat Listarea Gratuită. Upgrade-ul la Premium sau Enterprise se face prin contactare directă — activăm beneficiile în maxim 48h după confirmarea plății. Nu există contract minim, poți downgrada la gratuit oricând fără taxe ascunse.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>De unde vin lead-urile în Premium și Enterprise?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Din formularul „Cere Ofertă" pe care vizitatorii îl pot completa de pe pagina ta și din câteva puncte strategice din site. Lead-urile sunt distribuite exclusiv firmelor Premium/Enterprise din județul clientului — nu sunt vândute în masă și nici partajate cu firmele gratuite.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Pot cumula Profil Premium cu Listing Sponsor?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Doar dacă firma ta face ambele activități (instalări + vânzare materiale către alți instalatori). Sunt audiențe diferite, produse diferite. În practică, 95% dintre firme aleg un singur produs. Dacă ești în ambele categorii, îți oferim 20% discount la pachetul al doilea.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Există exclusivitate pe anumite pachete?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Popup-ul din Enterprise e <strong>exclusiv</strong> — un singur sponsor activ la un moment dat pe tot site-ul. Bannerele pe ghiduri sunt rotative între Enterprise plătitori (dacă sunt mai mulți). Listing Sponsor nu e exclusiv — pot fi 3-5 furnizori activi simultan, toți vizibili în sidebar-ul de ghiduri.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Cine primește rapoartele de trafic pe profil?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Doar firmele Premium și Enterprise. Raportul lunar include vizualizări profil, click-uri pe telefon și site, sursa traficului (organic Google, clasament, pagini de județ etc.). Enterprise primește în plus rapoarte pe campaniile publicitare — impresii banner, click popup, timp citire articol sponsor. Firmele cu Listare Gratuită nu primesc rapoarte.
              </p>
            </details>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-primary/5 rounded-xl border border-primary/10 p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Vrei să fii vizibil pe platforma noastră?
          </h2>
          <p className="text-sm text-gray-600 mb-6 max-w-lg mx-auto">
            Contactează-ne pentru detalii, demo live pe profilul tău sau ofertă personalizată. Răspundem în aceeași zi lucrătoare.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button href="mailto:contact@instalatori-fotovoltaice.ro?subject=Interes%20publicitate" variant="primary" size="lg">
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
