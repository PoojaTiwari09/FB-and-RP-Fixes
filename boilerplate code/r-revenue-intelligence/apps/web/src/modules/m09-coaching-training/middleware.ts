import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;
  const role = request.cookies.get('auth_role')?.value;

  if (pathname === '/') {
    return NextResponse.redirect(new URL(token ? `/${role === 'manager' ? 'manager/dashboard' : 'rep/assignments'}` : '/login', request.url));
  }

  if (!token && (pathname.startsWith('/rep') || pathname.startsWith('/manager'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL(role === 'manager' ? '/manager/dashboard' : '/rep/assignments', request.url));
  }

  if (token && role === 'rep' && pathname.startsWith('/manager')) {
    return NextResponse.redirect(new URL('/rep/dashboard', request.url));
  }

  if (token && role === 'manager' && pathname.startsWith('/rep')) {
    return NextResponse.redirect(new URL('/manager/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/rep/:path*', '/manager/:path*'],
};
