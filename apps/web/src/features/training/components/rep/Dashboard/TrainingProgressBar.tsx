import { TrainingStatus } from '@training/types/trainingDashboard.types';

interface TrainingProgressBarProps {
  percent: number;
  status: TrainingStatus;
}

export default function TrainingProgressBar({ percent, status }: TrainingProgressBarProps) {
  const barColor =
    status === 'completed'
      ? 'var(--progress-completed)'
      : 'var(--progress-in-progress)';

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            backgroundColor: barColor,
          }}
        />
      </div>
      <span className="text-xs text-gray-400 font-medium tabular-nums w-8 text-right">
        {percent}%
      </span>
    </div>
  );
}
