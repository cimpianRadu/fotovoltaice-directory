'use client';

import Button from '@/components/ui/Button';
import type { Company } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

interface CompanyContactProps {
  company: Company;
}

export default function CompanyContact({ company }: CompanyContactProps) {
  return (
    <div className="bg-surface rounded-xl p-6 border border-border">
      <h3 className="font-bold text-gray-900 mb-4">Contactează {company.name}</h3>

      <div className="space-y-3 mb-6">
        {company.contact.phone && (
          <a
            href={`tel:${company.contact.phone}`}
            onClick={() => trackEvent('company_contact_clicked', { company_id: company.id, contact_type: 'phone' })}
            className="flex items-center gap-3 text-sm text-gray-700 hover:text-primary-dark transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            {company.contact.phone}
          </a>
        )}
        {company.contact.email && (
          <a
            href={`mailto:${company.contact.email}`}
            onClick={() => trackEvent('company_contact_clicked', { company_id: company.id, contact_type: 'email' })}
            className="flex items-center gap-3 text-sm text-gray-700 hover:text-primary-dark transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            {company.contact.email}
          </a>
        )}
        {company.contact.website && (
          <a
            href={company.contact.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('external_link_clicked', { company_id: company.id, link_type: 'website' })}
            className="flex items-center gap-3 text-sm text-gray-700 hover:text-primary-dark transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            {company.contact.website.replace('https://', '')}
          </a>
        )}
      </div>

      {company.contact.phone && (
        <Button href={`tel:${company.contact.phone}`} variant="primary" size="lg" className="w-full">
          Sună Acum
        </Button>
      )}
      {company.contact.website && (
        <a
          href={company.contact.website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent('external_link_clicked', { company_id: company.id, link_type: 'website_cta' })}
          className="block w-full text-center text-sm font-medium text-primary-dark hover:text-primary border border-primary/30 rounded-lg px-4 py-2.5 transition-colors"
        >
          Vizitează Site-ul
        </a>
      )}
    </div>
  );
}
