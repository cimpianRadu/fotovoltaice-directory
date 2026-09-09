import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import Button from '@/components/ui/Button';
import AdInquiryForm from '@/components/forms/AdInquiryForm';
import TrafficWidget from '@/components/publicitate/TrafficWidget';
import { generateBreadcrumbJsonLd, generateFAQJsonLd } from '@/lib/seo';
import { getCompanies, getCoveredCounties, getPremiumCompanies } from '@/lib/utils';
import { PROMO_CAPS } from '@/lib/utils-shared';
import { PRICING, TVA_PCT } from '@/lib/pricing';
import guidesData from '@/data/guides.json';

export const metadata: Metadata = {
  title: `Partener Premium ${PRICING.premium.monthly}€/lună - Instalatori Fotovoltaice`,
  description: `Ce înseamnă Partener Premium: top pe pagina județului tău, rotație pe homepage, ghiduri, calculator și clasament, profil complet și raport lunar cu vizualizări și click-uri. ${PRICING.premium.monthly}€/lună + TVA, fără contract minim.`,
  alternates: { canonical: '/publicitate/premium' },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Premium îmi dă acces la cereri pe care altfel nu le văd?',
    a: 'Nu. Cererile publicate pe /cereri sunt vizibile și revendicabile gratuit de orice firmă listată, iar asta nu se schimbă. Premium înseamnă vizibilitate: te vede clientul care caută singur o firmă, înainte să ajungă la formular.',
  },
  {
    q: 'Sunt garantat primul pe pagina județului meu?',
    a: `Nu promitem „mereu primul". Pe județ intră maximum ${PROMO_CAPS.plusPerCounty} firme în blocul „Promovate", iar în pool-ul național maximum ${PROMO_CAPS.premiumPool}. Ordinea se randomizează la fiecare încărcare de pagină, deci fiecare firmă plătită primește un share egal.`,
  },
  {
    q: 'Ce se întâmplă dacă pool-ul e plin?',
    a: `Pool-ul național are ${PROMO_CAPS.premiumPool} locuri, ocupate în ordinea înscrierii. Dacă e plin, intri pe lista de așteptare și te anunțăm când se eliberează un loc. Nu diluăm pool-ul ca să încapă mai multe firme, pentru că asta ar scădea share-ul tuturor.`,
  },
  {
    q: 'Cum se facturează?',
    a: `Prețul e ${PRICING.premium.monthly}€/lună + TVA ${TVA_PCT}%, facturat în RON la cursul BNR din ziua emiterii facturii. Varianta anuală e ${PRICING.premium.annual}€ (două luni gratis). Nu există contract minim: anunți că oprești și nu se mai emite factura următoare.`,
  },
  {
    q: 'De unde vin cifrele din raportul lunar?',
    a: 'Din Umami, sistemul de analytics al site-ului. Sunt exact aceleași cifre pe care le vedem și noi în panoul de administrare, nu estimări. Dacă o lună a fost slabă, în raport scrie că a fost slabă.',
  },
];

/* ── Blocuri vizuale ──────────────────────────────────────────── */

function Placement({
  title,
  where,
  cap,
  children,
}: {
  title: string;
  where: string;
  cap?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {cap && (
          <span className="text-[11px] bg-secondary/10 text-secondary-dark px-2 py-0.5 rounded-full font-medium">
            {cap}
          </span>
        )}
      </div>
      <p className="text-xs font-mono text-gray-400 mb-2">{where}</p>
      <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
    </div>
  );
}

function Row({
  label,
  free,
  premium,
}: {
  label: string;
  free: boolean | string;
  premium: boolean | string;
}) {
  const cell = (v: boolean | string, on: boolean) =>
    typeof v === 'string' ? (
      <span className={on ? 'text-gray-900 font-medium' : 'text-gray-500'}>{v}</span>
    ) : v ? (
      <span className="text-green-600 font-bold">&#10003;</span>
    ) : (
      <span className="text-gray-300">&mdash;</span>
    );

  return (
    <tr>
      <td className="px-3 sm:px-4 py-2.5 text-[13px] sm:text-sm text-gray-700">{label}</td>
      <td className="px-2 sm:px-4 py-2.5 text-center text-[11px] sm:text-sm">{cell(free, false)}</td>
      <td className="px-2 sm:px-4 py-2.5 text-center text-[11px] sm:text-sm bg-secondary/5">
        {cell(premium, true)}
      </td>
    </tr>
  );
}

/** Mock al raportului lunar. Fără cifre inventate: structura raportului, atât. */
function MockReport() {
  const lines = ['Vizualizări pagină profil', 'Click pe telefon', 'Click pe email', 'Click către site-ul tău'];
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Email lunar</p>
        <p className="text-sm font-semibold text-gray-900">Firma Ta S.R.L. &middot; raport luna trecută</p>
      </div>
      <div className="p-4 space-y-2.5">
        {lines.map((l) => (
          <div key={l} className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-600">{l}</span>
            <span className="h-2.5 w-12 rounded bg-gray-100" />
          </div>
        ))}
        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-3">
          <span className="text-xs text-gray-600">Comparație cu luna anterioară</span>
          <span className="h-2.5 w-16 rounded bg-primary/20" />
        </div>
      </div>
      <p className="px-4 pb-3 text-[10px] text-gray-400 italic">
        Structura raportului. Cifrele sunt cele reale din Umami pentru luna respectivă.
      </p>
    </div>
  );
}

