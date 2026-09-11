import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import AnreVerificationClient from './AnreVerificationClient';
import PromovateSection from '@/components/promo/PromovateSection';
import InstallerCta from '@/components/InstallerCta';
import { getPlusCompaniesForAnre, PROMO_CAPS } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Verificare Instalator Fotovoltaic — Atestat ANRE + Casa Verde',
  description:
    'Verifică instant un instalator de panouri fotovoltaice: atestatele ANRE (C2A, C1A, B, A3 — active sau expirate, live din registrul oficial) și dacă apare pe lista AFM Casa Verde Fotovoltaice. Caută după nume sau CUI.',
  alternates: {
    canonical: '/verificare-anre',
  },
  openGraph: {
    type: 'website',
    url: '/verificare-anre',
    title: 'Verificare Instalator Fotovoltaic — ANRE + Casa Verde',
    description:
      'Verifică instant atestatul ANRE (live) și validarea Casa Verde a oricărei firme de panouri fotovoltaice.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Verificare Atestat ANRE Instalatori Fotovoltaici',
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
      name: 'Ce este atestatul ANRE?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Atestatul ANRE este o certificare emisă de Autoritatea Națională de Reglementare în domeniul Energiei care confirmă că un operator economic are competența de a proiecta și/sau executa instalații electrice. Este obligatoriu pentru orice firmă care realizează lucrări electrice în România.',
      },
    },
    {
      '@type': 'Question',
      name: 'Ce înseamnă atestat ANRE tip C2A?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Atestatul C2A acoperă executarea liniilor electrice aeriene sau subterane de 0,4–20 kV, a posturilor de transformare de până la 20 kV și a părții de medie tensiune din stații, și include competențele Be, Bi, A1 și A2. Contează pentru proiectele fotovoltaice a căror racordare se face în medie tensiune — de regulă hale industriale, clădiri de birouri sau parcuri logistice. Tensiunea de racordare nu ține de o putere fixă în kWp: o stabilește operatorul de distribuție prin avizul tehnic de racordare (ATR).',
      },
    },
    {
      '@type': 'Question',
      name: 'Cum verific dacă un instalator are atestat ANRE valid?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Folosește instrumentul de verificare de pe această pagină. Introdu numele firmei sau CUI-ul și vei vedea toate certificările active, expirate sau retrase din registrul oficial ANRE, afișate într-un format ușor de înțeles.',
      },
    },
    {
      '@type': 'Question',
      name: 'Ce atestat trebuie să aibă un instalator fotovoltaic?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Depinde de tensiunea la care se racordează sistemul, nu de o putere anume. Pentru instalația electrică a clădirii și pentru branșamentul în joasă tensiune (0,4 kV) e suficient atestatul tip B, care acoperă atât proiectarea, cât și execuția. Dacă operatorul de distribuție cere racordare în medie tensiune, lucrarea are nevoie de C1A pentru proiectare și C2A pentru execuție, ambele acoperind 0,4–20 kV. Tensiunea de racordare o stabilește operatorul prin avizul tehnic de racordare (ATR), în funcție de puterea cerută și de rețeaua din zonă. Multe firme au și atestate complementare (A3, E1, E2).',
      },
    },
    {
      '@type': 'Question',
      name: 'Un instalator fără atestat ANRE poate monta panouri fotovoltaice?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Legal, nu. Orice lucrare electrică în România trebuie executată de un operator economic atestat ANRE. Un instalator fără atestat valid riscă să nu obțină racordarea la rețea de la operatorul de distribuție, iar clientul poate pierde garanția echipamentelor.',
      },
    },
    {
      '@type': 'Question',
      name: 'Cum verific dacă un instalator e validat Casa Verde Fotovoltaice?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Caută firma după CUI pe această pagină — îți arătăm dacă apare pe lista AFM de instalatori validați în programul Casa Verde Fotovoltaice (sesiunea 2024), alături de atestatele ANRE. Pentru a obține subvenția Casa Verde, montajul trebuie făcut de un instalator validat de AFM. Lista oficială se actualizează pe sesiuni, deci confirmă starea curentă și pe afm.ro.',
      },
    },
  ],
};

