import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import guidesData from '@/data/guides.json';

export const metadata: Metadata = {
  title: 'Ghiduri Panouri Fotovoltaice Comerciale | Articole și Resurse 2026',
  description:
    'Ghiduri complete despre panouri fotovoltaice comerciale și industriale: costuri, legislație, subvenții, alegerea instalatorului. Informații verificate și actualizate.',
  alternates: { canonical: '/ghid' },
};

export default function GhidIndexPage() {
  const guides = guidesData.guides;

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Ghiduri', url: '/ghid' },
        ])}
      />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Ghiduri' }]} />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Ghiduri Fotovoltaice Comerciale
          </h1>
          <p className="text-gray-500 mt-2">
            Articole și resurse pentru firme care vor să investească în energie solară
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/ghid/${guide.slug}`}
              className="flex flex-col p-6 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all bg-white"
            >
              <h2 className="font-semibold text-gray-900 mb-2 text-lg">
                {guide.title}
              </h2>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {guide.heroDescription}
              </p>
              <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Image src="/logo.svg" alt="" width={16} height={16} className="w-4 h-4" />
                  <span className="font-medium text-gray-600">{guide.author}</span>
                  <span className="text-gray-300">|</span>
                  <span>Specialist Instalatori Fotovoltaice</span>
                </div>
                <time dateTime={guide.publishedAt} className="hidden sm:block">
                  {new Date(guide.publishedAt).toLocaleDateString('ro-RO', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </time>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
