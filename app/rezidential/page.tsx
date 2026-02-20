import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import WaitlistForm from '@/components/forms/WaitlistForm';
import { generateBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Panouri Fotovoltaice Rezidențiale - În Curând',
  description:
    'Directorul pentru panouri fotovoltaice rezidențiale va fi disponibil în curând. Înscrie-te pentru a fi notificat la lansare.',
  alternates: { canonical: '/rezidential' },
};

export default function RezidentialPage() {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Rezidențial', url: '/rezidential' },
        ])}
      />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Rezidențial' }]} />

        <div className="mt-16 mb-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-2xl flex items-center justify-center">
            <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>

          <p className="text-sm font-medium text-primary-dark mb-2">În curând</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Director Panouri Fotovoltaice Rezidențiale
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto">
            Lucrăm la directorul pentru panouri fotovoltaice pentru casă. Înscrie-te pentru a fi printre primii notificați la lansare.
          </p>

          <div className="flex justify-center mb-8">
            <WaitlistForm />
          </div>

          <div className="bg-surface rounded-xl border border-border p-6 text-left max-w-md mx-auto">
            <h2 className="font-semibold text-gray-900 mb-3">Ce vei găsi:</h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Instalatori verificați pentru case și apartamente
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Ghid de prețuri actualizat pentru sisteme rezidențiale
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Calculator de economii personalizat
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Informații despre programul Casa Verde
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
