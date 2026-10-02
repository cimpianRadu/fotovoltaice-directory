import Link from 'next/link';
import { GRILA } from '../grila';
import DocumentActions from '../../DocumentActions';
import { H2, Pill, Sheet } from '../../DocumentSheet';

// Documentul general trimis firmelor după apel (prima dată la GIS, 2 oct 2026):
// grila, cum se aplică, regulile cererilor și colegii pe același cont. Stă în
// admin fiindcă are cifrele, care nu sunt publice. Se scoate PDF din dialogul
// de print al browserului. Regulile din secțiunile 3 și 4 urmează codul:
// MAX_CLAIMS_PER_LEAD, MAX_ACTIVE_CLAIMS_PER_FIRM + claimHoldsFirmSlot,
// MAX_FIRM_EMAILS și alertele pe firmă din filterCountyAlertRecipients. Dacă se
// schimbă acolo, se schimbă și aici.

export const dynamic = 'force-dynamic';

const MESAJ = `Bună ziua, cum am discutat, vă trimit pe scurt cum funcționează cererile și comisionul: grila, când se plătește, regulile de revendicare și cum adăugați colegii în portal. Pe scurt: nu plătiți pentru cereri, comisionul apare doar la contract semnat. Dacă sunteți de acord cu grila, un răspuns „de acord" pe email e suficient. Pentru orice întrebare, mă găsiți la 0751 547 174.`;

