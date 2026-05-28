/** M05 Account Intelligence (standalone). */
export function getM05BoardUrl(): string {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_M05_WEB_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M05_WEB_URL;
  const base = String(fromVite || fromNext || 'http://localhost:5179').replace(/\/$/, '');
  return `${base}/board/demo`;
}

/** M07 Revenue Dashboards app root. */
export function getM07WebUrl(): string {
  const fromVite =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_M07_WEB_URL;
  const fromNext =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_M07_WEB_URL;
  return String(fromVite || fromNext || 'http://localhost:5180').replace(/\/$/, '');
}

export function getM07DashboardsUrl(): string {
  return `${getM07WebUrl()}/dashboards`;
}
