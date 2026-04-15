import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import LeadForm from '@/components/forms/LeadForm';
import { generateBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Despre Noi - Instalatori Fotovoltaice România',
  description:
    'Despre proiectul Instalatori Fotovoltaice România - platforma #1 pentru firme de instalare panouri fotovoltaice comerciale și industriale.',
  alternates: { canonical: '/despre' },
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
                Instalatori Fotovoltaice România este platforma #1 dedicată exclusiv segmentului comercial și industrial
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
                Am creat această platformă pentru a oferi transparență și a facilita procesul de selecție.
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
                pe platforma noastră, completează formularul de contact de mai jos sau trimite-ne un email
                la <a href="mailto:contact@instalatori-fotovoltaice.ro" className="text-primary hover:underline">contact@instalatori-fotovoltaice.ro</a>.
                Listarea de bază este gratuită.
              </p>
            </section>

            <section className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-primary/15 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Promovează-ți firma</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Vrei să fii mai vizibil în fața clienților care caută instalatori fotovoltaici?
                Oferim pachete de promovare adaptate nevoilor tale — de la badge &quot;Partener Verificat&quot;
                și poziție prioritară în listă, până la bannere pe ghiduri și articole sponsorizate.
              </p>
              <ul className="text-sm text-gray-600 space-y-2 mb-5">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  <span><strong>Listing Sponsor</strong> — logo și link pe toate ghidurile (de la 29 EUR/lună)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  <span><strong>Profil Premium</strong> — badge verificat, poziție prioritară, lead-uri (de la 49 EUR/lună)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 shrink-0">&#10003;</span>
                  <span><strong>Enterprise</strong> — tot din Premium + banner pe ghiduri și articol dedicat (de la 99 EUR/lună)</span>
                </li>
              </ul>
              <Link
                href="/publicitate"
                className="inline-flex items-center bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
              >
                Vezi opțiunile de promovare &rarr;
              </Link>
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
