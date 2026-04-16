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
    title: 'Verificare Atestat ANRE — Caută Instalator Autorizat',
    description:
      'Verifică online atestatele ANRE ale instalatorilor fotovoltaici. Caută după nume sau CUI și vezi certificările active, expirate sau retrase.',
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
      </div>
    </>
  );
}
