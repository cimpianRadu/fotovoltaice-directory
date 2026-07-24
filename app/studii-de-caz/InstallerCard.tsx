'use client';

import { trackEvent } from '@/lib/analytics';

export interface Installer {
  name: string;
  cui: string;
  location: string;
  phone?: string;
  facebook?: string;
  website?: string;
  coverage: string[];
  inDirectory: boolean;
  slug?: string;
}

interface Props {
  installer: Installer;
  slug: string;
}

export default function InstallerCard({ installer, slug }: Props) {
  const track = (linkType: string) =>
    trackEvent('case_study_installer_clicked', {
      case_study: slug,
      installer: installer.name,
      link_type: linkType,
    });

  return (
    <div className="bg-surface border border-border rounded-xl p-5 my-8">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
        În colaborare cu
      </div>
      <h3 className="font-bold text-gray-900 text-lg">{installer.name}</h3>
      <p className="text-sm text-gray-600 mt-1">
        {installer.location} · CUI {installer.cui}
      </p>
      {installer.coverage.length > 0 && (
        <p className="text-sm text-gray-600 mt-1">
          Se deplasează în: {installer.coverage.join(', ')}
        </p>
      )}

      <div className="flex flex-wrap gap-3 mt-4">
        {installer.phone && (
          <a
            href={`tel:${installer.phone.replace(/\s/g, '')}`}
            onClick={() => track('phone')}
            className="text-sm font-medium text-white bg-primary hover:bg-primary-dark rounded-lg px-4 py-2 transition-colors"
          >
            {installer.phone}
          </a>
        )}
        {installer.website && (
          <a
            href={installer.website}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={() => track('website')}
            className="text-sm font-medium text-primary-dark border border-primary/30 hover:border-primary rounded-lg px-4 py-2 transition-colors"
          >
            Site-ul firmei
          </a>
        )}
        {installer.facebook && (
          <a
            href={installer.facebook}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={() => track('facebook')}
            className="text-sm font-medium text-primary-dark border border-primary/30 hover:border-primary rounded-lg px-4 py-2 transition-colors"
          >
            Pagina de Facebook
          </a>
        )}
      </div>

      {/* Fără disclaimer negativ: articolul nu afirmă nicăieri că am verificat firma,
          deci nu are ce nega. Când firma e listată, linkul spre profil e informația
          utilă (acolo se văd atestatele ANRE și datele financiare). */}
      {installer.inDirectory && installer.slug && (
        <a
          href={`/firme/${installer.slug}`}
          onClick={() => track('profile')}
          className="inline-block text-sm text-primary-dark hover:underline mt-4"
        >
          Vezi profilul complet în director
        </a>
      )}
    </div>
  );
}
