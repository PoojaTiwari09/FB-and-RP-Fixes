import { TrainingStatus } from '@training/types/trainingDashboard.types';
import { Play, CheckCircle2 } from 'lucide-react';

interface TrainingStatusBadgeProps {
  status: TrainingStatus;
}

export default function TrainingStatusBadge({ status }: TrainingStatusBadgeProps) {
  if (status === 'completed') {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
        style={{
          backgroundColor: 'var(--status-completed-bg)',
          color: 'var(--status-completed-text)',
        }}
      >
        <CheckCircle2 size={13} />
        Completed
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: 'var(--status-in-progress-bg)',
        color: 'var(--status-in-progress-text)',
      }}
    >
      <Play size={13} fill="currentColor" />
      In-Progress
    </span>
  );
}
