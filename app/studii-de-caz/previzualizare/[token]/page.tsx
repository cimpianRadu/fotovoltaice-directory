import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import CaseStudyArticle from '../../CaseStudyArticle';
import { getCaseStudyByPreviewToken } from '@/lib/case-studies';

interface Props {
  params: Promise<{ token: string }>;
}

// Previzualizare pentru review-ul firmei, înainte de publicare. Nu e în sitemap,
// e noindex și blocată în robots.txt; singurul mod de a ajunge aici e tokenul
// din data/case-studies.json. Nu are JSON-LD, ca să nu existe nicio versiune
// „structurată" a articolului înainte de cea publicată.
export const dynamic = 'force-static';
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const study = getCaseStudyByPreviewToken(token);
  if (!study) return { robots: { index: false, follow: false } };
  return {
    title: `Previzualizare: ${study.title}`,
    description: study.metaDescription,
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function CaseStudyPreviewPage({ params }: Props) {
  const { token } = await params;
  const study = getCaseStudyByPreviewToken(token);
  if (!study) notFound();

  return (
    <>
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-4xl mx-auto px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Previzualizare, articol nepublicat.</span>{' '}
          Linkul acesta e doar pentru verificarea datelor și a pozelor de către firma care a
          executat lucrarea. Pagina nu apare pe site, în sitemap sau în Google până la
          publicare. Orice corectură se trimite la{' '}
          <a href="mailto:contact@instalatori-fotovoltaice.ro" className="underline">
            contact@instalatori-fotovoltaice.ro
          </a>
          .
        </div>
      </div>
      <CaseStudyArticle study={study} />
    </>
  );
}
