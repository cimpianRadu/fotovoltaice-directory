import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Politica de Cookies',
  description:
    'Politica de cookies a site-ului instalatori-fotovoltaice.ro. Informații despre cookie-urile utilizate și opțiunile dumneavoastră.',
  alternates: { canonical: '/politica-cookies' },
};

export default function PoliticaCookies() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumbs items={[{ label: 'Politica de Cookies' }]} />

      <article className="mt-6 prose prose-gray max-w-none">
        <h1>Politica de Cookies</h1>
        <p className="text-sm text-gray-500">Ultima actualizare: 20 februarie 2026</p>

        <h2>Ce sunt cookie-urile?</h2>
        <p>
          Cookie-urile sunt fișiere text mici stocate pe dispozitivul dumneavoastră de către
          browser-ul web atunci când vizitați un site. Sunt folosite pentru a reține preferințe,
          a îmbunătăți experiența și a furniza informații proprietarilor site-ului.
        </p>

        <h2>Cookie-uri pe care le folosim</h2>
        <p>
          Site-ul <strong>instalatori-fotovoltaice.ro</strong> este conceput să funcționeze cu un
          minim de cookie-uri:
        </p>

        <h3>Cookie-uri strict necesare</h3>
        <p>
          Acestea sunt esențiale pentru funcționarea site-ului. Nu colectează informații personale
          și nu pot fi dezactivate.
        </p>
        <table>
          <thead>
            <tr>
              <th>Cookie</th>
              <th>Scop</th>
              <th>Durată</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sesiune Next.js</td>
              <td>Funcționarea corectă a paginilor</td>
              <td>Sesiune</td>
            </tr>
          </tbody>
        </table>

        <h3>Cookie-uri de analiză (opționale)</h3>
        <p>
          Folosim un sistem de analytics <strong>fără cookie-uri</strong> (privacy-friendly), care
          nu stochează date pe dispozitivul dumneavoastră și nu urmărește utilizatorii între
          site-uri. Nu este necesar consimțământ pentru acesta conform GDPR.
        </p>

        <h3>Cookie-uri de marketing</h3>
        <p>
          <strong>Nu folosim cookie-uri de marketing sau publicitate.</strong> Nu partajăm date cu
          rețele publicitare și nu urmărim comportamentul dumneavoastră în scopuri de remarketing.
        </p>

        <h2>Cum controlați cookie-urile</h2>
        <p>
          Puteți controla și șterge cookie-urile din setările browser-ului dumneavoastră. Rețineți
          că dezactivarea cookie-urilor strict necesare poate afecta funcționalitatea site-ului.
        </p>
        <ul>
          <li><strong>Chrome:</strong> Setări → Confidențialitate și securitate → Cookie-uri</li>
          <li><strong>Firefox:</strong> Setări → Confidențialitate și securitate</li>
          <li><strong>Safari:</strong> Preferințe → Confidențialitate</li>
          <li><strong>Edge:</strong> Setări → Cookie-uri și permisiuni site</li>
        </ul>

        <h2>Modificări</h2>
        <p>
          Această politică poate fi actualizată periodic. Orice modificare va fi publicată pe
          această pagină cu data actualizării.
        </p>
      </article>
    </div>
  );
}
