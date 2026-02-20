import type { MetadataRoute } from 'next';
import companiesData from '@/data/companies.json';
import guidesData from '@/data/guides.json';

const BASE_URL = 'https://instalatori-fotovoltaice.ro';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${BASE_URL}/firme`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.9 },
    { url: `${BASE_URL}/listeaza-firma`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/cere-oferta`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
    { url: `${BASE_URL}/intrebari-frecvente`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE_URL}/despre`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${BASE_URL}/rezidential`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.4 },
  ];

  const companyPages = companiesData.companies.map((company) => ({
    url: `${BASE_URL}/firme/${company.slug}`,
    lastModified: new Date(company.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const guidePages = guidesData.guides.map((guide) => ({
    url: `${BASE_URL}/ghid/${guide.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...companyPages, ...guidePages];
}
