'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useBoardView } from '../../source-hooks/useBoardView';
import SourceDeadlineBanner from '../SourceDeadlineBanner';
import SourceBoardPeriodSelector from '../SourceBoardPeriodSelector';
import SourceTargetProgressBar from '../SourceTargetProgressBar';
import SourceSubmissionCell from '../SourceSubmissionCell';
import SourceSubmissionPanel from '../SourceSubmissionPanel';
import SourceColumnInfoTooltip from '../SourceColumnInfoTooltip';
import { formatCurrency, formatPeriodId, parseCustomMonth } from '../../source-utils/format';
import { getActiveBoardForPeriod, submitForecast } from '../../source-services/repBoard.service';
import SourceNotificationBell from '../SourceNotificationBell';
import { Search, Send, AlertTriangle } from 'lucide-react';

const BOARD_ID = 'board-q2';
const TEAM_NAME = 'West AEs';

const matchCustomMonth = (closeDateStr: string, customMonth: string, customYear: string) => {
  if (!closeDateStr) return false;
  const d = new Date(closeDateStr);
  if (isNaN(d.getTime())) return false;
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const dealMonth = months[d.getUTCMonth()];
  const dealYear = d.getUTCFullYear().toString();
  return dealMonth === customMonth.toLowerCase() && dealYear === customYear;
};

