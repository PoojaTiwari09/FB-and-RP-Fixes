'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronDown,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  ThumbsUp,
  AlertTriangle,
  Flame,
  BookOpen,
} from 'lucide-react';
import { fetchCalls, type CallsListResult } from '@calls/services/callsApi';
import type { AiCallReviewerCall } from '@calls/types/ai-call-reviewer.types';
import AssemblyAIKeySettings from '@calls/components/rep/AssemblyAIKeySettings';

function getCallIcon(call: AiCallReviewerCall) {
  if (call.type === 'Cold Call' || call.tags.includes('Outbound')) {
    return <BookOpen size={18} className="text-purple-500 shrink-0" aria-hidden />;
  }
  if (call.status === 'Feedback Pending' || (call.score >= 60 && call.score < 75)) {
    return <AlertTriangle size={18} className="text-amber-500 shrink-0" aria-hidden />;
  }
  if (call.score < 65 || call.tags.includes('Urgent') || call.status === 'Not Reviewed') {
    return <Flame size={18} className="text-red-500 shrink-0" aria-hidden />;
  }
  if (call.score >= 80 || call.status === 'Reviewed' || call.status === 'Acknowledged') {
    return <ThumbsUp size={18} className="text-green-500 shrink-0" aria-hidden />;
  }
  return <BookOpen size={18} className="text-purple-500 shrink-0" aria-hidden />;
}

const CALL_TYPES = ['All Types', 'Discovery', 'Demo', 'Negotiation', 'Follow-up', 'Cold Call'];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest_first' },
  { label: 'Oldest First', value: 'oldest_first' },
  { label: 'Recently Reviewed', value: 'recently_reviewed' },
  { label: 'High Priority', value: 'high_priority' },
];

const TAG_COLORS: Record<string, string> = {
  Enterprise: 'bg-blue-100 text-blue-700',
  'High Value': 'bg-purple-100 text-purple-700',
  Technical: 'bg-indigo-100 text-indigo-700',
  Urgent: 'bg-red-100 text-red-700',
  Outbound: 'bg-orange-100 text-orange-700',
  Onboarding: 'bg-teal-100 text-teal-700',
  Demo: 'bg-cyan-100 text-cyan-700',
};

function getTagColor(tag: string) {
  return TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600';
}

function getScoreStyle(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-800 ring-1 ring-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200';
  return 'bg-red-100 text-red-800 ring-1 ring-red-200';
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'Reviewed':
      return 'bg-blue-100 text-blue-700';
    case 'Feedback Pending':
      return 'bg-yellow-100 text-yellow-700';
    case 'Not Reviewed':
      return 'bg-gray-100 text-gray-600';
    case 'Acknowledged':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function sortCalls(calls: AiCallReviewerCall[], sort: string): AiCallReviewerCall[] {
  const list = [...calls];
  if (sort === 'oldest_first') {
    return list.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }
  if (sort === 'recently_reviewed') {
    const ORDER: Record<string, number> = {
      Reviewed: 0,
      Acknowledged: 1,
      'Feedback Pending': 2,
      'Not Reviewed': 3,
    };
    return list.sort((a, b) => {
      const diff = (ORDER[a.status] ?? 4) - (ORDER[b.status] ?? 4);
      return diff !== 0 ? diff : new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
    });
  }
  if (sort === 'high_priority') {
    return list.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
    });
  }
  return list.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div
            className="h-4 bg-gray-100 rounded animate-pulse"
            style={{ width: i === 0 ? '75%' : '60%' }}
          />
        </td>
      ))}
    </tr>
  );
}

function Dropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[130px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
    </div>
  );
}

export default function AICallReviewerCallsList() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [sort, setSort] = useState('newest_first');
  const [result, setResult] = useState<CallsListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadCalls = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCalls({
        search: debouncedSearch || undefined,
        type: typeFilter === 'All Types' ? undefined : typeFilter,
        sort,
        size: 50,
      });
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calls');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, sort]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  const sortedCalls = useMemo(
    () => sortCalls(result?.calls ?? [], sort),
    [result?.calls, sort],
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[#faf9fc]">
      <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 bg-white">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-gray-900 tracking-tight">
            AI Call Reviewer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review your sales calls, AI scores, and coaching feedback.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AssemblyAIKeySettings compact />
          <Link
            href="/calls/coaching-insights"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <TrendingUp size={15} />
            View Performance
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex-1 relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by call name, account, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Dropdown
          value={typeFilter}
          options={CALL_TYPES.map((t) => ({ label: t, value: t }))}
          onChange={setTypeFilter}
        />
        <Dropdown value={sort} options={SORT_OPTIONS} onChange={setSort} />
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Call', 'Account', 'Date & Time', 'Duration', 'Type', 'Stage', 'Score', 'Status'].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {col === 'Date & Time' ? (
                        <>
                          Date &amp; Time
                        </>
                      ) : (
                        col
                      )}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-red-600">
                      <AlertCircle size={24} />
                      <p className="text-sm font-medium">Failed to load calls</p>
                      <p className="text-xs text-gray-500 max-w-md">{error}</p>
                      <p className="text-xs text-gray-400">
                        Ensure unified API is running on port 3001 and Postgres is seeded.
                      </p>
                      <button
                        type="button"
                        onClick={loadCalls}
                        className="flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <RefreshCw size={12} />
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : sortedCalls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-500">
                      {debouncedSearch || typeFilter !== 'All Types'
                        ? 'No calls match your filters.'
                        : 'No calls in the database yet. Upload or seed calls via M01.'}
                    </p>
                  </td>
                </tr>
              ) : (
                sortedCalls.map((call) => (
                  <tr
                    key={call.id}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    onClick={() => router.push(`/calls/ai-reviewer/${call.id}/overview`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getCallIcon(call)}</div>
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <span className="font-medium text-sm text-blue-600 hover:text-blue-700 transition-colors leading-snug">
                            {call.callName}
                          </span>
                          {call.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {call.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${getTagColor(tag)}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{call.account}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatDateTime(call.dateTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">
                      {call.duration}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{call.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{call.stage}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold ${getScoreStyle(call.score)}`}
                      >
                        {call.score}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusStyle(call.status)}`}
                      >
                        {call.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {result && !loading && !error && (
          <p className="text-xs text-gray-400 mt-3 text-right">
            Showing {sortedCalls.length} of {result.pagination.total} calls
          </p>
        )}
      </div>
    </div>
  );
}
