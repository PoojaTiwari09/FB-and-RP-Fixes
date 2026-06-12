'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, Bell, AlertCircle, Settings, X } from 'lucide-react';

import type {
  ManagerBoardViewResponse,
  PendingApprovalEntry,
  RepDrillDownResponse,
  SubmissionStatus,
} from '../../source-types';

import { getManagerBoardView, getRepDrillDown, bulkUploadTargets, assignTargets } from '../../source-services/managerBoard.service';
import { usePendingApprovals } from '../../source-hooks/usePendingApprovals';
import { formatCurrency, getErrorMessage, formatPeriodId, parseCustomMonth } from '../../source-utils/format';
import { getActiveBoardForPeriod } from '../../source-services/repBoard.service';

import SourceDeadlineBanner from '../SourceDeadlineBanner';
import SourceBoardPeriodSelector from '../SourceBoardPeriodSelector';
import SourceTargetProgressBar from '../SourceTargetProgressBar';
import SourceColumnInfoTooltip from '../SourceColumnInfoTooltip';
import SourceSubmissionCell from '../SourceSubmissionCell';

import PendingApprovalsPanel from './PendingApprovalsPanel';
import OverrideSidePanel from './OverrideSidePanel';
import ManagerRepDrillDown from './ManagerRepDrillDown';

const BOARD_ID = 'board-q2';
const TEAM_NAME = 'West AEs';

// Safe parse currency input helper
function parseCurrencyInput(value: string): number | null {
  const clean = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? null : num;
}

// Calculate attainment helper
function calculateTargetAttainment(closed: number, commit: number | undefined, quota: number | null): number | null {
  if (!quota || quota <= 0) return null;
  const effectiveCommit = commit ?? 0;
  return Math.min(Math.round(((closed + effectiveCommit) / quota) * 100), 100);
}

