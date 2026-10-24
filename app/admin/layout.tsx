import type { Metadata } from 'next';
import { Suspense } from 'react';
import AdminNav from './AdminNav';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Meniul are print:hidden: rapoartele de partener se tipăresc fără el. */}
      <Suspense fallback={null}>
        <AdminNav />
      </Suspense>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
