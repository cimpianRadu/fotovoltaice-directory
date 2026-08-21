// Ce trebuie să conțină o ofertă completă de sistem fotovoltaic.
//
// Lista vine din felul în care instalatorii își compun ei înșiși devizul, nu
// dintr-o părere de-a noastră: aceleași poziții apar în uneltele de ofertare
// folosite intern de firme. Nu conține prețuri, tocmai fiindcă rostul ei e
// altul: cumpărătorul pune două oferte una lângă alta și vede ce lipsește din
// cea mai ieftină.
//
// E genul de listă pe care un instalator n-o poate publica credibil, fiindcă e
// parte interesată. Noi putem.

const INCLUS = [
  ['Panouri fotovoltaice', 'marca, modelul și puterea fiecărui panou, nu doar „X kWp"'],
  ['Invertor', 'marca, modelul și dacă e hibrid sau on-grid'],
  ['Baterie de stocare', 'dacă e în ofertă: capacitatea utilizabilă în kWh, nu numele comercial'],
  ['Structură de montaj', 'tipul, potrivit cu acoperișul (țiglă, tablă, terasă, la sol)'],
  ['Cabluri și conectori DC/AC', 'incluse, nu „se stabilesc la fața locului"'],
  ['Protecții electrice AC și DC', 'siguranțe, descărcătoare, separatoare'],
  ['Contor inteligent', 'necesar pentru managementul energiei și pentru dosarul de prosumator'],
  ['Manoperă de instalare', 'sumă separată, nu topită în prețul echipamentelor'],
  ['Dosarul de prosumator', 'cine îl depune și dacă e inclus în preț'],
  ['Punerea în funcțiune', 'inclusiv configurarea aplicației de monitorizare'],
  ['TVA', 'scris explicit, cu cota aplicată'],
] as const;

const DE_INTREBAT = [
  ['Deplasarea echipei', 'se calculează dus-întors, iar la distanță mare intră și cazarea. O firmă din județul dumneavoastră pornește de la un cost mai mic pentru aceeași lucrare.'],
  ['Priza de împământare', 'dacă locația nu are una conformă, se adaugă. Întrebați înainte, nu după semnare.'],
  ['Garanțiile, pe componente', 'panourile, invertorul, bateria și manopera au termene diferite. Cereți-le pe toate în scris.'],
  ['Avansul', 'nu e o cifră fixă. Se negociază, iar procentul cerut spune ceva despre firmă.'],
] as const;

export default function OfferChecklist() {
  return (
    <section className="mt-10 rounded-xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-bold text-secondary-dark">Ce trebuie să conțină oferta pe care o primiți</h2>
      <p className="mt-1 text-sm text-gray-600">
        Estimarea de mai sus vă dă ordinul de mărime. Diferența dintre două oferte apropiate ca preț
        stă aproape întotdeauna în ce lipsește din cea mai ieftină. Puneți-le una lângă alta pe lista asta.
      </p>

      <ul className="mt-4 space-y-2">
        {INCLUS.map(([titlu, detaliu]) => (
          <li key={titlu} className="flex items-start gap-2.5 text-sm">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span className="text-gray-700">
              <span className="font-semibold text-gray-900">{titlu}</span>
              <span className="text-gray-500">: {detaliu}</span>
            </span>
          </li>
        ))}
      </ul>

      <h3 className="mt-6 text-sm font-bold text-secondary-dark">Patru lucruri de întrebat, care nu apar în oferte</h3>
      <dl className="mt-2 space-y-2.5">
        {DE_INTREBAT.map(([titlu, detaliu]) => (
          <div key={titlu} className="text-sm">
            <dt className="font-semibold text-gray-900">{titlu}</dt>
            <dd className="text-gray-600">{detaliu}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
