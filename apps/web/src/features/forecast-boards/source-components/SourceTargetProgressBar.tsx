'use client';

import { calculateTargetAttainment, formatCurrency } from '../source-utils/format';

interface SourceTargetProgressBarProps {
  quota: number | null;
  closed: number;
  commit?: number | null;
  isLocked?: boolean;
}

export default function SourceTargetProgressBar({ quota, closed, commit = 0, isLocked = false }: SourceTargetProgressBarProps) {
  const displayQuota = quota || 0;
  const attainmentPct = displayQuota > 0 ? (calculateTargetAttainment(closed, commit, displayQuota) ?? 0) : 0;
  const pct = Math.min(attainmentPct, 100);
  const isOverTarget = attainmentPct > 100;

  return (
    <div className="flex flex-col gap-1 min-w-[116px]">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold ${isOverTarget ? 'text-green-700' : 'text-gray-700'}`}>
          {pct}%
        </span>
        <span className="text-[10px] text-gray-500">{formatCurrency(displayQuota, true)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all duration-300 ${isLocked ? 'bg-gray-500' : 'bg-blue-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isOverTarget && (
        <span className="text-[9px] font-semibold text-green-700">Over target</span>
      )}
    </div>
  );
}
