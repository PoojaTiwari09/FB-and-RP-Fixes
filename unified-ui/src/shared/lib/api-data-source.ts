import { ENV } from '@shared/config/env';

/** Mock data is only used when NEXT_PUBLIC_USE_MOCK_DATA=true in .env.local */
export function shouldUseMockData(): boolean {
  return ENV.USE_MOCK_DATA;
}

function isBackendUnreachable(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  const msg = error instanceof Error ? error.message : String(error);
  return /failed to fetch|networkerror|econnrefused|fetch failed/i.test(msg);
}

export async function fetchApiOrMock<T>(
  label: string,
  apiCall: () => Promise<T>,
  mockValue: () => T,
): Promise<T> {
  if (ENV.USE_MOCK_DATA) {
    return mockValue();
  }
  try {
    return await apiCall();
  } catch (error) {
    if (isBackendUnreachable(error)) {
      console.warn(`[API] ${label} unreachable — using demo sample fallback`);
      return mockValue();
    }
    console.error(`[API] ${label} failed:`, error);
    throw error;
  }
}
