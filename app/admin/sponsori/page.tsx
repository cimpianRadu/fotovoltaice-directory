import Link from 'next/link';
import { readSponsorData } from '@/lib/sponsors-store';
import SponsorControls from './SponsorControls';

// Pagina citește mereu starea reală (fișierele de pe disc local, respectiv
// ultimul commit de pe GitHub în producție), nu snapshotul din build — altfel,
// imediat după o salvare, admin-ul ar arăta datele vechi până trece deploy-ul.
export const dynamic = 'force-dynamic';

export default async function SponsoriControlPage() {
  const { data, meta } = await readSponsorData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Control Parteneri</h1>
          <p className="text-sm text-slate-500 mt-1">
            Pornești/oprești și editezi ce afișează sloturile de publicitate.{' '}
            {meta.mode === 'github'
              ? 'Salvarea face un commit pe main, iar Vercel redeployează singur (~2 min).'
              : meta.mode === 'fs'
                ? 'Rulezi local: salvarea scrie fișierele din data/, live intră la următorul push.'
                : ''}
          </p>
        </div>
        <Link
          href="/admin/analytics/sponsori"
          className="shrink-0 text-sm text-slate-500 hover:text-slate-900 transition"
        >
          Cifrele →
        </Link>
      </div>

      {meta.mode === 'bundled' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Doar citire: {meta.error ? 'GitHub a refuzat cererea' : 'GITHUB_TOKEN lipsește pe Vercel'}</p>
          <p className="mt-1 text-xs leading-relaxed">
            Ca să poți salva de aici: GitHub → Settings → Developer settings → Fine-grained tokens →
            token nou cu acces doar la <code className="font-mono">fotovoltaice-directory</code> și
            permisiunea <strong>Contents: Read and write</strong>, apoi în Vercel → Settings →
            Environment Variables adaugă <code className="font-mono">GITHUB_TOKEN</code> (Production)
            și redeployează. Până atunci vezi datele din build, fără buton de salvare.
          </p>
          {meta.error && (
            <p className="mt-2 text-xs font-mono text-amber-800 break-all">{meta.error}</p>
          )}
        </div>
      )}

      <SponsorControls initial={data} writable={meta.writable} mode={meta.mode} />

      <p className="text-xs text-slate-400">
        Partener nou sau logo schimbat: din cod (logo-ul are nevoie de fișier în{' '}
        <code className="font-mono">public/logos/</code>, altfel imaginea iese ruptă). Slug-urile nu
        se schimbă de aici: pe ele stau cifrele din analytics și link-urile de preview.
      </p>
    </div>
  );
}
