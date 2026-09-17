import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Decodes JWT payload in standard Edge runtime without external native dependencies
 */
function parseJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    // Check expiry
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  const session = token ? parseJwt(token) : null;

  // 1. Guard /admin/:path*
  if (pathname.startsWith('/admin')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== 'ADMIN') {
      // Reject non-admin customers and managers from accessing admin portal
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'unauthorized_admin_access');
      return NextResponse.redirect(homeUrl);
    }
  }

  // 2. Guard /manager/:path*
  if (pathname.startsWith('/manager')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.role !== 'MANAGER' && session.role !== 'ADMIN') {
      // Reject customers from accessing venue manager portal
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'unauthorized_manager_access');
      return NextResponse.redirect(homeUrl);
    }
  }

  // 3. Guard /booking/:path* (must be authenticated to access booking/payment flow)
  if (pathname.startsWith('/booking')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      const returnUrl = pathname + request.nextUrl.search;
      loginUrl.searchParams.set('redirect', returnUrl);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/manager/:path*',
    '/booking/:path*',
  ],
};
