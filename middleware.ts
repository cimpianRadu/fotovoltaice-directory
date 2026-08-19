import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, safeEqual, sessionToken } from '@/lib/admin-auth';
import { PORTAL_COOKIE, verifyToken } from '@/lib/portal-auth';

// Pagina de login și endpointul ei trebuie să treacă de gardă, altfel nu se
// poate ajunge niciodată la formular.
const OPEN_PATHS = new Set(['/admin/login', '/api/admin/login', '/api/admin/logout']);

// Fluxul de login al portalului: cerere de cod, verificare link/cod, logout.
// Plus /portal însuși: pagina decide singură ce arată, tablou de bord cu
// sesiune sau prezentarea publică fără. Restul rutelor rămân păzite aici.
const PORTAL_OPEN_PATHS = new Set([
  '/portal',
  '/portal/login',
  '/api/portal/auth/request',
  '/api/portal/auth/code',
  '/api/portal/auth/verify',
  '/api/portal/auth/logout',
]);

async function portalMiddleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  if (PORTAL_OPEN_PATHS.has(pathname)) return NextResponse.next();

  const secret = process.env.PORTAL_SECRET;
  if (!secret) {
    return new NextResponse('Portal disabled (PORTAL_SECRET not set)', { status: 503 });
  }

  const token = req.cookies.get(PORTAL_COOKIE)?.value;
  if (await verifyToken(token, 'session', secret)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = '/portal/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith('/portal') || pathname.startsWith('/api/portal')) {
    return portalMiddleware(req);
  }

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
  matcher: ['/admin/:path*', '/api/admin/:path*', '/portal/:path*', '/api/portal/:path*'],
};
