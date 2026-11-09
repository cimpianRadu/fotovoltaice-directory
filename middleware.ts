import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, safeEqual, sessionToken } from '@/lib/admin-auth';
import {
  CLIENT_HINT_COOKIE,
  CLIENT_HINT_DAYS,
  CLIENT_LEAD_COOKIE,
  CLIENT_SESSION_COOKIE,
  PORTAL_COOKIE,
  PORTAL_HINT_COOKIE,
  PORTAL_SESSION_DAYS,
  verifyToken,
} from '@/lib/portal-auth';

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
  // Cine sunt: răspunde { me: null } fără sesiune, nu 401 — e apelat de pe
  // /cereri pentru orice vizitator, ca să știe dacă firma are cont.
  '/api/portal/me',
  // Intrarea fără cod, pentru verificat portalul local pe contul unei firme.
  // Doar în `next dev`; ruta răspunde oricum 404 în afara lui.
  ...(process.env.NODE_ENV === 'development' ? ['/api/portal/auth/dev'] : []),
]);

/**
 * Ține semnul pentru header în pas cu sesiunea: pus când sesiunea e validă,
 * scos când a expirat. Se face aici pentru că pe aici trec și sesiunile vechi
 * (/portal, /api/portal/me de pe /cereri), nu doar loginurile noi.
 */
function syncHint(
  req: NextRequest,
  res: NextResponse,
  loggedIn: boolean,
  name = PORTAL_HINT_COOKIE,
  days = PORTAL_SESSION_DAYS,
): NextResponse {
  const has = req.cookies.has(name);
  if (loggedIn && !has) {
    res.cookies.set(name, '1', {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: days * 86_400,
    });
  } else if (!loggedIn && has) {
    res.cookies.delete(name);
  }
  return res;
}

/**
 * Contul clientului nu are gardă aici (paginile verifică singure), doar semnul
 * pentru „Cererea mea" din header. Pe /api/cont trece și evenimentul trimis de
 * ecranul de după formular, deci semnul se pune chiar după cerere, nu doar la
 * intrarea în cont.
 */
async function clientMiddleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  // Ieșirea și ștergerea își scot singure cookie-urile.
  if (pathname === '/api/cont/iesire' || pathname === '/api/cont/sterge') return NextResponse.next();
  const secret = process.env.PORTAL_SECRET;
  const loggedIn = Boolean(
    secret &&
      ((await verifyToken(req.cookies.get(CLIENT_SESSION_COOKIE)?.value, 'client-session', secret)) ||
        (await verifyToken(req.cookies.get(CLIENT_LEAD_COOKIE)?.value, 'client-lead', secret))),
  );
  return syncHint(req, NextResponse.next(), loggedIn, CLIENT_HINT_COOKIE, CLIENT_HINT_DAYS);
}

async function portalMiddleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const secret = process.env.PORTAL_SECRET;
  const token = req.cookies.get(PORTAL_COOKIE)?.value;
  const loggedIn = Boolean(secret && token && (await verifyToken(token, 'session', secret)));

  // Logout-ul își scoate singur cookie-urile; semnul nu trebuie repus în răspunsul lui.
  if (pathname === '/api/portal/auth/logout') return NextResponse.next();
  if (PORTAL_OPEN_PATHS.has(pathname)) return syncHint(req, NextResponse.next(), loggedIn);

  if (!secret) {
    return new NextResponse('Portal disabled (PORTAL_SECRET not set)', { status: 503 });
  }

  if (loggedIn) {
    return syncHint(req, NextResponse.next(), true);
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
  if (pathname === '/cont' || pathname.startsWith('/cont/') || pathname.startsWith('/api/cont/')) {
    return clientMiddleware(req);
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
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/portal/:path*',
    '/api/portal/:path*',
    '/cont/:path*',
    '/api/cont/:path*',
  ],
};
