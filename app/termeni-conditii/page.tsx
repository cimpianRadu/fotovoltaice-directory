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
        <p className="text-sm text-gray-500">Ultima actualizare: 18 septembrie 2026</p>

        <p>
          Prin accesarea și utilizarea site-ului <strong>instalatori-fotovoltaice.ro</strong> acceptați
          acești termeni și condiții în totalitate.
        </p>

        <h2>1. Descrierea serviciului</h2>
        <p>
          Instalatori Fotovoltaice România este o platformă online care listează firme de instalare
          panouri fotovoltaice comerciale și industriale din România. Site-ul oferă:
        </p>
        <ul>
          <li>Informații despre firmele de instalare (profil, certificări, acoperire geografică)</li>
          <li>Ghiduri informative despre panouri fotovoltaice</li>
          <li>Posibilitatea de a solicita oferte de la firmele listate</li>
          <li>
            Un feed public de cereri de ofertă, pe care firmele de instalare le pot revendica, și un
            portal în care firma își gestionează cererile revendicate
          </li>
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
        <p>
          Comisionul pe care îl poate datora o firmă instalatoare, în condițiile de la{' '}
          <a href="#comision">secțiunea 8</a>, privește exclusiv relația dintre noi și acea firmă. El
          nu ne face parte în contractul dintre firmă și client. Clientului nu îi cerem niciun cost
          și nu adăugăm nimic la oferta pe care i-o face firma.
        </p>

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
          solicita actualizarea sau eliminarea profilului contactându-ne la{' '}
          <a href="mailto:contact@instalatori-fotovoltaice.ro">contact@instalatori-fotovoltaice.ro</a>.
        </p>

        <h2 id="comision">8. Firme instalatoare: cereri revendicate și comision</h2>
        <p>
          Această secțiune privește firmele de instalare care primesc cereri prin platformă. Pentru
          clienții care cer oferte, platforma este și rămâne gratuită: nu le cerem niciun cost și nu
          le facturăm nimic.
        </p>
        <p>Sunt gratuite, fără condiții și fără abonament:</p>
        <ul>
          <li>listarea firmei în director și pagina ei publică</li>
          <li>accesul în portal și alertele pe județ</li>
          <li>vizualizarea cererilor publicate în feedul de cereri</li>
          <li>revendicarea unei cereri și primirea datelor complete ale clientului</li>
        </ul>
        <p>
          Nu vindem cereri la bucată. O cerere revendicată nu se plătește, indiferent ce iese din ea.
        </p>
        <p>
          <strong>Când apare un cost.</strong> Firma datorează un comision doar dacă semnează un
          contract cu un client a cărui cerere a primit-o prin platformă. Momentul care declanșează
          obligația este semnarea contractului între firmă și client. Dacă nu se semnează niciun
          contract, firma nu plătește nimic, oricâte cereri ar fi revendicat.
        </p>
        <p>
          <strong>Cum se calculează.</strong> Pentru proiectele obișnuite, comisionul este o sumă
          fixă, stabilită pe trepte, după puterea declarată în cererea transmisă de client, nu după
          ce se montează în final. Pentru proiectele mari, peste pragul convenit, comisionul este un
          procent din valoarea contractului, calculat la valoarea fără TVA. Nivelurile concrete
          (sumele fixe pe trepte, procentul și pragul de la care se aplică) se convin în scris cu
          fiecare firmă, înainte de prima cerere revendicată. Ele nu sunt publicate pe site fiindcă
          se stabilesc individual, iar fără un astfel de acord scris firma nu datorează nimic.
        </p>
        <p>
          <strong>Cum se confirmă lucrarea.</strong> Firma ne anunță contractul semnat, din portal
          sau pe email. Putem verifica faptul semnării direct la clientul care a trimis cererea.
          Verificăm dacă lucrarea s-a contractat, nu documentele comerciale ale firmei.
        </p>
        <p>
          <strong>Facturare.</strong> Comisionul se facturează de Cîmpian Radu Gheorghe PFA, CUI
          45316713, plătitor de TVA, după confirmarea contractului. Termenul de plată este cel din
          acordul scris cu firma.
        </p>
        <p>
          <strong>Dacă se anulează contractul.</strong> Dacă un contract semnat se anulează înainte
          de începerea lucrării, comisionul nu se mai datorează, iar factura deja emisă se
          stornează. Anularea se comunică în scris, de oricare dintre părți.
        </p>
        <p>
          Pachetele de promovare (poziții sponsorizate, promovare pe județ) sunt un serviciu
          separat, opțional, care nu influențează cererile primite și nu se compensează cu
          comisionul.
        </p>

        <h2 id="testimoniale">9. Testimoniale și studii de caz</h2>
        <p>
          După ce o cerere de ofertă se încheie cu un contract semnat, putem cere clientului și
          firmei care a executat lucrarea un scurt feedback, printr-un formular deschis doar cu un
          link trimis de noi. Răspunsurile ne ajută să îmbunătățim platforma și sunt folosite
          intern.
        </p>
        <p>
          Publicăm un răspuns pe site sau pe rețelele noastre sociale{' '}
          <strong>numai dacă persoana care l-a dat a ales explicit acest lucru în formular</strong>,
          și numai în forma aleasă (cu nume sau fără nume). Concret:
        </p>
        <ul>
          <li>
            <strong>De la client</strong> putem publica textul scris de el, județul, tipul și puterea
            sistemului. Numele apare doar dacă a ales varianta „cu numele meu".
          </li>
          <li>
            <strong>De la firma instalatoare</strong> putem publica părerea scrisă de ea, județul,
            tipul lucrării și puterea instalată. Numele firmei și linkul spre profilul ei apar doar
            dacă a ales varianta „cu numele firmei". Studiile de caz cu fotografii de la montaj se
            stabilesc separat, în scris, cu firma.
          </li>
          <li>
            Nu publicăm niciodată numărul de telefon, adresa de email sau adresa exactă a lucrării.
            Datele clientului nu apar în studiul de caz al firmei fără acordul separat al clientului.
          </li>
          <li>
            Acordul se poate retrage oricând, printr-un email la{' '}
            <a href="mailto:contact@instalatori-fotovoltaice.ro">contact@instalatori-fotovoltaice.ro</a>.
            Scoatem conținutul de pe site în cel mai scurt timp posibil; ce a fost deja distribuit pe
            rețele sociale de terți nu mai poate fi retras de noi.
          </li>
        </ul>

        <h2>10. Modificări</h2>
        <p>
          Ne rezervăm dreptul de a modifica acești termeni oricând. Modificările intră în vigoare
          la publicarea pe această pagină.
        </p>

        <h2>11. Legislație aplicabilă</h2>
        <p>
          Acești termeni sunt guvernați de legislația din România. Orice litigiu va fi soluționat
          de instanțele competente din România.
        </p>
      </article>
    </div>
  );
}
