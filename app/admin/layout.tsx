import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin · Analytics',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/analytics" className="text-sm font-semibold text-slate-900">
              Admin · Analytics
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/admin/analytics" className="hover:text-slate-900">
                Overview
              </Link>
              <span className="text-slate-300">Conținut · soon</span>
              <span className="text-slate-300">Sponsori · soon</span>
            </nav>
          </div>
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-900">
            ← site public
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
