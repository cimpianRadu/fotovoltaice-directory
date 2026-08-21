import Button from '@/components/ui/Button';

// Bannerul „cere ofertă" pus pe ghiduri, clasament, calculator, verificare-anre
// și studii de caz. Două schimbări față de varianta veche, ambele din aceleași
// cifre: pagina de formular primea 182 de afișări pe lună și scotea 29 de cereri.
//
// 1. Un singur buton principal. Înainte stăteau două, egale ca greutate, iar cel
//    de-al doilea („Vezi firme specializate") ducea în director, adică în afara
//    drumului care produce cereri. Acum e link discret.
// 2. Titlul și textul se pot suprascrie per pagină. Un om care tocmai a citit
//    despre bateriile Casa Verde nu are ce face cu „Cauți un instalator pentru
//    proiectul tău?", același text pe toate cele 50 de ghiduri.
//
// `sursa` ajunge în /cere-oferta?sursa=… și de acolo în coloana K din Sheet, ca
// să se poată spune în sfârșit care pagină produce cereri.

interface InstallerCtaProps {
  specializare?: string;
  sursa?: string;
  title?: string;
  description?: string;
  ctaLabel?: string;
}

export default function InstallerCta({
  specializare,
  sursa,
  title = 'Cauți un instalator pentru proiectul tău?',
  description = 'Spuneți-ne ce aveți nevoie și primiți oferte gratuite de la mai mulți instalatori atestați ANRE din zona dumneavoastră.',
  ctaLabel = 'Cere oferte gratuit',
}: InstallerCtaProps) {
  const href = sursa ? `/cere-oferta?sursa=${encodeURIComponent(sursa)}` : '/cere-oferta';

  return (
    <div className="bg-primary/5 rounded-xl border border-primary/10 p-6 my-10 text-center">
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-5 max-w-xl mx-auto leading-relaxed">{description}</p>

      <Button href={href} variant="primary" size="lg">
        {ctaLabel}
      </Button>

      <p className="mt-3 text-xs text-gray-500">
        Gratuit, fără obligații.{' '}
        <a
          href={`/firme${specializare ? `?specializare=${specializare}` : ''}`}
          className="underline hover:text-gray-700"
        >
          Sau vedeți direct firmele
        </a>
      </p>
    </div>
  );
}
