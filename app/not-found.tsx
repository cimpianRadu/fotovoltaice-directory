import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-surface rounded-2xl flex items-center justify-center">
        <span className="text-4xl font-bold text-gray-300">404</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">Pagina nu a fost găsită</h1>
      <p className="text-gray-500 mb-8">
        Pagina pe care o cauți nu există sau a fost mutată.
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-3">
        <Button href="/" variant="primary">Acasă</Button>
        <Button href="/firme" variant="outline">Vezi Firme</Button>
      </div>
    </div>
  );
}
