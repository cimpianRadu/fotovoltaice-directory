import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import Button from '@/components/ui/Button';
import AdInquiryForm from '@/components/forms/AdInquiryForm';
import TrafficWidget from '@/components/publicitate/TrafficWidget';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import { getCompanies, getCoveredCounties } from '@/lib/utils';
import guidesData from '@/data/guides.json';

export const metadata: Metadata = {
  title: 'Publicitate & parteneriate — Instalatori Fotovoltaice',
  description:
    'Directorul Instalatori Fotovoltaice România este în creștere. Listarea pentru firmele de instalare cu atestat ANRE valid este și rămâne gratuită. Pachetele comerciale sunt încă în construcție — lasă-ne datele dacă vrei să fii contactat când le lansăm sau să propui un parteneriat individual acum.',
  alternates: { canonical: '/publicitate' },
};

export default function AdvertisePage() {
  const totalCompanies = getCompanies().length;
  const totalCounties = getCoveredCounties().length;
  const totalGuides = guidesData.guides.length;

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Publicitate', url: '/publicitate' },
        ])}
      />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Publicitate' }]} />

        {/* Hero */}
        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Publicitate & parteneriate
          </h1>
          <p className="text-gray-600 mt-2 leading-relaxed">
            Directorul nostru este în construcție activă. <strong>Listarea pentru firmele de instalare cu atestat ANRE valid este și rămâne gratuită.</strong> Pachetele comerciale pentru promovare prioritară sunt încă în pregătire — le lansăm public când traficul site-ului ajunge la un nivel care le justifică economic pentru ambele părți.
          </p>
        </div>

        {/* Stats — real verified numbers only */}
        <div className="bg-surface rounded-xl border border-border p-6 mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Unde suntem acum</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-dark">{totalCompanies}</p>
              <p className="text-sm text-gray-500">Firme listate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-dark">{totalCounties}</p>
              <p className="text-sm text-gray-500">Județe acoperite</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-dark">{totalGuides}</p>
              <p className="text-sm text-gray-500">Ghiduri publicate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-dark">B2B</p>
              <p className="text-sm text-gray-500">Focus comercial</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mt-5">
            Focusul nostru este pe sisteme fotovoltaice comerciale și industriale în România — instalatori cu atestat ANRE valid, ghiduri pentru decizia de investiție, clasament financiar al firmelor, calculator estimativ, verificare ANRE live din registrul oficial.
          </p>
        </div>

        {/* Free listing — what's real, available now */}
        <section className="mb-10">
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold text-gray-900">Listare gratuită — instalatori</h2>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                Disponibil acum
              </span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              Dacă firma ta are atestat ANRE valid pentru servicii fotovoltaice (C2A, C1A, B, BP, BE), te poți lista gratuit. Profilul tău apare în director cu date contact, certificări, localizare; pagină proprie indexată Google la <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">/firme/firma-ta</code>; verificare ANRE live din registrul oficial; apariție în filtrele după județ, specializare și atestate; apariție în <a href="/clasament" className="text-primary-dark underline">/clasament</a> cu date financiare reale.
            </p>
            <p className="text-xs text-gray-500 mb-5">
              Listarea rămâne gratuită indiferent de ce decidem să facem cu pachetele comerciale ulterior.
            </p>
            <Button href="/listeaza-firma" variant="primary" size="md">
              Listează-ți firma gratuit
            </Button>
          </div>
        </section>

        {/* Real traffic widget */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Trafic actual</h2>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Cifrele de mai jos sunt din Umami live (last 30 zile). Le publicăm deschis ca să poți decide singur dacă scale-ul actual e relevant pentru tine — un parteneriat acum înseamnă să fii early în creștere, nu să cumperi audiență deja construită.
          </p>
          <TrafficWidget />
        </section>

        {/* Why no fixed packages yet */}
        <section className="mb-10">
          <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              De ce nu avem pachete comerciale standard public
            </h2>
            <div className="text-sm text-gray-700 leading-relaxed space-y-3">
              <p>
                Putem inventa prețuri lunare, pachete cu nume gen Plus / Premium, comparații cu Google Ads. Au mai făcut alții. Dar la traficul nostru actual și fără date despre cât valoarează un lead real prin director, orice preț afișat ar fi o ghicire — și nu vrem să vindem ghiciri.
              </p>
              <p>
                Așa că lucrăm momentan diferit: dacă ești o firmă care vrea vizibilitate prioritară pe directorul ăsta acum, ne scrii direct prin formularul de mai jos. Discutăm individual ce te interesează (vizibilitate pe pagina județului, pe homepage, în ghiduri, pilot gratuit cu testimonial — orice), vedem ce putem oferi real și agreem un preț care are sens pentru ambele părți.
              </p>
              <p>
                Pe măsură ce avem mai multe conversații reale cu firme reale, vom putea construi pachete standard pe care să le publicăm aici. Până atunci — discuții 1:1.
              </p>
            </div>
          </div>
        </section>

        {/* Inquiry form */}
        <section id="ad-inquiry" className="mb-12 scroll-mt-20">
          <AdInquiryForm />
          <div className="mt-4 text-center text-sm text-gray-500">
            Preferi telefon? <a href="tel:+40751547174" className="text-primary-dark font-medium hover:underline">0751 547 174</a> · email{' '}
            <a href="mailto:contact@instalatori-fotovoltaice.ro" className="text-primary-dark font-medium hover:underline">
              contact@instalatori-fotovoltaice.ro
            </a>
          </div>
        </section>

        {/* FAQ — short, honest */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Întrebări scurte</h2>
          <div className="space-y-3">
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Listarea e cu adevărat gratuită? Mereu?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Da. Listarea firmei tale în director e gratuită, fără card, fără perioadă de probă, fără upgrade obligatoriu. Dacă ulterior decidem să existe pachete comerciale pentru vizibilitate prioritară, asta NU schimbă faptul că listarea de bază rămâne gratuită — același tratament pe care l-am promis de la început tuturor firmelor care s-au listat până acum.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Cine vine pe site? Ce fel de trafic ai?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Trafic real (last 30 zile) este afișat pe această pagină. Nu publicăm date despre cine sunt vizitatorii (manageri / antreprenori / curioși) pentru că nu avem cum să verificăm asta fără să presupunem. Putem să-ți arătăm date Umami brute (referrer, surse de trafic, pagini cele mai citite) într-o conversație 1:1 dacă te interesează.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Câte lead-uri pot să primesc dacă plătesc?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Nu știm. Nu avem date măsurate despre conversie de la vizitator la lead în direcția firmelor listate, pentru că nu am avut încă firme cu plasament prioritar urmărit. Ne pare sincer mai bine să-ți spunem „nu știm&quot; decât să inventăm o cifră plauzibilă. Pe măsură ce avem primele parteneriate, vom putea raporta cifre reale.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Vrei să fii distribuitor / furnizor / SaaS. Mai e loc?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Da. Distribuitori panouri/invertoare/structuri, furnizori materiale electrice, echipamente specializate, SaaS pentru industrie sau cursuri/certificări — toate audiența noastră le-ar putea folosi. Avem un popup carousel mic în colțul dreapta-jos al site-ului cu maximum 8 parteneri activi. Lasă-ne datele în formular și discutăm.
              </p>
            </details>
            <details className="bg-white border border-border rounded-xl p-4 group">
              <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                <span>Când vor exista pachete cu prețuri publice?</span>
                <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                Când traficul justifică prețuri pe care le putem publica fără să le inventăm. Estimarea noastră (fără să o tratezi ca promisiune): undeva după ce trecem pragul de 10.000 vizualizări/lună și avem 3-5 conversații reale cu firme care plătesc. Estimat: 6-12 luni. Dacă vrei să fii printre primii anunțați, formul de mai sus capturează asta.
              </p>
            </details>
          </div>
        </section>
      </div>
    </>
  );
}
