import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Politica de Confidențialitate',
  description:
    'Politica de confidențialitate a site-ului instalatori-fotovoltaice.ro. Cum colectăm, folosim și protejăm datele dumneavoastră personale conform GDPR.',
  alternates: { canonical: '/politica-confidentialitate' },
};

export default function PoliticaConfidentialitate() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumbs items={[{ label: 'Politica de Confidențialitate' }]} />

      <article className="mt-6 prose prose-gray max-w-none">
        <h1>Politica de Confidențialitate</h1>
        <p className="text-sm text-gray-500">Ultima actualizare: 20 februarie 2026</p>

        <p>
          Instalatori Fotovoltaice România (&quot;noi&quot;, &quot;site-ul&quot;) operează site-ul{' '}
          <strong>instalatori-fotovoltaice.ro</strong>. Această politică descrie modul în care colectăm,
          folosim și protejăm datele dumneavoastră personale, în conformitate cu Regulamentul General
          privind Protecția Datelor (GDPR - Regulamentul UE 2016/679).
        </p>

        <h2>1. Date pe care le colectăm</h2>
        <h3>Date furnizate de dumneavoastră</h3>
        <ul>
          <li>
            <strong>Formularul &quot;Cere Ofertă&quot;:</strong> nume, email, telefon, descrierea proiectului,
            locație (județ, oraș)
          </li>
          <li>
            <strong>Formularul &quot;Listează-ți Firma&quot;:</strong> numele firmei, CUI, date de contact,
            informații despre servicii
          </li>
          <li>
            <strong>Newsletter / Waitlist:</strong> adresa de email
          </li>
        </ul>

        <h3>Date colectate automat</h3>
        <ul>
          <li>Date anonime de navigare (pagini vizitate, durata sesiunii) prin analytics fără cookies</li>
          <li>Nu folosim cookie-uri de tracking sau publicitate</li>
        </ul>

        <h2>2. Scopul prelucrării datelor</h2>
        <ul>
          <li>Transmiterea cererilor de ofertă către firmele de instalare relevante</li>
          <li>Procesarea cererilor de listare a firmelor în director</li>
          <li>Trimiterea de comunicări solicitate (newsletter)</li>
          <li>Îmbunătățirea funcționalității site-ului</li>
        </ul>

        <h2>3. Temeiul legal al prelucrării</h2>
        <ul>
          <li><strong>Consimțământ</strong> — pentru trimiterea formularelor și abonarea la newsletter</li>
          <li><strong>Interes legitim</strong> — pentru analytics anonim și îmbunătățirea site-ului</li>
        </ul>

        <h2>4. Partajarea datelor</h2>
        <p>
          Datele din formularul &quot;Cere Ofertă&quot; sunt transmise exclusiv firmelor de instalare din
          directorul nostru care acoperă zona dumneavoastră. Nu vindem și nu partajăm datele
          dumneavoastră cu terți în scopuri de marketing.
        </p>

        <h2>5. Durata stocării</h2>
        <ul>
          <li>Cererile de ofertă: 12 luni de la trimitere</li>
          <li>Datele firmelor listate: pe durata listării + 6 luni</li>
          <li>Email-uri newsletter: până la dezabonare</li>
        </ul>

        <h2>6. Drepturile dumneavoastră (GDPR)</h2>
        <p>Aveți dreptul la:</p>
        <ul>
          <li><strong>Acces</strong> — să solicitați o copie a datelor dumneavoastră</li>
          <li><strong>Rectificare</strong> — să corectați datele inexacte</li>
          <li><strong>Ștergere</strong> — să solicitați ștergerea datelor</li>
          <li><strong>Restricționare</strong> — să limitați prelucrarea datelor</li>
          <li><strong>Portabilitate</strong> — să primiți datele într-un format structurat</li>
          <li><strong>Opoziție</strong> — să vă opuneți prelucrării</li>
        </ul>
        <p>
          Pentru exercitarea acestor drepturi, ne puteți contacta la{' '}
          <a href="mailto:contact@instalatori-fotovoltaice.ro">contact@instalatori-fotovoltaice.ro</a>.
        </p>

        <h2>7. Securitatea datelor</h2>
        <p>
          Implementăm măsuri tehnice și organizatorice adecvate pentru protecția datelor: conexiune
          criptată (HTTPS), acces restricționat la baze de date, și proceduri de backup.
        </p>

        <h2>8. Modificări ale politicii</h2>
        <p>
          Ne rezervăm dreptul de a actualiza această politică. Orice modificare va fi publicată pe
          această pagină cu data actualizării.
        </p>
      </article>
    </div>
  );
}
