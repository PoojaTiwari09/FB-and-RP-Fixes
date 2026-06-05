import { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { RepDrillDownResponse, RollupData } from '../../source-types';
import { formatCurrency, parseCustomMonth } from '../../source-utils/format';
import { approveSubmission, reopenSubmission } from '../../source-services/approval.service';
import { submitForecast } from '../../source-services/repBoard.service';

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
import SourceTargetProgressBar from '../SourceTargetProgressBar';
import SourceSubmissionCell from '../SourceSubmissionCell';
import SourceColumnInfoTooltip from '../SourceColumnInfoTooltip';
import SourceSubmissionPanel from '../SourceSubmissionPanel';

interface ManagerRepDrillDownProps {
  boardId: string;
  drilldownData: RepDrillDownResponse;
  onBack: () => void;
  rollup: RollupData;
  teamName: string;
  periodName: string;
  onStatusChange: (repUserId: string, newStatus: 'approved' | 'reopened' | 'submitted') => void;
  onOverrideValues: (repUserId: string, commit: number, bestCase: number) => void;
  refreshDrilldown?: () => Promise<void>;
}

export default function ManagerRepDrillDown({
  boardId,
  drilldownData,
  onBack,
  rollup,
  teamName,
  periodName,
  onStatusChange,
  onOverrideValues,
  refreshDrilldown,
}: ManagerRepDrillDownProps) {
  const [repStatus, setRepStatus] = useState<'approved' | 'reopened' | 'submitted'>(
    drilldownData.submission?.status === 'approved' || drilldownData.submission?.status === 'reopened'
      ? drilldownData.submission.status
      : 'submitted'
  );
  const [deals, setDeals] = useState(drilldownData.deals);
  
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [activeColumnKey, setActiveColumnKey] = useState<'bestCase' | 'commit' | null>(null);

  const commitCol = drilldownData.columns.find((c) => c.label === 'Commit');
  const bestCaseCol = drilldownData.columns.find((c) => c.label === 'Best Case');
  const activeColumnId = activeColumnKey === 'bestCase' ? (bestCaseCol?.id || 'col-best-case') : (commitCol?.id || 'col-commit');
  const activeColumnLabel = activeColumnKey === 'bestCase' ? 'Best Case' : 'Commit';
  const activeDeal = deals.find((d) => d.id === activeDealId);
  const activeValue = activeDeal ? ((activeColumnKey === 'bestCase' ? activeDeal.bestCase : activeDeal.commit) ?? null) : null;

  // Fields are editable only if the rep's status is not 'approved'
  const isEditable = repStatus !== 'approved';

  const filteredDeals = useMemo(() => {
    const custom = parseCustomMonth(periodName);
    if (custom) {
      return deals.filter((deal) => matchCustomMonth(deal.closeDate, custom.month, custom.year));
    }
    return deals;
  }, [deals, periodName]);

  // Compute summary totals from deals
  const totalBestCase = filteredDeals.reduce((sum, d) => sum + (d.bestCase ?? 0), 0);
  const totalCommit = filteredDeals.reduce((sum, d) => sum + (d.commit ?? 0), 0);

  const displayPipeline = useMemo(() => {
    const custom = parseCustomMonth(periodName);
    if (custom) {
      return filteredDeals.filter(d => !d.isClosedWon && !d.isClosedLost).reduce((sum, d) => sum + d.amount, 0);
    }
    return drilldownData.summaryCards.pipeline;
  }, [filteredDeals, periodName, drilldownData.summaryCards.pipeline]);

  const displayClosed = useMemo(() => {
    const custom = parseCustomMonth(periodName);
    if (custom) {
      return filteredDeals.filter(d => d.isClosedWon).reduce((sum, d) => sum + d.amount, 0);
    }
    return drilldownData.summaryCards.closed;
  }, [filteredDeals, periodName, drilldownData.summaryCards.closed]);

  const handleOverrideSubmit = async (newValue: number, note: string) => {
    if (!activeDealId) return;

    const nextDeals = deals.map((deal) => {
      if (deal.id !== activeDealId) return deal;
      return {
        ...deal,
        ...(activeColumnKey === 'bestCase' ? { bestCase: newValue } : { commit: newValue }),
        managerAnnotation: note || deal.managerAnnotation,
        submissionStatus: 'submitted' as const,
      };
    });
    const nextCommit = nextDeals.reduce((sum, d) => sum + (d.commit ?? 0), 0);
    const nextBestCase = nextDeals.reduce((sum, d) => sum + (d.bestCase ?? 0), 0);
    
    try {
      await submitForecast(boardId, {
        columnId: activeColumnId,
        repUserId: drilldownData.rep.id,
        value: newValue,
        note: note || undefined,
        dealId: activeDealId,
        status: 'submitted',
      });
      setDeals(nextDeals);
      setRepStatus('submitted');
      onOverrideValues(drilldownData.rep.id, nextCommit, nextBestCase);
      onStatusChange(drilldownData.rep.id, 'submitted');
    } catch (e) {
      console.error('Failed to override deal forecast', e);
    }
  };

  const handleApprove = async () => {
    if (!drilldownData.submission?.id) return;
    try {
      await approveSubmission(boardId, drilldownData.submission.id);
      setRepStatus('approved');
      onStatusChange(drilldownData.rep.id, 'approved');
    } catch (e) {
      console.error('Failed to approve forecast', e);
    }
  };

  const handleReopen = async () => {
    if (!drilldownData.submission?.id) return;
    try {
      await reopenSubmission(boardId, drilldownData.submission.id);
      setRepStatus('reopened');
      onStatusChange(drilldownData.rep.id, 'reopened');
    } catch (e) {
      console.error('Failed to reopen forecast', e);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white">
      {/* Breadcrumb row */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-200 bg-gray-50/50">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <ArrowLeft size={13} />
          Forecast Board
        </button>
        <span className="text-xs text-gray-300">/</span>
        <span className="text-xs font-bold text-gray-700">{periodName}</span>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main Drilldown body */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-auto p-6 gap-6">
          {/* Header & Status Actions */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-violet-100 border border-violet-200 text-violet-700 flex items-center justify-center font-bold text-sm select-none">
                {drilldownData.rep.avatarInitials}
              </div>
              <div className="flex flex-col">
                 <h2 className="text-lg font-bold text-gray-900 leading-none">{drilldownData.rep.name}</h2>
                 <span className="text-xs text-gray-500 mt-1">Quota Attainment: {drilldownData.targetAttainment.quota && drilldownData.targetAttainment.quota > 0 ? Math.min(Math.round(((drilldownData.targetAttainment.closed + (totalCommit ?? 0)) / drilldownData.targetAttainment.quota) * 100), 100) : 0}%</span>
              </div>
            </div>

            {/* Approval controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 mr-1 flex items-center gap-1.5">
                Status:{' '}
                <span className={`font-bold capitalize px-2.5 py-0.5 rounded-full text-[10px] border ${
                  repStatus === 'approved'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : repStatus === 'reopened'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {repStatus === 'submitted' ? 'Pending Manager Approval' : repStatus}
                </span>
              </span>
              
              {drilldownData.submission?.id && (
                <div className="flex items-center gap-1.5 ml-2">
                  {repStatus === 'submitted' && (
                    <button
                      onClick={handleApprove}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      Approve
                    </button>
                  )}
                  {(repStatus === 'submitted' || repStatus === 'approved') && (
                    <button
                      onClick={handleReopen}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Key Summary metrics cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1 shadow-sm">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pipeline</span>
              <span className="text-base font-bold text-gray-900">{formatCurrency(displayPipeline)}</span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1 shadow-sm">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Best Case</span>
              <span className="text-base font-bold text-gray-900">
                {formatCurrency(totalBestCase)}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1 shadow-sm">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Commit</span>
              <span className="text-base font-bold text-gray-900">
                {formatCurrency(totalCommit)}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1 shadow-sm">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Closed Won</span>
              <span className="text-base font-bold text-gray-900">{formatCurrency(displayClosed)}</span>
            </div>
          </div>

          {/* Drilldown Deals Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm mt-2">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Deals</th>
                  <th className="py-3 px-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Pipeline</th>
                  <th className="py-3 px-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Best Case <SourceColumnInfoTooltip text="Sales Rep Best Case Forecast" />
                  </th>
                  <th className="py-3 px-4 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Commit <SourceColumnInfoTooltip text="Sales Rep Commit Forecast" />
                  </th>
                  <th className="py-3 px-4 text-right text-[10px] font-bold uppercase tracking-wider text-gray-400">Closed</th>
                  <th className="py-3 px-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Deal Name info */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400">{deal.accountName}</span>
                        <span className="text-xs font-semibold text-blue-600">{deal.dealName}</span>
                      </div>
                    </td>

                    {/* Pipeline */}
                    <td className="py-3 px-4 text-right text-xs font-medium text-gray-700">
                      {deal.isClosedWon || deal.isClosedLost ? '$0' : formatCurrency(deal.amount)}
                    </td>

                    {/* Best Case cell */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center">
                        <SourceSubmissionCell
                          cell={{
                            value: deal.bestCase ?? null,
                            submissionId: null,
                            lastUpdatedAt: null,
                            isAutoSubmit: false,
                            note: null,
                            managerAnnotation: deal.managerAnnotation ?? null,
                          }}
                          status={deal.submissionStatus}
                          emptyLabel="$0"
                          isActive={activeColumnKey === 'bestCase' && activeDealId === deal.id}
                          isEditable={isEditable && !!bestCaseCol}
                          onClick={() => {
                            setActiveColumnKey('bestCase');
                            setActiveDealId(deal.id);
                          }}
                          requestedValue={deal.requestedBestCase}
                        />
                      </div>
                    </td>

                    {/* Commit cell */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center">
                        <SourceSubmissionCell
                          cell={{
                            value: deal.commit ?? null,
                            submissionId: null,
                            lastUpdatedAt: null,
                            isAutoSubmit: false,
                            note: null,
                            managerAnnotation: deal.managerAnnotation ?? null,
                          }}
                          status={deal.submissionStatus}
                          emptyLabel="$0"
                          isActive={activeColumnKey === 'commit' && activeDealId === deal.id}
                          isEditable={isEditable && !!commitCol}
                          onClick={() => {
                            setActiveColumnKey('commit');
                            setActiveDealId(deal.id);
                          }}
                          requestedValue={deal.requestedCommit}
                        />
                      </div>
                    </td>

                    {/* Closed */}
                    <td className="py-3 px-4 text-right text-xs font-medium text-gray-700">
                      {deal.isClosedWon ? formatCurrency(deal.amount) : '$0'}
                    </td>

                    {/* Target quota progress */}
                    <td className="py-3 px-4">
                      <SourceTargetProgressBar
                        quota={drilldownData.targetAttainment.quota}
                        closed={drilldownData.targetAttainment.closed}
                        commit={deal.commit}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <p className="text-[10px] text-gray-400 px-1 mt-1 font-sans">
            * Best Case and Commit reflect period-level values for {drilldownData.rep.name}.
          </p>
        </div>

        {/* Standard Commit Submission Panel */}
        {activeColumnKey && (activeColumnKey === 'bestCase' ? bestCaseCol : commitCol) && activeDeal && (
          <SourceSubmissionPanel
            columnLabel={activeColumnLabel}
            columnId={activeColumnId}
            periodName={periodName}
            boardId={boardId}
            repUserId={drilldownData.rep.id}
            initialValue={activeValue}
            initialNote={drilldownData.submission?.notes ?? null}
            rollup={rollup}
            targetAttainment={drilldownData.targetAttainment}
            teamName={teamName}
            isManagerView={true}
            existingAnnotation={activeDeal.managerAnnotation}
            existingStatus={activeDeal.submissionStatus}
            teamSubmissions={[]} // Rollup submissions aren't strictly required in rep drilldown panel
            requestedValue={activeColumnKey === 'bestCase' ? activeDeal.requestedBestCase : activeDeal.requestedCommit}
            requestedNote={activeColumnKey === 'bestCase' ? activeDeal.requestedBestCaseNote : activeDeal.requestedCommitNote}
            onSaveSuccess={(v, note) => {
              handleOverrideSubmit(v, note || '');
            }}
            onApproveRequestSuccess={async () => {
              if (refreshDrilldown) {
                await refreshDrilldown();
              }
              setActiveColumnKey(null);
              setActiveDealId(null);
            }}
            onClose={() => {
              setActiveColumnKey(null);
              setActiveDealId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
