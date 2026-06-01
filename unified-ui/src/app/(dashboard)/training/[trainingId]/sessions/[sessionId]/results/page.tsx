'use client';

import { use, useEffect, useState } from 'react';
import { fetchTrainingResults } from '@training/services/trainingResults.service';
import ResultsHeader from '@training/components/rep/Results/ResultsHeader';
import OverallScoreCard from '@training/components/rep/Results/OverallScoreCard';
import ResultsTabSwitcher from '@training/components/rep/Results/ResultsTabSwitcher';
import type { TrainingResultsPage } from '@training/types/trainingResults.types';
import type { TranscriptMessage, SessionContext } from '@training/types/trainingSession.types';

interface TrainingResultsPageProps {
  params: Promise<{ trainingId: string; sessionId: string }>;
}

export default function TrainingResultsPage({ params }: TrainingResultsPageProps) {
  const { trainingId, sessionId } = use(params);
  const [data, setData] = useState<TrainingResultsPage | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(true);

  useEffect(() => {
    async function evaluate() {
      // 1. Check if we already evaluated this session and cached the result in localStorage
      try {
        const cachedResults = localStorage.getItem(`session-${sessionId}-results`);
        if (cachedResults) {
          setData(JSON.parse(cachedResults) as TrainingResultsPage);
          setIsEvaluating(false);
          return;
        }
      } catch {
        // ignore
      }

      // 2. Read transcript + context saved by handleEndSession (still in sessionStorage)
      let transcript: TranscriptMessage[] | undefined;
      let ctx: SessionContext | undefined;

      try {
        const stored = sessionStorage.getItem(`session-${sessionId}-data`);
        if (stored) {
          const parsed = JSON.parse(stored) as {
            transcript: TranscriptMessage[];
            context: SessionContext;
          };
          transcript = parsed.transcript;
          ctx = parsed.context;
        }
      } catch {
        // sessionStorage unavailable or parse failed — use mock
      }

      const rubric = ctx?.playbookSections;

      // fetchTrainingResults will try backend → Groq → mock (in that order)
      const results = await fetchTrainingResults(
        trainingId,
        sessionId,
        transcript,
        rubric,
        ctx
      );

      // Cache the result in localStorage so it persists permanently for future reviews
      try {
        localStorage.setItem(`session-${sessionId}-results`, JSON.stringify(results));
      } catch {
        // ignore quota errors
      }

      setData(results);
      setIsEvaluating(false);
    }

    evaluate();
  }, [trainingId, sessionId]);

  if (isEvaluating || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="flex gap-2 items-center">
          <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span className="text-sm font-medium text-gray-600">AI is evaluating your session…</span>
        </div>
        <p className="text-xs text-gray-400">This usually takes 5–10 seconds</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-8 py-8">
        <ResultsHeader trainingTitle={data.trainingTitle} />
        <OverallScoreCard data={data} />
        <ResultsTabSwitcher
          scoredSections={data.scoredSections}
          performanceBreakdown={data.performanceBreakdown}
          trainingTitle={data.trainingTitle}
          transcript={data.transcript}
        />
      </div>
    </div>
  );
}
