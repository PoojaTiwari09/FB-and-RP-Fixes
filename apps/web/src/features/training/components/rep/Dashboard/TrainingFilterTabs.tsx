'use client';

import { useState, useMemo, useCallback } from 'react';
import { TrainingItem, TrainingFilter } from '@training/types/trainingDashboard.types';
import TrainingTable from './TrainingTable';

interface TrainingFilterTabsProps {
  trainings: TrainingItem[];
}

const FILTERS: { key: TrainingFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in-progress', label: 'In-Progress' },
  { key: 'completed', label: 'Completed' },
];

export default function TrainingFilterTabs({ trainings }: TrainingFilterTabsProps) {
  const [activeFilter, setActiveFilter] = useState<TrainingFilter>('all');

  const counts = useMemo(
    () => ({
      all: trainings.length,
      'in-progress': trainings.filter((t) => t.status === 'in-progress').length,
      completed: trainings.filter((t) => t.status === 'completed').length,
    }),
    [trainings]
  );

  const filteredTrainings = useMemo(
    () =>
      activeFilter === 'all'
        ? trainings
        : trainings.filter((t) => t.status === activeFilter),
    [trainings, activeFilter]
  );

  const handleFilterChange = useCallback((filter: TrainingFilter) => {
    setActiveFilter(filter);
  }, []);

  return (
    <div>
      {/* Filter tab buttons */}
      <div className="flex items-center gap-2 mb-5">
        {FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => handleFilterChange(filter.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeFilter === filter.key
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            {filter.label}
            <span
              className={`text-xs tabular-nums ${
                activeFilter === filter.key
                  ? 'text-gray-300'
                  : 'text-gray-400'
              }`}
            >
              {counts[filter.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <TrainingTable trainings={filteredTrainings} />
    </div>
  );
}
