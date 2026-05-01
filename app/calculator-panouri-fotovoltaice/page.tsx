import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import CalculatorClient from './CalculatorClient';

export const metadata: Metadata = {
  title: 'Calculator Panouri Fotovoltaice Firmă 2026 — Cost, Producție, Payback',
  description:
    'Calculator gratuit pentru firme: estimează kWp, suprafață, investiție, producție anuală și payback pentru panouri fotovoltaice. Date PVGIS pe județ, prețuri 2026, autoconsum configurabil.',
  alternates: { canonical: '/calculator-panouri-fotovoltaice' },
  openGraph: {
    type: 'website',
    url: '/calculator-panouri-fotovoltaice',
    title: 'Calculator Panouri Fotovoltaice Firmă 2026',
    description:
      'Estimează cost, producție și payback pentru sistemul fotovoltaic al firmei tale. Date PVGIS pe județ, autoconsum configurabil.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Calculator Panouri Fotovoltaice Firmă',
      },
    ],
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Cât costă un sistem fotovoltaic pentru firmă în 2026?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pentru sisteme comerciale la cheie, prețul mediu este 3.500–4.500 RON/kWp în 2026, în funcție de mărime: sub 50 kWp ~4.500 RON/kWp, 50–200 kWp ~3.800 RON/kWp, peste 200 kWp ~3.500 RON/kWp. Include panouri, invertor, structură, manoperă, autorizații și racordare.',
      },
    },
    {
      '@type': 'Question',
      name: 'Cum se calculează kWp-ul pentru o firmă?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Regula simplă: kWp = consum anual (kWh) ÷ yield specific zonei (kWh/kWp/an). Yield-ul variază în România între 1.140 (zonele montane) și 1.380 kWh/kWp/an (sudul Dobrogei) pentru un sistem optim înclinat. Calculatorul nostru folosește date PVGIS per județ și ajustează pentru tipul de montaj.',
      },
    },
    {
      '@type': 'Question',
      name: 'Ce este cota de autoconsum și cum afectează economiile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cota de autoconsum este procentul din producția fotovoltaică pe care firma o consumă direct (nu se injectează în rețea). Energia autoconsumată îți economisește prețul plătit la furnizor (~1,30 RON/kWh), iar energia injectată e plătită de furnizor la tariful prosumator (~0,30 RON/kWh). Cu cât autoconsumul e mai mare, cu atât payback-ul e mai scurt. Tipic 60–80% pentru firme cu activitate diurnă.',
      },
    },
    {
      '@type': 'Question',
      name: 'În cât timp se recuperează investiția într-un sistem fotovoltaic comercial?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pentru o firmă cu autoconsum 70–80% și tarif curent peste 1,20 RON/kWh, payback-ul este tipic 4–6 ani la prețurile pieței din 2026. Sistemul produce timp de 25+ ani, deci profitul net pe durata de viață e de 3–5x investiția inițială.',
      },
    },
    {
      '@type': 'Question',
      name: 'Cât de precise sunt estimările acestui calculator?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Calculatorul folosește yield-uri PVGIS multianuale și prețuri medii de piață 2026. Variația reală în ofertele primite poate fi ±20% în funcție de condițiile site-ului, calitatea echipamentelor (Tier 1 vs entry-level), tipul invertorului (string vs micro), distanța de tabloul de racordare și complexitatea structurii. Pentru o decizie informată, cere oferte detaliate de la 3 instalatori autorizați ANRE.',
      },
    },
  ],
};

