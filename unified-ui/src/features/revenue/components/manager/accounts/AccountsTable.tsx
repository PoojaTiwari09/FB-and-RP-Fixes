'use client';

import { useState, useCallback, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import type { AccountRow, AccountListResponse } from '@revenue/types/accounts.types';
import ActivityDots from './ActivityDots';
import SkeletonRow from './SkeletonRow';

interface Props {
  data: AccountListResponse | null;
  isLoading: boolean;
  error: string | null;
  isMockFallback: boolean;
  onRowClick: (account: AccountRow) => void;
  onSearch: (q: string) => void;
  onSort: (col: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onPageChange: (page: number) => void;
  onRetry: () => void;
}

function formatCurrency(n: number): string {
  if (n === 0) return '$0.00';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

type SortDir = 'asc' | 'desc';

interface Column {
  key: string;
  label: string;
  sortable: boolean;
}

const COLUMNS: Column[] = [
  { key: 'accountName',  label: 'Account name',  sortable: true  },
  { key: 'owner',        label: 'Owner',          sortable: false },
  { key: 'exitARR',      label: 'Exit ARR',       sortable: true  },
  { key: 'contactsCount',label: 'Contacts',       sortable: true  },
  { key: 'activity',     label: 'Activity',       sortable: false },
  { key: 'lastActivity', label: 'Last activity',  sortable: true  },
  { key: 'managerNote',  label: 'Manager note',   sortable: false },
  { key: 'openDeals',    label: 'Open deals',     sortable: true  },
  { key: 'renewalDate',  label: 'Renewal date',   sortable: true  },
];

function SortIcon({ col, sortBy, sortOrder }: { col: string; sortBy: string; sortOrder: SortDir }) {
  if (col !== sortBy) return <ChevronsUpDown size={12} className="text-gray-300" />;
  return sortOrder === 'asc'
    ? <ChevronUp size={12} className="text-blue-600" />
    : <ChevronDown size={12} className="text-blue-600" />;
}

export default function AccountsTable({
  data,
  isLoading,
  error,
  isMockFallback,
  onRowClick,
  onSearch,
  onSort,
  sortBy,
  sortOrder,
  onPageChange,
  onRetry,
}: Props) {
  const [searchVal, setSearchVal] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (val: string) => {
      setSearchVal(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(val), 300);
    },
    [onSearch],
  );

  const accounts = data?.accounts ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.page ?? 1;

  return (
    <div className="mx-6 mt-4 rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Table toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts…"
            value={searchVal}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
          />
        </div>
        {isMockFallback && (
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
            Preview data
          </span>
        )}
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && !isMockFallback && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-100 text-sm text-red-700">
          Failed to load accounts.{' '}
          <button onClick={onRetry} className="underline font-medium">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-gray-800' : ''}`}
                  onClick={col.sortable ? () => onSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && <SortIcon col={col.key} sortBy={sortBy} sortOrder={sortOrder} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : accounts.length === 0
              ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
                    No accounts match your filters.
                    <button onClick={onRetry} className="ml-2 text-blue-600 underline text-xs">Clear</button>
                  </td>
                </tr>
              )
              : accounts.map((account) => (
                <tr
                  key={account.accountId}
                  onClick={() => onRowClick(account)}
                  className="border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors last:border-0"
                >
                  {/* Account Name */}
                  <td className="px-4 py-3">
                    <span className="font-medium text-blue-700 hover:underline text-sm">
                      {account.accountName}
                    </span>
                  </td>
                  {/* Owner */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                        {account.owner.initials}
                      </div>
                      <span className="text-sm text-gray-600">{account.owner.name}</span>
                    </div>
                  </td>
                  {/* Exit ARR */}
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                    {formatCurrency(account.exitARR)}
                  </td>
                  {/* Contacts */}
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {account.contactsCount}
                  </td>
                  {/* Activity dots */}
                  <td className="px-4 py-3">
                    <ActivityDots dots={account.activity} accountId={account.accountId} />
                  </td>
                  {/* Last Activity */}
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {account.lastActivity}
                  </td>
                  {/* Manager Note */}
                  <td className="px-4 py-3">
                    {account.managerNote ? (
                      <span className="text-sm text-gray-600 truncate max-w-[140px] block">
                        {account.managerNote}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-300">-</span>
                    )}
                  </td>
                  {/* Open Deals */}
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                    {account.openDeals > 0 ? formatCurrency(account.openDeals) : '-'}
                  </td>
                  {/* Renewal Date */}
                  <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(account.renewalDate)}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && accounts.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Page {currentPage} of {totalPages} · {data?.total ?? 0} accounts
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
