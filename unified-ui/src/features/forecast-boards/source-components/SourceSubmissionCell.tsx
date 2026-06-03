'use client';

import type { SubmissionCell as SubmissionCellType } from '../source-types';
import { formatCurrency } from '../source-utils/format';
import { MessageCircleWarning } from 'lucide-react';

interface SourceSubmissionCellProps {
  cell: SubmissionCellType;
  isActive: boolean;
  isEditable: boolean;
  status?: string | null;
  emptyLabel?: string;
  onClick: () => void;
  requestedValue?: number | null;
}

export default function SourceSubmissionCell({ cell, isActive, isEditable, status, emptyLabel = 'Not started', onClick, requestedValue }: SourceSubmissionCellProps) {
  const isEmpty = cell.value === null;
  const formattedVal = isEmpty ? emptyLabel : formatCurrency(cell.value);
  const hasManagerFeedback = !!cell.managerAnnotation;

  if (!isEditable) {
    const titleText = requestedValue !== undefined && requestedValue !== null
      ? `Pending Change Request: ${formatCurrency(requestedValue)}`
      : (status ? `Status: ${status.replace('_', ' ')}` : undefined);

    return (
      <button
        type="button"
        onClick={onClick}
        title={titleText}
        className={`relative inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-bold min-w-[104px] border select-none text-center cursor-pointer transition-all duration-150 outline-none ${
          isActive 
            ? 'border-2 border-blue-600 bg-blue-50/10 text-blue-700' 
            : 'border-gray-200 bg-gray-50 hover:border-blue-400'
        } ${isEmpty ? 'text-gray-400 italic' : 'text-gray-600'}`}
      >
        {formattedVal}
        {status === 'approved' && !hasManagerFeedback && (
          <div className="absolute -top-1.5 -right-1.5 bg-green-100 text-green-700 rounded-full p-0.5 border border-green-200 shadow-sm" title="Approved">
             <div className="text-[8px] leading-none px-0.5 font-extrabold">A</div>
          </div>
        )}
        {requestedValue !== undefined && requestedValue !== null && (
          <div className="absolute -top-1.5 -right-1.5 bg-blue-100 text-blue-700 rounded-full p-0.5 border border-blue-200 shadow-sm" title={`Pending Change Request: ${formatCurrency(requestedValue)}`}>
             <div className="text-[8px] leading-none px-0.5 font-extrabold">P</div>
          </div>
        )}
        {hasManagerFeedback && (
          <div className="absolute -top-1.5 -right-1.5 bg-yellow-100 text-yellow-700 rounded-full p-0.5 border border-yellow-200 shadow-sm" title="Manager Feedback">
             <MessageCircleWarning size={10} />
          </div>
        )}
      </button>
    );
  }

  const borderStyle = isActive
    ? 'border-2 border-blue-600 bg-blue-50/20 text-blue-700'
    : 'border-2 border-blue-500 hover:border-blue-600 bg-white text-gray-900 shadow-xs';

  return (
    <button
      type="button"
      onClick={onClick}
      title={status ? `Status: ${status.replace('_', ' ')}` : undefined}
      className={`relative inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-bold min-w-[104px] cursor-pointer transition-all duration-150 select-none ${borderStyle} ${isEmpty ? 'italic' : ''}`}
    >
      {formattedVal}
      {requestedValue !== undefined && requestedValue !== null && (
        <div className="absolute -top-1.5 -right-1.5 bg-blue-100 text-blue-700 rounded-full p-0.5 border border-blue-200 shadow-sm" title={`Pending Change Request: ${formatCurrency(requestedValue)}`}>
           <div className="text-[8px] leading-none px-0.5 font-extrabold">P</div>
        </div>
      )}
      {hasManagerFeedback && (
        <div className="absolute -top-1.5 -right-1.5 bg-yellow-100 text-yellow-700 rounded-full p-0.5 border border-yellow-200 shadow-sm" title="Manager Feedback">
           <MessageCircleWarning size={10} />
        </div>
      )}
    </button>
  );
}
