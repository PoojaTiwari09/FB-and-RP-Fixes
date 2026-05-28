export const M10_DEMO_TENANT =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TENANT_ID) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TENANT_ID) ||
  '00000000-0000-0000-0000-000000000001';

export const M10_DEMO_USER =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_USER_ID) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_USER_ID) ||
  '00000000-0000-0000-0000-000000000002';

export function getM10ApiBase(): string {
  const viteStandalone =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_M10_STANDALONE === 'true';
  if (viteStandalone) {
    const u = (import.meta as any).env?.VITE_M10_API_URL;
    if (u === '' || u === undefined) return '';
    return String(u).replace(/\/$/, '');
  }
  const fromVite =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_M10_API_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_M10_API_URL;
  const legacy =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL;
  return String(fromVite || fromNext || legacy || 'http://localhost:4011').replace(/\/$/, '');
}

export function m10ApiPrefix(): string {
  return `${getM10ApiBase()}/api/v1/m10-data-compliance`;
}

/** M05 Account Intelligence Vite app (standalone). */
export function getM05WebUrl(): string {
  const fromVite =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_M05_WEB_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M05_WEB_URL;
  return String(fromVite || fromNext || 'http://localhost:5179').replace(/\/$/, '');
}

/** M07 Revenue Dashboards (standalone). */
export function getM07WebUrl(): string {
  const fromVite =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_M07_WEB_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M07_WEB_URL;
  return String(fromVite || fromNext || 'http://localhost:5180').replace(/\/$/, '');
}

export function getM07DashboardsUrl(): string {
  return `${getM07WebUrl()}/dashboards`;
}

export function m10DefaultHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-tenant-id': M10_DEMO_TENANT,
    'x-user-id': M10_DEMO_USER,
  };
}
