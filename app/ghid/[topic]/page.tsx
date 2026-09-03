import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import FAQ from '@/components/seo/FAQ';
import InstallerCta from '@/components/InstallerCta';
import FinantareB2B, { FINANTARE_B2B_GUIDES } from '@/components/FinantareB2B';
import Markdown from '@/components/ui/Markdown';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import PremiumPoolSection from '@/components/promo/PremiumPoolSection';
import BatteryWidget from '@/components/BatteryWidget';
import CvbAlertForm from '@/components/forms/CvbAlertForm';
import { GUIDE_CTA } from '@/lib/guide-cta';

/**
 * Ghidurile care primesc un widget interactiv, cu secțiunea după care apare.
 * Widgetul stă lângă textul pe care îl pune în practică, nu la finalul paginii:
 * cine citește formula de punctaj vrea să o încerce pe cifrele lui imediat.
 */
const GUIDE_WIDGET: Record<string, string> = {
  'casa-verde-baterii-2026-program-stocare-afm': 'punctaj',
};

/**
 * Ghidurile care primesc formularul „anunță-mă când se deschide sesiunea CVB",
 * cu secțiunea după care apare. Formularul stă lângă calendarul programului:
 * exact locul în care cititorul află că data nu e anunțată și rămâne cu
 * întrebarea „și atunci când?". Rândurile ajung în tabul AlerteCVB din Sheet.
 */
const GUIDE_ALERT_FORM: Record<string, string> = {
  'casa-verde-baterii-2026-program-stocare-afm': 'calendar-update',
  'casa-verde-baterii-2026-cine-nu-poate-aplica-intrebari': 'cand-se-deschide',
};
import { existsSync } from 'fs';
import { join } from 'path';
import guidesData from '@/data/guides.json';
import { generateFAQJsonLd, generateBreadcrumbJsonLd, generateArticleJsonLd } from '@/lib/seo';

const HERO_IMAGE_EXTENSIONS = ['webp', 'png', 'jpg'];

function getHeroImage(slug: string): string | null {
  for (const ext of HERO_IMAGE_EXTENSIONS) {
    const filename = `${slug}.${ext}`;
    if (existsSync(join(process.cwd(), 'public', 'images', 'guides', filename))) {
      return `/images/guides/${filename}`;
    }
  }
  return null;
}

interface Props {
  params: Promise<{ topic: string }>;
}

export async function generateStaticParams() {
  return guidesData.guides.filter((g) => g.published !== false).map((g) => ({ topic: g.slug }));
}

// Un ghid depublicat rămâne în guides.json, deci căutarea după slug l-ar servi
// cu 200 pe o rută pe care Google o poate avea deja în index. Filtrăm la lookup,
// nu doar la generateStaticParams.
function getPublishedGuide(slug: string) {
  const guide = guidesData.guides.find((g) => g.slug === slug);
  return guide && guide.published !== false ? guide : undefined;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const guide = getPublishedGuide(topic);
  if (!guide) return {};

  const heroImage = getHeroImage(guide.slug);

  return {
    title: guide.title,
    description: guide.metaDescription,
    alternates: { canonical: `/ghid/${topic}` },
    openGraph: {
      type: 'article',
      url: `/ghid/${topic}`,
      title: guide.title,
      description: guide.metaDescription,
      publishedTime: guide.publishedAt,
      authors: [guide.author],
      images: heroImage
        ? [{ url: heroImage, width: 1200, height: 630, alt: guide.title }]
        : [{ url: '/og-image.png', width: 1200, height: 630, alt: guide.title }],
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { topic } = await params;
  const guide = getPublishedGuide(topic);
  if (!guide) notFound();

  const heroImage = getHeroImage(guide.slug);

  // Ghidurile cu volum au text scris pe subiect; restul iau textul generic.
  // `sursa` e slug-ul ghidului, ca să știm în sfârșit care articol produce cereri.
  const ctaBlock = (
    <InstallerCta
      specializare={guide.relatedSpecializations[0]}
      sursa={`ghid/${guide.slug}`}
      {...GUIDE_CTA[guide.slug]}
    />
  );

  return (
    <>
      <JsonLd
        data={generateArticleJsonLd({
          slug: guide.slug,
          title: guide.title,
          metaDescription: guide.metaDescription,
          heroDescription: guide.heroDescription,
          author: guide.author,
          publishedAt: guide.publishedAt,
          updatedAt: (guide as { updatedAt?: string }).updatedAt,
          heroImage,
        })}
      />
      <JsonLd data={generateFAQJsonLd(guide.faq)} />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Ghiduri', url: '/ghid' },
          { name: guide.title, url: `/ghid/${guide.slug}` },
        ])}
      />

      <article className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { label: 'Ghiduri', href: '/ghid' },
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

        {/* Hero Image */}
        {heroImage && (
          <div className="rounded-xl overflow-hidden mb-8">
            <Image
              src={heroImage}
              alt={guide.title}
              width={1200}
              height={630}
              className="w-full h-auto"
              priority
            />
          </div>
        )}

        {/* Table of Contents */}
        <nav className="bg-surface rounded-xl border border-border p-5 mb-6">
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

        {/* Sponsor */}
        <div className="mb-10">
          <SponsorBanner position="ghid-topic" />
        </div>

        {/* Content sections */}
        <div className="max-w-none">
          {guide.sections.map((section, i) => (
            <Fragment key={section.id}>
              <section id={section.id} className="mb-12 scroll-mt-20">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h2>
                <Markdown content={section.content} linkSource={`ghid/${guide.slug}`} />
              </section>
              {/* CTA după prima secțiune — puțini ajung la finalul articolului */}
              {i === 0 && ctaBlock}
              {/* Widget interactiv, montat imediat după secțiunea pe care o pune în
                  practică. Vezi GUIDE_WIDGET pentru maparea slug -> secțiune. */}
              {GUIDE_WIDGET[guide.slug] === section.id && (
                <BatteryWidget sursa={`ghid/${guide.slug}#widget`} />
              )}
              {/* Alerta de sesiune CVB, montată după secțiunea de calendar.
                  Vezi GUIDE_ALERT_FORM pentru maparea slug -> secțiune. */}
              {GUIDE_ALERT_FORM[guide.slug] === section.id && (
                <CvbAlertForm sursa={`ghid/${guide.slug}`} />
              )}
            </Fragment>
          ))}
        </div>

        <PremiumPoolSection
          title="Instalatori Recomandați"
          subtitle="Firme partenere care fac proiecte ca cel din ghid"
        />

        {/* Finanțarea vine ca obiecție imediat după preț, deci stă la finalul
            conținutului, doar pe ghidurile citite de firme. */}
        {FINANTARE_B2B_GUIDES.has(guide.slug) && <FinantareB2B slug={guide.slug} />}

        {/* CTA (repetat la final pentru cine ajunge aici) */}
        {ctaBlock}

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 mb-10">
          <FAQ items={guide.faq} title="Întrebări Frecvente" />
        </section>

        {/* Other guides */}
        <div className="border-t border-border pt-8">
          <h3 className="font-bold text-gray-900 mb-4">Alte ghiduri utile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guidesData.guides
              .filter((g) => g.published !== false && g.slug !== guide.slug)
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
