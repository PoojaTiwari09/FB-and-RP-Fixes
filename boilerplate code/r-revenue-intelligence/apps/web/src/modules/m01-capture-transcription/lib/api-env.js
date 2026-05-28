/**
 * M01 frontend API base — Vite standalone (5174) or Next.js apps/web.
 */
const viteStandalone =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_M01_STANDALONE === 'true';

export function getM01ApiRoot() {
  if (viteStandalone) {
    const u = import.meta.env?.VITE_M01_API_URL;
    return u === '' || u === undefined ? '' : String(u).replace(/\/$/, '');
  }
  const fromEnv =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M01_API_URL;
  return (fromEnv || 'http://localhost:3001').replace(/\/$/, '');
}

export function m01ApiV1(path = '') {
  const root = getM01ApiRoot();
  const base = root ? `${root}/api/v1` : '/api/v1';
  if (!path) return base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export const DEV_TENANT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TENANT_ID) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TENANT_ID) ||
  '00000000-0000-0000-0000-000000000001';

export const defaultHeaders = () => ({
  'Content-Type': 'application/json',
  'x-tenant-id': DEV_TENANT_ID,
});

/** M02 Conversation Intelligence Vite app (standalone). */
export function getM02WebUrl() {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_M02_WEB_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M02_WEB_URL;
  return String(fromVite || fromNext || 'http://localhost:5175').replace(/\/$/, '');
}

/** M10 Data & Compliance Vite app (standalone). */
export function getM10WebUrl() {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_M10_WEB_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M10_WEB_URL;
  return String(fromVite || fromNext || 'http://localhost:5178').replace(/\/$/, '');
}
