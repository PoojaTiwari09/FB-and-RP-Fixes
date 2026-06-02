'use client';

// ============================================================
// useCoachingData — Custom hooks for Coaching Insights module
// Pattern: API-first → on error → mock fallback
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/coachingService';
import * as mock from '../services/mock/mockCoachingService';
import type {
  CoachingFilters,
  CoachingParams,
  ActivityResponse,
  InteractionResponse,
  ResponsivenessResponse,
  ScorecardsResponse,
  AiInsightsResponse,
  TeamVsBenchmarkResponse,
} from '../types/coaching.types';

interface HookState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isMockFallback: boolean;
}

function useApiWithFallback<T>(
  fetcher: () => Promise<T>,
  fallback: () => T,
  deps: unknown[],
) {
  const [state, setState] = useState<HookState<T>>({
    data: null,
    isLoading: true,
    error: null,
    isMockFallback: false,
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data = await fetcher();
      setState({
        data,
        isLoading: false,
        error: null,
        isMockFallback: false,
      });
    } catch (err: any) {
      console.warn('API call failed, falling back to mock data:', err);
      setState({
        data: fallback(),
        isLoading: false,
        error: null,
        isMockFallback: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, retry: load };
}

// ─── Page Filters ─────────────────────────────────────────────
export function useCoachingFilters() {
  return useApiWithFallback<CoachingFilters>(
    () => api.getCoachingFilters(),
    () => mock.mockCoachingFilters(),
    [],
  );
}

// ─── Tab 1 — Activity ─────────────────────────────────────────
export function useCoachingActivity(params: CoachingParams) {
  return useApiWithFallback<ActivityResponse>(
    () => api.getCoachingActivity(params),
    () => mock.mockCoachingActivity(),
    [JSON.stringify(params)],
  );
}

// ─── Tab 2 — Interaction ──────────────────────────────────────
export function useCoachingInteraction(params: CoachingParams) {
  return useApiWithFallback<InteractionResponse>(
    () => api.getCoachingInteraction(params),
    () => mock.mockCoachingInteraction(),
    [JSON.stringify(params)],
  );
}

// ─── Tab 3 — Responsiveness ───────────────────────────────────
export function useCoachingResponsiveness(params: CoachingParams) {
  return useApiWithFallback<ResponsivenessResponse>(
    () => api.getCoachingResponsiveness(params),
    () => mock.mockCoachingResponsiveness(),
    [JSON.stringify(params)],
  );
}

// ─── Tab 4 — Scorecards ───────────────────────────────────────
export function useCoachingScorecards(params: CoachingParams) {
  return useApiWithFallback<ScorecardsResponse>(
    () => api.getCoachingScorecards(params),
    () => mock.mockCoachingScorecards(),
    [JSON.stringify(params)],
  );
}

// ─── Right Panel — AI Insights ────────────────────────────────
export function useAiInsights(params: CoachingParams) {
  return useApiWithFallback<AiInsightsResponse>(
    () => api.getAiInsights(params),
    () => mock.mockAiInsights(),
    [JSON.stringify(params)],
  );
}

// ─── Right Panel — Team vs Benchmark ─────────────────────────
export function useTeamVsBenchmark(params: CoachingParams) {
  return useApiWithFallback<TeamVsBenchmarkResponse>(
    () => api.getTeamVsBenchmark(params),
    () => mock.mockTeamVsBenchmark(),
    [JSON.stringify(params)],
  );
}