export default function CalculatorPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Calculator Panouri Fotovoltaice' }]} />

        <h1 className="text-3xl sm:text-4xl font-bold text-secondary-dark mt-4 mb-3">
          Calculator Panouri Fotovoltaice pentru Firmă
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Estimează în 30 de secunde cât costă un sistem fotovoltaic, cât produce și în cât timp se amortizează.
          Yield specific pe județ (date PVGIS) și prețuri actualizate 2026.
        </p>

        <CalculatorClient />

        {/* SEO content */}
        <section className="mt-16 space-y-6 text-gray-700 text-[15px] leading-relaxed">
          <h2 className="text-xl font-semibold text-secondary-dark">
            Cum funcționează calculatorul de panouri fotovoltaice
          </h2>
          <p>
            Calculatorul dimensionează sistemul fotovoltaic pornind de la <strong>consumul anual al firmei</strong> și de la <strong>yield-ul specific al județului</strong>.
            Yield-ul (exprimat în kWh produși per kWp instalat per an) variază în România între aproximativ 1.140 kWh/kWp/an
            în zonele montane (Harghita, Covasna) și 1.380 kWh/kWp/an în sudul Dobrogei (Constanța, Tulcea).
            Datele de bază provin din modelul european <strong>PVGIS-SARAH3</strong> al JRC, agregate ca medii multianuale 2005–2023.
          </p>
          <p>
            Pe lângă județ, tipul de montaj influențează semnificativ producția. Un acoperiș înclinat sud la ~30° este referința.
            O <strong>terasă plată</strong> cu structură la 10–15° produce cu 5–7% mai puțin (compensat parțial de spațiul mai mare disponibil).
            Un <strong>montaj la sol</strong> bine orientat poate depăși cu 1–2% acoperișul, având posibilitatea unghiului optim.
          </p>

          <h2 className="text-xl font-semibold text-secondary-dark">
            De ce contează cota de autoconsum
          </h2>
          <p>
            Pentru o firmă, profitabilitatea nu vine doar din producția totală, ci din <strong>cât din această producție o consumi direct</strong>.
            Energia autoconsumată îți elimină plata către furnizor (tipic 1,20–1,50 RON/kWh în 2026), pe când energia
            injectată în rețea în regim prosumator e plătită la un tarif mult mai mic (~0,30 RON/kWh, schemă reglementată).
            Diferența e ~4× — de aceea autoconsum 80% generează cu mult mai mult cash decât autoconsum 40%, chiar pentru același sistem.
          </p>
          <p>
            Pentru o firmă cu activitate de zi (birouri, hală cu schimb 8–17, depozit cu refrigerare), autoconsumul tipic e <strong>70–85%</strong>.
            Pentru retail care lucrează și seara sau pentru consumatori cu vârf scurt (ex. încărcare camioane noaptea), poate scădea spre 40–60%
            și atunci o investiție în baterii de stocare schimbă semnificativ ecuația.
          </p>

          <h2 className="text-xl font-semibold text-secondary-dark">
            Prețuri 2026 pentru sisteme fotovoltaice comerciale
          </h2>
          <p>
            Prețurile la cheie folosite de calculator reflectă media pieței românești în 2026, pe trei tranșe de mărime:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Sub 50 kWp:</strong> ~4.500 RON/kWp — costuri fixe (proiect, autorizații, manoperă) au pondere mai mare</li>
            <li><strong>50–200 kWp:</strong> ~3.800 RON/kWp — sweet spot pentru hale și clădiri comerciale medii</li>
            <li><strong>Peste 200 kWp:</strong> ~3.500 RON/kWp — economii de scară pe panouri și manoperă</li>
          </ul>
          <p>
            Prețurile includ panouri TOPCon Tier 1, invertor string sau hibrid, structură de montaj, cabluri DC/AC, tablouri,
            manoperă, proiect tehnic, dosar autorizare construcție, racordare la operatorul de distribuție și punere în funcțiune.
            Nu includ baterii de stocare, lucrări civile suplimentare (consolidări structurale), sau extinderi de tablou principal.
          </p>

          <h2 className="text-xl font-semibold text-secondary-dark">
            Limitele unei estimări online
          </h2>
          <p>
            Calculatorul îți dă un <strong>ordin de mărime</strong> — util pentru a decide dacă merită să continui investigația și pentru a compara oferte primite.
            Nu înlocuiește un audit tehnic la fața locului. Variabile pe care un calculator nu le poate captura:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Umbrirea</strong> de la clădiri vecine, copaci, coșuri sau echipamente HVAC pe acoperiș</li>
            <li><strong>Orientarea reală</strong> a acoperișului (sud-est sau sud-vest pierd 5–10% față de sud pur)</li>
            <li><strong>Capacitatea structurii</strong> de a susține panouri și balast (terasă) sau structuri (acoperiș înclinat)</li>
            <li><strong>Distanța de la câmpul de panouri la tabloul de racordare</strong> (cabluri lungi = costuri și pierderi)</li>
            <li><strong>Capacitatea racordului existent</strong> și costurile de upgrade (transformator, cable buried etc.)</li>
            <li><strong>Calitatea echipamentelor</strong> ofertate (panouri Tier 1 vs Tier 2, invertor cu garanție 10 vs 5 ani)</li>
          </ul>
          <p>
            De aceea, după ce calculatorul îți dă o cifră inițială, cere <strong>3 oferte concrete</strong> de la instalatori autorizați
            ANRE — diferența între ofertele primite e adesea instructivă în sine.
          </p>

          <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 mt-8">
            <p className="text-sm text-gray-800">
              <strong>Vrei oferte concrete pe baza estimării?</strong>{' '}
              <a href="/cere-oferta" className="text-primary-dark font-medium hover:underline">Trimite cererea</a>{' '}
              către instalatori verificați din județul tău, sau{' '}
              <a href="/firme" className="text-primary-dark font-medium hover:underline">vezi lista completă</a>{' '}
              de instalatori cu certificări ANRE active.
            </p>
          </div>
        </section>

        {/* FAQ visible */}
        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold text-secondary-dark">Întrebări frecvente</h2>
          <div className="space-y-3">
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Cât costă un sistem fotovoltaic pentru firmă în 2026?</summary>
              <p className="mt-2 text-sm text-gray-600">
                Pentru sisteme la cheie: ~4.500 RON/kWp sub 50 kWp, ~3.800 RON/kWp între 50–200 kWp, ~3.500 RON/kWp peste 200 kWp.
                Include panouri, invertor, structură, manoperă, proiect, autorizații și racordare. Nu include baterii sau upgrade racord.
              </p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Cum se calculează kWp-ul pentru o firmă?</summary>
              <p className="mt-2 text-sm text-gray-600">
                kWp ≈ consum anual ÷ yield-ul județului. În România yield-ul e între 1.140 și 1.380 kWh/kWp/an, în funcție de zonă și tipul montajului. Calculatorul folosește date PVGIS și ajustează pentru montaj înclinat / terasă / sol.
              </p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Ce este cota de autoconsum?</summary>
              <p className="mt-2 text-sm text-gray-600">
                Procentul din producție pe care firma îl consumă direct (nu se injectează). Autoconsum 80% e tipic pentru firme cu activitate diurnă; sub 50% înseamnă că un sistem cu baterii ar fi mai profitabil.
              </p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">În cât timp se recuperează investiția?</summary>
              <p className="mt-2 text-sm text-gray-600">
                Tipic 4–6 ani pentru o firmă cu autoconsum 70–80% și tarif energie peste 1,20 RON/kWh. Sistemul funcționează 25+ ani, deci profitul net e de 3–5× investiția inițială.
              </p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Cât de precise sunt estimările?</summary>
              <p className="mt-2 text-sm text-gray-600">
                Sunt orientative — îți dau ordinul de mărime corect. Variația reală în oferte poate fi ±20% în funcție de umbrire, orientare exactă, calitatea echipamentelor și distanță de racord. Cere 3 oferte de la instalatori autorizați ANRE pentru cifre exacte.
              </p>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
