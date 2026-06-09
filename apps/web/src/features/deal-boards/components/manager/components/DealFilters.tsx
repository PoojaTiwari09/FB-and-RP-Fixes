import { ChevronDown, Search } from 'lucide-react';
import type { DealFilterState } from '../types/deal.types';

interface DealFiltersProps {
  filters: DealFilterState;
  onChange: (filters: DealFilterState) => void;
  reps: string[];
  stages: string[];
  categories: string[];
}

export default function DealFilters({
  filters,
  onChange,
  reps,
  stages,
  categories,
}: DealFiltersProps) {
  const updateFilter = (key: keyof DealFilterState, value: string | null) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex items-center gap-2 py-2">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mr-1">
        Filters
      </span>

      <div className="relative shrink-0">
        <select
          value={filters.rep}
          onChange={(e) => updateFilter('rep', e.target.value)}
          className="appearance-none bg-white border border-gray-200 rounded-md pl-3 pr-8 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer h-8"
        >
          <option value="all">All Reps</option>
          {reps.map((rep) => (
            <option key={rep} value={rep}>{rep}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      <div className="relative shrink-0">
        <select
          value={filters.stage}
          onChange={(e) => updateFilter('stage', e.target.value)}
          className="appearance-none bg-white border border-gray-200 rounded-md pl-3 pr-8 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer h-8"
        >
          <option value="all">All Stages</option>
          {stages.map((stage) => (
            <option key={stage} value={stage}>{stage}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      <div className="relative shrink-0">
        <select
          value={filters.category ?? 'all'}
          onChange={(e) => updateFilter('category', e.target.value === 'all' ? null : e.target.value)}
          className="appearance-none bg-white border border-gray-200 rounded-md pl-3 pr-8 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer h-8"
        >
          <option value="all">All Forecasts</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      <input
        type="date"
        value={filters.startDate ?? ''}
        onChange={(e) => updateFilter('startDate', e.target.value || null)}
        className="shrink-0 bg-white border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer [color-scheme:light] h-8"
        style={{ width: '130px' }}
      />

      <span className="text-xs text-gray-400 shrink-0">to</span>

      <input
        type="date"
        value={filters.endDate ?? ''}
        onChange={(e) => updateFilter('endDate', e.target.value || null)}
        className="shrink-0 bg-white border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer [color-scheme:light] h-8"
        style={{ width: '130px' }}
      />

      <div className="flex-1 min-w-4" />

      <div className="relative flex-1 max-w-md">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          placeholder="Search deals..."
          className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-8"
        />
      </div>
    </div>
  );
}
