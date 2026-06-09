'use client';

import { ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { CoachingFilters, CoachingParams } from '@revenue/types/coaching.types';

interface Props {
  filters: CoachingFilters | null;
  params: CoachingParams;
  onChange: (params: CoachingParams) => void;
  isLoading: boolean;
}

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selected = options.find((o) => o.id === value);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-gray-400 text-xs">{label}</span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {selected?.label ?? 'All'}
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white shadow-lg py-1.5">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {opt.label}
              {value === opt.id && <Check size={13} className="text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoachingFilterBar({ filters, params, onChange, isLoading }: Props) {
  const periodOptions = (filters?.periods ?? []).map((p) => ({ id: p, label: p }));
  const teamOptions = [
    { id: '', label: 'All Teams' },
    ...(filters?.teams ?? []).map((t) => ({ id: t.id, label: t.name })),
  ];

  return (
    <div className="flex items-center gap-4 px-6 py-3 border-b border-gray-100 bg-white">
      {isLoading ? (
        <>
          <div className="skeleton h-7 w-32 rounded-md" />
          <div className="skeleton h-7 w-28 rounded-md" />
        </>
      ) : (
        <>
          <Dropdown
            label="Period"
            value={params.period ?? ''}
            options={periodOptions}
            onChange={(v) => onChange({ ...params, period: v })}
          />
          <Dropdown
            label="Team"
            value={params.teamId ?? ''}
            options={teamOptions}
            onChange={(v) => onChange({ ...params, teamId: v || undefined })}
          />
        </>
      )}
    </div>
  );
}
