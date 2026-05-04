import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import CalculatorClient from './CalculatorClient';
import PremiumPoolSection from '@/components/promo/PremiumPoolSection';

export const metadata: Metadata = {
  title: 'Calculator Amortizare Panouri Fotovoltaice 2026 — Cost și Producție',
  description:
    'Calculator gratuit pentru firme: estimează cât costă, cât produce și în câți ani se amortizează un sistem fotovoltaic. Date pe județ, prețuri 2026, cotă de autoconsum configurabilă.',
  alternates: { canonical: '/calculator-panouri-fotovoltaice' },
  openGraph: {
    type: 'website',
    url: '/calculator-panouri-fotovoltaice',
    title: 'Calculator Amortizare Panouri Fotovoltaice 2026',
    description:
      'Estimează cost, producție și amortizare pentru sistemul fotovoltaic al firmei tale. Date pe județ, autoconsum configurabil.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Calculator Amortizare Panouri Fotovoltaice',
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
        text: 'Pentru sisteme comerciale la cheie, prețul mediu este între 3.500 și 4.500 RON pe kWp în 2026, în funcție de mărime: sub 50 kWp aproximativ 4.500 RON/kWp, între 50 și 200 kWp în jur de 3.800 RON/kWp, iar peste 200 kWp aproximativ 3.500 RON/kWp. Prețul include panourile, invertorul, structura de montaj, manopera, autorizațiile și racordarea la rețea.',
      },
    },
    {
      '@type': 'Question',
      name: 'Cum dimensionezi un sistem fotovoltaic pentru firmă?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Regula simplă este: puterea instalată (kWp) = consumul anual (kWh) împărțit la producția specifică a zonei (kWh produși de fiecare kWp într-un an). În România, producția specifică variază între 1.140 kWh/kWp/an în zonele montane și 1.380 kWh/kWp/an în sudul Dobrogei, pentru un sistem optim orientat spre sud. Calculatorul folosește date pe fiecare județ și ajustează pentru tipul de montaj (acoperiș înclinat, terasă sau sol).',
      },
    },
    {
      '@type': 'Question',
      name: 'Ce este cota de autoconsum și cum influențează economiile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cota de autoconsum reprezintă procentul din producția fotovoltaică pe care firma îl consumă direct, fără să fie injectat în rețea. Energia autoconsumată îți elimină plata către furnizor (aproximativ 1,30 RON/kWh), iar energia injectată este plătită la tariful prosumator (aproximativ 0,30 RON/kWh). Cu cât autoconsumul este mai mare, cu atât amortizarea este mai rapidă. Pentru firme cu activitate de zi, cota tipică este între 60% și 80%.',
      },
    },
    {
      '@type': 'Question',
      name: 'În câți ani se amortizează un sistem fotovoltaic comercial?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pentru o firmă cu autoconsum între 70% și 80% și un tarif curent al energiei peste 1,20 RON/kWh, amortizarea este tipic între 4 și 6 ani, la prețurile pieței din 2026. Sistemul produce energie peste 25 de ani, iar profitul net pe toată durata de viață ajunge la 3–5 ori investiția inițială.',
      },
    },
    {
      '@type': 'Question',
      name: 'Cât de precise sunt estimările acestui calculator?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Calculatorul folosește producții specifice multianuale (model PVGIS) și prețuri medii de piață pentru 2026. Variația reală în ofertele primite poate fi de ±20%, în funcție de condițiile concrete ale acoperișului, calitatea echipamentelor, tipul invertorului, distanța până la tabloul de racordare și complexitatea structurii. Pentru o decizie informată, cere oferte detaliate de la cel puțin trei instalatori autorizați ANRE.',
      },
    },
  ],
};

