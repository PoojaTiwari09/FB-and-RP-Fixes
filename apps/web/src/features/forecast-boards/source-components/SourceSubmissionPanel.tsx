'use client';

import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { RollupData, TargetAttainment, TeamRollupSubmission } from '../source-types';
import { useSubmissionPanel } from '../source-hooks/useSubmissionPanel';
import { calculateTargetAttainment, formatCurrency, parseCurrencyInput, formatPeriodId } from '../source-utils/format';
import SourceSubmissionHistoryAccordion from './SourceSubmissionHistoryAccordion';
import { fetchTeamBoard, getRepM06Headers } from '../services/m06-api';
import { approveChangeRequest } from '../source-services/repBoard.service';

interface SourceSubmissionPanelProps {
  columnLabel: 'Best Case' | 'Commit';
  columnId: string;
  periodName: string;
  boardId: string;
  repUserId: string;
  initialValue: number | null;
  initialNote: string | null;
  rollup: RollupData;
  targetAttainment: TargetAttainment;
  teamName: string;
  isManagerView?: boolean;
  existingAnnotation?: string | null;
  existingStatus?: 'draft' | 'not_started' | 'submitted' | 'approved' | 'reopened' | null;
  teamSubmissions?: TeamRollupSubmission[];
  dealId?: string;
  requestedValue?: number | null;
  requestedNote?: string | null;
  onSaveSuccess: (newValue: number, note: string) => void;
  onApproveRequestSuccess?: () => void;
  onClose: () => void;
}

