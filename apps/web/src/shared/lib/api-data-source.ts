import { ENV } from '@shared/config/env';

/** Mock data is disabled */
export function shouldUseMockData(): boolean {
  return false;
}

export async function fetchApiOrMock<T>(
  label: string,
  apiCall: () => Promise<T>,
  mockValue: () => T,
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`[API] ${label} failed:`, error);
    throw error;
  }
}
