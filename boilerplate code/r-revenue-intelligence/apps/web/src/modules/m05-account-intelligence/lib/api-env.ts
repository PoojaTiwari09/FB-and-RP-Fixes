/** M05 API base — Vite standalone (5179) or Next.js apps/web. */
const viteStandalone =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_M05_STANDALONE === 'true';

export function getM05ApiRoot(): string {
  if (viteStandalone) {
    const u = import.meta.env?.VITE_M05_API_URL;
    return u === '' || u === undefined ? '' : String(u).replace(/\/$/, '');
  }
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_M05_API_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M05_API_URL;
  const legacy =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL;
  return String(fromVite || fromNext || legacy || 'http://localhost:4012').replace(/\/$/, '');
}

export function m05ApiPrefix(): string {
  const root = getM05ApiRoot();
  return root ? `${root}/api/v1/account-intelligence` : '/api/v1/account-intelligence';
}

export function getM05AiUrl(): string {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_AI_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_AI_URL;
  return String(fromVite || fromNext || 'http://localhost:8000').replace(/\/$/, '');
}

/** M10 Data & Compliance Vite app (standalone). */
export function getM10WebUrl(): string {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_M10_WEB_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M10_WEB_URL;
  return String(fromVite || fromNext || 'http://localhost:5178').replace(/\/$/, '');
}

/** M10 Revenue Graph view (default M10 landing). */
export function getM10RevenueGraphUrl(): string {
  return getM10WebUrl();
}

/** M10 Data Cloud view. */
export function getM10DataCloudUrl(): string {
  const base = getM10WebUrl();
  return `${base}/?view=data-cloud`;
}

/** M07 Revenue Dashboards Vite/Next app (standalone). */
export function getM07WebUrl(): string {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_M07_WEB_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M07_WEB_URL;
  return String(fromVite || fromNext || 'http://localhost:5180').replace(/\/$/, '');
}

/** M07 dashboard builder landing. */
export function getM07DashboardsUrl(): string {
  return `${getM07WebUrl()}/dashboards`;
}