export default function SourceForecastBoardsManagerView() {
  const [boardId, setBoardId] = useState<string>(BOARD_ID);
  const [data, setData] = useState<ManagerBoardViewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Checked reps and bulk target input
  const [checkedReps, setCheckedReps] = useState<Record<string, boolean>>({});
  const [bulkTargetValue, setBulkTargetValue] = useState('');

  // Immediate Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // UI state for panels and drills
  const [drilldownRepId, setDrilldownRepId] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<RepDrillDownResponse | null>(null);
  const [isDrilldownLoading, setIsDrilldownLoading] = useState(false);

  const [overrideRep, setOverrideRep] = useState<PendingApprovalEntry | null>(null);
  const [showReviewRequests, setShowReviewRequests] = useState(false);

  // Set Targets Modal state
  const [showSetTargets, setShowSetTargets] = useState(false);
  const [targetInputs, setTargetInputs] = useState<Record<string, string>>({});
  const [targetErrors, setTargetErrors] = useState<Record<string, string>>({});
  const [targetSearchQuery, setTargetSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // Forecast Period state
  const [selectedPeriodName, setSelectedPeriodName] = useState<string | null>(null);

  // Toast / Feedback status
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync board list loader
  const loadBoardData = useCallback((bId: string) => {
    setIsLoading(true);
    getManagerBoardView(bId)
      .then((res) => {
        setData(JSON.parse(JSON.stringify(res)));
        // Initialize target inputs
        const initialInputs: Record<string, string> = {};
        res.rows.forEach((row) => {
          initialInputs[row.repUserId] = String(row.targetAttainment.quota ?? 0);
        });
        setTargetInputs(initialInputs);
      })
      .catch((e: unknown) => setError(getErrorMessage(e, 'Failed to load manager board.')))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (selectedPeriodName) {
      const periodId = formatPeriodId(selectedPeriodName);
      getActiveBoardForPeriod(periodId)
        .then((res) => setBoardId(res.board.id))
        .catch(console.error);
    }
  }, [selectedPeriodName]);

  useEffect(() => {
    loadBoardData(boardId);
  }, [loadBoardData, boardId]);

  // Hook for pending approvals review lists
  const {
    approvals,
    pendingCount,
    approve,
    reopen,
    override,
    isLoading: isApprovalsLoading,
  } = usePendingApprovals(boardId, () => loadBoardData(boardId));

  // Filter manager rows based on immediate search query
  const filteredRows = useMemo(() => {
    if (!data) return [];
    if (!searchQuery.trim()) return data.rows;
    const q = searchQuery.toLowerCase();
    return data.rows.filter((row) => row.repName.toLowerCase().includes(q));
  }, [data, searchQuery]);

  // Get current active columns
  const commitCol = data?.columns.find((c) => c.label === 'Commit');
  const bestCaseCol = data?.columns.find((c) => c.label === 'Best Case');

  // Handle drill down click on rep name
  const handleOpenDrilldown = async (repId: string) => {
    setIsDrilldownLoading(true);
    setDrilldownRepId(repId);
    try {
      const res = await getRepDrillDown(boardId, repId);
      // Sync local status with dashboard status
      const dashRow = data?.rows.find((r) => r.repUserId === repId);
      if (dashRow && res.submission) {
        res.submission.status = dashRow.submissionStatus;
        res.summaryCards.commit = dashRow.cells['col-commit']?.value ?? res.summaryCards.commit;
        res.summaryCards.bestCase = dashRow.cells['col-best-case']?.value ?? res.summaryCards.bestCase;
      }
      setDrilldownData(res);
    } catch (e) {
      console.error(e);
      setDrilldownRepId(null);
    } finally {
      setIsDrilldownLoading(false);
    }
  };

  const handleCloseDrilldown = () => {
    setDrilldownRepId(null);
    setDrilldownData(null);
  };

  const refreshDrilldown = async () => {
    if (!drilldownRepId) return;
    try {
      const res = await getRepDrillDown(boardId, drilldownRepId);
      const dashRow = data?.rows.find((r) => r.repUserId === drilldownRepId);
      if (dashRow && res.submission) {
        res.submission.status = dashRow.submissionStatus;
        res.summaryCards.commit = dashRow.cells['col-commit']?.value ?? res.summaryCards.commit;
        res.summaryCards.bestCase = dashRow.cells['col-best-case']?.value ?? res.summaryCards.bestCase;
      }
      setDrilldownData(res);
      loadBoardData(boardId);
    } catch (e) {
      console.error(e);
    }
  };

  // Inline approval / reopen updates
  const handleStatusChange = (repId: string, newStatus: SubmissionStatus) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map((row) => {
          if (row.repUserId === repId) {
            return { ...row, submissionStatus: newStatus };
          }
          return row;
        }),
      };
    });
    showToast(`Forecast status updated to: ${newStatus === 'approved' ? 'Approved' : 'Reopened'}`);
  };

  const handleOverrideValues = (repId: string, commit: number, bestCase: number) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        rows: prev.rows.map((row) => {
          if (row.repUserId === repId) {
            return {
              ...row,
              cells: {
                ...row.cells,
                'col-commit': { ...row.cells['col-commit'], value: commit },
                'col-best-case': { ...row.cells['col-best-case'], value: bestCase },
              },
            };
          }
          return row;
        }),
      };
    });
  };

  // Save representative targets (quotas)
  const handleBulkAssign = async () => {
    if (!bulkTargetValue) return;
    const numericQuota = parseCurrencyInput(bulkTargetValue);
    if (!numericQuota || numericQuota <= 0) return;

    const repsToAssign = data?.rows.filter(row => checkedReps[row.repUserId]) || [];
    if (repsToAssign.length === 0) return;

    const assignments = repsToAssign.map(row => ({
      repUserId: row.repUserId,
      targetValue: numericQuota
    }));

    try {
      await assignTargets(boardId, data!.period.id, assignments);
      showToast('Targets assigned successfully');
      loadBoardData(boardId);
      setCheckedReps({});
      setBulkTargetValue('');
    } catch (e) {
      showToast('Failed to assign targets');
    }
  };

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    const nextErrors: Record<string, string> = {};
    const assignments: { repUserId: string; targetValue: number }[] = [];

    data.rows.forEach((row) => {
      const input = targetInputs[row.repUserId];
      if (input === undefined) return;
      const numericQuota = parseCurrencyInput(input);
      if (numericQuota === null || numericQuota <= 0) {
        nextErrors[row.repUserId] = 'Target must be greater than 0.';
      } else {
        assignments.push({ repUserId: row.repUserId, targetValue: numericQuota });
      }
    });

    setTargetErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await assignTargets(boardId, data.period.id, assignments);
      loadBoardData(boardId);
      setShowSetTargets(false);
      setTargetErrors({});
      setCheckedReps({});
      setBulkTargetValue('');
      showToast('Representative targets updated successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to save targets.');
    }
  };

  // Handle Bulk Upload
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsBulkUploading(true);
    try {
      await bulkUploadTargets(boardId, file);
      showToast('Targets bulk updated successfully from Excel!');
      setShowSetTargets(false);
      // Reload board data to get the updated targets
      loadBoardData(boardId);
    } catch (err) {
      showToast('Failed to bulk upload targets');
      console.error(err);
    } finally {
      setIsBulkUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Pending approval panel action wraps
  const onApproveRequest = async (subId: string, repName: string, requestType: string) => {
    const rep = approvals.find((a) => a.submissionId === subId);
    await approve(subId, requestType);
    if (rep) {
      handleStatusChange(rep.repUserId, 'approved');
      if (rep.repUserId === drilldownRepId) {
        refreshDrilldown();
      }
    }
    showToast(`Forecast for ${repName} Approved!`);
  };

  const onReopenRequest = async (subId: string, repName: string) => {
    const rep = approvals.find((a) => a.submissionId === subId);
    await reopen(subId);
    if (rep) {
      handleStatusChange(rep.repUserId, 'reopened');
      if (rep.repUserId === drilldownRepId) {
        refreshDrilldown();
      }
    }
    showToast(`Forecast for ${repName} Reopened!`);
  };

  const onOverrideSubmit = async (commitVal: number, bestCaseVal: number, note: string) => {
    if (!overrideRep) return;
    await override(overrideRep.repUserId, 'col-commit', commitVal, note, false);
    await override(overrideRep.repUserId, 'col-best-case', bestCaseVal, note);
    handleOverrideValues(overrideRep.repUserId, commitVal, bestCaseVal);
    handleStatusChange(overrideRep.repUserId, 'overridden');
    showToast(`Override values applied for ${overrideRep.repName}!`);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 text-sm animate-pulse">Loading manager forecast board...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-red-500 text-sm">{error ?? 'Failed to load manager board.'}</div>
      </div>
    );
  }

  const displayPeriodName = selectedPeriodName || data.period.name;

  return (
    <div className="flex flex-col flex-1 min-h-0 relative bg-white">
      {/* Toast popup */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl animate-bounce">
          <AlertCircle size={14} className="text-blue-400" />
          {toastMessage}
        </div>
      )}

      {isDrilldownLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 text-xs font-semibold text-gray-500">
          Loading representative forecast...
        </div>
      )}

      {/* Renders Rep Drilldown if a rep is selected */}
      {drilldownRepId && drilldownData ? (
        <ManagerRepDrillDown
          boardId={boardId}
          drilldownData={drilldownData}
          onBack={handleCloseDrilldown}
          rollup={data.rollup}
          teamName={TEAM_NAME}
          periodName={displayPeriodName}
          onStatusChange={handleStatusChange}
          onOverrideValues={handleOverrideValues}
          refreshDrilldown={refreshDrilldown}
        />
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200 bg-white">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Forecast Board</h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 mt-1">
                Sales Manager
              </span>
            </div>
            <SourceBoardPeriodSelector
              periodName={selectedPeriodName || 'Q2 FY26'}
              onChange={(name, id) => {
                setSelectedPeriodName(name);
                if (id) setBoardId(id);
              }}
            />
          </div>

          {/* Deadline banner */}
          {data.period && data.period.endDate && <SourceDeadlineBanner period={data.period} />}

          {/* Board Main contents */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-auto">
              {/* Search bar & Action triggers */}
              <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-gray-200">
                <div className="flex items-center gap-2 flex-1 max-w-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus-within:border-blue-500 transition-colors">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Team Members..."
                    className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder:text-gray-400 font-medium"
                  />
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Set Targets Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowSetTargets(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Settings size={13} className="text-gray-500" />
                    Set Targets
                  </button>

                  {/* Review Requests trigger */}
                  <button
                    type="button"
                    onClick={() => setShowReviewRequests(true)}
                    className="relative inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <Bell size={13} className="text-gray-500" />
                    Review Requests
                    {pendingCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-bold">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="px-6 py-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/50">
                        <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Team Members</th>
                        <th className="py-3 px-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Pipeline</th>
                        <th className="py-3 px-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Best Case <SourceColumnInfoTooltip text="Sales Rep Best Case Forecast" />
                        </th>
                        <th className="py-3 px-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Commit <SourceColumnInfoTooltip text="Sales Rep Commit Forecast" />
                        </th>
                        <th className="py-3 px-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Closed</th>
                        <th className="py-3 px-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">AI Prediction Score</th>
                        <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-xs text-gray-500">
                            No team members found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => {
                          const isPending = row.submissionStatus === 'submitted';

                          return (
                            <tr
                              key={row.repUserId}
                              className={`hover:bg-gray-50/50 transition-colors ${isPending ? 'bg-amber-50/70 border-l-4 border-l-amber-500' : ''}`}
                            >
                              {/* Member profile info */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-full bg-violet-100 border border-violet-200 text-violet-700 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                                    {row.avatarInitials}
                                  </div>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => handleOpenDrilldown(row.repUserId)}
                                        className="text-xs font-bold text-blue-600 hover:underline text-left cursor-pointer bg-transparent border-none p-0"
                                      >
                                        {row.repName}
                                      </button>
                                      {isPending && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                          ⏳ Review Pending
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1.5">
                                      Quota attainment: {calculateTargetAttainment(row.targetAttainment.closed, row.cells['col-commit']?.value ?? undefined, row.targetAttainment.quota) ?? 0}%
                                      {row.submissionStatus === 'approved' && (
                                        <span className="text-green-600 font-bold bg-green-50 px-1 rounded">Approved</span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Pipeline */}
                              <td className="py-3 px-4">
                                <div className="border border-gray-200 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 flex justify-center items-center">
                                  {formatCurrency(row.cells['col-pipeline']?.value)}
                                </div>
                              </td>

                              {/* Best Case */}
                              <td className="py-3 px-4 text-center">
                                <div className="border border-gray-200 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 flex justify-center items-center mx-auto" style={{ width: '85px' }}>
                                  {formatCurrency(row.cells['col-best-case']?.value)}
                                </div>
                              </td>

                              {/* Commit */}
                              <td className="py-3 px-4 text-center">
                                <div className="border border-gray-200 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 flex justify-center items-center mx-auto" style={{ width: '85px' }}>
                                  {formatCurrency(row.cells['col-commit']?.value)}
                                </div>
                              </td>

                              {/* Closed */}
                              <td className="py-3 px-4">
                                <div className="border border-gray-200 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 flex justify-center items-center">
                                  {formatCurrency(row.cells['col-closed']?.value)}
                                </div>
                              </td>

                              {/* AI Prediction Score */}
                              <td className="py-3 px-4">
                                <div className="border border-gray-200 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 flex justify-center items-center mx-auto" style={{ width: '60px' }}>
                                  {row.aiPredictionScore ?? 0}
                                </div>
                              </td>

                              {/* Target quota progress */}
                              <td className="py-3 px-4">
                                  <SourceTargetProgressBar
                                    quota={row.targetAttainment.quota}
                                    closed={row.targetAttainment.closed}
                                    commit={row.cells['col-commit']?.value}
                                    isLocked={row.submissionStatus === 'approved' || row.submissionStatus === 'overridden'}
                                  />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar Override panel */}
            {overrideRep && (
              <OverrideSidePanel
                repName={overrideRep.repName}
                initialCommit={overrideRep.commitValue}
                initialBestCase={overrideRep.bestCaseValue}
                onClose={() => setOverrideRep(null)}
                onSubmit={onOverrideSubmit}
              />
            )}
          </div>
        </div>
      )}

      {/* Set Targets Modal Overlay */}
      {showSetTargets && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-base font-bold text-gray-900">Set Team Targets</h2>
              <div className="flex items-center gap-3 ml-auto mr-4">
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv" 
                  ref={fileInputRef} 
                  onChange={handleBulkUpload} 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBulkUploading}
                  className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  {isBulkUploading ? 'Uploading...' : 'Bulk Upload'}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowSetTargets(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveTargets} className="p-6 flex flex-col gap-4">
              {/* Bulk target assign controls */}
              <div className="flex items-center gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                <input
                  type="text"
                  placeholder="Bulk target amount (e.g. 500000)"
                  value={bulkTargetValue}
                  onChange={(e) => setBulkTargetValue(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 outline-none bg-white focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  disabled={!data || data.rows.filter(r => checkedReps[r.repUserId]).length === 0 || !bulkTargetValue}
                  onClick={handleBulkAssign}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Assign to Selected Reps
                </button>
              </div>

              {/* Search bar inside Set Team Targets modal */}
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus-within:border-blue-500 transition-colors">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={targetSearchQuery}
                  onChange={(e) => setTargetSearchQuery(e.target.value)}
                  placeholder="Search Reps..."
                  className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder:text-gray-400 font-medium"
                />
              </div>

              {/* Select All Checkbox */}
              {data && data.rows.length > 0 && (
                <div className="flex items-center gap-2 px-1">
                  <input
                    type="checkbox"
                    checked={data.rows.length > 0 && data.rows.every(r => checkedReps[r.repUserId])}
                    onChange={(e) => {
                      const next = { ...checkedReps };
                      data.rows.forEach(r => { next[r.repUserId] = e.target.checked; });
                      setCheckedReps(next);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-gray-600">Select All Reps</span>
                </div>
              )}

              <div className="flex flex-col gap-3.5 max-h-[50vh] overflow-y-auto pr-1">
                {data.rows
                  .filter((row) => !targetSearchQuery.trim() || row.repName.toLowerCase().includes(targetSearchQuery.toLowerCase()))
                  .map((row) => {
                    const parsedTarget = parseCurrencyInput(targetInputs[row.repUserId] ?? '');
                    const projectedPct = calculateTargetAttainment(row.targetAttainment.closed, row.cells['col-commit']?.value ?? undefined, parsedTarget);
                    return (
                      <div key={row.repUserId} className="flex flex-col gap-1.5 border-b border-gray-50 pb-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={!!checkedReps[row.repUserId]}
                              onChange={(e) => setCheckedReps({ ...checkedReps, [row.repUserId]: e.target.checked })}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 mr-1 cursor-pointer"
                            />
                            <div className="h-7 w-7 rounded-full bg-violet-100 border border-violet-200 text-violet-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {row.avatarInitials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-gray-800 truncate">{row.repName}</span>
                              <span className="text-[10px] text-gray-400">
                                Closed + Commit: {formatCurrency(row.targetAttainment.closed + (row.cells['col-commit']?.value ?? 0), true)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-blue-500 transition-colors w-32 shrink-0">
                            <span className="px-2 py-1 text-gray-400 text-[10px] border-r border-gray-200 font-semibold">$</span>
                            <input
                              type="text"
                              value={targetInputs[row.repUserId] ?? ''}
                              onChange={(e) => {
                                setTargetInputs({ ...targetInputs, [row.repUserId]: e.target.value });
                                setTargetErrors((prev) => ({ ...prev, [row.repUserId]: '' }));
                              }}
                              placeholder="Target"
                              className="w-full px-2 py-1 text-[11px] font-semibold text-gray-900 outline-none bg-transparent"
                            />
                          </div>
                        </div>
                        {targetErrors[row.repUserId] ? (
                          <span className="text-[10px] font-semibold text-red-600">{targetErrors[row.repUserId]}</span>
                        ) : projectedPct !== null ? (
                          <span className="text-[10px] text-gray-400">Projected target progress: {projectedPct}%</span>
                        ) : null}
                      </div>
                    );
                  })}
              </div>

              <div className="flex justify-end gap-2.5 border-t border-gray-150 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSetTargets(false)}
                  className="px-4 py-2 border border-gray-200 bg-white text-xs font-bold rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Save Targets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review requests overlay dialog */}
      {showReviewRequests && (
        <PendingApprovalsPanel
          approvals={approvals}
          isLoading={isApprovalsLoading}
          onClose={() => setShowReviewRequests(false)}
          onApprove={onApproveRequest}
          onReopen={onReopenRequest}
          onOverride={(rep) => {
            setShowReviewRequests(false);
            setOverrideRep(rep);
          }}
        />
      )}
    </div>
  );
}
