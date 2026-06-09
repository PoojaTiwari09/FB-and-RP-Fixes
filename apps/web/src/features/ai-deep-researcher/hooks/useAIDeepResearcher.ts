import { useState, useCallback } from 'react';
import {
  getDashboard,
  getExecutiveSummary,
  getKeyFindings,
  getTrends,
  getRisksOpportunities,
  getRecommendations,
} from '../services/aiDeepResearcher';
import type {
  DashboardResponse,
  ExecutiveSummaryResponse,
  KeyFindingsResponse,
  TrendsResponse,
  RisksOpportunitiesResponse,
  RecommendationsResponse,
} from '../types';

export function useAIDeepResearcher(jobId: string | null) {
  // Caches for each tab/section
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [execSummary, setExecSummary] = useState<ExecutiveSummaryResponse | null>(null);
  const [keyFindings, setKeyFindings] = useState<KeyFindingsResponse | null>(null);
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [risks, setRisks] = useState<RisksOpportunitiesResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);

  // Loading states
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isLoadingExecSummary, setIsLoadingExecSummary] = useState(false);
  const [isLoadingKeyFindings, setIsLoadingKeyFindings] = useState(false);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [isLoadingRisks, setIsLoadingRisks] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Error states
  const [errorDashboard, setErrorDashboard] = useState<Error | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!jobId || dashboard) return; // Already cached
    setIsLoadingDashboard(true);
    setErrorDashboard(null);
    try {
      const data = await getDashboard(jobId);
      setDashboard(data);
    } catch (e: any) {
      setErrorDashboard(e);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [jobId, dashboard]);

  const fetchExecSummary = useCallback(async () => {
    if (!jobId || execSummary) return;
    setIsLoadingExecSummary(true);
    try {
      const data = await getExecutiveSummary(jobId);
      setExecSummary(data);
    } catch (e: any) {} finally {
      setIsLoadingExecSummary(false);
    }
  }, [jobId, execSummary]);

  const fetchKeyFindings = useCallback(async () => {
    if (!jobId || keyFindings) return;
    setIsLoadingKeyFindings(true);
    try {
      const data = await getKeyFindings(jobId);
      setKeyFindings(data);
    } catch (e: any) {} finally {
      setIsLoadingKeyFindings(false);
    }
  }, [jobId, keyFindings]);

  const fetchTrends = useCallback(async () => {
    if (!jobId || trends) return;
    setIsLoadingTrends(true);
    try {
      const data = await getTrends(jobId);
      setTrends(data);
    } catch (e: any) {} finally {
      setIsLoadingTrends(false);
    }
  }, [jobId, trends]);

  const fetchRisks = useCallback(async () => {
    if (!jobId || risks) return;
    setIsLoadingRisks(true);
    try {
      const data = await getRisksOpportunities(jobId);
      setRisks(data);
    } catch (e: any) {} finally {
      setIsLoadingRisks(false);
    }
  }, [jobId, risks]);

  const fetchRecommendations = useCallback(async () => {
    if (!jobId || recommendations) return;
    setIsLoadingRecommendations(true);
    try {
      const data = await getRecommendations(jobId);
      setRecommendations(data);
    } catch (e: any) {} finally {
      setIsLoadingRecommendations(false);
    }
  }, [jobId, recommendations]);

  const clearCache = useCallback(() => {
    setDashboard(null);
    setExecSummary(null);
    setKeyFindings(null);
    setTrends(null);
    setRisks(null);
    setRecommendations(null);
  }, []);

  return {
    dashboard, isLoadingDashboard, fetchDashboard, errorDashboard,
    execSummary, isLoadingExecSummary, fetchExecSummary,
    keyFindings, isLoadingKeyFindings, fetchKeyFindings,
    trends, isLoadingTrends, fetchTrends,
    risks, isLoadingRisks, fetchRisks,
    recommendations, isLoadingRecommendations, fetchRecommendations,
    clearCache,
  };
}
