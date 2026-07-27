'use client';

import { trackEvent } from '@/lib/analytics';

export type Disclosure = 'colaborare' | 'platit';

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
  disclosure?: Disclosure;
}

export default function InstallerCard({ installer, slug, disclosure = 'colaborare' }: Props) {
  const isPaid = disclosure === 'platit';

  const track = (linkType: string) =>
    trackEvent('case_study_installer_clicked', {
      case_study: slug,
      installer: installer.name,
      link_type: linkType,
      disclosure,
    });

  // La articolele plătite, `sponsored` e tokenul corect pentru Google; `nofollow`
  // rămâne ca plasă pentru crawlerele care nu îl înțeleg.
  const externalRel = isPaid
    ? 'noopener noreferrer sponsored nofollow'
    : 'noopener noreferrer nofollow';

  return (
    <div className="bg-surface border border-border rounded-xl p-5 my-8">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
        {isPaid ? 'Articol plătit de' : 'În colaborare cu'}
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
            rel={externalRel}
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
            rel={externalRel}
            onClick={() => track('facebook')}
            className="text-sm font-medium text-primary-dark border border-primary/30 hover:border-primary rounded-lg px-4 py-2 transition-colors"
          >
            Pagina de Facebook
          </a>
        )}
      </div>

      {/* Spunem explicit cum stă treaba cu banii. La articolele nesponsorizate,
          propoziția asta e chiar activul: dacă nu e credibilă acum, nu are cum să
          fie credibilă când unele articole vor fi plătite. */}
      <p className="text-xs text-gray-500 mt-4 pt-3 border-t border-border">
        {isPaid
          ? 'Firma a plătit pentru realizarea acestui articol. Datele tehnice și pozele vin de la ea, iar noi le-am publicat ca atare.'
          : 'Articol nesponsorizat: firma nu a plătit pentru apariția aici. Ne-a pus la dispoziție pozele de pe teren și datele tehnice ale sistemului.'}
      </p>

      {/* Când firma e listată, linkul spre profil e informația utilă: acolo se văd
          atestatele ANRE și datele financiare. */}
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
