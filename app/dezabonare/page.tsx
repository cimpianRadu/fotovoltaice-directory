import type { Metadata } from 'next';
import Link from 'next/link';
import { verifyUnsubscribeToken } from '@/lib/firm-unsubscribe-token';

// Pagina din linkul „Nu mai vreau emailuri cu cereri" (17 oct 2026). Oprirea
// se face la apăsarea butonului, nu la deschiderea linkului: unele servere de
// email deschid singure linkurile și ar dezabona firma fără să vrea.

export const metadata: Metadata = {
  title: 'Dezabonare',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function DezabonarePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string; gata?: string }>;
}) {
  const { e = '', t = '', gata } = await searchParams;

  if (gata) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gata, nu mai primești emailuri cu cereri</h1>
        <p className="mt-4 text-gray-700 leading-relaxed">
          {e ? <>Adresa <strong>{e}</strong> nu mai primește </> : 'Nu mai primești '}
          rezumatul de luni și alertele pe județ. Dacă te răzgândești, bifează din nou județele din{' '}
          <Link href="/portal#alerte" className="text-primary-dark underline">
            portal
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!verifyUnsubscribeToken(e, t)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Linkul nu este valid</h1>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Linkul din email a fost modificat sau e incomplet. Scrie-ne la{' '}
          <a href="mailto:contact@instalatori-fotovoltaice.ro" className="text-primary-dark underline">
            contact@instalatori-fotovoltaice.ro
          </a>{' '}
          și te scoatem manual din listă.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Nu mai vrei emailuri cu cereri?</h1>
      <p className="mt-4 text-gray-700 leading-relaxed">
        Adresa <strong>{e}</strong> nu va mai primi rezumatul de luni și alertele pe județ. Contul din portal și
        cererile pe care le-ai luat rămân neatinse.
      </p>
      <form method="post" action="/api/dezabonare" className="mt-6">
        <input type="hidden" name="e" value={e} />
        <input type="hidden" name="t" value={t} />
        <button
          type="submit"
          className="rounded-lg bg-primary px-5 py-3 font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          Confirm, nu mai vreau emailuri
        </button>
      </form>
    </div>
  );
}
