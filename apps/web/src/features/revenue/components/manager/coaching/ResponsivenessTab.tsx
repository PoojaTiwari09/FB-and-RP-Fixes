'use client';

import type { ResponsivenessResponse } from '@revenue/types/coaching.types';

interface Props {
  data: ResponsivenessResponse | null;
  isLoading: boolean;
}

function RateBadge({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const color = value >= 80 ? 'text-green-700' : value >= 60 ? 'text-amber-700' : 'text-red-600';
  return <span className={`font-semibold ${color}`}>{value}{suffix}</span>;
}

export default function ResponsivenessTab({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[0,1,2,3,4].map(i => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  const reps = data ?? [];

  if (reps.length === 0) {
    return <p className="p-8 text-center text-sm text-gray-400">No responsiveness data for this period.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {['Rep', 'Avg Response Time', 'Follow-up Rate', 'Reply Rate'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {reps.map((rep) => (
            <tr key={rep.repId} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-800">{rep.repName}</td>
              <td className="px-4 py-3 text-gray-700">{rep.avgResponseTime}</td>
              <td className="px-4 py-3"><RateBadge value={rep.followUpRate} /></td>
              <td className="px-4 py-3"><RateBadge value={rep.replyRate} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
