import { NextRequest, NextResponse } from 'next/server';
import type { UserRole } from '@shared/types/shared.types';
import { ENV } from '@shared/config/env';

export const DEFAULT_ROLE: UserRole =
  (process.env.NEXT_PUBLIC_DEFAULT_USER_ROLE as UserRole) || 'sales_rep';

/** Phase 2: land on Engage; sidebar navigates to all modules on one host */
export const HOME_PATH = ENV.HOME_PATH || '/engage';

const MANAGER_ONLY_PREFIXES = [
  '/calls/search',
  '/calls/translator',
  '/calls/transcriber',
  '/calls/reviews',
  '/calls/analytics',
  '/revenue',
  '/deal-drivers',
  '/ai-deep-researcher',
  '/ai-revenue-predictor',
  '/data-cloud',
];

const REP_ONLY_PREFIXES = [
  '/training',
  '/topics',
  '/trackers',
  '/calls/ai-reviewer',
  '/calls/coaching-insights',
  '/smart-call',
];

function getRole(req: NextRequest): UserRole {
  const raw = req.cookies.get('user_role')?.value;
  return raw === 'sales_manager' ? 'sales_manager' : 'sales_rep';
}

function withRoleCookie(response: NextResponse, role: UserRole) {
  response.cookies.set('user_role', role, { path: '/' });
  return response;
}

export function createAppMiddleware() {
  return function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const role = getRole(request);

    if (!request.cookies.get('user_role')?.value) {
      return withRoleCookie(NextResponse.next(), DEFAULT_ROLE);
    }

    if (pathname === '/') {
      return NextResponse.redirect(new URL(HOME_PATH, request.url));
    }

    const isManagerOnly = MANAGER_ONLY_PREFIXES.some((p) => pathname.startsWith(p));
    const isRepOnly = REP_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

    if (isManagerOnly && role !== 'sales_manager') {
      const res = NextResponse.redirect(new URL(HOME_PATH, request.url));
      return withRoleCookie(res, 'sales_manager');
    }

    if (isRepOnly && role !== 'sales_rep') {
      const res = NextResponse.redirect(new URL(HOME_PATH, request.url));
      return withRoleCookie(res, 'sales_rep');
    }

    return NextResponse.next();
  };
}
