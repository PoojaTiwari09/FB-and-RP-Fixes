import { PerformanceTag } from '@training/types/trainingResults.types';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface PerformanceTagPillProps {
  tag: PerformanceTag;
}

export default function PerformanceTagPill({ tag }: PerformanceTagPillProps) {
  const isPositive = tag.type === 'positive';

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: isPositive
          ? 'var(--status-completed-bg)'
          : 'var(--status-in-progress-bg)',
        color: isPositive
          ? 'var(--status-completed-text)'
          : 'var(--status-in-progress-text)',
      }}
    >
      {isPositive ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
      {tag.label}
    </span>
  );
}
