'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Play, Check, Calendar, Clock, MoreHorizontal } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onStartQueue: () => void;
  onMarkComplete: () => void;
  onUpdateDueDate: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
  onSkipStep: () => void;
  onRemoveFromFlow: () => void;
  onPauseFlow: () => void;
}

export default function BulkActionBar({
  selectedCount,
  onClear,
  onStartQueue,
  onMarkComplete,
  onUpdateDueDate,
  onSnooze,
  onDismiss,
  onSkipStep,
  onRemoveFromFlow,
  onPauseFlow,
}: BulkActionBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [moreOpen]);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-700 px-6 py-3 flex items-center shadow-2xl">
      {/* Selected count */}
      <button
        onClick={onClear}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white cursor-pointer transition-colors"
      >
        <X size={14} />
        <span className="font-medium">{selectedCount} selected</span>
      </button>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onStartQueue}
          className="flex items-center gap-1.5 text-sm font-semibold bg-white text-gray-900 rounded-lg px-4 py-1.5 hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <Play size={12} fill="currentColor" /> Start Queue
        </button>

        <button
          onClick={onMarkComplete}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
        >
          <Check size={14} /> Mark Complete
        </button>

        <button
          onClick={onUpdateDueDate}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
        >
          <Calendar size={14} /> Update Due Date
        </button>

        <button
          onClick={onSnooze}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
        >
          <Clock size={14} /> Snooze
        </button>

        {/* More overflow */}
        <div ref={moreRef} className="relative">
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <MoreHorizontal size={14} /> More
          </button>

          {moreOpen && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-xl border border-gray-200 shadow-xl py-1 min-w-48 overflow-hidden">
              <button
                onClick={() => { setMoreOpen(false); onDismiss(); }}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors text-left"
              >
                Dismiss
              </button>
              <button
                onClick={() => { setMoreOpen(false); onSkipStep(); }}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors text-left"
              >
                Skip Step
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
