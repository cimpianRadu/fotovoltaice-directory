import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { getCaseStudies, getHeroPhoto } from '@/lib/case-studies';
import { generateBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Studii de Caz - Montaje Fotovoltaice din România',
  description:
    'Montaje fotovoltaice documentate cu echipamentele folosite, configurația sistemului, producția estimată și cine a executat lucrarea. Cifre puse la dispoziție de instalatori.',
  alternates: { canonical: '/studii-de-caz' },
};

export default function CaseStudiesPage() {
  const studies = getCaseStudies();

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Studii de caz', url: '/studii-de-caz' },
        ])}
      />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Studii de caz' }]} />

        <div className="mt-6 mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Studii de caz: montaje fotovoltaice din România
          </h1>
          <p className="text-gray-500 mt-3 text-lg max-w-3xl">
            Lucrări documentate cu echipamentele folosite, configurația sistemului și firma care
            le-a montat. Toate cifrele vin de la instalatorii care au făcut lucrarea, iar unde
            calculăm ceva spunem din ce.
          </p>
        </div>

        {studies.length === 0 ? (
          <p className="text-sm text-gray-500">Niciun studiu de caz publicat momentan.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {studies.map((study) => {
              const hero = getHeroPhoto(study);
              return (
                <Link
                  key={study.slug}
                  href={`/studii-de-caz/${study.slug}`}
                  className="group rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  {hero && (
                    <div className="aspect-[16/10] overflow-hidden bg-surface">
                      <Image
                        src={hero.src}
                        alt={study.title}
                        width={800}
                        height={500}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex flex-wrap gap-2 mb-3 text-xs">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary-dark font-medium">
                        {study.project.kwp.toString().replace('.', ',')} kWp
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface text-gray-600">
                        {study.project.county}
                      </span>
                      {study.project.battery && (
                        <span className="px-2 py-0.5 rounded bg-surface text-gray-600">
                          cu stocare
                        </span>
                      )}
                    </div>
                    <h2 className="font-bold text-gray-900 group-hover:text-primary-dark transition-colors">
                      {study.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                      {study.heroDescription}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12 rounded-xl border border-border bg-surface p-6">
          <h2 className="font-bold text-gray-900">Ai făcut un montaj și vrei să apară aici?</h2>
          <p className="text-sm text-gray-600 mt-2 max-w-2xl">
            Documentăm lucrări cu poze de pe teren și cifrele exacte ale sistemului. Dacă
            ești instalator și vrei ca o lucrare de-a ta să fie prezentată,{' '}
            <Link href="/listeaza-firma" className="text-primary-dark hover:underline">
              scrie-ne
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
