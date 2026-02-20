import { SITE_NAME, SITE_URL } from './utils';
import type { Company } from './utils';

export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Platforma #1 pentru firme de instalare panouri fotovoltaice comerciale și industriale din România.',
    sameAs: [],
  };
}

export function generateLocalBusinessJsonLd(company: Company) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/firme/${company.slug}`,
    name: company.name,
    description: company.description,
    url: company.contact.website,
    telephone: company.contact.phone,
    email: company.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.location.address,
      addressLocality: company.location.city,
      addressRegion: company.location.county,
      addressCountry: 'RO',
    },
    foundingDate: String(company.founded),
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: company.employees,
    },
    areaServed: company.coverage.map((county) => ({
      '@type': 'AdministrativeArea',
      name: county,
    })),
  };
}

export function generateFAQJsonLd(
  faqs: { question: string; answer: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
