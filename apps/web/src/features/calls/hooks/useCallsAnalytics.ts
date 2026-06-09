import { useState, useEffect } from 'react';
import {
  fetchAnalyticsSummary,
  fetchScoreTrend,
  fetchFocusAreas,
  fetchReviewHistory,
} from '../services/calls-reviews.service';
import type {
  AnalyticsSummary,
  TrendPoint,
  FocusArea,
  ReviewHistoryItem,
} from '../types/calls.types';

export function useCallsAnalytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [history, setHistory] = useState<ReviewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [historySearch, setHistorySearch] = useState('');
  const [historyRep, setHistoryRep] = useState('All Reps');
  const [historyRange, setHistoryRange] = useState('Last 30 Days');

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      try {
        const [summaryData, trendDataRes, focusAreasRes] = await Promise.all([
          fetchAnalyticsSummary(),
          fetchScoreTrend(),
          fetchFocusAreas(),
        ]);
        setSummary(summaryData);
        setTrend(trendDataRes.trendData);
        setFocusAreas(focusAreasRes.focusAreas);
      } catch (err) {
        console.error('Failed to load calls analytics data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  useEffect(() => {
    async function loadHistory() {
      try {
        const repId = historyRep === 'All Reps' ? undefined : historyRep;
        const range = historyRange;
        const search = historySearch || undefined;
        const res = await fetchReviewHistory({ repId, dateRange: range, search });
        setHistory(res.reviews);
      } catch (err) {
        console.error('Failed to load review history:', err);
      }
    }
    loadHistory();
  }, [historySearch, historyRep, historyRange]);

  return {
    summary,
    trend,
    focusAreas,
    history,
    loading,
    historySearch,
    setHistorySearch,
    historyRep,
    setHistoryRep,
    historyRange,
    setHistoryRange,
  };
}
