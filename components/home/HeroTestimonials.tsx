import clienti from '@/data/testimoniale.json';
import firme from '@/data/testimoniale-firme.json';
import TestimonialCarousel, { type TestimonialCard } from './TestimonialCarousel';

// Banda de testimoniale din hero, pe navy. Stă în locul căutării (mutată sub
// parteneri pe 21 sept 2026): dovada socială prinde clientul lângă formular.
// Din 23 sept 2026 arată TOATE testimonialele, ale clienților și ale firmelor
// care au montat, în ordinea în care au venit, într-un carusel cu săgeți,
// puncte și derulare automată (TestimonialCarousel, client).
// Regulile de conținut sunt în components/ClientTestimonial.tsx (clienți) și
// components/FirmTestimonial.tsx (firme).

const cards: (TestimonialCard & { data: string })[] = [
  ...clienti.map((t) => ({
    key: `client-${t.id}`,
    data: t.data,
    nota: t.nota,
    badge: 'Contract semnat',
    text: t.text,
    nume: t.nume,
    href: null,
    meta: [t.tip, `${t.putere} kW`, t.judet].join(' · '),
    extra: `${t.oferte} oferte primite`,
  })),
  ...firme.map((t) => ({
    key: `firma-${t.id}-${t.firma}`,
    data: t.data,
    nota: t.nota,
    badge: 'Lucrare executată',
    text: t.text,
    nume: t.firma,
    href: t.slug ? `/firme/${t.slug}` : null,
    meta: [t.tip, `${t.putere} kW`, t.judet].join(' · '),
    extra: 'firma care a montat',
  })),
].sort((a, b) => a.data.localeCompare(b.data));

export default function HeroTestimonials() {
  if (cards.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-white/10 max-w-3xl mx-auto">
      <p className="text-xs font-semibold text-primary-light uppercase tracking-wider mb-3 text-center sm:text-left">
        Cum e experiența pe platformă
      </p>
      <TestimonialCarousel cards={cards.map(({ data: _data, ...c }) => c)} />
    </div>
  );
}
