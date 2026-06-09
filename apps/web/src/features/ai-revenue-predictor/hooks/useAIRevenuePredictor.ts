"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RepDetail, RepForecast, TeamSummary, ActiveDeal } from '../types';
import {
  getRepDetail,
  getRepForecasts,
  getTeamSummary,
} from '../services/revenuePredictor';

type ViewMode = 'overview' | 'rep-detail';

const QUARTER_OPTIONS = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'] as const;

export function useAIRevenuePredictor() {
  const hasLoadedOnceRef = useRef(false);
  const [selectedQuarter, setSelectedQuarter] = useState<(typeof QUARTER_OPTIONS)[number]>('Q2 2026');
  const [selectedBaseline, setSelectedBaseline] = useState<string>('Current baseline');
  const [lobFilter, setLobFilter] = useState<string>('All');
  const selectedTeamId = 'team_west';
  const selectedTeamLabel = 'West Team';

  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  const [rawTeamSummary, setRawTeamSummary] = useState<TeamSummary | null>(null);
  const [rawRepForecasts, setRawRepForecasts] = useState<RepForecast[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);
  const [rawRepDetail, setRawRepDetail] = useState<RepDetail | null>(null);

  // Client-side filtering by LOB
  const teamSummary = useMemo(() => {
    if (!rawTeamSummary) return null;
    if (lobFilter === 'All') return rawTeamSummary;

    const filteredDeals = rawTeamSummary.activeDeals.filter((d) => d.lob === lobFilter);
    const closedWonDeals = rawTeamSummary.mathData.closedWon.deals.filter((d: any) => d.lob === lobFilter);
    const closedWonTotal = closedWonDeals.reduce((sum: number, d: any) => sum + d.amount, 0);
    const weightedTotal = filteredDeals.reduce((sum, d) => sum + d.contribution, 0);
    const expectedTotal = Math.round(rawTeamSummary.expectedDeals * (filteredDeals.length / Math.max(rawTeamSummary.activeDeals.length, 1)));
    const totalProj = closedWonTotal + weightedTotal + expectedTotal;

    return {
      ...rawTeamSummary,
      aiProjection: totalProj,
      closedWon: closedWonTotal,
      weightedPipeline: weightedTotal,
      expectedDeals: expectedTotal,
      activeDeals: filteredDeals,
      rangeMin: Math.round(totalProj * 0.9),
      rangeMax: Math.round(totalProj * 1.1),
    };
  }, [rawTeamSummary, lobFilter]);

  const repForecasts = useMemo(() => {
    if (lobFilter === 'All') return rawRepForecasts;
    // Since LOB filter is applied, we can adjust/simulate the rep projections based on LOB deals
    return rawRepForecasts.map((rep) => {
      const repDeals = rawTeamSummary?.activeDeals.filter(d => d.lob === lobFilter) ?? [];
      // Simulate LOB proportion for rep forecasts
      const repLobDeals = repDeals.filter(d => d.id.includes(rep.id));
      if (repLobDeals.length === 0) {
        return {
          ...rep,
          aiPrediction: Math.round(rep.aiPrediction * 0.3),
          finalForecast: Math.round((rep.managerOverride ?? rep.aiPrediction) * 0.3),
        };
      }
      return rep;
    });
  }, [rawRepForecasts, rawTeamSummary, lobFilter]);

  const repDetail = useMemo(() => {
    if (!rawRepDetail) return null;
    if (lobFilter === 'All') return rawRepDetail;

    const filteredDeals = rawRepDetail.activeDeals.filter((d) => d.lob === lobFilter);
    const closedWonDeals = rawRepDetail.mathData.closedWon.deals.filter((d: any) => d.lob === lobFilter);
    const closedWonTotal = closedWonDeals.reduce((sum: number, d: any) => sum + d.amount, 0);
    const weightedTotal = filteredDeals.reduce((sum, d) => sum + d.contribution, 0);
    const expectedTotal = Math.round(rawRepDetail.expectedDeals * (filteredDeals.length / Math.max(rawRepDetail.activeDeals.length, 1)));
    const totalProj = closedWonTotal + weightedTotal + expectedTotal;

    return {
      ...rawRepDetail,
      aiProjection: totalProj,
      closedWon: closedWonTotal,
      weightedPipeline: weightedTotal,
      expectedDeals: expectedTotal,
      activeDeals: filteredDeals,
      rangeMin: Math.round(totalProj * 0.9),
      rangeMax: Math.round(totalProj * 1.1),
    };
  }, [rawRepDetail, lobFilter]);

  const totalAIPrediction = useMemo(
    () => repForecasts.reduce((sum, r) => sum + r.aiPrediction, 0),
    [repForecasts],
  );
  const totalWithOverrides = useMemo(
    () => repForecasts.reduce((sum, r) => sum + (r.managerOverride ?? r.aiPrediction), 0),
    [repForecasts],
  );

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [summary, reps] = await Promise.all([
        getTeamSummary(selectedQuarter, selectedBaseline, selectedTeamId),
        getRepForecasts(selectedQuarter, selectedBaseline, selectedTeamId),
      ]);
      setRawTeamSummary(summary);
      setRawRepForecasts(reps);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [selectedQuarter, selectedBaseline, selectedTeamId]);

  useEffect(() => {
    const run = async () => {
      if (!hasLoadedOnceRef.current) {
        setIsLoading(true);
      }
      setLoadError(null);
      try {
        const [summary, reps] = await Promise.all([
          getTeamSummary(selectedQuarter, selectedBaseline, selectedTeamId),
          getRepForecasts(selectedQuarter, selectedBaseline, selectedTeamId),
        ]);
        setRawTeamSummary(summary);
        setRawRepForecasts(reps);
        hasLoadedOnceRef.current = true;
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };
    void run();
  }, [selectedQuarter, selectedBaseline, selectedTeamId]);

  const openRepDetail = useCallback(
    async (repId: string) => {
      setSelectedRepId(repId);
      setViewMode('rep-detail');
      setLoadError(null);
      try {
        const detail = await getRepDetail(repId, selectedQuarter, selectedTeamId);
        setRawRepDetail(detail);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load rep detail');
      }
    },
    [selectedQuarter, selectedTeamId],
  );

  const backToOverview = useCallback(() => {
    setViewMode('overview');
    setSelectedRepId(null);
    setRawRepDetail(null);
  }, []);

  const selectedRep = useMemo(() => rawRepForecasts.find((r) => r.id === selectedRepId) ?? null, [rawRepForecasts, selectedRepId]);

  return {
    quarterOptions: QUARTER_OPTIONS,
    selectedQuarter,
    setSelectedQuarter,
    selectedTeamLabel,
    viewMode,
    teamSummary,
    repForecasts,
    isLoading,
    loadError,
    refreshAll,
    totalAIPrediction,
    totalWithOverrides,

    selectedRep,
    repDetail,
    openRepDetail,
    backToOverview,

    selectedBaseline,
    setSelectedBaseline,
    lobFilter,
    setLobFilter,
  };
}
