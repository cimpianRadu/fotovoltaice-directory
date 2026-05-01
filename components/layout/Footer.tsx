import Link from 'next/link';
import guidesData from '@/data/guides.json';
import { getCoveredCounties, slugifyCounty, getCompaniesByCounty, getCompanies } from '@/lib/utils';
import FooterAccordion from './FooterAccordion';

export default function Footer() {
  const latestGuides = [...guidesData.guides]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 5);

  const topCounties = getCoveredCounties()
    .map((county) => ({ name: county, count: getCompaniesByCounty(county).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const featuredCompanies = getCompanies()
    .filter((c) => c.featured)
    .slice(0, 6);

  const linkClass = 'text-sm text-gray-300 hover:text-white transition-colors';

  return (
    <footer className="bg-secondary-dark text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Brand — always visible */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-2">Instalatori Fotovoltaice</h3>
          <p className="text-sm text-gray-300 leading-relaxed max-w-md">
            Platforma #1 pentru firme de instalare panouri fotovoltaice comerciale și industriale din România.
          </p>
        </div>

        {/* Accordion sections on mobile, grid on desktop */}
        <div className="sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
          <FooterAccordion title="Pagini">
            <ul className="space-y-2">
              <li><Link href="/firme" className={linkClass}>Firme Instalatoare</Link></li>
              <li><Link href="/clasament" className={linkClass}>Clasament Firme</Link></li>
              <li><Link href="/verificare-anre" className={linkClass}>Verificare ANRE</Link></li>
              <li><Link href="/calculator-panouri-fotovoltaice" className={linkClass}>Calculator Costuri</Link></li>
              <li><Link href="/listeaza-firma" className={linkClass}>Listează-ți Firma</Link></li>
              <li><Link href="/cere-oferta" className={linkClass}>Cere Ofertă</Link></li>
              <li><Link href="/intrebari-frecvente" className={linkClass}>Întrebări Frecvente</Link></li>
              <li><Link href="/despre" className={linkClass}>Despre Noi</Link></li>
              <li><Link href="/publicitate" className={linkClass}>Publicitate</Link></li>
            </ul>
          </FooterAccordion>

          <FooterAccordion title="Ghiduri">
            <ul className="space-y-2">
              {latestGuides.map((guide) => (
                <li key={guide.slug}>
                  <Link href={`/ghid/${guide.slug}`} className={linkClass}>
                    {guide.title.split(' - ')[0]}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/ghid" className={linkClass}>Toate ghidurile →</Link>
              </li>
            </ul>
          </FooterAccordion>

          <FooterAccordion title="Instalatori per Județ">
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {topCounties.map((county) => (
                <li key={county.name}>
                  <Link
                    href={`/firme/judet/${slugifyCounty(county.name)}`}
                    className={linkClass}
                  >
                    {county.name} <span className="text-gray-500">({county.count})</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/firme" className={linkClass}>Toate județele →</Link>
              </li>
            </ul>
          </FooterAccordion>

          <FooterAccordion title="Top Firme">
            <ul className="space-y-1.5">
              {featuredCompanies.map((company) => (
                <li key={company.slug}>
                  <Link
                    href={`/firme/${company.slug}`}
                    className={linkClass}
                  >
                    {company.name.replace(/ S\.R\.L\.$| S\.A\.$/, '')}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/firme" className={linkClass}>Toate firmele →</Link>
              </li>
            </ul>
          </FooterAccordion>
        </div>

        {/* Legal + Contact */}
        <div className="mt-8 pt-8 border-t border-gray-700 sm:flex sm:justify-between sm:items-start gap-8">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
            <Link href="/politica-confidentialitate" className="hover:text-gray-200 transition-colors">Confidențialitate</Link>
            <Link href="/termeni-conditii" className="hover:text-gray-200 transition-colors">Termeni</Link>
            <Link href="/politica-cookies" className="hover:text-gray-200 transition-colors">Cookies</Link>
            <Link href="/despre" className="hover:text-gray-200 transition-colors">Despre Noi</Link>
          </div>
          <div className="mt-3 sm:mt-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400">
            <a href="mailto:contact@instalatori-fotovoltaice.ro" className="hover:text-gray-200 transition-colors">
              contact@instalatori-fotovoltaice.ro
            </a>
            <a href="tel:+40751547174" className="hover:text-gray-200 transition-colors">
              0751 547 174
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61587772223405"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pagina de Facebook"
              className="inline-flex items-center gap-1.5 hover:text-gray-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                <path d="M13.5 22v-8.5h2.86l.43-3.33H13.5V8.04c0-.96.27-1.62 1.65-1.62h1.76V3.44A23.6 23.6 0 0 0 14.34 3.3c-2.54 0-4.28 1.55-4.28 4.4v2.47H7.2v3.33h2.86V22h3.44Z" />
              </svg>
              Facebook
            </a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Instalatori Fotovoltaice România. Toate drepturile rezervate.
          </p>
          <p className="text-xs text-gray-400">
            Informațiile de pe acest site sunt cu caracter informativ.
          </p>
        </div>
      </div>
    </footer>
  );
}
