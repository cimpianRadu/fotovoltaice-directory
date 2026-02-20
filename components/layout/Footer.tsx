import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-secondary-dark text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-3">Instalatori Fotovoltaice</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Directorul #1 pentru firme de instalare panouri fotovoltaice comerciale și industriale din România.
            </p>
          </div>

          {/* Pages */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-gray-400">
              Pagini
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/firme" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Firme Instalatoare
                </Link>
              </li>
              <li>
                <Link href="/listeaza-firma" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Listează-ți Firma
                </Link>
              </li>
              <li>
                <Link href="/cere-oferta" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Cere Ofertă
                </Link>
              </li>
              <li>
                <Link href="/intrebari-frecvente" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Întrebări Frecvente
                </Link>
              </li>
              <li>
                <Link href="/despre" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Despre Noi
                </Link>
              </li>
            </ul>
          </div>

          {/* Guides */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-gray-400">
              Ghiduri
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/ghid/panouri-fotovoltaice-hale-industriale" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Fotovoltaice Hale Industriale
                </Link>
              </li>
              <li>
                <Link href="/ghid/cost-sistem-fotovoltaic-comercial" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Costuri Sistem Comercial
                </Link>
              </li>
              <li>
                <Link href="/ghid/cum-alegi-instalator-fotovoltaic" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Cum Alegi Instalatorul
                </Link>
              </li>
              <li>
                <Link href="/ghid/legislatie-prosumator-comercial" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Legislație Prosumator
                </Link>
              </li>
              <li>
                <Link href="/ghid" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Toate ghidurile →
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3 text-gray-400">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/politica-confidentialitate" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Politica de Confidențialitate
                </Link>
              </li>
              <li>
                <Link href="/termeni-conditii" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Termeni și Condiții
                </Link>
              </li>
              <li>
                <Link href="/politica-cookies" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Politica de Cookies
                </Link>
              </li>
              <li>
                <Link href="/despre" className="text-sm text-gray-300 hover:text-white transition-colors">
                  Contactează-ne
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
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
