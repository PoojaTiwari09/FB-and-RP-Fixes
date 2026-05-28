/**
 * M02 frontend API base — works in Vite standalone (5175) and Next.js (apps/web).
 * Vite: use '' + proxy to m02-api :3002. Next: NEXT_PUBLIC_M02_API_URL or :3002.
 */
const viteStandalone =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_M02_STANDALONE === 'true';

export function getM02ApiRoot() {
  if (viteStandalone) {
    const u = import.meta.env?.VITE_M02_API_URL;
    return u === '' || u === undefined ? '' : String(u).replace(/\/$/, '');
  }
  const fromEnv =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M02_API_URL;
  return (fromEnv || 'http://localhost:3002').replace(/\/$/, '');
}

/** Full prefix including /api/v1 */
export function m02ApiV1(path = '') {
  const root = getM02ApiRoot();
  const base = root ? `${root}/api/v1` : '/api/v1';
  if (!path) return base;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export const DEV_TENANT_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TENANT_ID) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TENANT_ID) ||
  '00000000-0000-0000-0000-000000000001';

export const DEV_USER_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_USER_ID) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_USER_ID) ||
  '00000000-0000-0000-0000-000000000002';

export const defaultHeaders = () => ({
  'Content-Type': 'application/json',
  'x-tenant-id': DEV_TENANT_ID,
  'x-user-id': DEV_USER_ID,
});

/** M01 Capture & Transcription Vite app (standalone). */
export function getM01WebUrl() {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_M01_WEB_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M01_WEB_URL;
  return (fromVite || fromNext || 'http://localhost:5174').replace(/\/$/, '');
}

/** M09 Coaching & Training Next app (standalone). */
export function getM09WebUrl() {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_M09_WEB_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M09_WEB_URL;
  return (fromVite || fromNext || 'http://localhost:5176').replace(/\/$/, '');
}

/** M03 AI Summaries & GenAI Vite app (standalone — AI Assist). */
export function getM03WebUrl() {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_M03_WEB_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M03_WEB_URL;
  return (fromVite || fromNext || 'http://localhost:5177').replace(/\/$/, '');
}
