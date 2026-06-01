/**
 * Unified demo: one backend port for M01 + M02 + M09 bridge routes.
 */
export type RevenueModule = 'm01' | 'm02' | 'm08' | 'm09';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_M01_API_BASE_URL ??
  'http://localhost:3001';

const M01 = process.env.NEXT_PUBLIC_M01_API_BASE_URL ?? API_BASE;
const M02 = process.env.NEXT_PUBLIC_M02_API_BASE_URL ?? API_BASE;
const M09 = process.env.NEXT_PUBLIC_M09_API_BASE_URL ?? API_BASE;
const M08 = process.env.NEXT_PUBLIC_M08_API_BASE_URL ?? API_BASE;

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
  // Legacy manager reviewer stub route → M02 reviews
  if (pathname.startsWith('/calls/reviewer')) return 'm02';
  return 'm01';
}

export function getApiBaseForModule(module: RevenueModule): string {
  switch (module) {
    case 'm09':
      return M09;
    case 'm02':
      return M02;
    case 'm08':
      return M08;
    case 'm01':
    default:
      return M01;
  }
}

export function getApiBaseForPath(pathname: string): string {
  return getApiBaseForModule(getModuleForPath(pathname));
}

export const MODULE_API = { M01, M02, M08, M09 } as const;
