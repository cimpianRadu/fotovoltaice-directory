import Image from 'next/image';
import { type Company, formatShortDate, hasPremiumPlacement, hasPlusPlacement } from '@/lib/utils';
import { TierBadge } from '@/components/promo/PromoBadge';

interface CompanyHeaderProps {
  company: Company;
}

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M19 3H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM8.3 18H5.7V9.7h2.6V18zM7 8.5C6.2 8.5 5.5 7.8 5.5 7s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zM18.3 18h-2.6v-4c0-.97-.04-2.2-1.4-2.2-1.4 0-1.6 1.07-1.6 2.13V18H10.1V9.7h2.5v1.13h.04c.4-.66 1.3-1.4 2.6-1.4 2.74 0 3.06 1.8 3.06 4.1V18z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.9 5.9 0 00-2.13 1.39A5.9 5.9 0 00.62 4.15c-.3.76-.5 1.64-.55 2.91C0 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.55 2.91.31.79.72 1.46 1.39 2.13a5.9 5.9 0 002.13 1.39c.76.3 1.64.5 2.91.55C8.33 24 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.55a5.9 5.9 0 002.13-1.39 5.9 5.9 0 001.39-2.13c.3-.76.5-1.64.55-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.55-2.91a5.9 5.9 0 00-1.39-2.13A5.9 5.9 0 0019.86.63c-.76-.3-1.64-.5-2.91-.55C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 005.84 12 6.16 6.16 0 0012 18.16 6.16 6.16 0 0018.16 12 6.16 6.16 0 0012 5.84zm0 10.16A4 4 0 018 12a4 4 0 014-4 4 4 0 014 4 4 4 0 01-4 4zm6.4-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
    </svg>
  ),
};

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  youtube: 'YouTube',
};

export default function CompanyHeader({ company }: CompanyHeaderProps) {
  const initials = company.name
    .split(/[\s-]+/)
    .filter(w => w.length > 1 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map(w => w[0])
    .join('');

  const isPremium = hasPremiumPlacement(company);
  const isPlus = hasPlusPlacement(company);
  const showSocials = isPremium && company.socials && Object.values(company.socials).some(Boolean);
  const description = isPremium && company.longDescription ? company.longDescription : company.description;

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        {company.logo ? (
          <Image
            src={company.logo}
            alt={`Logo ${company.name}`}
            width={56}
            height={56}
            className="rounded-xl object-contain bg-white"
            style={{ width: 56, height: 56 }}
          />
        ) : (
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-secondary font-bold text-lg" style={{ width: 56, height: 56 }}>
            {initials}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            {(isPremium || isPlus) && <TierBadge tier={company.promoTier} />}
          </div>
          <p className="text-gray-500">
            {company.location.city}, {company.location.county} &middot; CUI: {company.cui}
          </p>
          {company.createdAt && (
            <p className="text-xs text-gray-400 mt-0.5">
              Listat pe platformă {formatShortDate(company.createdAt)}
            </p>
          )}
        </div>
      </div>

      <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>

      {showSocials && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {(['facebook', 'linkedin', 'instagram', 'youtube'] as const).map((key) => {
            const url = company.socials?.[key];
            if (!url) return null;
            return (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-gray-700 hover:border-primary/40 hover:text-primary-dark transition-colors"
                aria-label={`${SOCIAL_LABELS[key]} ${company.name}`}
              >
                {SOCIAL_ICONS[key]}
                <span>{SOCIAL_LABELS[key]}</span>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
