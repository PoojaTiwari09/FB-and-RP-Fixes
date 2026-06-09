import React from 'react';
import type { CallsListFilters } from '../types/calls.types';
import DateRangeSelect from './DateRangeSelect';
import { useAccountsDropdown, useParticipantsDropdown } from '../hooks/useFilterDropdown';

interface FilterBarProps {
  filters: CallsListFilters;
  setSearch: (search: string) => void;
  setDateRange: (range: string, start?: string | null, end?: string | null) => void;
  toggleAccount: (id: string) => void;
  toggleParticipantId: (id: string) => void;
  toggleDealType: (value: string) => void;
}

export default function FilterBar({
  filters,
  setSearch,
  setDateRange,
  toggleAccount,
  toggleParticipantId,
  toggleDealType,
}: FilterBarProps) {
  const { options: accounts } = useAccountsDropdown();
  const { options: participants } = useParticipantsDropdown();

  return (
    <div className="flex flex-col gap-4 p-4 bg-white border-b border-gray-200">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search calls..."
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        {/* Date Range */}
        <div className="w-[180px]">
          <DateRangeSelect 
            dateRange={filters.dateRange} 
            onDateRangeChange={(range, start, end) => setDateRange(range, start, end)} 
          />
        </div>
      </div>
      
      {/* Toggles */}
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Deal Type:</span>
          {['New Business', 'Renewal', 'Expansion'].map(type => (
            <label key={type} className="flex items-center gap-1 cursor-pointer">
              <input 
                type="checkbox" 
                checked={filters.dealType.includes(type)}
                onChange={() => toggleDealType(type)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-gray-600">{type}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
