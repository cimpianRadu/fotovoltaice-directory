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
        <p className="text-sm text-gray-500">Ultima actualizare: 29 iulie 2026</p>

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
          <li>
            Transmiterea cererilor de ofertă către firmele de instalare relevante, pentru ca acestea să
            vă contacteze cu oferte
          </li>
          <li>
            Transmiterea cererilor care menționează finanțare printr-un program către un partener de
            finanțare, pentru ca acesta să vă contacteze cu opțiuni
          </li>
          <li>Procesarea cererilor de listare a firmelor pe platformă</li>
          <li>Trimiterea de comunicări solicitate (newsletter)</li>
          <li>Îmbunătățirea funcționalității site-ului</li>
        </ul>

        <h2>3. Temeiul legal al prelucrării</h2>
        <ul>
          <li>
            <strong>Consimțământ</strong> (art. 6 alin. 1 lit. a GDPR): pentru trimiterea formularelor și
            abonarea la newsletter
          </li>
          <li>
            <strong>Interes legitim</strong> (art. 6 alin. 1 lit. f GDPR): pentru analytics anonim și
            îmbunătățirea site-ului
          </li>
        </ul>

        <h2>4. Partajarea datelor cu firmele de instalare</h2>
        <p>
          Datele din formularul &quot;Cere Ofertă&quot; sunt transmise firmelor de instalare din platforma
          noastră care acoperă zona și tipul proiectului dumneavoastră, cu unicul scop de a vă contacta cu
          oferte pentru cererea trimisă. Transmiterea către aceste firme se poate realiza și în baza unui
          acord comercial între platformă și firmele respective.
        </p>
        <p>
          După primirea cererii, fiecare firmă de instalare prelucrează datele dumneavoastră în calitate de
          operator independent, exclusiv pentru a vă contacta în legătură cu cererea de ofertă.
        </p>

        <h3>Parteneri de finanțare</h3>
        <p>
          Dacă în formular ați indicat că investiția s-ar face printr-un program de finanțare (Casa
          Verde, AFM, Electric Up sau altul) ori că nu ați decis încă modul de finanțare, cererea
          poate fi transmisă și unui partener de finanțare sau asigurare cu care colaborăm, în
          același scop: să vă contacteze cu opțiuni pentru proiectul dumneavoastră. Partenerul
          prelucrează datele tot ca operator independent.
        </p>
        <p>
          Cererile în care ați indicat că investiția se face din fonduri proprii{' '}
          <strong>nu se transmit</strong> acestor parteneri. În afara firmelor de instalare și a
          partenerilor de finanțare descriși mai sus, nu transmitem datele dumneavoastră către alte
          categorii de destinatari (agenții de marketing, brokeri de date) și nu le folosim în alte
          scopuri decât cele descrise în această politică.
        </p>

        <h2>5. Furnizori de servicii (persoane împuternicite)</h2>
        <p>
          Pentru operarea site-ului folosim furnizori care pot prelucra date în numele nostru, strict
          conform instrucțiunilor noastre:
        </p>
        <ul>
          <li><strong>Google (Google Workspace):</strong> stocarea cererilor și comunicare prin email</li>
          <li><strong>Resend:</strong> trimiterea notificărilor prin email</li>
          <li><strong>Vercel:</strong> găzduirea site-ului</li>
          <li><strong>Umami:</strong> analytics fără cookie-uri, pe date agregate</li>
        </ul>
        <p>
          Unii dintre acești furnizori pot prelucra date în afara Uniunii Europene (în special în SUA).
          Astfel de transferuri se realizează în baza unor garanții adecvate conform art. 44-49 GDPR
          (Decizia de adecvare UE-SUA / EU-US Data Privacy Framework sau clauze contractuale standard).
        </p>

        <h2>6. Durata stocării</h2>
        <ul>
          <li>Cererile de ofertă: 12 luni de la trimitere</li>
          <li>Datele firmelor listate: pe durata listării + 6 luni</li>
          <li>Email-uri newsletter: până la dezabonare</li>
        </ul>

        <h2>7. Drepturile dumneavoastră (GDPR)</h2>
        <p>Aveți dreptul la:</p>
        <ul>
          <li><strong>Acces</strong>: să solicitați o copie a datelor dumneavoastră</li>
          <li><strong>Rectificare</strong>: să corectați datele inexacte</li>
          <li><strong>Ștergere</strong>: să solicitați ștergerea datelor</li>
          <li><strong>Restricționare</strong>: să limitați prelucrarea datelor</li>
          <li><strong>Portabilitate</strong>: să primiți datele într-un format structurat</li>
          <li><strong>Opoziție</strong>: să vă opuneți prelucrării</li>
          <li>
            <strong>Retragerea consimțământului</strong>: oricând, fără a afecta legalitatea prelucrării
            anterioare
          </li>
        </ul>
        <p>
          Pentru exercitarea acestor drepturi, ne puteți contacta la{' '}
          <a href="mailto:contact@instalatori-fotovoltaice.ro">contact@instalatori-fotovoltaice.ro</a>.
          Aveți de asemenea dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a
          Prelucrării Datelor cu Caracter Personal (ANSPDCP,{' '}
          <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer">
            dataprotection.ro
          </a>
          ).
        </p>

        <h2>8. Securitatea datelor</h2>
        <p>
          Implementăm măsuri tehnice și organizatorice adecvate pentru protecția datelor: conexiune
          criptată (HTTPS), acces restricționat la datele stocate, și proceduri de backup.
        </p>

        <h2>9. Modificări ale politicii</h2>
        <p>
          Ne rezervăm dreptul de a actualiza această politică. Orice modificare va fi publicată pe
          această pagină cu data actualizării.
        </p>
      </article>
    </div>
  );
}
