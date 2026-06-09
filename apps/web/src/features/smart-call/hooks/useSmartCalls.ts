'use client';

import { useState, useEffect } from 'react';
import type { SmartCall } from '@smart-call/types/smart-call.types';
import { fetchSmartCalls } from '@smart-call/services/smart-call.service';

interface UseSmartCallsResult {
  calls: SmartCall[];
  loading: boolean;
  error: Error | null;
}

/**
 * Client-side hook for fetching Smart Calls.
 *
 * Use this inside 'use client' components that need to fetch on the browser side.
 * For server components, call fetchSmartCalls() directly from the service instead.
 */
export function useSmartCalls(): UseSmartCallsResult {
  const [calls, setCalls] = useState<SmartCall[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchSmartCalls()
      .then((data) => setCalls(data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err : new Error(String(err)))
      )
      .finally(() => setLoading(false));
  }, []);

  return { calls, loading, error };
}