/* ── Pagina ───────────────────────────────────────────────────── */

export default function PremiumPage() {
  const totalCompanies = getCompanies().length;
  const totalCounties = getCoveredCounties().length;
  const totalGuides = guidesData.guides.length;
  const activePremium = getPremiumCompanies().length;
  const freeSlots = Math.max(PROMO_CAPS.premiumPool - activePremium, 0);

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Publicitate', url: '/publicitate' },
          { name: 'Partener Premium', url: '/publicitate/premium' },
        ])}
      />
      <JsonLd data={generateFAQJsonLd(FAQ.map((f) => ({ question: f.q, answer: f.a })))} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[{ label: 'Publicitate', href: '/publicitate' }, { label: 'Partener Premium' }]}
        />

        {/* Hero */}
        <div className="mt-6 mb-8">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider bg-secondary/10 text-secondary-dark px-2.5 py-1 rounded-full">
            ★ Partener Premium
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-3">
            Ce înseamnă să fii Partener Premium
          </h1>
          <p className="text-gray-600 mt-3 leading-relaxed max-w-2xl">
            Listarea firmei rămâne gratuită, iar cererile de pe <Link href="/cereri" className="text-primary-dark underline hover:no-underline">/cereri</Link>{' '}
            se revendică gratuit de orice firmă listată. Premium e stratul de vizibilitate peste asta:
            apari sus pe pagina județului tău, intri în rotația de pe paginile cu cel mai mult trafic
            și primești lunar cifrele reale de pe profilul tău.
          </p>

          <div className="mt-5 rounded-xl border-2 border-secondary/40 bg-linear-to-br from-secondary/5 via-white to-primary/5 p-5">
            <div className="flex items-end gap-2 flex-wrap">
              <p className="text-3xl font-bold text-gray-900">
                {PRICING.premium.monthly} <span className="text-base font-normal text-gray-500">EUR/lună</span>
              </p>
              <p className="text-sm text-gray-600 pb-1">
                + TVA {TVA_PCT}% &middot; anual {PRICING.premium.annual}€ (2 luni gratis) &middot; fără contract minim
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button href="#cerere" variant="secondary" size="md">
                Vreau Premium
              </Button>
              <Button href="#trafic" variant="outline" size="md">
                Vezi traficul real
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {freeSlots > 0 ? (
                <>
                  <strong className="text-gray-700">{freeSlots} din {PROMO_CAPS.premiumPool} locuri libere</strong> în
                  pool-ul național chiar acum. Se ocupă în ordinea înscrierii.
                </>
              ) : (
                <>
                  Pool-ul național e plin ({PROMO_CAPS.premiumPool} din {PROMO_CAPS.premiumPool} locuri).
                  Te putem trece pe lista de așteptare.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Gratuit vs Premium */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Gratuit vs. Premium</h2>
          <p className="text-sm text-gray-500 mb-4">
            Tot ce e gratuit rămâne gratuit. Premium adaugă doar rândurile marcate în coloana din dreapta.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full">
              <thead>
                <tr className="bg-surface border-b border-border">
                  <th className="px-3 sm:px-4 py-3 text-left text-[13px] sm:text-sm font-semibold text-gray-700">
                    Ce primești
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-center text-[13px] sm:text-sm font-semibold text-gray-700">
                    Gratuit
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-center text-[13px] sm:text-sm font-semibold text-secondary-dark bg-secondary/10">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <Row label="Profil public indexat în Google" free premium />
                <Row label="Atestat ANRE verificat live din registru" free premium />
                <Row label="Apari în lista de firme și în filtre" free premium />
                <Row label="Revendici cereri de pe /cereri" free="Gratuit" premium="Gratuit" />
                <Row
                  label={'Top „Promovate” pe pagina județului tău'}
                  free={false}
                  premium={`max ${PROMO_CAPS.plusPerCounty}`}
                />
                <Row
                  label="Rotație pe homepage, ghiduri, calculator, clasament"
                  free={false}
                  premium={`max ${PROMO_CAPS.premiumPool}`}
                />
                <Row label="Featured pe /verificare-anre" free={false} premium />
                <Row label="Logo, descriere lungă, linkuri social" free={false} premium />
                <Row label={'Badge „Promovat” pe card'} free={false} premium />
                <Row label="Raport lunar cu vizualizări și click-uri" free={false} premium />
              </tbody>
            </table>
          </div>
        </section>

        {/* Unde apari */}
        <section id="unde-apari" className="mb-10 scroll-mt-20">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Unde apari, concret</h2>
          <p className="text-sm text-gray-500 mb-4">
            Patru plasări, toate cu plafon de firme. Nu vindem mai multe locuri decât afișăm.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Placement
              title="Sus pe județul tău"
              where="/firme/judet/<județ>"
              cap={`max ${PROMO_CAPS.plusPerCounty}`}
            >
              Blocul „Promovate" e primul lucru pe care îl vede cineva care caută instalatori în județul
              tău, înaintea listei alfabetice.
            </Placement>
            <Placement
              title="Pool rotativ național"
              where="/, /ghid, /calculator..., /clasament"
              cap={`max ${PROMO_CAPS.premiumPool}`}
            >
              Apari în blocul „Firme Recomandate" de pe homepage, din ghiduri, din calculator și din
              clasament. Ordinea se randomizează la fiecare încărcare.
            </Placement>
            <Placement
              title="Verificare ANRE"
              where="/verificare-anre"
              cap={`max ${PROMO_CAPS.plusOnAnre}`}
            >
              Pagina unde clientul verifică dacă o firmă chiar are atestat. Cine ajunge acolo e deja în
              faza de verificare a ofertelor.
            </Placement>
            <Placement title="Profil complet" where="/firme/<firma-ta>">
              Logo proeminent, descriere lungă în loc de două rânduri, linkuri către site și social,
              badge „Promovat" pe fiecare card al firmei.
            </Placement>
          </div>
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            Context: {totalCompanies} firme verificate în {totalCounties} județe și {totalGuides} ghiduri
            care aduc traficul. Cu {PROMO_CAPS.premiumPool} locuri în pool, share-ul e vizibil, nu
            simbolic.
          </p>
        </section>

        {/* Trafic real */}
        <section id="trafic" className="mb-10 scroll-mt-20">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Câte vizite au paginile pe care apari</h2>
          <p className="text-sm text-gray-500 mb-4">
            Cifre live din Umami, ultimele 30 de zile. Se actualizează singure, nu sunt un screenshot
            dintr-o lună bună.
          </p>
          <TrafficWidget />
        </section>

        {/* Raport lunar */}
        <section id="raport" className="mb-10 scroll-mt-20">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Raportul lunar</h2>
          <p className="text-sm text-gray-500 mb-4">
            La început de lună primești pe email cifrele profilului tău din luna încheiată.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 items-start">
            <div>
              <ul className="space-y-2.5 text-sm text-gray-600">
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  <span><strong className="text-gray-900">Vizualizări</strong> pe pagina ta de profil</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  <span><strong className="text-gray-900">Click-uri pe telefon</strong>, separat pe linkul din listă și pe butonul „Sună Acum"</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  <span><strong className="text-gray-900">Click-uri pe email</strong> și pe linkul către site-ul tău</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  <span><strong className="text-gray-900">Comparația cu luna anterioară</strong>, ca să vezi dacă merge sau nu</span>
                </li>
              </ul>
              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                Click-urile pe telefon și pe email sunt cel mai apropiat lucru de „m-a sunat un client"
                pe care îl putem măsura. Ce se întâmplă după ce clientul formează numărul se vede doar
                la tine, nu la noi.
              </div>
            </div>
            <MockReport />
          </div>
        </section>

        {/* Ce nu promitem */}
        <section className="mb-10">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5">
            <h2 className="font-bold text-gray-900 mb-3">Ce nu promitem</h2>
            <ul className="space-y-2 text-sm text-amber-900 leading-relaxed">
              <li>
                <strong>Un număr de lead-uri.</strong> Premium e vizibilitate, nu un abonament pe cereri.
                Câți clienți te sună depinde de județ, de sezon și de cât de convingător e profilul tău.
              </li>
              <li>
                <strong>Poziția întâi permanentă.</strong> Ordinea în pool se randomizează la fiecare
                încărcare, ca fiecare firmă plătită să primească un share egal.
              </li>
              <li>
                <strong>Trafic garantat.</strong> Cifrele de mai sus sunt istoric real, nu o promisiune
                pentru luna viitoare.
              </li>
            </ul>
          </div>
        </section>

        {/* Formular */}
        <section id="cerere" className="mb-10 scroll-mt-20">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Activează Premium</h2>
          <AdInquiryForm />
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Întrebări frecvente</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-xl border border-border bg-white p-4">
                <summary className="cursor-pointer list-none font-semibold text-gray-900 text-sm flex items-start justify-between gap-3">
                  {f.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform shrink-0">▾</span>
                </summary>
                <p className="mt-2.5 text-sm text-gray-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <p className="text-sm text-gray-600">
          Vezi și{' '}
          <Link href="/publicitate" className="text-primary-dark underline hover:no-underline">
            celelalte opțiuni de promovare
          </Link>{' '}
          sau{' '}
          <Link href="/listeaza-firma" className="text-primary-dark underline hover:no-underline">
            listează-ți firma gratuit
          </Link>
          .
        </p>
      </div>
    </>
  );
}
