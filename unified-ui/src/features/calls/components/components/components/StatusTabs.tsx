import React from 'react';
import type { CallStatus } from '../types/calls.types';

interface StatusTabsProps {
  currentStatus: CallStatus | 'all';
  onStatusChange: (status: CallStatus | 'all') => void;
}

export default function StatusTabs({ currentStatus, onStatusChange }: StatusTabsProps) {
  const tabs: { label: string; value: CallStatus | 'all' }[] = [
    { label: 'All Calls', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Failed', value: 'failed' },
    { label: 'Skipped', value: 'skipped' },
  ];

  return (
    <div className="flex space-x-1 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onStatusChange(tab.value)}
          className={`px-4 py-2 text-sm font-medium border-b-2 focus:outline-none transition-colors ${
            currentStatus === tab.value
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
