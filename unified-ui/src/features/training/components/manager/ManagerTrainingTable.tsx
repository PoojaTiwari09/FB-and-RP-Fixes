import { ManagedRepTraining } from '@training/types/trainingManager.types';
import ManagerTrainingTableRow from './ManagerTrainingTableRow';

interface ManagerTrainingTableProps {
  trainings: ManagedRepTraining[];
}

export default function ManagerTrainingTable({ trainings }: ManagerTrainingTableProps) {
  if (trainings.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="text-center">
          <p className="text-gray-400 text-sm font-medium">No completed trainings to review</p>
          <p className="text-gray-300 text-xs mt-1">
            Check back when your reps complete their practice sessions.
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
            <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 w-[22%]">
              Rep Name
            </th>
            <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 w-[28%]">
              Training Title
            </th>
            <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 w-[16%]">
              Completed
            </th>
            <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 w-[10%]">
              Score
            </th>
            <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 w-[24%]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {trainings.map((training) => (
            <ManagerTrainingTableRow key={training.id} training={training} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
