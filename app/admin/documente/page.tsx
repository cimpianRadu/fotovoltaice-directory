import Link from 'next/link';

// Documentele de trimis firmelor după un apel, într-un singur loc din meniu.
// Fiecare pagină are „Printează / PDF” și mesajul de însoțire gata de copiat.

const DOCUMENTE = [
  {
    href: '/admin/comision/document',
    titlu: 'Cererile și comisionul',
    descriere:
      'Grila de comision, cum se aplică, regulile cererilor (3 firme pe cerere, 5 active pe firmă) și colegii pe același cont.',
    cand: 'Firmei care primește cereri, înainte de acordul „de acord” pe email.',
  },
  {
    href: '/admin/sponsori/oferta',
    titlu: 'Oferta de publicitate',
    descriere: 'Premium, studiu de caz și Slot Popup, cu prețuri și condiții, ca pe /publicitate.',
    cand: 'Firmei care întreabă de promovare.',
  },
];

export default function DocumentePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Documente pentru firme</h1>
        <p className="mt-1 text-sm text-slate-500">
          Deschizi documentul, apeși „Printează / PDF”, salvezi ca PDF și îl trimiți pe WhatsApp
          sau email, cu mesajul copiat de pe aceeași pagină.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {DOCUMENTE.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-400"
          >
            <div className="text-lg font-semibold text-slate-900">{d.titlu} →</div>
            <p className="mt-2 text-sm text-slate-700">{d.descriere}</p>
            <p className="mt-2 text-xs text-slate-500">Când: {d.cand}</p>
          </Link>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Rapoartele lunare pentru parteneri sunt în{' '}
        <Link href="/admin/analytics/sponsori" className="underline hover:no-underline">
          Sponsori
        </Link>
        .
      </p>
    </div>
  );
}
