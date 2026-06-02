import Link from 'next/link';
import type { RecentCall, KpiStatus } from '@revenue/types/coaching-rep.types';

interface RecentCallsTableProps {
  calls: RecentCall[];
}

const getBadgeClasses = (status: KpiStatus) => {
  switch (status) {
    case 'critical': return 'bg-red-50 text-red-700 border-red-200';
    case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'optimal': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export default function RecentCallsTable({ calls }: RecentCallsTableProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between border-b border-slate-200">
        <h2 className="text-base font-semibold text-slate-900">Recent Calls</h2>
        <Link href="/calls/list" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
          View all calls <span aria-hidden="true">→</span>
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-medium text-xs text-slate-400 uppercase tracking-wider w-1/3">Call</th>
              <th className="px-6 py-4 font-medium text-xs text-slate-400 uppercase tracking-wider">Talk Ratio</th>
              <th className="px-6 py-4 font-medium text-xs text-slate-400 uppercase tracking-wider">Questions</th>
              <th className="px-6 py-4 font-medium text-xs text-slate-400 uppercase tracking-wider">Duration</th>
              <th className="px-6 py-4 font-medium text-xs text-slate-400 uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {calls.map((call) => (
              <tr key={call.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900 mb-0.5">{call.title}</div>
                  <div className="text-xs text-slate-500">{call.dateRange}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getBadgeClasses(call.talkRatioStatus)}`}>
                    {call.talkRatio}%
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-700 font-medium">
                  {call.questionRate}
                </td>
                <td className="px-6 py-4 text-slate-700 font-medium">
                  {call.duration}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1">
                    Open <span aria-hidden="true">→</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
