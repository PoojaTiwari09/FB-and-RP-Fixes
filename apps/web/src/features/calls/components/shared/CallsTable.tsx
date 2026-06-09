'use client';
import { useRouter } from 'next/navigation';
import { Search, Clock, ChevronDown, Phone, FileText } from 'lucide-react';
import CallsBadge from '@calls/components/ui/CallsBadge';
import CallsSkeletonRow from '@calls/components/ui/CallsSkeletonRow';
import CallsToast from '@calls/components/ui/CallsToast';
import { useCallsTable } from '@calls/hooks/useCallsTable';
import type { CallReview, Call } from '@calls/types/calls.types';
import { format } from '@calls/services/format';

interface CallsTableProps {
  mode: 'reviews' | 'all';
  title: string;
  subtitle: string;
  fetchData: (params: Record<string, string>) => Promise<{
    totalCount: number;
    data: (CallReview | Call)[];
  }>;
}

const STATUS_OPTIONS = ['All Status', 'Pending', 'In Progress', 'Completed', 'Overdue', 'Reopened'];
const PRIORITY_OPTIONS = ['All Priority', 'High', 'Medium', 'Low'];
const CALL_TYPE_OPTIONS_REVIEWS = [
  'All Call Types', 'Discovery', 'Demo', 'Negotiation', 'Closing', 'Follow-Up',
];
const CALL_TYPE_OPTIONS_ALL = [
  'All Call Types', 'Discovery', 'Demo', 'Negotiation', 'Closing', 'Follow-Up', 'Check-In',
];
const SORT_OPTIONS = ['Newest First', 'Oldest First', 'Highest Priority', 'Overdue First'];

export default function CallsTable({ mode, title, subtitle, fetchData }: CallsTableProps) {
  const router = useRouter();
  const {
    rows, totalCount, loading, error, setError,
    search, setSearch,
    status, setStatus,
    priority, setPriority,
    callType, setCallType,
    sort, setSort,
    resetFilters,
  } = useCallsTable({ fetchData });

  const callTypeOptions =
    mode === 'all' ? CALL_TYPE_OPTIONS_ALL : CALL_TYPE_OPTIONS_REVIEWS;

  const isOverdue = (row: CallReview | Call) => row.status === 'Overdue';

  const handleRowClick = (row: CallReview | Call) => {
    if (mode === 'reviews') {
      router.push(`/calls/reviews/${row.reviewId}`);
    } else {
      // All calls are clickable — navigate to review detail for all
      router.push(`/calls/reviews/${row.reviewId}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <CallsToast message={error} onClose={() => setError('')} />}

      {/* Page title */}
      <div className="mb-1">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by rep, call title, or account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: status, setter: setStatus, options: STATUS_OPTIONS },
            { value: priority, setter: setPriority, options: PRIORITY_OPTIONS },
            { value: callType, setter: setCallType, options: callTypeOptions },
            { value: sort, setter: setSort, options: SORT_OPTIONS },
          ].map(({ value, setter, options }) => (
            <div key={options[0]} className="relative">
              <select
                value={value}
                onChange={(e) => setter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[130px]"
              >
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Showing X of X calls */}
      {!loading && (
        <p className="text-xs text-gray-500">
          Showing {rows.length} of {totalCount} calls
        </p>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Call Title', 'Account', 'Call Date', 'Type', 'Duration', 'Priority', 'Status', 'AI Flags', 'Due Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <CallsSkeletonRow key={i} cols={9} />)
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <p className="text-gray-500 font-medium">No calls found</p>
                    <button onClick={resetFilters} className="mt-2 text-[#2563eb] text-sm hover:underline">
                      Reset filters
                    </button>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const overdue = isOverdue(row);
                  const clickable = true; // all rows are navigable

                  return (
                    <tr
                      key={row.reviewId}
                      onClick={() => handleRowClick(row)}
                      className={`transition-colors ${clickable ? 'cursor-pointer hover:bg-blue-50' : 'cursor-default hover:bg-gray-50'}`}
                    >
                      {/* Call Title */}
                      <td className="px-4 py-3 min-w-[220px]">
                        <span className={clickable ? 'text-gray-900 font-medium hover:underline' : 'text-gray-800 font-medium'}>
                          {row.callTitle}
                        </span>
                        {row.scorecardName && (
                          <p className="text-xs text-gray-400 mt-0.5">{row.scorecardName}</p>
                        )}
                      </td>

                      {/* Account */}
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.account}</td>

                      {/* Call Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                        <div className="text-sm">{format.date(row.callDate)}</div>
                        <div className="text-xs text-gray-400">{format.time(row.callDate)}</div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <CallsBadge label={row.callType} variant="auto" />
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{row.duration}</td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        <CallsBadge label={row.priority} variant="auto" />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <CallsBadge label={row.status} variant="auto" />
                      </td>

                      {/* AI Flags */}
                      <td className="px-4 py-3 min-w-[180px]">
                        <div className="flex flex-wrap gap-1">
                          {row.aiFlags.map((flag) => (
                            <CallsBadge key={flag} label={flag} variant="flag" />
                          ))}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className={`flex items-center gap-1 text-sm ${overdue ? 'text-red-500 font-medium' : 'text-gray-900'}`}>
                          <Clock size={13} className={overdue ? 'text-red-500' : 'text-gray-400'} />
                          {format.date(row.dueDate)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
