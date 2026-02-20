import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import FAQ from '@/components/seo/FAQ';
import Button from '@/components/ui/Button';
import Markdown from '@/components/ui/Markdown';
import guidesData from '@/data/guides.json';
import { generateFAQJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';

interface Props {
  params: Promise<{ topic: string }>;
}

export async function generateStaticParams() {
  return guidesData.guides.map((g) => ({ topic: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const guide = guidesData.guides.find((g) => g.slug === topic);
  if (!guide) return {};

  return {
    title: guide.title,
    description: guide.metaDescription,
    alternates: { canonical: `/ghid/${topic}` },
    openGraph: {
      title: guide.title,
      description: guide.metaDescription,
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { topic } = await params;
  const guide = guidesData.guides.find((g) => g.slug === topic);
  if (!guide) notFound();

  return (
    <>
      <JsonLd data={generateFAQJsonLd(guide.faq)} />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Ghiduri', url: '/ghid/panouri-fotovoltaice-hale-industriale' },
          { name: guide.title, url: `/ghid/${guide.slug}` },
        ])}
      />

      <article className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { label: 'Ghiduri', href: '/ghid/panouri-fotovoltaice-hale-industriale' },
            { label: guide.title.split(' - ')[0] },
          ]}
        />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {guide.title}
          </h1>
          <p className="text-gray-500 mt-3 text-lg">{guide.heroDescription}</p>

          {/* Author & date */}
          <div className="flex items-center gap-3 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="" width={20} height={20} className="w-5 h-5" />
              <span className="font-medium text-gray-700">{guide.author}</span>
              <span className="text-gray-300">|</span>
              <span>Specialist Instalatori Fotovoltaice</span>
            </div>
            <span className="text-gray-300">|</span>
            <time dateTime={guide.publishedAt}>
              {new Date(guide.publishedAt).toLocaleDateString('ro-RO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </div>
        </div>

        {/* Table of Contents */}
        <nav className="bg-surface rounded-xl border border-border p-5 mb-10">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Cuprins</h2>
          <ol className="space-y-1.5 list-decimal list-inside">
            {guide.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-sm text-primary-dark hover:underline"
                >
                  {section.title}
                </a>
              </li>
            ))}
            <li>
              <a href="#faq" className="text-sm text-primary-dark hover:underline">
                Întrebări frecvente
              </a>
            </li>
          </ol>
        </nav>

        {/* Content sections */}
        <div className="max-w-none">
          {guide.sections.map((section) => (
            <section key={section.id} id={section.id} className="mb-12 scroll-mt-20">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>
              <Markdown content={section.content} />
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-primary/5 rounded-xl border border-primary/10 p-6 my-10 text-center">
          <h3 className="font-bold text-gray-900 mb-2">
            Cauți un instalator pentru proiectul tău?
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Vezi firmele specializate din directorul nostru sau cere o ofertă gratuită.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button
              href={`/firme${guide.relatedSpecializations[0] ? `?specializare=${guide.relatedSpecializations[0]}` : ''}`}
              variant="primary"
            >
              Vezi Firme Specializate
            </Button>
            <Button href="/cere-oferta" variant="outline">
              Cere Ofertă Gratuită
            </Button>
          </div>
        </div>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 mb-10">
          <FAQ items={guide.faq} title="Întrebări Frecvente" />
        </section>

        {/* Other guides */}
        <div className="border-t border-border pt-8">
          <h3 className="font-bold text-gray-900 mb-4">Alte ghiduri utile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guidesData.guides
              .filter((g) => g.slug !== guide.slug)
              .map((g) => (
                <Link
                  key={g.slug}
                  href={`/ghid/${g.slug}`}
                  className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
                >
                  {g.title.split(' - ')[0]}
                </Link>
              ))}
          </div>
        </div>
      </article>
    </>
  );
}
