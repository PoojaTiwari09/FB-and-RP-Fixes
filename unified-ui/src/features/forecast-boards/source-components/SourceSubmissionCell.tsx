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

  let borderStyle = 'border-gray-200 bg-gray-50';
  let badge = null;
  let tooltip = status ? `Status: ${status.replace('_', ' ')}` : '';

  const isPending = status === 'submitted' || status === 'pending';
  const isApproved = status === 'approved';
  const isReopened = status === 'reopened';
  const isOverridden = status === 'overridden';

  if (isApproved) {
    borderStyle = 'border-gray-200 bg-gray-50 text-gray-700';
    badge = (
      <div className="absolute -top-1.5 -right-1.5 bg-green-100 text-green-700 rounded-full p-0.5 border border-green-200 shadow-sm" title="Approved">
        <div className="text-[8px] leading-none px-0.5 font-extrabold">✅</div>
      </div>
    );
    tooltip = `Approved — ${formattedVal} (final)`;
  } else if (isPending) {
    borderStyle = 'border-gray-200 bg-gray-50 text-gray-500';
    badge = (
      <div className="absolute -top-1.5 -right-1.5 bg-amber-100 text-amber-700 rounded-full p-0.5 border border-amber-200 shadow-sm" title="Pending Approval">
        <div className="text-[8px] leading-none px-0.5 font-extrabold">🕐</div>
      </div>
    );
    tooltip = 'Pending approval — submitted';
  } else if (isReopened) {
    borderStyle = isActive
      ? 'border-2 border-blue-600 bg-blue-50/20 text-blue-700'
      : 'border-2 border-blue-500 hover:border-blue-600 bg-white text-gray-900 shadow-xs';
    badge = (
      <div className="absolute -top-1.5 -right-1.5 bg-purple-100 text-purple-700 rounded-full p-0.5 border border-purple-200 shadow-sm" title="Reopened">
        <div className="text-[8px] leading-none px-0.5 font-extrabold">🔄</div>
      </div>
    );
    tooltip = 'Reopened — please re-enter your value';
  } else if (isOverridden) {
    borderStyle = 'border-gray-200 bg-gray-50 text-gray-700';
    badge = (
      <div className="absolute -top-1.5 -right-1.5 bg-yellow-100 text-yellow-700 rounded-full p-0.5 border border-yellow-200 shadow-sm" title="Overridden">
        <div className="text-[8px] leading-none px-0.5 font-extrabold">🟡</div>
      </div>
    );
    tooltip = `Overridden — ${formattedVal} (manager override, final)`;
  } else {
    if (isEditable) {
      borderStyle = isActive
        ? 'border-2 border-blue-600 bg-blue-50/20 text-blue-700'
        : 'border-2 border-blue-500 hover:border-blue-600 bg-white text-gray-900 shadow-xs';
      tooltip = 'Editable — enter your value';
    } else {
      borderStyle = 'border-gray-200 bg-gray-50 text-gray-700';
      tooltip = 'Read-only';
    }
  }

  // Override / Pending visual logic
  if (requestedValue !== undefined && requestedValue !== null) {
    badge = (
      <div className="absolute -top-1.5 -right-1.5 bg-blue-100 text-blue-700 rounded-full p-0.5 border border-blue-200 shadow-sm" title={`Pending Change Request: ${formatCurrency(requestedValue)}`}>
        <div className="text-[8px] leading-none px-0.5 font-extrabold">P</div>
      </div>
    );
    tooltip = `Pending Change Request: ${formatCurrency(requestedValue)}`;
  } else if (hasManagerFeedback) {
    badge = (
      <div className="absolute -top-1.5 -right-1.5 bg-yellow-100 text-yellow-700 rounded-full p-0.5 border border-yellow-200 shadow-sm" title="Manager Feedback">
        <MessageCircleWarning size={10} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={`relative inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-bold min-w-[104px] border select-none text-center cursor-pointer transition-all duration-150 outline-none ${borderStyle} ${isEmpty ? 'text-gray-400 italic' : ''}`}
    >
      {formattedVal}
      {badge}
    </button>
  );
}
