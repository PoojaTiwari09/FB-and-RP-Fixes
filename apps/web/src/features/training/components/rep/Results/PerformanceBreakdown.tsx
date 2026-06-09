'use client';

import { useState } from 'react';
import { PerformanceBreakdownItem } from '@training/types/trainingResults.types';
import { ChevronDown, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';

interface PerformanceBreakdownProps {
  items: PerformanceBreakdownItem[];
}

function BreakdownCard({ item }: { item: PerformanceBreakdownItem }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isGood = item.percentage >= 80;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-800">{item.category}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-[200px] h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: isGood ? 'var(--status-completed-text)' : 'var(--status-in-progress-text)',
                }}
              />
            </div>
            <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
              {item.score}/{item.maxScore} ({item.percentage}%)
            </span>
          </div>
        </div>
        <div className="shrink-0 ml-3 text-gray-400">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 leading-relaxed mt-3 mb-3">
            {item.description}
          </p>

          {item.strengths.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1.5">
                Strengths
              </h5>
              <ul className="space-y-1">
                {item.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.areasForImprovement.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1.5">
                Areas for Improvement
              </h5>
              <ul className="space-y-1">
                {item.areasForImprovement.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PerformanceBreakdown({ items }: PerformanceBreakdownProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-base font-semibold text-gray-900 mb-1">
        Detailed Performance Breakdown
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        AI-evaluated scoring across key selling dimensions
      </p>
      <div className="space-y-3">
        {items.map((item) => (
          <BreakdownCard key={item.category} item={item} />
        ))}
      </div>
    </div>
  );
}
