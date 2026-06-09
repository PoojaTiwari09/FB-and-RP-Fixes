'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CoachingRepFullData } from '../types/coaching-rep.types';
import { getCoachingRepDetails } from '../services/coachingService';
import { getMockRepDetails } from '../services/mock/mockCoachingRepService';

export function useCoachingRepData(repId: string) {
  const [data, setData] = useState<CoachingRepFullData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getCoachingRepDetails(repId);
      setData(res);
    } catch (err: any) {
      console.warn('API call failed for coaching rep details, falling back to mock data:', err);
      setData(getMockRepDetails(repId));
    } finally {
      setIsLoading(false);
    }
  }, [repId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, retry: load };
}
