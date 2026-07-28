import { safeNext } from '@/lib/admin-auth';

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function AdminLogin({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Admin</h1>
      <p className="text-sm text-slate-500 mt-1">Introdu parola ca să continui.</p>

      <form method="POST" action="/api/admin/login" className="mt-6 space-y-3">
        <input type="hidden" name="next" value={next} />
        <input
          type="password"
          name="password"
          autoFocus
          required
          autoComplete="current-password"
          placeholder="Parolă"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-900"
        />
        {sp.error && <p className="text-sm text-red-600">Parolă greșită.</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 px-3 py-2 font-medium text-white transition hover:bg-slate-700"
        >
          Intră
        </button>
      </form>
    </div>
  );
}
