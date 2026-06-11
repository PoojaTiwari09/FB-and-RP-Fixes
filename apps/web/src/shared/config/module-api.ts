/**
 * Unified demo: one backend port for M01 + M02 + M09 bridge routes.
 */
export type RevenueModule = 'm01' | 'm02' | 'm08' | 'm09';

const SERVER_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_M01_API_BASE_URL ??
  'http://localhost:3002';

/**
 * Get the backend API base URL
 * Always returns the full backend URL from env config
 */
export function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002';
}

/** Browser uses same-origin `/api/*` (Next.js rewrite → :3001). SSR uses full backend URL. */
export function resolveApiBase(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  return getBackendUrl();
}

const M02_PREFIXES = [
  '/calls/search',
  '/calls/translator',
  '/calls/transcriber',
  '/calls/reviews',
  '/calls/analytics',
];

const M09_PREFIXES = ['/training'];

const M01_PREFIXES = [
  '/calls/list',
  '/calls/ai-reviewer',
  '/calls/coaching-insights',
  '/smart-call',
  '/calls/theme-spotter',
];

const M08_PREFIXES = ['/engage'];

export function getModuleForPath(pathname: string): RevenueModule {
  if (M09_PREFIXES.some((p) => pathname.startsWith(p))) return 'm09';
  if (M08_PREFIXES.some((p) => pathname.startsWith(p))) return 'm08';
  if (M02_PREFIXES.some((p) => pathname.startsWith(p))) return 'm02';
  if (M01_PREFIXES.some((p) => pathname.startsWith(p))) return 'm01';
  if (pathname.startsWith('/calls/reviewer')) return 'm02';
  return 'm01';
}

export function getApiBaseForModule(_module: RevenueModule): string {
  return resolveApiBase();
}

export function getApiBaseForPath(pathname: string): string {
  return getApiBaseForModule(getModuleForPath(pathname));
}

export const MODULE_API = {
  get M01() {
    return resolveApiBase();
  },
  get M02() {
    return resolveApiBase();
  },
  get M08() {
    return resolveApiBase();
  },
  get M09() {
    return resolveApiBase();
  },
} as const;
