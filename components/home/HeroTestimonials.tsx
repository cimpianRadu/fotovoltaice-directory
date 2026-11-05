import TestimonialCarousel from './TestimonialCarousel';
import { getTestimonialCards } from '@/lib/testimoniale';

// Banda de testimoniale din hero, pe navy. Stă în locul căutării (mutată sub
// parteneri pe 21 sept 2026): dovada socială prinde clientul lângă formular.
// Din 23 sept 2026 arată TOATE testimonialele (clienți + firme) din
// lib/testimoniale.ts, în același carusel ca pe /pentru-instalatori.

export default function HeroTestimonials() {
  const cards = getTestimonialCards();
  if (cards.length === 0) return null;

  return (
    <div className="mt-5 pt-5 border-t border-white/10">
      <p className="text-xs font-semibold text-primary-light uppercase tracking-wider mb-3 text-center sm:text-left">
        Cum e experiența pe platformă
      </p>
      {/* Săgețile caruselului ies în afara lui; padding-ul le ține în lățimea
          heroului, altfel pe ecrane de ~1024px pagina capătă derulare orizontală. */}
      <div className="sm:px-5 lg:px-6">
        <TestimonialCarousel cards={cards} tone="dark" />
      </div>
    </div>
  );
}
