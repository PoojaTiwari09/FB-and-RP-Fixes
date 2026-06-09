import { createAppMiddleware } from '@shared/lib/app-entry.middleware';

export const middleware = createAppMiddleware();

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
