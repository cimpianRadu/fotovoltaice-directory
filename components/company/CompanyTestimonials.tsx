import { formatNumber, formatShortDate, type Company, type Testimonial } from '@/lib/utils';

interface CompanyTestimonialsProps {
  company: Company;
}

const SOURCE_LABEL: Record<Testimonial['source'], string> = {
  platforma: 'Client venit prin instalatori-fotovoltaice.ro',
  firma: 'Recenzie transmisă de firmă',
};

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span
      className="text-primary text-sm tracking-wide"
      role="img"
      aria-label={`${rating} din 5 stele`}
    >
      {'★'.repeat(full)}
      <span className="text-gray-300">{'★'.repeat(5 - full)}</span>
    </span>
  );
}

export default function CompanyTestimonials({ company }: CompanyTestimonialsProps) {
  const testimonials = company.testimonials ?? [];
  if (testimonials.length === 0) return null;

  // Cele mai recente primele — recenziile vechi spun mai puțin despre firma de azi.
  const sorted = [...testimonials].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-3">Recenzii de la clienți</h2>
      <div className="space-y-3">
        {sorted.map((t) => {
          const meta = [
            t.location,
            t.projectKw ? `${formatNumber(t.projectKw)} kW` : null,
            formatShortDate(t.date),
          ].filter(Boolean);

          return (
            <figure
              key={`${t.author}-${t.date}`}
              className="rounded-lg bg-surface border border-border p-4"
            >
              {t.rating !== undefined && (
                <div className="mb-2">
                  <Stars rating={t.rating} />
                </div>
              )}
              <blockquote className="text-sm text-gray-700 leading-relaxed">
                „{t.text}"
              </blockquote>
              <figcaption className="mt-3 text-xs text-gray-500">
                <span className="font-medium text-gray-700">{t.author}</span>
                {meta.length > 0 && <> · {meta.join(' · ')}</>}
                <span className="block mt-1">{SOURCE_LABEL[t.source]}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Recenziile se publică doar cu acordul clientului. Nu le edităm și nu ștergem
        recenziile negative la cererea firmei.
      </p>
    </div>
  );
}
