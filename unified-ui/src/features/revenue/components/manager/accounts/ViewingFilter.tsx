'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Users, User } from 'lucide-react';
import type { ViewersResponse } from '@revenue/types/accounts.types';

interface Props {
  viewers: ViewersResponse | null;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function ViewingFilter({ viewers, selectedIds, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function getLabel(): string {
    if (!viewers || selectedIds.length === 0) return 'Everyone';
    const allItems = [...(viewers.teams ?? []), ...(viewers.reps ?? [])];
    const first = allItems.find((x) => x.id === selectedIds[0]);
    if (!first) return 'Everyone';
    const extra = selectedIds.length - 1;
    return extra > 0 ? `${first.name} +${extra}` : first.name;
  }

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <span className="text-gray-400 text-xs">Viewing</span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {getLabel()}
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && viewers && (
        <div className="absolute top-full left-0 z-20 mt-1 w-56 rounded-xl border border-gray-200 bg-white shadow-lg py-1.5">
          {viewers.teams.length > 0 && (
            <>
              <p className="px-3 pt-1 pb-0.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Teams</p>
              {viewers.teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Users size={14} className="text-gray-400" />
                  <span className="flex-1 text-left">{t.name}</span>
                  <span className="text-xs text-gray-400">{t.memberCount}</span>
                  {selectedIds.includes(t.id) && <Check size={13} className="text-blue-600" />}
                </button>
              ))}
            </>
          )}
          {viewers.reps.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-0.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Reps</p>
              {viewers.reps.map((r) => (
                <button
                  key={r.id}
                  onClick={() => toggle(r.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <div
                    className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-[10px] font-bold"
                  >
                    {r.initials}
                  </div>
                  <span className="flex-1 text-left">{r.name}</span>
                  {selectedIds.includes(r.id) && <Check size={13} className="text-blue-600" />}
                </button>
              ))}
            </>
          )}
          {viewers.teams.length === 0 && viewers.reps.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">No options available</p>
          )}
        </div>
      )}
    </div>
  );
}
