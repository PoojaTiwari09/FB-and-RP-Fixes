import React from 'react';

export const PERIODS = [
  { id: 'current', label: 'Q2 FY26 (Current)' },
  { id: 'q1-fy26-demo', label: 'Q1 FY26' },
  { id: 'q4-fy25-demo', label: 'Q4 FY25' },
];

export default function PeriodToggle({ 
  selectedPeriod, 
  onChange 
}: { 
  selectedPeriod: string; 
  onChange: (periodId: string) => void;
}) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg">
      {PERIODS.map(p => (
        <button
          key={p.id}
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
