import { existsSync } from 'fs';
import { join } from 'path';
import caseStudiesData from '@/data/case-studies.json';
import type { Installer } from '@/app/studii-de-caz/InstallerCard';

export interface CaseStudySection {
  id: string;
  title: string;
  content: string;
}

export interface CaseStudyProject {
  county: string;
  buildingType: string;
  date: string;
  kwp: number;
  panels: string;
  inverter: string;
  battery?: string;
  strings?: string;
  duration?: string;
}

export interface CaseStudyPhoto {
  file: string;
  caption: string;
}

export interface CaseStudy {
  slug: string;
  published: boolean;
  publishedAt: string;
  author: string;
  title: string;
  metaDescription: string;
  heroDescription: string;
  installer: Installer;
  project: CaseStudyProject;
  gallery: CaseStudyPhoto[];
  sections: CaseStudySection[];
  faq: { question: string; answer: string }[];
  relatedGuides: string[];
}

const CASE_STUDIES = caseStudiesData.caseStudies as CaseStudy[];

export function getCaseStudies(): CaseStudy[] {
  return CASE_STUDIES.filter((c) => c.published !== false);
}

export function getCaseStudyBySlug(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.slug === slug);
}

/**
 * Pozele lipsă ar deveni next/image → 400. Filtrăm pe disc, ca la logo-urile de
 * firme, ca un studiu de caz să poată fi scris înainte să existe fișierele.
 */
export function getExistingPhotos(study: CaseStudy): { src: string; caption: string }[] {
  return study.gallery
    .map((photo) => ({
      src: `/images/studii-de-caz/${study.slug}/${photo.file}`,
      caption: photo.caption,
    }))
    .filter((p) => existsSync(join(process.cwd(), 'public', p.src)));
}

export function getHeroPhoto(study: CaseStudy): { src: string; caption: string } | null {
  return getExistingPhotos(study)[0] ?? null;
}
