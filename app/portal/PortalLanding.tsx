import Link from 'next/link';
import { MAX_CLAIMS_PER_LEAD } from '@/lib/sheets';

/**
 * Fața publică a portalului, pentru firma care nu e logată.
 *
 * Până acum /portal redirecta direct spre formularul de login, care e noindex:
 * cine auzea de portal în afara site-ului (reel, telefon, email) ajungea la o
 * casetă de email fără nicio explicație, iar Google n-avea ce indexa. Pagina
 * asta stă pe aceeași adresă, ca să rămână una singură de spus cu voce tare.
 *
 * Ordinea de pe pagină e ordinea utilității pentru o firmă NOUĂ: alertele pe
 * județ sunt singurul lucru pe care îl poate face din prima, fără să fi
 * revendicat ceva. Cererile revendicate și statusurile vin după, pentru că nu
 * spun nimic cuiva care intră prima oară.
 */
export default function PortalLanding() {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 pb-16">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark mb-2">
          Pentru firme de instalare
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Portal Instalatori</h1>
        <p className="text-gray-600 mt-3 leading-relaxed">
          Locul din care firma ta află de cererile din județele ei și lucrează cererile pe care
          le-a revendicat. Gratuit, fără parolă și fără cont de creat.
        </p>
      </div>

      {/* Cârligul: singurul lucru care are sens la rece. */}
      <div className="rounded-xl border-2 border-primary bg-primary/5 p-6 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark mb-2">
          Se pornește în 30 de secunde
        </p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Alerte pe email, pe județele tale
        </h2>
        <p className="text-gray-700 leading-relaxed">
          Bifezi județele în care lucrezi și primești pe email fiecare cerere nouă de acolo, în
          momentul în care intră. Nu trebuie să fi revendicat nimic înainte și nu trebuie să
          stai cu ochii pe feedul public.
        </p>
        <Link
          href="/portal/login"
          className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-3 rounded-lg mt-5 transition-colors"
        >
          Intră cu emailul firmei
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Cererile revendicate</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Cererile pe care le-ai luat din{' '}
            <Link href="/cereri" className="text-primary-dark underline hover:no-underline">
              feedul de cereri active
            </Link>
            , într-un singur loc. După apelul nostru de confirmare, datele de contact ale
            clientului se deblochează aici.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-semibold text-gray-900 mb-2">Status, note și locuri libere</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Marchezi unde ai ajuns cu fiecare client și îți lași notele, ca să nu te mai sunăm
            degeaba. Iar la cererile la care renunți eliberezi locul, ca să îl ia altcineva.
            Fiecare cerere merge la maxim {MAX_CLAIMS_PER_LEAD} firme.
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-border p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Cum intri</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary-dark font-bold text-sm inline-flex items-center justify-center">
              1
            </span>
            <span>Lași emailul firmei</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary-dark font-bold text-sm inline-flex items-center justify-center">
              2
            </span>
            <span>Primești pe email un link și un cod de 6 cifre, oricare dintre ele merge</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary-dark font-bold text-sm inline-flex items-center justify-center">
              3
            </span>
            <span>Ești în portal, fără parolă de ținut minte</span>
          </li>
        </ol>
      </div>

      <div className="text-center">
        <Link
          href="/portal/login"
          className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Intră în portal
        </Link>
        <p className="text-sm text-gray-500 mt-4 leading-relaxed">
          Vrei ca firma ta să apară și în director?{' '}
          <Link href="/listeaza-firma" className="text-primary-dark underline hover:no-underline">
            Listarea este gratuită
          </Link>
          . Dacă ai revendicat cereri înainte de lansarea portalului, scrie-ne la{' '}
          <a
            href="mailto:contact@instalatori-fotovoltaice.ro"
            className="text-primary-dark underline hover:no-underline"
          >
            contact@instalatori-fotovoltaice.ro
          </a>{' '}
          și ți le legăm de cont.
        </p>
      </div>
    </div>
  );
}
