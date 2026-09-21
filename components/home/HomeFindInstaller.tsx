'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import HomeHeroSearch, { type FirmIndexItem, type CountyIndexItem } from './HomeHeroSearch';

// Căutarea după firmă sau județ. Stătea în hero până pe 21 sept 2026, când
// locul ei a fost dat testimonialelor; acum stă imediat sub parteneri.
// Paginile de județ au adus 18 din cele 44 de cereri cu atribuire (sept 2026),
// deci merită urmărit `hero_pill_click` după mutare: evenimentul și-a păstrat
// numele ca să rămână comparabil.

export default function HomeFindInstaller({
  firms,
  counties,
  topCounties,
}: {
  firms: FirmIndexItem[];
  counties: CountyIndexItem[];
  topCounties: CountyIndexItem[];
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 text-center sm:text-left">
        Căutați direct un instalator
      </h2>
      <div className="[&_form]:border [&_form]:border-border [&_form]:shadow-md">
        <HomeHeroSearch firms={firms} counties={counties} />
      </div>
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
        {topCounties.map((c) => (
          <Link
            key={c.slug}
            href={`/firme/judet/${c.slug}`}
            onClick={() => trackEvent('hero_pill_click', { county: c.name })}
            className="text-xs sm:text-sm text-secondary bg-surface border border-border hover:border-primary/50 rounded-full px-3 py-1 transition-colors"
          >
            {c.name}
          </Link>
        ))}
        <Link
          href="/firme"
          onClick={() => trackEvent('hero_pill_click', { county: 'toate' })}
          className="text-xs sm:text-sm text-primary-dark hover:text-primary self-center font-medium transition-colors"
        >
          toate firmele &rarr;
        </Link>
      </div>
    </div>
  );
}
