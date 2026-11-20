import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import { ACORDURI, COMISION_TERMEN_PLATA_ZILE, GRILA_COMISION } from '@/lib/acorduri-shared';
import { MAX_ACTIVE_CLAIMS_PER_FIRM } from '@/lib/sheets-shared';
import { WATT_FIRME_MESAJE_PE_ZI } from '@/lib/watt-firme-shared';

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
        <p className="text-sm text-gray-500">Ultima actualizare: 20 noiembrie 2026</p>

        <p>
          Prin accesarea și utilizarea site-ului <strong>instalatori-fotovoltaice.ro</strong> acceptați
          acești termeni și condiții în totalitate.
        </p>

        <p>
          Site-ul este operat de <strong>CÎMPIAN RADU GHEORGHE PERSOANĂ FIZICĂ AUTORIZATĂ</strong>,
          CIF RO45316713, Nr. Reg. Com. F01/1568/2021, denumit în continuare „noi”. Contact:{' '}
          <a href="mailto:contact@instalatori-fotovoltaice.ro">contact@instalatori-fotovoltaice.ro</a>.
        </p>

        <h2>1. Descrierea serviciului</h2>
        <p>
          Instalatori Fotovoltaice România este o platformă online care listează firme de instalare
          panouri fotovoltaice din România. Site-ul oferă:
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
          <strong>Ce află clientul.</strong> Când o firmă preia o cerere și primește datele
          clientului, clientul primește pe email numele firmei și telefonul public de pe fișa ei din
          director, ca să știe cine îl va suna. În contul lui, clientul ne poate spune dacă firma l-a
          contactat. Pozele și adresa montajului, dacă clientul le-a adăugat, le vede doar firma care a
          preluat cererea și le folosește numai pentru oferta la acea cerere. Când clientul își
          închide cererea, firmele care o au în lucru sunt anunțate pe email. Ofertele trimise prin portal le vede doar clientul cererii și noi: nu le arătăm
          altor firme și nu le publicăm. Valorile din oferte le folosim doar adunate, fără numele
          firmei.
        </p>
        <p>
          <strong>Când apare un cost.</strong> Firma datorează un comision doar dacă semnează un
          contract cu un client a cărui cerere a primit-o prin platformă. Momentul care declanșează
          obligația este semnarea contractului între firmă și client. Dacă nu se semnează niciun
          contract, firma nu plătește nimic, oricâte cereri ar fi revendicat.
        </p>
        <p>
          <strong>Grila de comision.</strong> Treapta se stabilește după puterea din contractul
          semnat cu clientul, nu după puterea din cererea transmisă de acesta. Sumele sunt fără TVA;
          la factură se adaugă TVA 21%.
        </p>
        <div className="not-prose my-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-2 pr-4 font-medium">Puterea contractată</th>
                <th className="py-2 pr-4 font-medium">Comision</th>
                <th className="py-2 font-medium">Detalii</th>
              </tr>
            </thead>
            <tbody>
              {GRILA_COMISION.map((r) => (
                <tr key={r.putere} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-700">{r.putere}</td>
                  <td className="py-2 pr-4 font-semibold text-gray-900 whitespace-nowrap">{r.comision}</td>
                  <td className="py-2 text-gray-600">{r.cuTva}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Grila se aplică tuturor firmelor, dacă nu am convenit altfel în scris cu o firmă anume.
          Peste 100 kW, procentul exact îl stabilim în scris pentru fiecare proiect, înainte de
          semnarea contractului cu clientul.
        </p>
        <p>
          <strong>Acordul.</strong> Firma acceptă termenii și grila bifându-le în contul ei din
          portal sau în formularul de revendicare, înainte de prima cerere revendicată. Fără acord
          nu se poate revendica o cerere. Salvăm, pentru fiecare adresă de email a firmei, versiunea
          acceptată, data și ora, adresa IP și textul bifat. Firma își vede acordurile în portal, în tabul „Alerte și
          utilizatori”.
        </p>
        <p>
          <strong>Cum se confirmă lucrarea.</strong> Firma ne anunță contractul semnat, din portal
          sau pe email, împreună cu puterea contractată. Putem verifica semnarea și puterea direct
          la clientul care a trimis cererea. Verificăm dacă lucrarea s-a contractat și la ce putere,
          nu documentele comerciale ale firmei.
        </p>
        <p>
          <strong>Facturare.</strong> Comisionul se facturează de CÎMPIAN RADU GHEORGHE PERSOANĂ
          FIZICĂ AUTORIZATĂ, CIF RO45316713, plătitor de TVA, după confirmarea contractului. Factura se
          plătește în {COMISION_TERMEN_PLATA_ZILE} de zile de la emitere.
        </p>
        <p>
          <strong>Dacă se anulează contractul.</strong> Dacă un contract semnat se anulează înainte
          de începerea lucrării, comisionul nu se mai datorează, iar factura deja emisă se
          stornează. Anularea se comunică în scris, de oricare dintre părți.
        </p>
        <p>
          <strong>Regulile cererilor.</strong> O cerere poate fi revendicată de cel mult 3 firme, ca
          clientul să nu fie sunat de zece firme. Pe fiecare cerere se vede câte locuri sunt
          ocupate. O firmă poate ține cel mult {MAX_ACTIVE_CLAIMS_PER_FIRM} cereri care așteaptă
          primul telefon în același timp: o cerere ocupă un loc cât stă pe „De sunat” sau pe „Nu
          răspunde” fără nicio notă. Locul se eliberează când firma mută cererea pe alt status sau
          renunță la ea din portal, cu un motiv scurt. Clientul vede cererea ca preluată, deci
          firma care o revendică se angajează să-l sune.
        </p>
        <p>
          Pachetele de promovare (poziții sponsorizate, promovare pe județ) sunt un serviciu
          separat, opțional, care nu influențează cererile primite și nu se compensează cu
          comisionul.
        </p>

        <h2 id="watt-ai">9. Watt AI pentru firme</h2>
        <p>
          Firmele logate pot folosi Watt AI, asistentul platformei, din bula de pe site. Watt
          răspunde din datele platformei: cererile preluate de firmă, cu ce a confirmat clientul,
          cererile publice din județele firmei și ghidurile noastre. Datele de contact ale
          clienților nu ajung la Watt.
        </p>
        <ul>
          <li>
            Răspunsurile lui Watt sunt generate automat și pot conține greșeli. Ele nu sunt
            consultanță juridică, fiscală sau de finanțare. Firma verifică informațiile importante
            (sumele, termenele, condițiile programelor) la sursă, înainte să le folosească în oferte
            sau în discuția cu clientul.
          </li>
          <li>
            Mesajele firmei și răspunsurile lui Watt se păstrează în contul firmei. Le putem citi ca
            să îmbunătățim asistentul și platforma. Pentru răspunsuri, mesajele sunt trimise la
            Anthropic, furnizorul modelului AI. La cerere, ștergem conversația.
          </li>
          <li>
            Accesul e gratuit până pe 10 decembrie 2026, cu cel mult {WATT_FIRME_MESAJE_PE_ZI} mesaje pe
            zi pentru o firmă. Condițiile de după vor fi publicate ca versiune nouă a acestor termeni,
            pe care firma o acceptă separat. Fără acceptarea ei, accesul se oprește.
          </li>
          <li>
            Nu folosiți Watt pentru a trimite date personale ale altor persoane decât cele pe care
            platforma vi le-a dat deja pentru o cerere.
          </li>
        </ul>

        <h2 id="testimoniale">10. Testimoniale și studii de caz</h2>
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
            <strong>De la client</strong> publicăm doar recomandarea scrisă de el în câmpul dedicat
            din formular, dacă a ales să o publicăm, cu județul, tipul și puterea sistemului. Numele
            apare doar dacă a ales varianta „cu numele meu”. Celelalte răspunsuri ale clientului rămân
            interne.
          </li>
          <li>
            <strong>De la firma instalatoare</strong> publicăm doar recomandarea scrisă de ea în
            câmpul dedicat din formular, dacă l-a completat, cu numele firmei și linkul spre profilul
            ei, plus județul, tipul lucrării și puterea instalată. Celelalte răspunsuri ale firmei
            rămân interne. Studiile de caz cu fotografii de la montaj se stabilesc separat, în scris,
            cu firma.
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

        <h2 id="modificari">11. Modificări</h2>
        <p>
          Putem modifica acești termeni. Modificările intră în vigoare la publicarea pe această
          pagină. O schimbare de fond pentru firme (grila de comision, termenul de plată, regulile
          cererilor, condițiile Watt AI) primește o versiune nouă: firma o vede în cont și o
          bifează înainte să revendice din nou. Până la acceptarea ei, pentru cererile deja
          revendicate se aplică versiunea acceptată anterior. Corecturile de formulare, fără efect
          asupra drepturilor sau obligațiilor, nu primesc versiune nouă.
        </p>
        <p className="text-sm text-gray-500">
          Versiunile în vigoare pentru firme:{' '}
          {ACORDURI.map((a) => `${a.titlu.toLowerCase()}, din ${a.dataVersiunii}`).join('; ')}.
        </p>

        <h2>12. Legislație aplicabilă</h2>
        <p>
          Acești termeni sunt guvernați de legislația din România. Orice litigiu va fi soluționat
          de instanțele competente din România.
        </p>
      </article>
    </div>
  );
}