export default function CalculatorPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Calculator Amortizare' }]} />

        <h1 className="text-3xl sm:text-4xl font-bold text-secondary-dark mt-4 mb-3">
          Calculator Cost și Amortizare Sistem Fotovoltaic
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Estimează în 30 de secunde cât costă un sistem fotovoltaic pentru firma ta, cât produce într-un an
          și în câți ani se amortizează. Cu date pe fiecare județ și prețuri actualizate pentru 2026.
        </p>

        <CalculatorClient />

        <PremiumPoolSection
          title="Instalatori Recomandați"
          subtitle="Firme partenere care pot prelua proiectul tău"
        />

        {/* SEO content */}
        <section className="mt-16 space-y-6 text-gray-700 text-[15px] leading-relaxed">
          <h2 className="text-xl font-semibold text-secondary-dark">
            Cum funcționează calculatorul
          </h2>
          <p>
            Calculatorul dimensionează sistemul fotovoltaic pornind de la <strong>consumul anual al firmei</strong> și de la <strong>producția specifică a județului</strong>.
            Producția specifică este energia produsă într-un an de fiecare kWp instalat și se exprimă în kWh/kWp/an.
            În România, ea variază între aproximativ 1.140 kWh/kWp/an în zonele montane (Harghita, Covasna)
            și 1.380 kWh/kWp/an în sudul Dobrogei (Constanța, Tulcea). Datele de bază provin din modelul european
            PVGIS-SARAH3, ca medii multianuale 2005–2023.
          </p>
          <p>
            Pe lângă județ, tipul de montaj influențează semnificativ producția. Un acoperiș înclinat orientat spre sud,
            la aproximativ 30°, este referința. O <strong>terasă plată</strong> cu structură la 10–15° produce cu 5–7% mai puțin
            (compensat parțial de spațiul mai mare disponibil). Un <strong>montaj la sol</strong>, bine orientat, poate depăși cu 1–2%
            acoperișul, datorită posibilității de a alege unghiul optim.
          </p>

          <h2 className="text-xl font-semibold text-secondary-dark">
            De ce contează cota de autoconsum
          </h2>
          <p>
            Pentru o firmă, profitabilitatea sistemului fotovoltaic nu vine doar din producția totală, ci mai ales din
            <strong> cât din această producție o consumă direct firma</strong>. Energia autoconsumată elimină plata către furnizor
            (în 2026, tarifele tipice sunt între 1,20 și 1,50 RON/kWh), pe când energia injectată în rețea este plătită
            de furnizor la <strong>tariful prosumator</strong> (aproximativ 0,30 RON/kWh, schemă reglementată).
            Diferența de aproape 4× explică de ce un autoconsum de 80% generează mult mai mult cash decât unul de 40%,
            chiar pentru același sistem instalat.
          </p>
          <p>
            Pentru firme cu activitate de zi (birouri, hală cu schimb 8–17, depozit cu refrigerare), cota de autoconsum
            tipică este între <strong>70% și 85%</strong>. Pentru retail care lucrează și seara sau pentru consumatori cu vârf de noapte
            (de exemplu, încărcare camioane), cota poate scădea spre 40–60%, iar atunci o investiție în baterii de stocare
            schimbă semnificativ ecuația.
          </p>

          <h2 className="text-xl font-semibold text-secondary-dark">
            Prețuri 2026 pentru sisteme fotovoltaice comerciale
          </h2>
          <p>
            Prețurile la cheie folosite de calculator reflectă media pieței românești în 2026, pe trei tranșe de mărime:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Sub 50 kWp:</strong> aproximativ 4.500 RON/kWp — costurile fixe (proiect, autorizații, manoperă) au pondere mai mare.</li>
            <li><strong>Între 50 și 200 kWp:</strong> aproximativ 3.800 RON/kWp — intervalul cu cel mai bun raport calitate-preț pentru hale și clădiri comerciale medii.</li>
            <li><strong>Peste 200 kWp:</strong> aproximativ 3.500 RON/kWp — economii de scară pe panouri și manoperă.</li>
          </ul>
          <p>
            Prețurile includ panouri TOPCon de calitate Tier 1, invertor string sau hibrid, structură de montaj,
            cabluri DC și AC, tablouri electrice, manoperă, proiect tehnic, dosar de autorizare, racordarea la operatorul
            de distribuție și punerea în funcțiune. Nu includ baterii de stocare, lucrări civile suplimentare
            (consolidări structurale) sau extinderi ale tabloului principal.
          </p>

          <h2 className="text-xl font-semibold text-secondary-dark">
            Limitele unei estimări online
          </h2>
          <p>
            Calculatorul îți dă un <strong>ordin de mărime</strong> — util ca să decizi dacă merită să continui investigația și ca să
            compari ofertele primite. Nu înlocuiește un audit tehnic la fața locului. Variabile pe care un calculator
            online nu le poate captura:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Umbrirea</strong> de la clădirile vecine, copaci, coșuri sau echipamente HVAC de pe acoperiș.</li>
            <li><strong>Orientarea reală</strong> a acoperișului (sud-est sau sud-vest pierd 5–10% față de sud pur).</li>
            <li><strong>Capacitatea structurii</strong> de a susține panourile și balastul (terasă) sau structura (acoperiș înclinat).</li>
            <li><strong>Distanța de la câmpul de panouri la tabloul de racordare</strong> (cabluri lungi înseamnă costuri și pierderi mai mari).</li>
            <li><strong>Capacitatea racordului existent</strong> și costurile de upgrade (transformator, cabluri îngropate).</li>
            <li><strong>Calitatea echipamentelor</strong> ofertate (panouri Tier 1 față de Tier 2, invertor cu garanție de 10 ani față de 5 ani).</li>
          </ul>
          <p>
            De aceea, după ce calculatorul îți dă o cifră inițială, cere <strong>cel puțin trei oferte concrete</strong> de la
            instalatori autorizați ANRE. Diferența între ofertele primite e adesea instructivă în sine.
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
                Pentru sisteme la cheie: aproximativ 4.500 RON/kWp sub 50 kWp, în jur de 3.800 RON/kWp între 50 și 200 kWp,
                și aproximativ 3.500 RON/kWp peste 200 kWp. Prețul include panouri, invertor, structură, manoperă,
                proiect, autorizații și racordare. Nu include baterii sau upgrade de racord.
              </p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Cum dimensionezi un sistem fotovoltaic pentru firmă?</summary>
              <p className="mt-2 text-sm text-gray-600">
                Puterea instalată (kWp) ≈ consumul anual împărțit la producția specifică a județului. În România,
                producția specifică este între 1.140 și 1.380 kWh/kWp/an, în funcție de zonă și de tipul montajului.
                Calculatorul folosește date pe fiecare județ și ajustează pentru montaj înclinat, terasă sau sol.
              </p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Ce este cota de autoconsum?</summary>
              <p className="mt-2 text-sm text-gray-600">
                Procentul din producția sistemului pe care firma îl consumă direct, fără să fie injectat în rețea.
                Un autoconsum de 80% este tipic pentru firme cu activitate de zi. Sub 50%, devine interesantă o investiție
                în baterii de stocare.
              </p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">În câți ani se amortizează investiția?</summary>
              <p className="mt-2 text-sm text-gray-600">
                Tipic între 4 și 6 ani pentru o firmă cu autoconsum 70–80% și tarif curent peste 1,20 RON/kWh. Sistemul
                funcționează peste 25 de ani, deci profitul net total este de 3–5 ori mai mare decât investiția inițială.
              </p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Cât de precise sunt estimările?</summary>
              <p className="mt-2 text-sm text-gray-600">
                Sunt orientative — îți dau ordinul de mărime corect. Variația reală în oferte poate fi de ±20%, în funcție
                de umbrire, orientare exactă, calitatea echipamentelor și distanța până la racord. Cere cel puțin trei
                oferte de la instalatori autorizați ANRE pentru cifre exacte.
              </p>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
