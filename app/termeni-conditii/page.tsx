import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Termeni și Condiții',
  description:
    'Termenii și condițiile de utilizare ale site-ului instalatori-fotovoltaice.ro. Reguli de utilizare, responsabilități și limitări.',
  alternates: { canonical: '/termeni-conditii' },
};

export default function TermeniConditii() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <Breadcrumbs items={[{ label: 'Termeni și Condiții' }]} />

      <article className="mt-6 prose prose-gray max-w-none">
        <h1>Termeni și Condiții</h1>
        <p className="text-sm text-gray-500">Ultima actualizare: 20 februarie 2026</p>

        <p>
          Prin accesarea și utilizarea site-ului <strong>instalatori-fotovoltaice.ro</strong> acceptați
          acești termeni și condiții în totalitate.
        </p>

        <h2>1. Descrierea serviciului</h2>
        <p>
          Instalatori Fotovoltaice România este un director online care listează firme de instalare
          panouri fotovoltaice comerciale și industriale din România. Site-ul oferă:
        </p>
        <ul>
          <li>Informații despre firmele de instalare (profil, certificări, acoperire geografică)</li>
          <li>Ghiduri informative despre panouri fotovoltaice</li>
          <li>Posibilitatea de a solicita oferte de la firmele listate</li>
        </ul>

        <h2>2. Rolul nostru</h2>
        <p>
          Suntem un <strong>intermediar informațional</strong>. Nu suntem parte în contractele între
          clienți și firmele de instalare. Nu garantăm și nu ne asumăm responsabilitatea pentru:
        </p>
        <ul>
          <li>Calitatea serviciilor oferite de firmele listate</li>
          <li>Prețurile sau ofertele comunicate de firme</li>
          <li>Respectarea termenelor de execuție</li>
          <li>Orice prejudiciu rezultat din relația directă cu firmele listate</li>
        </ul>

        <h2>3. Acuratețea informațiilor</h2>
        <p>
          Depunem eforturi rezonabile pentru a menține datele actualizate și corecte. Informațiile
          despre firme provin din surse publice (registre oficiale, site-uri ale firmelor) și pot
          fi verificate sau actualizate de firmele însele. Cu toate acestea:
        </p>
        <ul>
          <li>Nu garantăm acuratețea 100% a tuturor informațiilor</li>
          <li>Datele financiare sunt orientative și provin din registre publice</li>
          <li>Ghidurile au caracter informativ și nu înlocuiesc consultanța de specialitate</li>
        </ul>

        <h2>4. Utilizarea site-ului</h2>
        <p>Utilizatorii se obligă să:</p>
        <ul>
          <li>Furnizeze informații reale și corecte în formulare</li>
          <li>Nu utilizeze site-ul în scopuri ilegale sau abuzive</li>
          <li>Nu trimită spam sau cereri false prin formularul de ofertă</li>
          <li>Nu copieze sau redistribuie conținutul fără acordul nostru</li>
        </ul>

        <h2>5. Proprietate intelectuală</h2>
        <p>
          Conținutul site-ului (texte, design, logo, ghiduri) este proprietatea noastră și este
          protejat de legea drepturilor de autor. Datele despre firme provin din surse publice și
          sunt agregate de noi.
        </p>

        <h2>6. Limitarea răspunderii</h2>
        <p>
          Site-ul este furnizat &quot;așa cum este&quot;. Nu oferim garanții exprese sau implicite privind
          disponibilitatea neîntreruptă, absența erorilor sau adecvarea pentru un anumit scop.
          Răspunderea noastră este limitată la valoarea serviciilor plătite de utilizator (dacă e
          cazul).
        </p>

        <h2>7. Firmele listate</h2>
        <p>
          Firmele sunt listate pe baza informațiilor din surse publice. Orice firmă listată poate
          solicita actualizarea sau eliminarea profilului contactându-ne la adresa de email de pe
          pagina <a href="/despre">Despre Noi</a>.
        </p>

        <h2>8. Modificări</h2>
        <p>
          Ne rezervăm dreptul de a modifica acești termeni oricând. Modificările intră în vigoare
          la publicarea pe această pagină.
        </p>

        <h2>9. Legislație aplicabilă</h2>
        <p>
          Acești termeni sunt guvernați de legislația din România. Orice litigiu va fi soluționat
          de instanțele competente din România.
        </p>
      </article>
    </div>
  );
}
