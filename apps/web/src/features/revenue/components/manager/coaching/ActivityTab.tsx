'use client';

import type { ActivityResponse } from '@revenue/types/coaching.types';

interface Props {
  data: ActivityResponse | null;
  isLoading: boolean;
}

function AvatarBubble({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

export default function ActivityTab({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[0,1,2,3,4].map(i => <div key={i} className="skeleton h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  const reps = data ?? [];

  if (reps.length === 0) {
    return <p className="p-8 text-center text-sm text-gray-400">No activity data for this period.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {['Rep', 'Calls', 'Emails', 'Meetings', 'Total'].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {reps.map((rep) => (
            <tr key={rep.repId} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <AvatarBubble initials={rep.initials} color={rep.avatarColor} />
                  <span className="font-medium text-gray-800">{rep.repName}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-700">{rep.callsCount}</td>
              <td className="px-4 py-3 text-gray-700">{rep.emailsCount}</td>
              <td className="px-4 py-3 text-gray-700">{rep.meetingsCount}</td>
              <td className="px-4 py-3">
                <span className="font-semibold text-gray-900">{rep.totalActivities}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
