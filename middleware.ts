import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, safeEqual, sessionToken } from '@/lib/admin-auth';

// Pagina de login și endpointul ei trebuie să treacă de gardă, altfel nu se
// poate ajunge niciodată la formular.
const OPEN_PATHS = new Set(['/admin/login', '/api/admin/login', '/api/admin/logout']);

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (OPEN_PATHS.has(pathname)) return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse('Admin disabled (ADMIN_PASSWORD not set)', { status: 503 });
  }

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (cookie && safeEqual(cookie, await sessionToken(password))) {
    return NextResponse.next();
  }

  // API-urile răspund cu 401. Doar navigarea în browser merge spre formular.
  if (pathname.startsWith('/api/')) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
