import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import LeadForm from '@/components/forms/LeadForm';
import { generateBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Despre Noi - Instalatori Fotovoltaice România',
  description:
    'Despre proiectul Instalatori Fotovoltaice România - directorul #1 pentru firme de instalare panouri fotovoltaice comerciale și industriale.',
};

export default function DesprePage() {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Despre', url: '/despre' },
        ])}
      />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Despre' }]} />

        <div className="mt-6 mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Despre Instalatori Fotovoltaice
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Content */}
          <div className="lg:col-span-3 space-y-6">
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Misiunea noastră</h2>
              <p className="text-gray-600 leading-relaxed">
                Instalatori Fotovoltaice România este directorul #1 dedicat exclusiv segmentului comercial și industrial
                al pieței de energie solară din România. Misiunea noastră este să conectăm companiile care doresc
                să investească în energie solară cu cei mai buni instalatori verificați din țară.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">De ce existăm?</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Piața de fotovoltaice comerciale din România crește rapid, dar găsirea unui instalator de încredere
                pentru un proiect industrial rămâne o provocare. Informațiile sunt fragmentate, iar diferențele
                de calitate între instalatori pot fi enorme.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Am creat acest director pentru a oferi transparență și a facilita procesul de selecție.
                Toate firmele listate sunt verificate, iar datele despre experiență, certificări și stabilitate
                financiară sunt actualizate constant.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Ce ne diferențiază?</h2>
              <ul className="text-gray-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">1.</span>
                  <span><strong>Focus exclusiv pe comercial/industrial</strong> - nu rezidențial, nu panouri pentru casă</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">2.</span>
                  <span><strong>Date verificate</strong> - certificări ANRE, date financiare, proiecte reale</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">3.</span>
                  <span><strong>Gratuit pentru companii</strong> - cererea de ofertă este gratuită și fără obligații</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">4.</span>
                  <span><strong>Ghiduri practice</strong> - conținut educațional pentru decizii informate</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Ești instalator?</h2>
              <p className="text-gray-600 leading-relaxed">
                Dacă ești o firmă de instalare panouri fotovoltaice comerciale și dorești să fii listat
                în directorul nostru, completează formularul de contact de mai jos sau trimite-ne un email.
                Listarea de bază este gratuită.
              </p>
            </section>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-border p-5 sticky top-20">
              <h2 className="font-bold text-gray-900 mb-4">Contactează-ne</h2>
              <LeadForm sourcePage="despre" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