export default function SourceForecastBoardsRepView() {
  const [boardId, setBoardId] = useState<string>(BOARD_ID);
  const { data, isLoading, error, updateCellValue, refresh } = useBoardView(boardId);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedPeriodName, setSelectedPeriodName] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<{ dealId: string; columnKey: 'bestCase' | 'commit' } | null>(null);

  // Submit Modal States
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitNote, setSubmitNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPeriodName) {
      const periodId = formatPeriodId(selectedPeriodName);
      getActiveBoardForPeriod(periodId)
        .then((res) => setBoardId(res.board.id))
        .catch(console.error);
    }
  }, [selectedPeriodName]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  const filteredDeals = useMemo(() => {
    if (!data) return [];
    let list = data.deals;
    if (selectedPeriodName) {
      const custom = parseCustomMonth(selectedPeriodName);
      if (custom) {
        list = list.filter((d) => matchCustomMonth(d.closeDate, custom.month, custom.year));
      }
    }
    if (!debouncedQuery.trim()) return list;
    const q = debouncedQuery.toLowerCase();
    return list.filter(
      (d) => d.dealName.toLowerCase().includes(q) || d.accountName.toLowerCase().includes(q),
    );
  }, [data, debouncedQuery, selectedPeriodName]);

  const getTeamRollup = useCallback(
    (columnId: string) => {
      if (!data) return [];
      return [{
        repUserId: data.repRow.repUserId,
        repName: data.repRow.repName,
        avatarInitials: data.repRow.avatarInitials,
        value: data.repRow.cells[columnId]?.value ?? null,
        status: data.repRow.submissionStatus as 'submitted' | 'draft' | 'not_started' | 'approved' | 'reopened',
      }];
    },
    [data],
  );

  const handleSubmitForApproval = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await submitForecast(boardId, {
        repUserId: data?.repRow?.repUserId || '',
        status: 'submitted',
        note: submitNote || undefined,
      });
      setShowSubmitModal(false);
      setSubmitNote('');
      void refresh();
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to submit forecast.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 text-sm animate-pulse">Loading forecast board...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-500 text-sm">{error ?? 'Failed to load board.'}</div>
      </div>
    );
  }

  const { board, period, repRow, rollup, deadlineBanner, columns } = data;
  const bestCaseCol = columns.find((c) => c.label === 'Best Case');
  const commitCol = columns.find((c) => c.label === 'Commit');

  const displayPeriodName = selectedPeriodName || period.name;
  const activeDeal = activePanel ? data.deals.find((d) => d.id === activePanel.dealId) : null;
  const bestCaseRollup = bestCaseCol ? getTeamRollup(bestCaseCol.id) : [];
  const commitRollup = commitCol ? getTeamRollup(commitCol.id) : [];

  const togglePanel = (dealId: string, columnKey: 'bestCase' | 'commit') => {
    if (activePanel?.dealId === dealId && activePanel?.columnKey === columnKey) {
      setActivePanel(null);
    } else {
      setActivePanel({ dealId, columnKey });
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-white">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Forecast Board</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Sales Rep
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${repRow.submissionStatus === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                repRow.submissionStatus === 'submitted' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  repRow.submissionStatus === 'reopened' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    'bg-gray-50 text-gray-700 border-gray-200'
              }`}>
              {repRow.submissionStatus === 'submitted' ? 'Pending Manager Approval' : repRow.submissionStatus.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SourceNotificationBell repUserId={repRow.repUserId} />
          <SourceBoardPeriodSelector periodName={displayPeriodName} onChange={setSelectedPeriodName} />
        </div>
      </div>

      {/* Deadline banner */}
      {period && period.endDate && <SourceDeadlineBanner period={period} />}

      {/* Board + Panels side by side */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main board area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-auto">
          {/* Search row */}
          <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2 flex-1 max-w-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search deals..."
                className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder:text-gray-400 font-medium"
              />
            </div>
          </div>

          {/* Table */}
          <div className="px-6 py-4">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Deals <SourceColumnInfoTooltip text="Account · Deal name" />
                    </th>
                    <th className="py-3 px-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Pipeline</th>
                    <th className="py-3 px-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Best Case
                    </th>
                    <th className="py-3 px-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Commit
                    </th>
                    <th className="py-3 px-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Closed</th>
                    <th className="py-3 px-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">AI Prediction Score</th>
                    <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Target <SourceColumnInfoTooltip text="Quota attainment %" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDeals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-gray-500">
                        No deals match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredDeals.map((deal) => {
                      const canEditDeal = ['draft', 'not_started', 'reopened'].includes(repRow.submissionStatus || 'draft');

                      return (
                        <tr key={deal.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400">{deal.accountName}</span>
                              <span className="text-xs font-semibold text-blue-600">
                                {deal.dealName}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right text-xs font-semibold text-gray-700">
                            {deal.isClosedWon || deal.isClosedLost ? '-' : formatCurrency(deal.amount)}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center">
                              <SourceSubmissionCell
                                cell={{
                                  value: deal.bestCase ?? null,
                                  submissionId: null,
                                  lastUpdatedAt: null,
                                  isAutoSubmit: false,
                                  note: null,
                                  managerAnnotation: deal.managerAnnotation ?? repRow.cells['col-best-case']?.managerAnnotation ?? null,
                                }}
                                status={deal.bestCaseState}
                                emptyLabel="$0"
                                isActive={activePanel?.dealId === deal.id && activePanel?.columnKey === 'bestCase'}
                                isEditable={['editable', 'reopened'].includes(deal.bestCaseState ?? 'editable') && !!bestCaseCol && bestCaseCol.submissionMode === 'Manual'}
                                onClick={() => togglePanel(deal.id, 'bestCase')}
                                requestedValue={deal.requestedBestCase}
                              />
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center">
                              <SourceSubmissionCell
                                cell={{
                                  value: deal.commit ?? null,
                                  submissionId: null,
                                  lastUpdatedAt: null,
                                  isAutoSubmit: false,
                                  note: null,
                                  managerAnnotation: deal.managerAnnotation ?? repRow.cells['col-commit']?.managerAnnotation ?? null,
                                }}
                                status={deal.commitState}
                                emptyLabel="$0"
                                isActive={activePanel?.dealId === deal.id && activePanel?.columnKey === 'commit'}
                                isEditable={['editable', 'reopened'].includes(deal.commitState ?? 'editable') && !!commitCol && commitCol.submissionMode === 'Manual'}
                                onClick={() => togglePanel(deal.id, 'commit')}
                                requestedValue={deal.requestedCommit}
                              />
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right text-xs font-semibold text-gray-700">
                            {deal.isClosedWon ? formatCurrency(deal.amount) : '-'}
                          </td>

                          <td className="py-3 px-4 text-center text-xs font-medium text-gray-700">
                            {repRow.aiPredictionScore ?? '-'}
                          </td>

                          <td className="py-3 px-4">
                            <SourceTargetProgressBar
                              quota={repRow.targetAttainment.quota}
                              closed={repRow.targetAttainment.closed}
                              commit={repRow.cells['col-commit']?.value}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-gray-400 mt-2 px-1">
              Bordered cells like{' '}
              <span className="inline-flex items-center px-2 py-0.5 border-2 border-blue-500 rounded text-[10px] font-bold text-gray-700 bg-white">
                {formatCurrency(repRow.cells['col-best-case']?.value ?? 280000)}
              </span>{' '}
              indicate submission values you can edit
            </p>
          </div>
        </div>

        {/* Dynamic Submission Panel */}
        {activePanel && activePanel.columnKey === 'bestCase' && bestCaseCol && activeDeal && (
          <SourceSubmissionPanel
            columnLabel="Best Case"
            columnId={bestCaseCol.id}
            periodName={displayPeriodName}
            boardId={board.id}
            repUserId={repRow.repUserId}
            initialValue={activeDeal.bestCase ?? null}
            initialNote={null}
            rollup={rollup}
            targetAttainment={repRow.targetAttainment}
            teamName={TEAM_NAME}
            existingAnnotation={activeDeal.managerAnnotation}
            existingStatus={repRow.submissionStatus as any}
            teamSubmissions={bestCaseRollup}
            dealId={activeDeal.id}
            requestedValue={activeDeal.requestedBestCase}
            requestedNote={activeDeal.requestedBestCaseNote}
            onSaveSuccess={(v) => {
              if (['submitted', 'approved'].includes(repRow.submissionStatus)) {
                void refresh();
              } else {
                updateCellValue(activeDeal.id, 'col-best-case', v);
              }
            }}
            onClose={() => setActivePanel(null)}
          />
        )}

        {activePanel && activePanel.columnKey === 'commit' && commitCol && activeDeal && (
          <SourceSubmissionPanel
            columnLabel="Commit"
            columnId={commitCol.id}
            periodName={displayPeriodName}
            boardId={board.id}
            repUserId={repRow.repUserId}
            initialValue={activeDeal.commit ?? null}
            initialNote={null}
            rollup={rollup}
            targetAttainment={repRow.targetAttainment}
            teamName={TEAM_NAME}
            existingAnnotation={activeDeal.managerAnnotation}
            existingStatus={repRow.submissionStatus as any}
            teamSubmissions={commitRollup}
            dealId={activeDeal.id}
            requestedValue={activeDeal.requestedCommit}
            requestedNote={activeDeal.requestedCommitNote}
            onSaveSuccess={(v) => {
              if (['submitted', 'approved'].includes(repRow.submissionStatus)) {
                void refresh();
              } else {
                updateCellValue(activeDeal.id, 'col-commit', v);
              }
            }}
            onClose={() => setActivePanel(null)}
          />
        )}

        {/* Submit confirmation modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md overflow-hidden shadow-2xl flex flex-col p-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-sm font-bold text-gray-900">Submit Forecast for Approval</h3>
                  <p className="text-xs text-gray-500 mt-0.5">This will lock edits on your deals list.</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Note for manager</label>
                <textarea
                  value={submitNote}
                  onChange={(e) => setSubmitNote(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Explain context or adjustments for the manager..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 resize-none outline-none focus:border-blue-500 transition-colors bg-white font-sans"
                />
              </div>

              {submitError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">{submitError}</p>
              )}

              <div className="flex justify-end gap-2.5 border-t border-gray-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false);
                    setSubmitNote('');
                    setSubmitError(null);
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-200 bg-white text-xs font-bold rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitForApproval}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send size={12} />
                      Submit Forecast
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