export default function ComisionDocumentPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <Link href="/admin/comision" className="text-xs text-slate-500 hover:text-slate-900">
            ← Comisionul, pentru telefon
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Documentul pentru firme</h1>
          <p className="mt-1 text-sm text-slate-500">
            General, fără numele firmei. „Printează / PDF” → Salvează ca PDF, apoi îl trimiți pe
            WhatsApp sau email, cu mesajul de mai jos.
          </p>
        </div>
        <DocumentActions mesaj={MESAJ} />
      </div>

      <textarea
        id="mesaj-insotire"
        readOnly
        value={MESAJ}
        rows={4}
        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 print:hidden"
      />

      {/* Foaia care ajunge la firmă. De aici în jos, totul e vizibil și la print. */}
      <Sheet title="Cererile de ofertă și comisionul">
        <div className="mb-5 rounded-lg border-2 border-[#f59e0b] bg-amber-50 px-4 py-3 text-base font-semibold text-slate-900">
          Nu plătiți pentru cereri. Plătiți un comision doar pentru lucrările pe care le contractați
          cu clienții primiți prin platformă.
        </div>

        <p className="font-semibold">Gratuit, fără abonament și fără plată per cerere:</p>
        <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
          {[
            'listarea firmei și pagina ei publică',
            'portalul și alertele pe județ',
            'revendicarea cererilor',
            'datele complete ale clientului',
          ].map((t) => (
            <li key={t}>
              <span className="font-bold text-green-600">✓</span> {t}
            </li>
          ))}
        </ul>

        <section className="break-inside-avoid">
          <H2 n={1}>Comisionul</H2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-[#1e3a5f] text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-1.5 font-semibold">Puterea contractată</th>
                <th className="px-2 py-1.5 font-semibold">Comision, fără TVA</th>
                <th className="px-2 py-1.5 font-semibold">Cu TVA 21%</th>
              </tr>
            </thead>
            <tbody>
              {GRILA.map((t) => (
                <tr key={t.putere} className="border-b border-slate-200 align-top">
                  <td className="whitespace-nowrap px-2 py-2 font-semibold">{t.putere}</td>
                  <td className="whitespace-nowrap px-2 py-2 text-lg font-bold text-slate-900">
                    {t.suma}
                  </td>
                  <td className="px-2 py-2">{t.cuTva}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[0.9em] text-slate-600">
            Treapta se stabilește după puterea din contractul semnat cu clientul. Când ne confirmați
            lucrarea, ne comunicați și puterea contractată.
          </p>
        </section>

        <section className="break-inside-avoid">
          <H2 n={2}>Cum se aplică</H2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              <strong>Acordul.</strong> Confirmați grila în scris, pe email, înainte de prima cerere
              revendicată. Un răspuns „de acord” este suficient. Fără acord scris nu se datorează
              nimic.
            </li>
            <li>
              <strong>Momentul.</strong> Comisionul apare la semnarea contractului cu clientul. Nu la
              ofertă și nu la revendicare.
            </li>
            <li>
              <strong>Confirmarea.</strong> Ne anunțați din portal (statusul <Pill>Concretizat</Pill>)
              sau pe email, împreună cu puterea contractată. Îl sunăm și noi pe client după
              aproximativ 30 de zile, ca să aflăm cum a decurs. Verificăm doar dacă lucrarea s-a
              contractat, nu documentele firmei.
            </li>
            <li>
              <strong>Factura.</strong> Se emite după confirmare de Cîmpian Radu Gheorghe PFA, CUI
              45316713, plătitor de TVA. Termenul de plată îl stabilim în acordul scris.
            </li>
            <li>
              <strong>Anularea.</strong> Dacă contractul se anulează înainte de începerea lucrării,
              comisionul nu se mai datorează, iar factura se stornează.
            </li>
          </ol>
        </section>

        <section className="break-inside-avoid">
          <H2 n={3}>Regulile cererilor</H2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Maxim 3 firme pe aceeași cerere.</strong> Pe fiecare cerere din
              instalatori-fotovoltaice.ro/cereri vedeți câte locuri sunt ocupate, de exemplu{' '}
              <Pill>1/3 revendicate</Pill>. Clientul nu este sunat de zece firme, iar dumneavoastră
              nu concurați cu toată piața. Când o firmă renunță sau marchează cererea{' '}
              <Pill>Neconcretizat</Pill>, locul se eliberează pentru alta.
            </li>
            <li>
              <strong>Maxim 5 cereri care așteaptă primul telefon, în același timp.</strong> O
              cerere ocupă unul dintre cele 5 locuri cât timp stă pe <Pill>De sunat</Pill>, sau pe{' '}
              <Pill>Nu răspunde</Pill> fără nicio notă. Când o mutați pe <Pill>În discuții</Pill>,{' '}
              <Pill>Ofertă trimisă</Pill> sau alt status, ori renunțați la ea, locul se eliberează
              și puteți revendica alta.
            </li>
            <li>
              Limita nu este pe câte cereri lucrați, ci pe câte ați luat și n-ați sunat încă.
              Clientul vede cererea ca preluată, deci contează ca cineva să-l sune.
            </li>
            <li>Renunțarea la o cerere se face din portal, cu un motiv scurt.</li>
          </ul>
        </section>

        <section className="break-inside-avoid">
          <H2 n={4}>Mai mulți colegi pe același cont</H2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Fiecare coleg intră în portal cu emailul lui, fără parolă: primește pe email un link și
              un cod.
            </li>
            <li>
              Adresele se adaugă din portal, tabul <strong>Setări</strong>, secțiunea{' '}
              <strong>Utilizatorii firmei</strong>. Se pot adăuga până la 5 adrese pe firmă, direct,
              fără cod de confirmare.
            </li>
            <li>Toți colegii văd aceleași cereri revendicate, cu datele clienților, notele și statusurile.</li>
            <li>
              <strong>Alertele pe județ sunt ale firmei, nu ale fiecărei adrese.</strong> Județele
              bifate se aplică întregii firme, iar alerta pentru o cerere nouă ajunge la toate
              adresele adăugate.
            </li>
            <li>
              O adresă care are deja cont propriu sau cereri revendicate nu se poate adăuga din
              portal. În cazul acesta ne scrieți și o legăm noi, fără să se piardă nimic.
            </li>
          </ul>
        </section>

        <p className="mt-6 text-xs text-slate-500">
          Termenii compleți: instalatori-fotovoltaice.ro/termeni-conditii#comision
        </p>
      </Sheet>
    </div>
  );
}
