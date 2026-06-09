'use client';

import { User, Clock } from 'lucide-react';
import { ManagerActiveTraining } from '@training/types/trainingCreate.types';

interface ManagerActiveTableProps {
  trainings: ManagerActiveTraining[];
}

function formatDate(isoDate: string): string {
  if (!isoDate) return '--';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ManagerActiveTable({ trainings }: ManagerActiveTableProps) {
  if (trainings.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center shadow-sm">
        <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Clock size={20} className="text-indigo-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">No Active Assignments</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto">
          You haven't assigned any new trainings yet. Click "Create New Training" to assign practice sessions to your team.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100">
              <th className="py-3 px-5 text-[11px] font-bold tracking-wider uppercase text-gray-500 w-[25%]">Rep</th>
              <th className="py-3 px-5 text-[11px] font-bold tracking-wider uppercase text-gray-500 w-[35%]">Training Title</th>
              <th className="py-3 px-5 text-[11px] font-bold tracking-wider uppercase text-gray-500 w-[20%]">Due Date</th>
              <th className="py-3 px-5 text-[11px] font-bold tracking-wider uppercase text-gray-500 w-[20%]">Status</th>
            </tr>
          </thead>
          <tbody>
            {trainings.map((training) => (
              <tr key={training.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-150">
                {/* Rep Name */}
                <td className="py-4 px-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                      <User size={14} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{training.repName}</p>
                      <p className="text-xs text-gray-400">{training.repId}</p>
                    </div>
                  </div>
                </td>

                {/* Training Title */}
                <td className="py-4 px-5">
                  <p className="text-sm font-medium text-gray-900">{training.trainingTitle}</p>
                </td>

                {/* Due Date */}
                <td className="py-4 px-5">
                  <span className="text-sm text-gray-500 flex items-center gap-1.5">
                    <CalendarIcon />
                    {formatDate(training.dueDateIso)}
                  </span>
                </td>

                {/* Status */}
                <td className="py-4 px-5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Pending
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalendarIcon() {
  return <Clock size={14} className="text-gray-400" />;
}
