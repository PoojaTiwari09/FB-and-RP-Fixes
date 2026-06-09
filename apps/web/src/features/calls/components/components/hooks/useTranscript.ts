import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  TranscriptEntry,
  TranscriptSummary,
  TalkRatio,
  Topic,
  NextStep,
} from '../types/calls.types';
import {
  fetchTranscript,
  fetchTranscriptSummary,
  fetchTalkRatio,
  fetchTopics,
  fetchNextSteps,
  updateNextStep,
} from '../services/calls.service';

interface UseTranscriptReturn {
  transcript: TranscriptEntry[];
  totalCount: number;
  summary: TranscriptSummary | null;
  talkRatio: TalkRatio | null;
  topics: Topic[];
  nextSteps: NextStep[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showLowConfidenceOnly: boolean;
  setShowLowConfidenceOnly: (v: boolean) => void;
  toggleStepCompleted: (stepId: string) => void;
}

export function useTranscript(callId: string | null): UseTranscriptReturn {
  const [rawTranscript, setRawTranscript] = useState<TranscriptEntry[]>([]);
  const [summary, setSummary] = useState<TranscriptSummary | null>(null);
  const [talkRatio, setTalkRatio] = useState<TalkRatio | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [nextSteps, setNextSteps] = useState<NextStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowConfidenceOnly, setShowLowConfidenceOnly] = useState(false);

  const loadTranscript = useCallback(async () => {
    if (!callId) return;
    try {
      const data = await fetchTranscript(callId, {});
      setRawTranscript(data.transcript);
    } catch {
      /* handled at service level */
    }
  }, [callId]);

  const loadSidePanel = useCallback(async () => {
    if (!callId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [summaryData, ratioData, topicsData, stepsData] = await Promise.all([
        fetchTranscriptSummary(callId),
        fetchTalkRatio(callId),
        fetchTopics(callId),
        fetchNextSteps(callId),
      ]);
      setSummary(summaryData);
      setTalkRatio(ratioData);
      setTopics(topicsData.topics);
      setNextSteps(stepsData.nextSteps);
    } catch {
      setError('Failed to load transcript data.');
    } finally {
      setIsLoading(false);
    }
  }, [callId]);

  useEffect(() => {
    loadSidePanel();
  }, [loadSidePanel]);

  useEffect(() => {
    loadTranscript();
  }, [loadTranscript]);

  const filteredTranscript = useMemo(() => {
    return rawTranscript.filter((entry) => {
      // 1. Low Confidence filter
      if (showLowConfidenceOnly && entry.confidence !== 'low') {
        return false;
      }
      // 2. Search query matching
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesText = entry.text.toLowerCase().includes(query);
        const matchesSpeaker = entry.speakerName.toLowerCase().includes(query);
        if (!matchesText && !matchesSpeaker) {
          return false;
        }
      }
      return true;
    });
  }, [rawTranscript, searchQuery, showLowConfidenceOnly]);

  const toggleStepCompleted = useCallback(
    async (stepId: string) => {
      if (!callId) return;
      const step = nextSteps.find((s) => s.stepId === stepId);
      if (!step) return;
      const newCompleted = !step.completed;
      setNextSteps((prev) =>
        prev.map((s) => (s.stepId === stepId ? { ...s, completed: newCompleted } : s)),
      );
      try {
        await updateNextStep(callId, stepId, newCompleted);
      } catch {
        // revert on failure
        setNextSteps((prev) =>
          prev.map((s) => (s.stepId === stepId ? { ...s, completed: !newCompleted } : s)),
        );
      }
    },
    [callId, nextSteps],
  );

  return {
    transcript: filteredTranscript,
    totalCount: filteredTranscript.length,
    summary,
    talkRatio,
    topics,
    nextSteps,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    showLowConfidenceOnly,
    setShowLowConfidenceOnly,
    toggleStepCompleted,
  };
}
