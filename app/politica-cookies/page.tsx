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
        <p className="text-sm text-gray-500">Ultima actualizare: 29 iulie 2026</p>

        <h2>Ce sunt cookie-urile?</h2>
        <p>
          Cookie-urile sunt fișiere text mici stocate pe dispozitivul dumneavoastră de către
          browser-ul web atunci când vizitați un site. Sunt folosite pentru a reține preferințe,
          a îmbunătăți experiența și a furniza informații proprietarilor site-ului.
        </p>

        <h2>De ce nu vedeți o fereastră de consimțământ</h2>
        <p>
          La o vizită obișnuită, site-ul <strong>nu scrie niciun cookie</strong> pe dispozitivul
          dumneavoastră. Sistemul de analiză a traficului funcționează fără cookie-uri, iar
          publicitate sau urmărire între site-uri nu folosim deloc. Singurele informații salvate
          local apar <strong>după o acțiune a dumneavoastră</strong> (alegeți un mod de afișare,
          închideți o fereastră) și servesc exclusiv la a vă respecta acea alegere. Pentru astfel
          de informații, strict necesare unei funcții pe care ați cerut-o, legislația nu impune
          obținerea prealabilă a consimțământului.
        </p>

        <h2>Ce salvăm, concret</h2>
        <p>
          Nimic din tabelul de mai jos nu conține date personale și nimic nu se scrie înainte să
          interacționați cu elementul respectiv.
        </p>
        <table>
          <thead>
            <tr>
              <th>Ce</th>
              <th>Când apare</th>
              <th>La ce folosește</th>
              <th>Durată</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>segment</code> (cookie)
              </td>
              <td>Când alegeți „Casă" sau „Firmă"</td>
              <td>Site-ul vă arată în continuare secțiunea aleasă</td>
              <td>1 an</td>
            </tr>
            <tr>
              <td>
                <code>cta-popup-dismissed</code> (stocare locală)
              </td>
              <td>Când închideți fereastra de sugestie</td>
              <td>Nu v-o mai arătăm</td>
              <td>Până ștergeți datele browserului</td>
            </tr>
            <tr>
              <td>
                <code>partner-carousel</code> (stocare de sesiune)
              </td>
              <td>Când închideți caruselul de parteneri</td>
              <td>Nu vi-l mai arătăm în sesiunea curentă</td>
              <td>Până închideți fila</td>
            </tr>
            <tr>
              <td>Cookie de autentificare</td>
              <td>Doar la administrarea site-ului</td>
              <td>Menține sesiunea de administrator</td>
              <td>Sesiune</td>
            </tr>
          </tbody>
        </table>

        <h3>Analiza traficului</h3>
        <p>
          Folosim un sistem de analiză <strong>fără cookie-uri</strong>, care nu stochează date pe
          dispozitivul dumneavoastră și nu vă urmărește între site-uri. Vedem câte persoane au
          vizitat o pagină și de unde au venit, nu cine sunt.
        </p>

        <h3>Cookie-uri de marketing</h3>
        <p>
          <strong>Nu folosim cookie-uri de marketing sau publicitate.</strong> Nu partajăm date cu
          rețele publicitare și nu urmărim comportamentul dumneavoastră în scopuri de remarketing.
        </p>

        <h2>Cum controlați cookie-urile</h2>
        <p>
          Puteți controla și șterge cookie-urile din setările browser-ului dumneavoastră. Dacă le
          ștergeți, site-ul uită preferințele salvate (modul de afișare ales, ferestrele închise) și
          vi le va cere din nou, dar funcționează în continuare normal.
        </p>
        <p>
          Dacă vom introduce vreodată instrumente care necesită consimțământ, cum ar fi pixeli de
          publicitate, veți vedea o fereastră de consimțământ înainte ca acestea să pornească, iar
          această pagină va fi actualizată corespunzător.
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
