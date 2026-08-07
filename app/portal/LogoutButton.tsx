'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch('/api/portal/auth/logout', { method: 'POST' });
    router.push('/portal/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="shrink-0 text-xs text-gray-400 underline hover:text-gray-600"
    >
      Ieși din cont
    </button>
  );
}
