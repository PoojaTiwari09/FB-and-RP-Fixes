'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Tracker, TrackerDetail, Filters } from '../types/tracker.types';
import { fetchTrackers, fetchTrackerDetail, postTrackerQuestion } from '../services/trackers.service';

export default function useTrackers() {
  const [filters, setFilters] = useState<Filters>({
    teamId: 'all',
    dateRange: 'last-30-days',
    interactionType: 'calls-emails',
    search: '',
  });

  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTracker, setSelectedTracker] = useState<Tracker | null>(null);
  const [detail, setDetail] = useState<TrackerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiResponseLoading, setAiResponseLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchTrackers(filters)
      .then(setTrackers)
      .catch((e) => {
        setTrackers([]);
        setError(e instanceof Error ? e.message : 'Failed to load trackers');
      })
      .finally(() => setLoading(false));
  }, [filters]);

  const updateFilter = useCallback((key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const openPanel = useCallback((tracker: Tracker) => {
    setSelectedTracker(tracker);
    setDetail(null);
    setAiResponse(null);
    setDetailLoading(true);
    fetchTrackerDetail(tracker.id)
      .then(setDetail)
      .finally(() => setDetailLoading(false));
  }, []);

  const closePanel = useCallback(() => {
    setSelectedTracker(null);
    setDetail(null);
    setAiResponse(null);
  }, []);

  const postQuestion = useCallback(
    async (question: string) => {
      if (!selectedTracker) return;
      setAiResponseLoading(true);
      try {
        const response = await postTrackerQuestion(selectedTracker.id, question);
        setAiResponse(response);
      } catch {
        setAiResponse('Unable to analyze that question right now. Please try again.');
      } finally {
        setAiResponseLoading(false);
      }
    },
    [selectedTracker],
  );

  return {
    filters,
    updateFilter,
    trackers,
    loading,
    error,
    selectedTracker,
    detail,
    detailLoading,
    openPanel,
    closePanel,
    postQuestion,
    aiResponse,
    aiResponseLoading,
  };
}
