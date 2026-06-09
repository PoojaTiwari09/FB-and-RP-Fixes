import React from 'react';
import type { ForecastPeriod } from './api';

export const PERIODS = [
  { id: 'current', label: 'Q2 FY26 (Current)' },
  { id: 'q1-fy26-demo', label: 'Q1 FY26' },
  { id: 'q4-fy25-demo', label: 'Q4 FY25' },
];

export default function PeriodToggle({
  selectedPeriod,
  onChange,
  periods,
}: {
  selectedPeriod: string;
  onChange: (periodId: string) => void;
  periods?: ForecastPeriod[];
}) {
  const items =
    periods && periods.length > 0
      ? [
          { id: 'current', label: `${periods.find((p) => !p.isLocked)?.name ?? periods[0].name} (Current)` },
          ...periods.map((p) => ({ id: p.periodId, label: p.name })),
        ]
      : PERIODS;

  const uniqueItems = items.filter(
    (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index,
  );

  return (
    <div className="flex bg-gray-100 p-1 rounded-lg flex-wrap gap-1">
      {uniqueItems.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onChange(p.id)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            selectedPeriod === p.id
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
