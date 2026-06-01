import React from 'react';
import type { DurationFilter } from '../types/calls.types';

interface DurationTabsProps {
  currentDuration: DurationFilter;
  onDurationChange: (duration: DurationFilter) => void;
}

export default function DurationTabs({ currentDuration, onDurationChange }: DurationTabsProps) {
  const tabs: { label: string; value: DurationFilter }[] = [
    { label: 'Any Duration', value: 'all' },
    { label: '< 2 mins', value: 'lt2' },
    { label: '2 - 10 mins', value: '2to10' },
    { label: '> 10 mins', value: 'gt10' },
  ];

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onDurationChange(tab.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            currentDuration === tab.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
