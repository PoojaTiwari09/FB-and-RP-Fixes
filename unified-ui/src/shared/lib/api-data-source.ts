import { ENV } from '@shared/config/env';

/** Mock data is only used when NEXT_PUBLIC_USE_MOCK_DATA=true in .env.local */
export function shouldUseMockData(): boolean {
  return ENV.USE_MOCK_DATA;
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
    if (ENV.IS_DEV) {
      console.warn(`[API] ${label} failed — using mock fallback in development:`, error);
      return mockValue();
    }
    console.error(
      `[API] ${label} failed — mock fallback disabled (set NEXT_PUBLIC_USE_MOCK_DATA=true to use mocks):`,
      error,
    );
    throw error;
  }
}
