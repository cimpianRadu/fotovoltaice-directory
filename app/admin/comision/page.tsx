import Link from 'next/link';

// Fișa de ținut deschisă la telefon cu instalatorii: cifra, mecanismul și
// răspunsurile la obiecții, fără să caut prin memorii. Cifrele NU sunt publice
// (decizie 10 sept 2026): pe site apare doar mecanismul, în T&C §8 și pe
// /pentru-instalatori. Grila e cea din 4 sept 2026, confirmată 25 sept: sumele
// sunt fără TVA (PFA plătitor, factura adaugă 21%), iar peste 100 kW e procent.

const TREPTE = [
  { putere: 'sub 10 kW', suma: '500 lei', nota: '605 lei cu TVA · 63% din cereri, mediana 6 kW' },
  { putere: '10 – 100 kW', suma: '1.000 lei', nota: '1.210 lei cu TVA · în practică 10–30 kW' },
  { putere: 'peste 100 kW', suma: '1–2%', nota: 'din valoarea contractului fără TVA, + TVA' },
];

// Aceleași trepte ca procent din ofertă, pe prețuri reale cu montaj, fără TVA
// (`data/kit-prices.json`, 17 aug 2026). Pentru „e mult”.
const EXEMPLE = [
  { proiect: '6 kW on-grid', comision: '500 lei', pct: '2,97%' },
  { proiect: '10 kW on-grid', comision: '1.000 lei', pct: '3,97%' },
  { proiect: '10 kW hibrid', comision: '1.000 lei', pct: '2,64%' },
  { proiect: '15 kW', comision: '1.000 lei', pct: '1,79%' },
  { proiect: '30 kW', comision: '1.000 lei', pct: '0,90%' },
  { proiect: '150 kW', comision: '4.710–9.420 lei', pct: '1–2%' },
];

const OBIECTII = [
  {
    q: '„E mult.”',
    a: 'Pe un 6 kW sunt ~3% din ofertă, pe un 15 kW sub 2%. Și îi plătești doar după ce ai semnat, adică după ce ai lucrarea. O cerere care nu iese nu te costă nimic.',
  },
  {
    q: '„La alții plătesc per lead.”',
    a: 'Exact: acolo plătești fiecare cerere, iese sau nu, deci riscul e tot al tău. greenlead.ro vinde cererea cu 60–70 lei la până la 10 firme. Aici maxim 3 firme pe cerere și plătești doar ce semnezi.',
  },
  {
    q: '„Cum știți că am semnat?”',
    a: 'Ne anunți tu, din portal sau pe email. Oricum îl sun pe client la 30 de zile, ca să văd cum a fost. Verific doar dacă s-a semnat, nu mă uit în contractele tale.',
  },
  {
    q: '„Și dacă clientul se răzgândește?”',
    a: 'Dacă se anulează contractul înainte să înceapă lucrarea, nu datorezi nimic, iar factura se stornează.',
  },
  {
    q: '„Clientul a zis 10 kW, am montat 8.”',
    a: 'Contează puterea din cerere, nu ce se montează. Știi de la început cât e, nu te surprinde nimic.',
  },
  {
    q: '„Am deja destule cereri.”',
    a: 'Nu insista. E al treilea semnal (StratoSpark, 16 sept): firmele cu marketing propriu nu cumpără volum. Mulțumești și treci la următoarea.',
  },
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

export default function ComisionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Comisionul, pentru telefon</h1>
        <p className="mt-1 text-sm text-slate-500">
          Cifrele nu sunt publice: se spun la telefon și se confirmă pe email. Public e doar
          mecanismul, în{' '}
          <Link href="/termeni-conditii#comision" className="underline hover:no-underline">
            T&amp;C §8
          </Link>{' '}
          și pe{' '}
          <Link href="/pentru-instalatori" className="underline hover:no-underline">
            /pentru-instalatori
          </Link>
          .
        </p>
      </div>

      <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-5">
        <p className="text-lg font-semibold text-slate-900">
          Cererile sunt gratuite. Plătești comision doar când semnezi contractul cu clientul.
          Dacă nu semnezi, nu plătești nimic.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Grila, după puterea din cerere">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {TREPTE.map((t) => (
                <tr key={t.putere}>
                  <td className="py-3 pr-4 font-medium text-slate-900 whitespace-nowrap">{t.putere}</td>
                  <td className="py-3 pr-4 text-2xl font-bold tabular-nums text-slate-900 whitespace-nowrap">
                    {t.suma}
                  </td>
                  <td className="py-3 text-xs text-slate-500">{t.nota}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">
            Toate sumele sunt fără TVA. Factura (Cîmpian Radu Gheorghe PFA, plătitor de TVA)
            adaugă 21%. Spune „plus TVA” la telefon.
          </p>
        </Card>

        <Card title="Cât înseamnă din ofertă (fără TVA)">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {EXEMPLE.map((e) => (
                <tr key={e.proiect}>
                  <td className="py-2 pr-4 text-slate-900">{e.proiect}</td>
                  <td className="py-2 pr-4 tabular-nums text-slate-600">{e.comision}</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-slate-900">{e.pct}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">
            Prețuri cu montaj din kit-prices.json (17 aug 2026). Grila fixă e regresivă: treapta
            mică e cea mai apăsătoare, de aceea peste 100 kW trece pe procent.
          </p>
        </Card>
      </div>

      <Card title="Ce e gratuit">
        <ul className="grid gap-2 text-sm text-slate-800 sm:grid-cols-2">
          <li>✓ Listarea firmei și pagina ei publică</li>
          <li>✓ Portalul și alertele pe județ</li>
          <li>✓ Revendicarea cererii și datele complete ale clientului</li>
          <li>✓ Fără abonament, fără plată per cerere</li>
        </ul>
      </Card>

      <Card title="Cum merge, pas cu pas">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-800">
          <li>
            <strong>Acordul:</strong> suma se confirmă în scris, pe email, înainte de prima cerere
            revendicată. Un rând „de acord” ajunge. Fără acord scris, firma nu datorează nimic.
          </li>
          <li>
            <strong>Declanșarea:</strong> semnarea contractului între firmă și client. Nu oferta, nu
            revendicarea.
          </li>
          <li>
            <strong>Confirmarea:</strong> firma anunță din portal sau pe email; eu sun clientul la
            30 de zile.
          </li>
          <li>
            <strong>Factura:</strong> după confirmare, prin PFA. Termenul de plată e cel din acordul
            scris.
          </li>
          <li>
            <strong>Anulare:</strong> contract anulat înainte de începerea lucrării → nu se
            datorează, factura se stornează.
          </li>
        </ol>
      </Card>

      <Card title="Oferta de acum (22 sept – 10 oct)">
        <p className="text-sm text-slate-800">
          Cererile „cât mai repede” din județul tău vin <strong>întâi la tine</strong>, la o singură
          firmă, cu <strong>48 de ore</strong> avans. Clientul e sunat de mine înainte. Plătești
          suma din grilă, plus TVA, doar la contract semnat.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Lista: Enera, East Solar, AXIONET, Dandis, Green Seiro, Solanum, Electro Prahova. Ținta: 3
          „de acord” scrise. Verdict 15 oct.
        </p>
      </Card>

      <Card title="Obiecții">
        <dl className="space-y-4 text-sm">
          {OBIECTII.map((o) => (
            <div key={o.q}>
              <dt className="font-semibold text-slate-900">{o.q}</dt>
              <dd className="mt-1 text-slate-700">{o.a}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
