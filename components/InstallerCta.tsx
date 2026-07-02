import Button from '@/components/ui/Button';

// Shared "get a quote / browse installers" banner. Single source for the CTA
// wording and layout, dropped on guides, clasament, calculator, verificare-anre.
// `specializare` pre-filters the firms link when the host page has that context.
export default function InstallerCta({ specializare }: { specializare?: string }) {
  return (
    <div className="bg-primary/5 rounded-xl border border-primary/10 p-6 my-10 text-center">
      <h3 className="font-bold text-gray-900 mb-2">Cauți un instalator pentru proiectul tău?</h3>
      <p className="text-sm text-gray-600 mb-4">
        Spune-ne ce ai nevoie și primești oferte gratuite de la mai mulți instalatori atestați, sau vezi direct firmele specializate.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Button href="/cere-oferta" variant="primary">
          Cere ofertă
        </Button>
        <Button href={`/firme${specializare ? `?specializare=${specializare}` : ''}`} variant="outline">
          Vezi Firme Specializate
        </Button>
      </div>
    </div>
  );
}
