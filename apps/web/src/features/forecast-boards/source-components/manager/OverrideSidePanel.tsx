'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { getErrorMessage } from '../../source-utils/format';
import SourceSubmissionHistoryAccordion from '../SourceSubmissionHistoryAccordion';

interface OverrideSidePanelProps {
  repName: string;
  initialCommit: number | null;
  initialBestCase: number | null;
  onSubmit: (commitVal: number, bestCaseVal: number, note: string) => Promise<void>;
  boardId?: string;
  repUserId?: string;
  dealId?: string;
  onClose: () => void;
}

export default function OverrideSidePanel({
  repName,
  initialCommit,
  initialBestCase,
  onClose,
  onSubmit,
  boardId,
  repUserId,
  dealId,
}: OverrideSidePanelProps) {
  const [commitVal, setCommitVal] = useState(initialCommit !== null ? String(initialCommit) : '');
  const [bestCaseVal, setBestCaseVal] = useState(initialBestCase !== null ? String(initialBestCase) : '');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cVal = parseFloat(commitVal.replace(/[^0-9.]/g, ''));
    const bVal = parseFloat(bestCaseVal.replace(/[^0-9.]/g, ''));

    if (isNaN(cVal) || cVal < 0) {
      setError('Please enter a valid Commit value.');
      return;
    }
    if (isNaN(bVal) || bVal < 0) {
      setError('Please enter a valid Best Case value.');
      return;
    }
    if (!note.trim()) {
      setError('A note explaining the override is mandatory.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(cVal, bVal, note);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to submit override.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full w-80 shrink-0 border-l border-gray-200 bg-white overflow-y-auto"
      style={{ boxShadow: '-4px 0 16px rgba(0,0,0,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-gray-900">Override Forecast</h3>
          <span className="text-[10px] text-gray-400 font-medium">For {repName}</span>
        </div>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
          <X size={15} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-5 py-4 flex-1">
        {/* Best Case Override */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Best Case Value</label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-blue-500 transition-colors">
            <span className="px-3 py-2 text-gray-400 text-xs border-r border-gray-200 font-semibold">$</span>
            <input
              type="text"
              value={bestCaseVal}
              onChange={(e) => setBestCaseVal(e.target.value)}
              placeholder="0"
              className="flex-1 px-3 py-2 text-xs font-semibold text-gray-900 outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Commit Override */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Commit Value</label>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-blue-500 transition-colors">
            <span className="px-3 py-2 text-gray-400 text-xs border-r border-gray-200 font-semibold">$</span>
            <input
              type="text"
              value={commitVal}
              onChange={(e) => setCommitVal(e.target.value)}
              placeholder="0"
              className="flex-1 px-3 py-2 text-xs font-semibold text-gray-900 outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Explanation Note */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Reason for Override <span className="text-red-500">*</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Provide detail on why you are overriding this forecast. This will be sent as a note to the rep."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 resize-none outline-none focus:border-blue-500 transition-colors bg-white font-sans"
            required
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{error}</p>
        )}
        {success && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">Override saved!</p>
        )}

        {/* Action Button */}
        <div className="mt-4 border-t border-gray-200 pt-4 pb-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-opacity disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? 'Saving...' : 'Send Override'}
          </button>
        </div>
        
        {/* Submission history */}
        {boardId && repUserId && (
          <div className="mt-2 pb-4">
            <SourceSubmissionHistoryAccordion 
              boardId={boardId} 
              repUserId={repUserId} 
              columnId="col-commit" 
              dealId={dealId} 
            />
          </div>
        )}
      </form>
    </div>
  );
}
