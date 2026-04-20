import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import AnreVerificationClient from './AnreVerificationClient';

export const metadata: Metadata = {
  title: 'Verificare Atestat ANRE — Caută Instalator Autorizat',
  description:
    'Verifică online atestatele ANRE ale instalatorilor fotovoltaici. Caută după nume sau CUI și vezi certificările active, expirate sau retrase direct din registrul ANRE.',
  alternates: {
    canonical: '/verificare-anre',
  },
  openGraph: {
    type: 'website',
    url: '/verificare-anre',
    title: 'Verificare Atestat ANRE — Caută Instalator Autorizat',
    description:
      'Verifică online atestatele ANRE ale instalatorilor fotovoltaici. Caută după nume sau CUI și vezi certificările active, expirate sau retrase.',
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
        text: 'Atestatul ANRE este o certificare emisă de Autoritatea Națională de Reglementare în domeniul Energiei care confirmă că un operator economic are competența de a proiecta și/sau executa instalații electrice.',
      },
    },
    {
      '@type': 'Question',
      name: 'Ce înseamnă atestat ANRE tip C2A?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Atestatul C2A permite proiectarea și executarea instalațiilor electrice exterioare de medie și înaltă tensiune. Este esențial pentru proiecte fotovoltaice comerciale și industriale mai mari de 50 kWp.',
      },
    },
    {
      '@type': 'Question',
      name: 'Cum verific dacă un instalator are atestat ANRE valid?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Puteți verifica atestatele ANRE ale oricărui instalator folosind instrumentul nostru de verificare. Introduceți numele firmei sau CUI-ul și veți vedea toate certificările active, expirate sau retrase din registrul oficial ANRE.',
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
          Verificare Atestat ANRE
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          Caută un instalator după nume sau CUI și verifică dacă are atestate ANRE valide.
        </p>

        <AnreVerificationClient />

        {/* Info section about certificate types */}
        <section className="mt-12 space-y-6">
          <h2 className="text-xl font-semibold text-secondary-dark">
            Tipuri de Atestate ANRE pentru Fotovoltaice
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="bg-surface rounded-xl border border-border p-4">
              <h3 className="font-semibold text-secondary-dark mb-1">C2A — Executare Exterioară</h3>
              <p className="text-sm text-gray-600">
                Proiectare + executare instalații electrice exterioare (medie/înaltă tensiune).{' '}
                <strong>Esențial</strong> pentru proiecte comerciale/industriale peste 50 kWp.
              </p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <h3 className="font-semibold text-secondary-dark mb-1">B — Joasă Tensiune</h3>
              <p className="text-sm text-gray-600">
                Executare instalații electrice de joasă tensiune. Suficient pentru proiecte
                rezidențiale sau IMM-uri mici (sub 50 kWp).
              </p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-4">
              <h3 className="font-semibold text-secondary-dark mb-1">C1A — Proiectare Exterioară</h3>
              <p className="text-sm text-gray-600">
                Proiectare instalații electrice exterioare. Doar proiectare, nu execuție.
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
            Depinde de dimensiunea proiectului. Pentru un <strong>sistem rezidențial sau comercial mic</strong> (sub 50 kWp), este suficient un atestat <strong>tip B</strong> (executare instalații electrice de joasă tensiune). Pentru <strong>proiecte comerciale și industriale</strong> mai mari de 50 kWp — hale industriale, clădiri de birouri, parcuri logistice — este necesar atestatul <strong>tip C2A</strong>, care acoperă proiectarea și executarea instalațiilor electrice exterioare de medie și înaltă tensiune.
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
            <li>Verifică <strong>atestatul C2A</strong> pentru orice proiect comercial sau industrial — este obligatoriu pentru sisteme peste 50 kWp</li>
            <li>Asigură-te că atestatul este în stare <strong>„Atestat"</strong> (activ), nu „Expirat" sau „Retras"</li>
            <li>Verifică <strong>data de expirare</strong> — un atestat care expiră în curând ar putea cauza probleme dacă proiectul durează mai mult</li>
            <li>Cere referințe și vizitează proiecte finalizate — atestatul ANRE este o condiție necesară, dar nu suficientă</li>
            <li>Verifică și <strong>certificările ISO</strong> (9001, 14001, 45001) pentru un indicator suplimentar de profesionalism</li>
          </ul>

          <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 mt-6">
            <p className="text-sm text-gray-800">
              <strong>Cauți un instalator fotovoltaic verificat?</strong> În{' '}
              <a href="/firme" className="text-primary-dark font-medium hover:underline">platforma noastră</a>{' '}
              găsești doar firme cu date verificate din surse publice oficiale, inclusiv certificări ANRE confirmate.
              Poți filtra după tip de atestat, județ și specializare.
            </p>
          </div>
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
              <p className="mt-2 text-sm text-gray-600">Atestatul C2A permite proiectarea și executarea instalațiilor electrice exterioare de medie și înaltă tensiune. Este esențial pentru proiecte fotovoltaice comerciale și industriale mai mari de 50 kWp — hale, clădiri de birouri, parcuri logistice.</p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Cum verific dacă un instalator are atestat ANRE valid?</summary>
              <p className="mt-2 text-sm text-gray-600">Folosește instrumentul de verificare de pe această pagină. Introdu numele firmei sau CUI-ul și vei vedea toate certificările active, expirate sau retrase din registrul oficial ANRE, afișate într-un format ușor de înțeles.</p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Ce atestat trebuie să aibă un instalator fotovoltaic?</summary>
              <p className="mt-2 text-sm text-gray-600">Pentru sisteme rezidențiale sau mici (sub 50 kWp) este suficient atestatul tip B. Pentru proiecte comerciale și industriale (peste 50 kWp) este necesar atestatul tip C2A. Ideal, firma ar trebui să aibă și atestate complementare (A3, E1, E2).</p>
            </details>
            <details className="bg-surface rounded-xl border border-border p-4 group">
              <summary className="font-medium text-secondary-dark cursor-pointer">Un instalator fără atestat ANRE poate monta panouri fotovoltaice?</summary>
              <p className="mt-2 text-sm text-gray-600">Legal, nu. Orice lucrare electrică în România trebuie executată de un operator economic atestat ANRE. Un instalator fără atestat valid riscă să nu obțină racordarea la rețea de la operatorul de distribuție, iar clientul poate pierde garanția echipamentelor.</p>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
