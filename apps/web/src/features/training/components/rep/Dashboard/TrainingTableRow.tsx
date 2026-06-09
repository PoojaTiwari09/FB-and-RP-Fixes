import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { TrainingItem } from '@training/types/trainingDashboard.types';
import TrainingProgressBar from './TrainingProgressBar';
import TrainingStatusBadge from './TrainingStatusBadge';

interface TrainingTableRowProps {
  training: TrainingItem;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function TrainingTableRow({ training }: TrainingTableRowProps) {
  const actionHref =
    training.status === 'completed' && training.lastSessionId
      ? `/training/${training.id}/sessions/${training.lastSessionId}/results`
      : `/training/${training.id}`;

  const actionLabel = training.status === 'completed' ? 'Review' : 'Practice';

  return (
    <tr className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-150">
      {/* Training Title + Progress Bar */}
      <td className="py-4 px-5 w-[40%]">
        <div>
          <p className="text-sm font-semibold text-gray-900">{training.title}</p>
          <TrainingProgressBar
            percent={training.progressPercent}
            status={training.status}
          />
        </div>
      </td>

      {/* Due Date */}
      <td className="py-4 px-5 w-[20%]">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar size={14} className="text-gray-400" />
          {formatDate(training.dueDateIso)}
        </div>
      </td>

      {/* Status */}
      <td className="py-4 px-5 w-[20%]">
        <TrainingStatusBadge status={training.status} />
      </td>

      {/* Action */}
      <td className="py-4 px-5 w-[20%]">
        <Link
          href={actionHref}
          className={`inline-flex items-center justify-center px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            training.status === 'completed'
              ? 'text-gray-600 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md'
          }`}
        >
          {actionLabel}
        </Link>
      </td>
    </tr>
  );
}
