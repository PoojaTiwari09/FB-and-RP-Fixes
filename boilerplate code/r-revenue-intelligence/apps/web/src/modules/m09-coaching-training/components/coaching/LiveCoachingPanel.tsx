'use client';

import { AlertTriangle, CheckCircle2, Lightbulb, Radar, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LiveCoachingEvaluation } from '@/types/session.types';

interface LiveCoachingPanelProps {
  evaluation?: LiveCoachingEvaluation | null;
  onUseSuggestion?: (suggestion: string) => void;
}

const scoreRows = [
  ['Discovery', 'discovery_score'],
  ['Objections', 'objection_score'],
  ['Confidence', 'confidence_score'],
  ['Continuity', 'continuity_score'],
  ['Communication', 'communication_score'],
  ['Relevance', 'relevance_score'],
] as const;

function scoreColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

export function LiveCoachingPanel({ evaluation, onUseSuggestion }: LiveCoachingPanelProps) {
  const liveScore = evaluation?.live_score ?? 0;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-indigo-600" />
            <h2 className="font-bold text-gray-900">Live Coaching</h2>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${liveScore >= 80 ? 'bg-emerald-100 text-emerald-700' : liveScore >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
            {liveScore}
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {scoreRows.map(([label, key]) => {
            const value = evaluation?.[key] ?? 0;
            return (
              <div key={key}>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold text-gray-600">
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
                <Progress value={value} indicatorColor={scoreColor(value)} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sky-600" />
          <h2 className="font-bold text-gray-900">Talk Ratio</h2>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
          <div className={`h-full ${evaluation?.talk_ratio_warning ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: evaluation?.talk_ratio_warning ? '72%' : '48%' }} />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {evaluation?.talk_ratio_warning ? 'Rep is carrying too much of the conversation.' : 'Rep and buyer balance looks healthy.'}
        </p>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900">Customer Satisfaction</h2>
          </div>
          <span className="text-sm font-bold text-gray-700">{evaluation?.satisfaction_score ?? 50}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div className={`h-full transition-all duration-500 ${(evaluation?.satisfaction_score ?? 50) >= 75 ? 'bg-emerald-500' : (evaluation?.satisfaction_score ?? 50) >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${evaluation?.satisfaction_score ?? 50}%` }} />
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <h2 className="font-bold text-gray-900">Alerts</h2>
        </div>
        <div className="mt-3 space-y-2">
          {(evaluation?.detected_issues?.length ? evaluation.detected_issues : ['Feedback updates after the next rep message.']).map((issue) => (
            <p key={issue} className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{issue}</p>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <h2 className="font-bold text-gray-900">Coach Notes</h2>
        </div>
        <div className="mt-3 space-y-2">
          {(evaluation?.coaching_feedback?.length ? evaluation.coaching_feedback : ['Send a message to receive turn-by-turn coaching.']).map((feedback) => (
            <p key={feedback} className="text-sm text-gray-600">{feedback}</p>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-indigo-600" />
          <h2 className="font-bold text-gray-900">Suggested Responses</h2>
        </div>
        <div className="mt-3 space-y-2">
          {(evaluation?.suggested_response?.length ? evaluation.suggested_response : ['Suggested responses appear here before your next turn.']).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onUseSuggestion?.(suggestion)}
              className="w-full rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-left text-sm text-gray-700 hover:border-indigo-200 hover:bg-indigo-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