export default function SourceSubmissionPanel({
  columnLabel, columnId, periodName, boardId, repUserId,
  initialValue, initialNote, rollup, targetAttainment, teamName,
  isManagerView = false, existingAnnotation, existingStatus, teamSubmissions = [], dealId,
  requestedValue, requestedNote, onSaveSuccess, onApproveRequestSuccess, onClose,
}: SourceSubmissionPanelProps) {
  // If rep has a pending change request, default the input/note to the requested values
  const actualInitialValue = requestedValue !== undefined && requestedValue !== null ? requestedValue : initialValue;
  const actualInitialNote = requestedNote !== undefined && requestedNote !== null ? requestedNote : initialNote;

  const { value, setValue, note, setNote, onSave, isSaving, saveError, saveSuccess } =
    useSubmissionPanel({
      boardId,
      columnId,
      repUserId,
      initialValue: actualInitialValue,
      initialNote: actualInitialNote,
      isManagerView,
      dealId,
      onSaveSuccess,
      existingStatus
    });

  const [teammateSubs, setTeammateSubs] = useState<TeamRollupSubmission[]>([]);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    const pid = formatPeriodId(periodName);
    
    fetchTeamBoard(pid, undefined, getRepM06Headers(repUserId))
      .then((res) => {
        if (!isCurrent) return;
        const mapped: TeamRollupSubmission[] = (res.team || []).map((rep: any) => ({
          repUserId: rep.userId,
          repName: rep.name,
          avatarInitials: rep.initials,
          value: columnLabel === 'Best Case' ? rep.submission?.bestCaseForecast ?? null : rep.submission?.commitForecast ?? null,
          status: rep.submission?.status ?? 'not_started',
        }));
        setTeammateSubs(mapped);
      })
      .catch((e) => {
        console.error('Failed to fetch team rollup:', e);
      });

    return () => {
      isCurrent = false;
    };
  }, [periodName, columnLabel, repUserId]);

  const rollupValue = rollup.cells[columnId] ?? 0;
  const quota = targetAttainment.quota ?? 0;
  const hasQuota = quota > 0;

  const numericVal = parseCurrencyInput(value) ?? 0;
  const commitValueForProgress = columnLabel === 'Commit'
    ? numericVal
    : (quota * (targetAttainment.attainmentPct ?? 0) / 100 - targetAttainment.closed);

  const dynamicAttainmentPct = calculateTargetAttainment(targetAttainment.closed, commitValueForProgress, quota) ?? 0;
  const attainPct = Math.min(dynamicAttainmentPct, 100);

  const isRepLocked = !isManagerView && (existingStatus === 'submitted' || existingStatus === 'approved');
  const canSave = !isSaving;
  const saveLabel = isManagerView
    ? (isSaving ? 'Overriding...' : 'Override')
    : (isRepLocked
      ? (isSaving ? 'Sending request...' : 'Send Request')
      : (columnLabel === 'Best Case' ? 'Save best case' : 'Save commit'));

  const handleApproveChange = async () => {
    setIsApproving(true);
    try {
      await approveChangeRequest(boardId, {
        repUserId,
        dealId: dealId || '',
        columnId,
      });
      if (onApproveRequestSuccess) {
        onApproveRequestSuccess();
      } else {
        onSaveSuccess(requestedValue!, requestedNote || '');
      }
    } catch (e: any) {
      console.error('Failed to approve change request:', e);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full w-80 shrink-0 border-l border-gray-200 bg-white overflow-y-auto"
      style={{ boxShadow: '-4px 0 16px rgba(0,0,0,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-900">
          {columnLabel} - {periodName}
        </h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
          <X size={15} />
        </button>
      </div>

      <div className="flex flex-col gap-5 px-5 py-4 flex-1">
        {/* Dollar input */}
        <div>
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-blue-500 transition-colors">
            <span className="px-3 py-2 text-gray-400 text-xs border-r border-gray-200 font-semibold">$</span>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              className="flex-1 px-3 py-2 text-xs font-semibold text-gray-900 outline-none bg-transparent disabled:text-gray-500 disabled:bg-gray-50"
            />
          </div>
          {isRepLocked && (
            <p className="mt-1.5 text-[10px] font-medium text-blue-600">
              Forecast is submitted. Editing will send a change request to your manager.
            </p>
          )}
        </div>

        {/* Target progress */}
        {hasQuota && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Target progress</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900">{dynamicAttainmentPct}%</span>
              <span className="text-xs text-gray-500">{formatCurrency(targetAttainment.quota)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="h-1 rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${attainPct}%` }} />
            </div>
            <p className="text-[10px] text-gray-500">
              Projected to close {formatCurrency(targetAttainment.closed)} of {formatCurrency(targetAttainment.quota)} target
            </p>
          </div>
        )}

        {/* Team rollup */}
        <div className="flex flex-col gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Team rollup ({teamName})</span>
            <span className="text-base font-bold text-gray-900">{formatCurrency(rollupValue)}</span>
            <span className="text-[10px] text-gray-500">{rollup.submittedCount} of {rollup.totalCount} reps submitted</span>
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-gray-200/60">
            <span className="text-[10px] font-semibold text-gray-500">Teammate Submissions</span>
            {teammateSubs.length === 0 ? (
              <span className="text-[11px] text-gray-500 italic">No teammate rollup available.</span>
            ) : (
              teammateSubs.map((entry) => (
                <div key={entry.repUserId} className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-gray-700 truncate">{entry.repName}</span>
                  {entry.status === 'not_started' || entry.value === null ? (
                    <span className="text-[11px] font-semibold text-gray-400 italic">Not submitted</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-gray-900">{formatCurrency(entry.value)}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Manager feedback */}
        {(existingAnnotation || existingStatus) && (
          <div className="flex flex-col gap-2 rounded-lg border p-3 border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Manager Feedback</span>
              {existingStatus && (
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  existingStatus === 'approved' ? 'bg-green-100 text-green-700' :
                  existingStatus === 'reopened' ? 'bg-orange-100 text-orange-700' :
                  existingStatus === 'submitted' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {existingStatus.replace('_', ' ')}
                </span>
              )}
            </div>
            {existingAnnotation ? (
              <p className="text-xs text-gray-700 leading-relaxed italic border-l-2 border-gray-300 pl-2">&quot;{existingAnnotation}&quot;</p>
            ) : (
              <p className="text-xs text-gray-500 italic">No note provided.</p>
            )}
          </div>
        )}

        {/* Manager Approve Change Request Section */}
        {isManagerView && requestedValue !== undefined && requestedValue !== null && (
          <div className="flex flex-col gap-2 rounded-lg border p-3 border-blue-200 bg-blue-50/30">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Rep Change Request</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-900">
                Requested: {formatCurrency(requestedValue)}
              </span>
            </div>
            {requestedNote && (
              <p className="text-xs text-blue-700 italic border-l-2 border-blue-300 pl-2 mt-0.5">&quot;{requestedNote}&quot;</p>
            )}
            <button
              type="button"
              disabled={isApproving}
              onClick={handleApproveChange}
              className="mt-1.5 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer text-center disabled:opacity-50"
            >
              {isApproving ? 'Approving...' : 'Approve Change Request'}
            </button>
          </div>
        )}

        {/* Note section */}
        {!isManagerView ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Note for manager</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Add context or reasoning for your manager..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 resize-none outline-none focus:border-blue-500 transition-colors bg-white font-sans disabled:text-gray-500 disabled:bg-gray-50"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Note for rep</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Add a note for the sales rep..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 resize-none outline-none focus:border-blue-500 transition-colors bg-white font-sans"
            />
          </div>
        )}

        {/* Submission history */}
        <SourceSubmissionHistoryAccordion boardId={boardId} repUserId={repUserId} columnId={columnId} dealId={dealId} />

        {saveError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{saveError}</p>
        )}
        {saveSuccess && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">Saved successfully!</p>
        )}
      </div>

      {/* Save button */}
      <div className="px-5 py-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          className="w-full py-2.5 rounded-lg text-xs font-semibold text-white transition-opacity disabled:opacity-60 cursor-pointer bg-blue-600 hover:bg-blue-700"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}
