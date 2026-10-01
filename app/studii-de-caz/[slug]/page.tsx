import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import CaseStudyArticle from '../CaseStudyArticle';
import { getCaseStudies, getCaseStudyBySlug, getHeroPhoto } from '@/lib/case-studies';
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

  const hero = getHeroPhoto(study);

  return (
    <>
      <JsonLd
        data={generateArticleJsonLd({
          slug: study.slug,
          basePath: 'studii-de-caz',
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
      <CaseStudyArticle study={study} />
    </>
  );
}
