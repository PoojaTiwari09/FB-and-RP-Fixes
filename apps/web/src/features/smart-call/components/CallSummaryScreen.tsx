'use client';

import { useState } from 'react';
import { Clock, CheckCircle2, ArrowLeft, FileText, RotateCcw, AlertTriangle, TrendingUp, XCircle } from 'lucide-react';
import type { CallSummary, KeyMoment } from '@smart-call/types/smart-call.types';
import TranscriptModal from '@smart-call/components/TranscriptModal';

interface Props {
  summary: CallSummary;
  onBack: () => void;
  onPracticeAgain: () => void;
}

// ─── Key Moment styling ────────────────────────────────────────────────────

const KEY_MOMENT_STYLES: Record<
  KeyMoment['type'],
  { bg: string; border: string; badge: string; icon: React.ReactNode }
> = {
  OBJECTION: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    icon: <AlertTriangle size={14} className="text-yellow-500 shrink-0" />,
  },
  INTEREST_SIGNAL: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    badge: 'bg-green-100 text-green-700',
    icon: <TrendingUp size={14} className="text-green-500 shrink-0" />,
  },
  MISSED_OPPORTUNITY: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    icon: <XCircle size={14} className="text-red-500 shrink-0" />,
  },
};

const MOMENT_LABELS: Record<KeyMoment['type'], string> = {
  OBJECTION: 'Objection',
  INTEREST_SIGNAL: 'Interest Signal',
  MISSED_OPPORTUNITY: 'Missed Opportunity',
};

const DEFAULT_MOMENT_STYLE = KEY_MOMENT_STYLES.INTEREST_SIGNAL;

function normalizeKeyMomentType(raw: string | undefined): KeyMoment['type'] {
  const upper = String(raw ?? '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (upper.includes('OBJECTION')) return 'OBJECTION';
  if (upper.includes('MISSED') || upper.includes('RISK')) return 'MISSED_OPPORTUNITY';
  if (
    upper.includes('INTEREST') ||
    upper.includes('SIGNAL') ||
    upper.includes('POSITIVE') ||
    upper.includes('WIN')
  ) {
    return 'INTEREST_SIGNAL';
  }
  return 'INTEREST_SIGNAL';
}

// ─── Score circle ──────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center w-24 h-24 relative">
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r={radius} strokeWidth="8" fill="none" stroke="#e5e7eb" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          strokeWidth="8"
          fill="none"
          stroke="#3b82f6"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-blue-600">{score}</span>
        <span className="text-[10px] text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

// ─── Score progress bar ────────────────────────────────────────────────────

function DimensionBar({ label, score, max }: { label: string; score: number; max: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">
          {score}/{max}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${(score / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function CallSummaryScreen({ summary, onBack, onPracticeAgain }: Props) {
  const [showTranscript, setShowTranscript] = useState(false);
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-gray-50">

      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Call Summary</h1>
        {/* Meta bar */}
        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock size={13} />
            Duration: <span className="font-semibold text-gray-700">{summary.duration}</span>
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-sm text-gray-500">
            Call Type:{' '}
            <span className="font-semibold text-gray-700">{summary.callType}</span>
          </span>
          <span className="text-gray-300">·</span>
          {summary.signalType === 'POSITIVE' && (
            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
              <CheckCircle2 size={13} />
              {summary.signalLabel}
            </span>
          )}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 px-6 py-6 max-w-3xl mx-auto w-full space-y-5">

        {/* Performance Snapshot */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Performance Snapshot</h2>
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <ScoreCircle score={summary.overallScore} />
              <p className="text-xs text-gray-400 mt-1">Overall Score</p>
            </div>
            <div className="flex-1 space-y-4">
              {summary.dimensionScores.map((d) => (
                <DimensionBar key={d.dimension} label={d.dimension} score={d.score} max={d.maxScore} />
              ))}
            </div>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">AI Summary</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{summary.aiSummary}</p>
        </div>

        {/* Key Moments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Key Moments</h2>
          <div className="space-y-3">
            {(summary.keyMoments ?? []).map((moment, i) => {
              const momentType = normalizeKeyMomentType(moment?.type);
              const style = KEY_MOMENT_STYLES[momentType] ?? DEFAULT_MOMENT_STYLE;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${style.bg} ${style.border}`}
                >
                  {style.icon}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500 font-mono">{moment.timestamp ?? '—'}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${style.badge}`}>
                        {MOMENT_LABELS[momentType]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{moment.description ?? ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Missed Opportunities */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-6">
          <h2 className="text-base font-semibold text-red-600 mb-1">
            {summary.missedOpportunities.title}
          </h2>
          <p className="text-xs text-gray-500 mb-3">{summary.missedOpportunities.subLabel}</p>
          <ul className="space-y-1.5">
            {summary.missedOpportunities.questions.map((q, i) => (
              <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-red-300 mt-0.5 shrink-0">•</span>
                {q}
              </li>
            ))}
          </ul>
        </div>

        {/* Suggested Improvements */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
          <h2 className="text-base font-semibold text-blue-700 mb-4">Suggested Improvements</h2>
          <div className="space-y-2">
            {summary.suggestedImprovements.map((imp, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white rounded-lg border border-blue-100 px-4 py-2.5"
              >
                <CheckCircle2 size={15} className="text-blue-500 shrink-0" />
                <p className="text-sm text-gray-700">{imp}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Conversation Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Conversation Timeline</h2>
          <div className="space-y-2">
            {summary.conversationTimeline.map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0"
              >
                <span className="shrink-0 px-2.5 py-1 rounded-lg bg-blue-500 text-white text-[11px] font-semibold whitespace-nowrap">
                  {entry.startTime}–{entry.endTime}
                </span>
                <p className="text-sm text-gray-600">{entry.topic}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-center gap-3 pb-4 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
          <button
            onClick={() => setShowTranscript(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <FileText size={14} />
            View Full Transcript
          </button>
          <button
            onClick={onPracticeAgain}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-colors"
          >
            <RotateCcw size={14} />
            Practice Again
          </button>
        </div>
      </div>

      {/* Transcript modal */}
      {showTranscript && (
        <TranscriptModal
          sessionId={summary.sessionId}
          onClose={() => setShowTranscript(false)}
        />
      )}
    </div>
  );
}
