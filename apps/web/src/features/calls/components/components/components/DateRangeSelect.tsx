import React from 'react';
import type { DateRangeFilter } from '../types/calls.types';

interface DateRangeSelectProps {
  dateRange: DateRangeFilter;
  onDateRangeChange: (range: DateRangeFilter, start?: string | null, end?: string | null) => void;
}

export default function DateRangeSelect({ dateRange, onDateRangeChange }: DateRangeSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onDateRangeChange(e.target.value as DateRangeFilter);
  };

  return (
    <div className="relative">
      <select
        value={dateRange}
        onChange={handleChange}
        className="block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value="all">All Time</option>
        <option value="last7days">Last 7 Days</option>
        <option value="last30days">Last 30 Days</option>
        <option value="custom">Custom Range...</option>
      </select>
    </div>
  );
}
