import clienti from '@/data/testimoniale.json';
import firme from '@/data/testimoniale-firme.json';
import type { TestimonialCard } from '@/components/home/TestimonialCarousel';

// Toate testimonialele publicate, într-un singur format, în ordinea în care au
// venit răspunsurile. Le folosesc heroul de pe homepage și /pentru-instalatori,
// prin același TestimonialCarousel.
//
// Reguli de conținut:
// - Clienți: vin din tabul „Feedback clienți” (formularul /feedback/client) și
//   intră în data/testimoniale.json DOAR cu „da” în coloana K; la
//   „da-fara-nume” numele se scoate. Firma cu care a semnat NU se numește pe
//   cardul clientului: acordul e al clientului, nu al firmei.
// - Firme: vin din tabul „Feedback firme” (formularul /feedback/firma) și intră
//   în data/testimoniale-firme.json DOAR cu „da” în coloana L; la
//   „da-fara-nume” numele firmei se scoate. `slug` e profilul din director
//   (acordul „cu numele firmei” acoperă și linkul); null când firma nu e
//   listată. Clientul NU se numește pe cardul firmei.
// - Textul păstrează formulările omului; se corectează doar diacriticele și
//   greșelile de tastare (decizia userului, 23 sept 2026), niciodată cuvintele
//   sau sensul.
// - Fără schema Review în JSON-LD: Google nu ia recenziile despre propriul site.
// - Import doar din componente server: JSON-urile nu intră în bundle-ul client.

export function getTestimonialCards(): TestimonialCard[] {
  return [
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
  ]
    .sort((a, b) => a.data.localeCompare(b.data))
    .map(({ data: _data, ...card }) => card);
}
