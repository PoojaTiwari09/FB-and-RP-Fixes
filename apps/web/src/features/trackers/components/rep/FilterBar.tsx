'use client';

import { Search, ChevronDown } from 'lucide-react';
import type { Filters } from '../../types/tracker.types';

interface FilterBarProps {
  filters: Filters;
  updateFilter: (key: keyof Filters, value: string) => void;
}

export default function FilterBar({ filters, updateFilter }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <select
          value={filters.teamId}
          onChange={(e) => updateFilter('teamId', e.target.value)}
          className="appearance-none border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Teams</option>
          <option value="sales">Sales Team</option>
          <option value="account-manager">Account Manager</option>
          <option value="customer-success">Customer Success</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>

      <div className="relative">
        <select
          value={filters.dateRange}
          onChange={(e) => updateFilter('dateRange', e.target.value)}
          className="appearance-none border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="last-7-days">Last 7 days</option>
          <option value="last-30-days">Last 30 days</option>
          <option value="last-quarter">Last quarter</option>
          <option value="last-6-months">Last 6 months</option>
          <option value="custom">Custom range</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>

      <div className="relative">
        <select
          value={filters.interactionType}
          onChange={(e) => updateFilter('interactionType', e.target.value)}
          className="appearance-none border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="calls-only">Calls only</option>
          <option value="emails-only">Emails only</option>
          <option value="calls-emails">Calls + Emails</option>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>

      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search trackers..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}
