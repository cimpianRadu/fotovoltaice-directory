import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import AdminNav from './AdminNav';

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
            <Suspense fallback={null}>
              <AdminNav />
            </Suspense>
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
