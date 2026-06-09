'use client';

import type { ConfidenceLevel } from '../../../types';

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
}

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  return (
    <span
      className={[
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
        level === 'High' ? 'bg-[#DCFCE7] text-[#16A34A]' : '',
        level === 'Medium' ? 'bg-[#FEF3C7] text-[#D97706]' : '',
        level === 'Low' ? 'bg-[#FEE2E2] text-[#DC2626]' : '',
      ].filter(Boolean).join(' ')}
    >
      {level.toLowerCase()}
    </span>
  );
}