export default function VerificareAnrePage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Verificare ANRE' }]} />

        <h1 className="text-3xl font-bold text-secondary-dark mt-4 mb-2">
          Verificare Instalator Fotovoltaic
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Caută un instalator după nume sau CUI și verifică într-un singur loc dacă are{' '}
          <strong>atestate ANRE valide</strong> (live din registrul oficial) și dacă apare pe{' '}
          <strong>lista AFM Casa Verde Fotovoltaice</strong>. Pentru status Casa Verde exact, caută după CUI.
        </p>

        <AnreVerificationClient />

        {(() => {
          const plusOnAnre = getPlusCompaniesForAnre();
          if (plusOnAnre.length === 0) return null;
          return (
            <div className="mt-10">
              <PromovateSection
                companies={plusOnAnre}
                max={PROMO_CAPS.plusOnAnre}
                title="Instalatori Parteneri Verificați ANRE"
                subtitle="Firme partenere ale platformei — toate cu atestat ANRE activ"
              />
            </div>
          );
        })()}

        {/* Info section about certificate types */}
        <section className="mt-12 space-y-6">
          <h2 className="text-xl font-semibold text-secondary-dark">
            Tipuri de Atestate ANRE pentru Fotovoltaice
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-surface rounded-xl border border-border p-4">
              <h3 className="font-semibold text-secondary-dark mb-1">C2A — Executare 0,4–20 kV</h3>
              <p className="text-sm text-gray-600">
                Executare linii electrice de 0,4–20 kV, posturi de transformare de până la 20 kV și
                partea de medie tensiune a stațiilor.{' '}
                <strong>Esențial</strong> când racordarea se face în medie tensiune.
              </p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <h3 className="font-semibold text-secondary-dark mb-1">B — Joasă Tensiune</h3>
              <p className="text-sm text-gray-600">
                Proiectare și executare instalații electrice și branșamente la 0,4 kV. Suficient
                când sistemul se racordează în joasă tensiune.
              </p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <h3 className="font-semibold text-secondary-dark mb-1">C1A — Proiectare 0,4–20 kV</h3>
              <p className="text-sm text-gray-600">
                Proiectare linii electrice de 0,4–20 kV și posturi de transformare. Doar
                proiectare, nu execuție.
              </p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <h3 className="font-semibold text-secondary-dark mb-1">A3, E1, E2 — Proiectare/Verificare</h3>
              <p className="text-sm text-gray-600">
                Atestate de proiectare generală (A3) și verificare instalații (E1 proiecte, E2
                execuție). Complementare, nu suficiente singure.
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-xl border border-border p-4">
            <h3 className="font-semibold text-secondary-dark mb-2">Stări posibile</h3>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span><strong>Atestat</strong> — valid, activ</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span><strong>Expirat</strong> — nu a fost reînnoit</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span><strong>Retras</strong> — retras de ANRE sau titular</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                <span><strong>ScosDinEvidenta</strong> — eliminat din registru</span>
              </span>
            </div>
          </div>
        </section>

        {/* SEO content section */}
        <section className="mt-12 space-y-6 text-gray-700 text-[15px] leading-relaxed">
          <h2 className="text-xl font-semibold text-secondary-dark">
            De ce e important să verifici atestatul ANRE al instalatorului
          </h2>
          <p>
            Instalarea unui sistem fotovoltaic presupune lucrări electrice complexe — de la racordarea la rețeaua de distribuție, la configurarea invertoarelor și a sistemelor de protecție. Un instalator fără atestat ANRE valid nu are dreptul legal de a executa aceste lucrări, iar consecințele pot fi grave: de la refuzul operatorului de distribuție de a racorda sistemul, până la pierderea garanției echipamentelor sau, în cel mai rău caz, riscuri de incendiu.
          </p>
          <p>
            <strong>Autoritatea Națională de Reglementare în Domeniul Energiei (ANRE)</strong> este singura instituție din România care atestă operatorii economici pentru proiectarea și executarea instalațiilor electrice. Atestatul ANRE confirmă că firma deține personalul calificat, echipamentele necesare și procedurile de lucru conforme cu normativele tehnice în vigoare.
          </p>

          <h3 className="text-lg font-semibold text-secondary-dark">
            Ce atestat ANRE trebuie să aibă instalatorul de panouri fotovoltaice
          </h3>
          <p>
            Depinde de tensiunea la care se racordează sistemul, nu de puterea lui în kWp. Pentru instalația electrică a clădirii și pentru branșamentul în <strong>joasă tensiune</strong> (0,4 kV) e suficient un atestat <strong>tip B</strong>, care acoperă atât proiectarea, cât și execuția. Dacă operatorul de distribuție cere racordare în <strong>medie tensiune</strong> — situația obișnuită la hale industriale, clădiri de birouri sau parcuri logistice — lucrarea de racordare are nevoie de <strong>C1A</strong> pentru proiectare și <strong>C2A</strong> pentru execuție, ambele acoperind instalații de 0,4–20 kV. Tensiunea de racordare o stabilește operatorul prin <strong>avizul tehnic de racordare (ATR)</strong>, în funcție de puterea cerută și de rețeaua din zonă, deci nu există un prag fix în kWp de la care „e nevoie de C2A".
          </p>
          <p>
            Multe firme dețin și atestate complementare: <strong>A3</strong> (proiectare generală), <strong>E1</strong> și <strong>E2</strong> (verificare instalații), <strong>D1/D2</strong> (rețele electrice). Cu cât o firmă are mai multe tipuri de atestate active, cu atât poate acoperi mai multe etape ale proiectului fără a apela la subcontractori.
          </p>

          <h3 className="text-lg font-semibold text-secondary-dark">
            Cum funcționează instrumentul nostru de verificare
          </h3>
          <p>
            Instrumentul de verificare de pe această pagină interoghează în timp real <strong>registrul oficial ANRE</strong> al operatorilor economici atestați. Introduci numele firmei sau codul unic de înregistrare (CUI) și primești instantaneu lista completă a atestatelor — active, expirate sau retrase — cu numărul atestatului, data emiterii și data expirării.
          </p>
          <p>
            Spre deosebire de portalul oficial ANRE (portal.anre.ro), care are o interfață dificil de navigat, instrumentul nostru afișează rezultatele într-un format clar, cu evidențierea atestatelor relevante pentru instalarea de panouri fotovoltaice și badge-uri vizuale pentru starea fiecărei certificări.
          </p>

          <h3 className="text-lg font-semibold text-secondary-dark">
            Sfaturi pentru alegerea unui instalator verificat
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Verifică <strong>atestatul C2A</strong> dacă avizul tehnic de racordare cere medie tensiune — fără el, firma nu poate executa singură partea de racordare</li>
            <li>Asigură-te că atestatul este în stare <strong>„Atestat"</strong> (activ), nu „Expirat" sau „Retras"</li>
            <li>Verifică <strong>data de expirare</strong> — un atestat care expiră în curând ar putea cauza probleme dacă proiectul durează mai mult</li>
            <li>Cere referințe și vizitează proiecte finalizate — atestatul ANRE este o condiție necesară, dar nu suficientă</li>
            <li>Verifică și <strong>certificările ISO</strong> (9001, 14001, 45001) pentru un indicator suplimentar de profesionalism</li>
          </ul>

          <InstallerCta sursa="verificare-anre" />
        </section>

        {/* FAQ section visible */}
        <section className="mt-12 space-y-4">
          <h2 className="text-xl font-semibold text-secondary-dark">
            Întrebări frecvente despre atestatele ANRE
          </h2>
          <div className="space-y-3">
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Ce este atestatul ANRE?</summary>
              <p className="mt-2 text-sm text-gray-600">Atestatul ANRE este o certificare emisă de Autoritatea Națională de Reglementare în domeniul Energiei care confirmă că un operator economic are competența de a proiecta și/sau executa instalații electrice. Este obligatoriu pentru orice firmă care realizează lucrări electrice în România.</p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Ce înseamnă atestat ANRE tip C2A?</summary>
              <p className="mt-2 text-sm text-gray-600">Atestatul C2A acoperă executarea liniilor electrice aeriene sau subterane de 0,4–20 kV, a posturilor de transformare de până la 20 kV și a părții de medie tensiune din stații, și include competențele Be, Bi, A1 și A2. Contează pentru proiectele fotovoltaice a căror racordare se face în medie tensiune — de regulă hale industriale, clădiri de birouri sau parcuri logistice. Tensiunea de racordare nu ține de o putere fixă în kWp: o stabilește operatorul de distribuție prin avizul tehnic de racordare (ATR).</p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Cum verific dacă un instalator are atestat ANRE valid?</summary>
              <p className="mt-2 text-sm text-gray-600">Folosește instrumentul de verificare de pe această pagină. Introdu numele firmei sau CUI-ul și vei vedea toate certificările active, expirate sau retrase din registrul oficial ANRE, afișate într-un format ușor de înțeles.</p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Ce atestat trebuie să aibă un instalator fotovoltaic?</summary>
              <p className="mt-2 text-sm text-gray-600">Depinde de tensiunea la care se racordează sistemul, nu de o putere anume. Pentru instalația electrică a clădirii și pentru branșamentul în joasă tensiune (0,4 kV) e suficient atestatul tip B, care acoperă atât proiectarea, cât și execuția. Dacă operatorul de distribuție cere racordare în medie tensiune, lucrarea are nevoie de C1A pentru proiectare și C2A pentru execuție, ambele acoperind 0,4–20 kV. Tensiunea de racordare o stabilește operatorul prin avizul tehnic de racordare (ATR), în funcție de puterea cerută și de rețeaua din zonă. Multe firme au și atestate complementare (A3, E1, E2).</p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Un instalator fără atestat ANRE poate monta panouri fotovoltaice?</summary>
              <p className="mt-2 text-sm text-gray-600">Legal, nu. Orice lucrare electrică în România trebuie executată de un operator economic atestat ANRE. Un instalator fără atestat valid riscă să nu obțină racordarea la rețea de la operatorul de distribuție, iar clientul poate pierde garanția echipamentelor.</p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Cum verific dacă un instalator e validat Casa Verde Fotovoltaice?</summary>
              <p className="mt-2 text-sm text-gray-600">Caută firma după CUI pe această pagină — îți arătăm dacă apare pe lista AFM de instalatori validați în programul Casa Verde Fotovoltaice (sesiunea 2024), alături de atestatele ANRE. Pentru a obține subvenția Casa Verde, montajul trebuie făcut de un instalator validat de AFM. Lista oficială se actualizează pe sesiuni, deci confirmă starea curentă și pe afm.ro.</p>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
