'use client';

import { useState } from 'react';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { useSubmissionHistory } from '../source-hooks/useSubmissionHistory';
import { formatCurrency } from '../source-utils/format';

interface Props {
  boardId: string;
  repUserId: string;
  columnId: string;
  dealId?: string;
}

export default function SourceSubmissionHistoryAccordion({ boardId, repUserId, columnId, dealId }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const { history, isLoading } = useSubmissionHistory(boardId, repUserId, columnId, isOpen, dealId);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-between w-full px-4 py-3 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        Submission Changes
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="px-4 py-3 text-xs text-gray-500">Loading...</div>
          ) : history.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-500">No history yet.</div>
          ) : (
            history.map((entry, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-gray-700">{entry.periodLabel}</span>
                    <span className="text-[10px] text-gray-500">
                      {entry.submitterName} | {entry.submittedAt}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-semibold text-gray-700">{formatCurrency(entry.value)}</span>
                    {entry.deltaDirection && entry.delta !== null && entry.delta !== 0 && (
                      <span
                        className="flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded border"
                        style={entry.deltaDirection === 'up'
                          ? { background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }
                          : { background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }
                        }
                      >
                        {entry.deltaDirection === 'up' ? '⬆' : '⬇'}
                        {formatCurrency(entry.delta, true)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
