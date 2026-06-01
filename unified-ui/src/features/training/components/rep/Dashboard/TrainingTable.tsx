import { TrainingItem } from '@training/types/trainingDashboard.types';
import TrainingTableRow from './TrainingTableRow';

interface TrainingTableProps {
  trainings: TrainingItem[];
}

export default function TrainingTable({ trainings }: TrainingTableProps) {
  if (trainings.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="text-center">
          <p className="text-gray-400 text-sm font-medium">No trainings found</p>
          <p className="text-gray-300 text-xs mt-1">
            Try a different filter or check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 w-[40%]">
              Training Title
            </th>
            <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 w-[20%]">
              Due Date
            </th>
            <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 w-[20%]">
              Status
            </th>
            <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 w-[20%]">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {trainings.map((training) => (
            <TrainingTableRow key={training.id} training={training} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
