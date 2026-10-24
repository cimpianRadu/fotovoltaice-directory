import { redirect } from 'next/navigation';

// Pagina de start a adminului e lista de cereri (24 oct 2026). Cardurile de
// aici repetau meniul de sus.
export default function AdminHome() {
  redirect('/admin/cereri');
}
