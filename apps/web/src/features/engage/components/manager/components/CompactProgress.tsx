"use client";

import { Target } from 'lucide-react';

interface CompactProgressProps {
  completedCount: number;
  totalCount: number;
  remainingHighPriority: number;
}

export default function CompactProgress({
  completedCount,
  totalCount,
  remainingHighPriority,
}: CompactProgressProps) {
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div
      className="rounded-lg p-4 mb-6"
      style={{
        border: '1px solid #E5E7EB',
        backgroundColor: '#FAFAFA',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" style={{ color: '#6B7280' }} />
          <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>
            Today's Progress
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: '#111827' }}>
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full mb-3 overflow-hidden animate-pulse-subtle" style={{ backgroundColor: '#E5E7EB' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${completionRate}%`,
            backgroundColor: '#111827',
          }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span style={{ color: '#6B7280' }}>
          {remainingHighPriority > 0 ? (
            <>
              {remainingHighPriority} high-priority {remainingHighPriority === 1 ? 'task' : 'tasks'}{' '}
              remaining
            </>
          ) : (
            'All high-priority tasks complete!'
          )}
        </span>
        <span
          className="text-xs font-medium"
          style={{
            color: '#6B7280',
          }}
        >
          {completionRate}% complete
        </span>
      </div>
    </div>
  );
}
