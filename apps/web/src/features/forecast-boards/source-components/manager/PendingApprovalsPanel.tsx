'use client';

import { useState } from 'react';
import { X, Check, ArrowRightLeft, ShieldAlert, CheckCircle, Info, Clock } from 'lucide-react';
import type { PendingApprovalEntry } from '../../source-types';
import { formatCurrency, getErrorMessage } from '../../source-utils/format';

interface PendingApprovalsPanelProps {
  approvals: PendingApprovalEntry[];
  isLoading: boolean;
  onClose: () => void;
  onApprove: (submissionId: string, repName: string) => Promise<void>;
  onReopen: (submissionId: string, repName: string) => Promise<void>;
  onOverride: (entry: PendingApprovalEntry) => void;
}

export default function PendingApprovalsPanel({
  approvals,
  isLoading,
  onClose,
  onApprove,
  onReopen,
  onOverride,
}: PendingApprovalsPanelProps) {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info'; title: string; desc: string } | null>(null);

  const triggerFeedback = (type: 'success' | 'info', title: string, desc: string) => {
    setFeedback({ type, title, desc });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleApprove = async (subId: string, repName: string) => {
    try {
      await onApprove(subId, repName);
      triggerFeedback(
        'success',
        'Forecast Approved Successfully ✓',
        `${repName}'s Best Case and Commit forecasts are now locked.`
      );
    } catch (err: unknown) {
      triggerFeedback('info', 'Failed to Approve', getErrorMessage(err, 'An error occurred.'));
    }
  };

  const handleReopen = async (subId: string, repName: string) => {
    try {
      await onReopen(subId, repName);
      triggerFeedback(
        'info',
        'Forecast Reopened',
        `${repName} can now edit their forecast values again.`
      );
    } catch (err: unknown) {
      triggerFeedback('info', 'Failed to Reopen', getErrorMessage(err, 'An error occurred.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative">
        
        {/* Floating Feedback Overlay inside the Modal */}
        {feedback && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] bg-gray-900/95 backdrop-blur-md text-white rounded-xl p-4 shadow-xl border border-gray-800 flex items-start gap-3 animate-bounce">
            {feedback.type === 'success' ? (
              <CheckCircle className="text-green-400 shrink-0 mt-0.5" size={18} />
            ) : (
              <Info className="text-blue-400 shrink-0 mt-0.5" size={18} />
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold tracking-wide">{feedback.title}</span>
              <span className="text-[10px] text-gray-400 leading-relaxed">{feedback.desc}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-gray-950">Review Requests</h2>
            <p className="text-xs text-gray-500">
              {approvals.length} representative forecast submissions awaiting your approval.
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all duration-150 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-white">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="text-xs text-gray-500 animate-pulse font-medium">Loading review requests...</span>
            </div>
          ) : approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-12 w-12 rounded-full bg-green-50 border border-green-200 text-green-600 flex items-center justify-center mb-3">
                <Check size={24} />
              </div>
              <h3 className="text-sm font-bold text-gray-950">All Caught Up!</h3>
              <p className="text-xs text-gray-500 mt-1">No pending forecast approvals at the moment.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {approvals.map((rep) => (
                <div
                  key={rep.repUserId}
                  className="border border-gray-200 rounded-xl p-4 bg-gray-50/30 hover:bg-gray-50/80 transition-all duration-200 flex flex-col gap-3.5 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Rep profile and values */}
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-violet-100 border border-violet-200 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                        {rep.avatarInitials}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-gray-950">{rep.repName}</span>
                        <span className="text-[10px] text-gray-400">Submitted {rep.submittedAt ? new Date(rep.submittedAt).toLocaleDateString() : ''}</span>
                        
                        <div className="flex items-center gap-4 mt-2 bg-white px-3 py-2 border border-gray-100 rounded-lg shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Best Case</span>
                            <span className="text-xs font-bold text-gray-950">{formatCurrency(rep.bestCaseValue)}</span>
                          </div>
                          <div className="w-[1px] h-6 bg-gray-100" />
                          <div className="flex flex-col">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Commit</span>
                            <span className="text-xs font-bold text-gray-950">{formatCurrency(rep.commitValue)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleApprove(rep.submissionId, rep.repName)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white bg-green-600 hover:bg-green-700 hover:shadow-sm transition-all duration-150 cursor-pointer"
                      >
                        <Check size={12} />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReopen(rep.submissionId, rep.repName)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 hover:shadow-sm transition-all duration-150 cursor-pointer"
                      >
                        <ArrowRightLeft size={11} />
                        Reopen
                      </button>
                      <button
                        type="button"
                        onClick={() => onOverride(rep)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-sm transition-all duration-150 cursor-pointer"
                      >
                        <ShieldAlert size={11} />
                        Override
                      </button>
                    </div>
                  </div>

                  {/* Submission note */}
                  {rep.note && (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-700 italic font-sans leading-relaxed">
                      <span className="font-bold not-italic text-gray-400 text-[9px] uppercase tracking-wider block mb-1">Rep note:</span>
                      &quot;{rep.note}&quot;
                    </div>
                  )}

                  {rep.activity && rep.activity.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <span className="font-bold text-gray-400 text-[9px] uppercase tracking-wider block mb-2">Activity status</span>
                      <div className="flex flex-col gap-2">
                        {rep.activity.map((entry) => (
                          <div key={entry.id} className="flex items-start gap-2">
                            <div className="mt-0.5 h-5 w-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                              <Clock size={11} />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-semibold text-gray-800">{entry.description}</span>
                              <span className="text-[10px] text-gray-500">{entry.actorName} | {entry.occurredAt}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-350 bg-white text-xs font-bold rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer transition-all duration-150"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
