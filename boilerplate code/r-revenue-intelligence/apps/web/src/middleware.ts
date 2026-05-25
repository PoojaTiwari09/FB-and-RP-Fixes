import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route access rules by role
const ROLE_ROUTES: Record<string, string[]> = {
  '/executive': ['ADMIN', 'EXECUTIVE'],
  '/executive/:path*': ['ADMIN', 'EXECUTIVE'],
  '/api/executive': ['ADMIN', 'EXECUTIVE'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userRole = request.headers.get('x-user-role') ??
                   request.cookies.get('x-user-role')?.value ??
                   'SALES_REP';

  // Check if this route requires specific roles
  for (const [pattern, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    const regexPattern = pattern.replace(':path*', '.*').replace(/\//g, '\\/');
    if (new RegExp(`^${regexPattern}$`).test(pathname)) {
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.json({ error: 'Access denied. Executive role required.' }, { status: 403 });
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/executive/:path*', '/api/executive/:path*'],
};
