'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const PERIOD_OPTIONS = [
  'Last 7 days',
  'Last 30 days',
  'Last quarter',
  'This quarter',
  'This month',
];

interface Props {
  value: string;
  onChange: (period: string) => void;
}

export default function PeriodFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <span className="text-gray-400 text-xs">Period</span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {value || 'Last quarter'}
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white shadow-lg py-1.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {opt}
              {value === opt && <Check size={13} className="text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
