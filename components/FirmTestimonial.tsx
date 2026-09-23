import Link from 'next/link';
import testimoniale from '@/data/testimoniale-firme.json';

// Testimoniale de la firmele care au executat o lucrare venită de aici. Vin din
// tabul „Feedback firme” (formularul /feedback/firma) și intră în
// data/testimoniale-firme.json DOAR cu „da” în coloana L; la „da-fara-nume”
// numele firmei se scoate. Textul se copiază exact cum l-a scris omul, fără
// corecturi, inclusiv fără diacritice dacă așa a venit.
//
// `slug` e profilul firmei din director (acordul „cu numele firmei” acoperă și
// linkul); null când firma nu e listată, cum e Electro Prahova.
// Clientul NU se numește: acordul lui e separat, în data/testimoniale.json.

type Testimonial = (typeof testimoniale)[number];

function Stars({ nota }: { nota: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Notă ${nota} din 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < nota ? 'text-primary' : 'text-gray-300'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 00-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 00-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.07-3.29z" />
        </svg>
      ))}
    </div>
  );
}

export default function FirmTestimonial({
  eyebrow = 'Spus de firma care a montat',
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  const t: Testimonial | undefined = testimoniale[0];
  if (!t) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-primary-dark uppercase tracking-wider mb-1.5">{eyebrow}</p>
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-gray-600 mt-1.5 text-sm leading-relaxed max-w-2xl">{subtitle}</p>}

      <figure className="mt-5 rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <Stars nota={t.nota} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Lucrare executată
          </span>
        </div>
        <blockquote className="text-lg sm:text-xl leading-relaxed text-gray-900">
          „{t.text}”
        </blockquote>
        <figcaption className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {t.slug ? (
            <Link href={`/firme/${t.slug}`} className="font-semibold text-gray-900 hover:text-primary-dark">
              {t.firma}
            </Link>
          ) : (
            <span className="font-semibold text-gray-900">{t.firma}</span>
          )}
          <span className="text-gray-500">{[t.tip, `${t.putere} kW`, t.judet].join(' · ')}</span>
        </figcaption>
      </figure>
    </div>
  );
}
