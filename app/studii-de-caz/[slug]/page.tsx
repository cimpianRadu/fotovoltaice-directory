import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import FAQ from '@/components/seo/FAQ';
import InstallerCta from '@/components/InstallerCta';
import Markdown from '@/components/ui/Markdown';
import InstallerCard from '../InstallerCard';
import guidesData from '@/data/guides.json';
import {
  getCaseStudies,
  getCaseStudyBySlug,
  getExistingPhotos,
  getHeroPhoto,
} from '@/lib/case-studies';
import { generateFAQJsonLd, generateBreadcrumbJsonLd, generateArticleJsonLd } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getCaseStudies().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) return {};

  const hero = getHeroPhoto(study);

  return {
    title: study.title,
    description: study.metaDescription,
    alternates: { canonical: `/studii-de-caz/${slug}` },
    openGraph: {
      type: 'article',
      url: `/studii-de-caz/${slug}`,
      title: study.title,
      description: study.metaDescription,
      publishedTime: study.publishedAt,
      authors: [study.author],
      images: hero
        ? [{ url: hero.src, width: 1200, height: 630, alt: study.title }]
        : [{ url: '/og-image.png', width: 1200, height: 630, alt: study.title }],
    },
  };
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const study = getCaseStudyBySlug(slug);
  if (!study) notFound();

  const photos = getExistingPhotos(study);
  const hero = photos[0] ?? null;
  const rest = photos.slice(1);
  const { project } = study;

  const relatedGuides = guidesData.guides.filter((g) => study.relatedGuides.includes(g.slug));

  const specs: [string, string][] = [
    ['Județ', project.county],
    ['Tip clădire', project.buildingType],
    ['Perioadă', project.date],
    ['Putere instalată', `${project.kwp.toString().replace('.', ',')} kWp`],
    ['Panouri', project.panels],
    ['Invertor', project.inverter],
    ...(project.battery ? ([['Stocare', project.battery]] as [string, string][]) : []),
    ...(project.strings ? ([['Configurație', project.strings]] as [string, string][]) : []),
    ...(project.duration ? ([['Durata montajului', project.duration]] as [string, string][]) : []),
  ];

  return (
    <>
      <JsonLd
        data={generateArticleJsonLd({
          slug: `studii-de-caz/${study.slug}`,
          title: study.title,
          metaDescription: study.metaDescription,
          heroDescription: study.heroDescription,
          author: study.author,
          publishedAt: study.publishedAt,
          heroImage: hero?.src ?? null,
        })}
      />
      <JsonLd data={generateFAQJsonLd(study.faq)} />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Studii de caz', url: '/studii-de-caz' },
          { name: study.title, url: `/studii-de-caz/${study.slug}` },
        ])}
      />

      <article className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { label: 'Studii de caz', href: '/studii-de-caz' },
            { label: study.title.split(':')[0] },
          ]}
        />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {study.title}
          </h1>
          <p className="text-gray-500 mt-3 text-lg">{study.heroDescription}</p>

          <div className="flex items-center gap-3 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="" width={20} height={20} className="w-5 h-5" />
              <span className="font-medium text-gray-700">{study.author}</span>
            </div>
            <span className="text-gray-300">|</span>
            <time dateTime={study.publishedAt}>
              {new Date(study.publishedAt).toLocaleDateString('ro-RO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </time>
          </div>
        </div>

        {hero && (
          <figure className="mb-8">
            <div className="rounded-xl overflow-hidden">
              <Image
                src={hero.src}
                alt={hero.caption}
                width={1200}
                height={900}
                className="w-full h-auto"
                priority
              />
            </div>
            <figcaption className="text-xs text-gray-500 mt-2">{hero.caption}</figcaption>
          </figure>
        )}

        {/* Fișa tehnică — cifrele pe care le caută cititorul, înainte de text */}
        <div className="bg-surface border border-border rounded-xl p-5 mb-8">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Fișa lucrării</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {specs.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3 text-sm border-b border-border/60 py-1.5">
                <dt className="text-gray-500 shrink-0">{label}</dt>
                <dd className="text-gray-900 font-medium text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <nav className="bg-surface rounded-xl border border-border p-5 mb-10">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Cuprins</h2>
          <ol className="space-y-1.5 list-decimal list-inside">
            {study.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-sm text-primary-dark hover:underline">
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

        <div className="max-w-none">
          {study.sections.map((section, i) => (
            <Fragment key={section.id}>
              <section id={section.id} className="mb-12 scroll-mt-20">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>
                <Markdown content={section.content} />
              </section>
              {i === 0 && (
                <InstallerCard
                  installer={study.installer}
                  slug={study.slug}
                  disclosure={study.disclosure}
                />
              )}
            </Fragment>
          ))}
        </div>

        {rest.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Imagini de la montaj</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rest.map((photo) => (
                <figure key={photo.src}>
                  <div className="rounded-lg overflow-hidden border border-border">
                    <Image
                      src={photo.src}
                      alt={photo.caption}
                      width={800}
                      height={600}
                      className="w-full h-auto"
                    />
                  </div>
                  <figcaption className="text-xs text-gray-500 mt-1.5">{photo.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        <InstallerCta specializare="rezidential" sursa={`studiu-caz/${study.slug}`} />

        <section id="faq" className="scroll-mt-20 mb-10">
          <FAQ items={study.faq} title="Întrebări Frecvente" />
        </section>

        {relatedGuides.length > 0 && (
          <div className="border-t border-border pt-8">
            <h3 className="font-bold text-gray-900 mb-4">Ghiduri legate de acest proiect</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedGuides.map((g) => (
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
        )}
      </article>
    </>
  );
}
