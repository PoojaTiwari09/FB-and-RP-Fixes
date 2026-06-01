'use client';

import { useState, useCallback } from 'react';
import { ScoredPlaybookSection, TranscriptEntry, PerformanceBreakdownItem } from '@training/types/trainingResults.types';
import EvaluationSummary from './EvaluationSummary';
import FullTranscript from './FullTranscript';

type ResultsTab = 'evaluation' | 'transcript';

interface ResultsTabSwitcherProps {
  scoredSections: ScoredPlaybookSection[];
  performanceBreakdown: PerformanceBreakdownItem[];
  trainingTitle: string;
  transcript: TranscriptEntry[];
}

export default function ResultsTabSwitcher({
  scoredSections,
  performanceBreakdown,
  trainingTitle,
  transcript,
}: ResultsTabSwitcherProps) {
  const [activeTab, setActiveTab] = useState<ResultsTab>('evaluation');

  const handleTabChange = useCallback((tab: ResultsTab) => {
    setActiveTab(tab);
  }, []);

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => handleTabChange('evaluation')}
          className={`px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === 'evaluation'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Evaluation Summary
        </button>
        <button
          onClick={() => handleTabChange('transcript')}
          className={`px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === 'transcript'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Full Transcript
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'evaluation' ? (
        <EvaluationSummary sections={scoredSections} performanceBreakdown={performanceBreakdown} trainingTitle={trainingTitle} />
      ) : (
        <FullTranscript entries={transcript} />
      )}
    </div>
  );
}
