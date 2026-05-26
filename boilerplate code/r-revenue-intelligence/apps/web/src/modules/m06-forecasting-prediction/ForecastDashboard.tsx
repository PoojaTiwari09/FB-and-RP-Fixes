'use client';
import React, { useState, useEffect, useRef } from 'react';
import AddDealModal, { computeDealContribution } from './AddDealModal';

const LOBS = ['All', 'Enterprise Software', 'Consulting Services', 'Hardware', 'Cloud Services'];
const BASELINES = [
  { label: 'Current baseline', value: '' },
  { label: 'Avg of last 2 periods', value: 'avg_last_2' },
  { label: 'Last period (Q1 FY26)', value: 'last_period' },
  { label: 'Same period last year (Q2 FY25)', value: 'same_period_last_year' },
];

function formatCr(val: number) { return (val / 10000000).toFixed(1); }
function formatL(val: number) { return (val / 100000).toFixed(1); }

function ProgressBar({ closed, pipeline, expected }: { closed: number; pipeline: number; expected: number }) {
  const total = closed + pipeline + expected || 1;
  return (
    <div className="w-full h-3 flex rounded-full overflow-hidden gap-0.5 my-4">
      <div className="bg-blue-600 h-full rounded-l-full transition-all duration-500" style={{ width: `${(closed / total) * 100}%` }} />
      <div className="bg-blue-400 h-full transition-all duration-500" style={{ width: `${(pipeline / total) * 100}%` }} />
      <div className="bg-blue-200 h-full rounded-r-full transition-all duration-500" style={{ width: `${(expected / total) * 100}%` }} />
    </div>
  );
}

const confStyle = (c: string) =>
  c === 'High' ? { label: '● High', cls: 'text-green-600' }
  : c === 'Med' ? { label: '◕ Med', cls: 'text-amber-500' }
  : { label: '○ Low', cls: 'text-red-500' };

export default function ForecastDashboard({
  data,
  onSeeTheMath,
  onCreateDeal,
  onBaselineChange,
  isPeriodLocked,
}: {
  data: any;
  onSeeTheMath: () => void;
  onCreateDeal?: (deal: any) => Promise<void>;
  onBaselineChange?: (baseline: string) => Promise<void>;
  isPeriodLocked?: boolean;
}) {
  const [lob, setLob] = useState(LOBS[0]);
  const [baseline, setBaseline] = useState(BASELINES[0].value);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  // Pending deals = deals added since last backend reload (used for optimistic UI)
  const [pendingDeals, setPendingDeals] = useState<any[]>([]);
  const [isNewDealHighlighted, setIsNewDealHighlighted] = useState(false);
  // Track which deal IDs are already shown from the backend, to avoid duplication
  const knownDealNamesRef = useRef<Set<string>>(new Set());

  if (!data?.aiPrediction) return null;

  const { predictedAmount, computedAt, confidenceRangeLow, confidenceRangeHigh, explainability } = data.aiPrediction;
  const { closedWonDetails = { total: 0, deals: [] }, pipelineByStage = [], expectedDeals = { rate: 0, addressablePipeline: 0, contribution: 0 } } = explainability ?? {};
  const periodName = data.period?.name || 'Q2 FY26';
  const periodEnd = data.period?.endDate
    ? new Date(data.period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Jun 30, 2026';

  // Backend seed deals
  const backendDeals: any[] = explainability.deals ?? [];

  // Sync: when backend refreshes and picks up a deal we added, remove it from pendingDeals
  useEffect(() => {
    const currentNames = new Set(backendDeals.map((d: any) => (d.deal || d.dealName || '').toLowerCase()));
    setPendingDeals(prev => prev.filter(p => !currentNames.has((p.deal || '').toLowerCase())));
    knownDealNamesRef.current = currentNames;
  }, [backendDeals.length]);

  // Filter by LOB
  const filteredBackend = lob === 'All' ? backendDeals : backendDeals.filter(d => d.lob === lob);
  const filteredPending = lob === 'All' ? pendingDeals : pendingDeals.filter(d => d.lob === lob);
  const allFilteredDeals = [...filteredBackend, ...filteredPending];

  // Weighted pipeline totals
  const seedPipelineTotal = filteredBackend.reduce((s: number, p: any) => s + (p.contribution ?? 0), 0);
  const newDealsContribution = filteredPending.reduce((s, d) => s + (d.contribution ?? 0), 0);
  const totalPipeline = seedPipelineTotal + newDealsContribution;
  const expectedContribution = lob === 'All' || lob === 'Enterprise Software' ? expectedDeals.contribution : 0;
  const closedWonTotal = lob === 'All' || lob === 'Enterprise Software' ? closedWonDetails.total : 0;

  // Live projection = backend amount + any pending deals not yet in backend
  const currentProjection = lob === 'All' ? predictedAmount + newDealsContribution : closedWonTotal + totalPipeline + expectedContribution;
  const projectionChanged = pendingDeals.length > 0;

  const handleAddDeal = async (newDeal: any) => {
    // Add to optimistic/pending list immediately
    setPendingDeals(prev => [...prev, { ...newDeal, _isNew: true }]);
    setIsNewDealHighlighted(true);
    setTimeout(() => setIsNewDealHighlighted(false), 4000);
    // Persist to backend and reload
    await onCreateDeal?.(newDeal);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Hero — AI Projection Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
              AI Revenue Projection · {periodName}
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-[3.5rem] font-light text-gray-900 leading-none transition-all duration-700">
                ₹{formatCr(currentProjection)}
              </span>
              <span className="text-2xl font-light text-gray-400">Cr</span>
              {projectionChanged && (
                <span className="ml-2 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full animate-pulse">
                  ↑ Updated
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 flex-wrap">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
              <span>Updated today · {new Date(computedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-gray-300">·</span>
              <span>Range: ₹{formatCr(confidenceRangeLow)}Cr – ₹{formatCr(confidenceRangeHigh)}Cr</span>
              <span className="text-gray-300">·</span>
              <span>Current period closes {periodEnd}</span>
              {projectionChanged && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-green-600 font-medium">
                    +₹{formatCr(newDealsContribution)}Cr from {filteredPending.length} pending deal{filteredPending.length !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* LOB Filter */}
          <div className="flex flex-col items-end gap-2">
            <label className="text-[11px] text-gray-400 font-medium">Filter by LOB</label>
            <select
              value={lob}
              onChange={(e) => setLob(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LOBS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Baseline Selector */}
        <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium text-gray-600">Projection baseline:</span>
              {BASELINES.map((b) => (
                <button
                  key={b.value}
                  onClick={() => { setBaseline(b.value); onBaselineChange?.(b.value); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    baseline === b.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <button
              onClick={onSeeTheMath}
              className="text-blue-600 text-xs font-semibold hover:text-blue-800 flex items-center gap-1 whitespace-nowrap"
            >
              See the math
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            {data.aiPrediction?.baselineNote || 'Uses current period conversion rates.'}
          </p>
        </div>

        {/* Stacked Bar */}
        <div className="mt-4">
          <ProgressBar closed={closedWonTotal} pipeline={totalPipeline} expected={expectedContribution} />
          <div className="flex gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />
              <span>Closed-won</span>
              <strong className="text-gray-900">₹{formatCr(closedWonTotal)}Cr</strong>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" />
              <span>Weighted pipeline</span>
              <strong className="text-gray-900">₹{formatCr(totalPipeline)}Cr</strong>
              {newDealsContribution > 0 && (
                <span className="text-[10px] text-green-600 font-medium">(+₹{formatCr(newDealsContribution)}Cr new)</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="w-3 h-3 rounded-sm bg-blue-200 inline-block" />
              <span>Expected deals</span>
              <strong className="text-gray-900">₹{formatCr(expectedContribution)}Cr</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Overview Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Pipeline Overview</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Active deals contributing to your AI projection</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{allFilteredDeals.length} deals</span>
            <button
              onClick={() => setIsAddDealOpen(true)}
              disabled={isPeriodLocked}
              title={isPeriodLocked ? "Deal creation disabled for closed/locked periods" : ""}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Deal
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest font-semibold">
              <th className="px-6 py-3 text-left">Deal</th>
              <th className="px-4 py-3 text-left">Stage</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">AI Confidence</th>
              <th className="px-4 py-3 text-left">Expected Close</th>
              <th className="px-4 py-3 text-center">Factor</th>
              <th className="px-4 py-3 text-right">Contribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allFilteredDeals.map((d: any, i: number) => {
              const { label, cls } = confStyle(d.aiConf ?? 'Med');
              const isNewRow = d._isNew && isNewDealHighlighted;
              const dealContrib = d.contribution ?? computeDealContribution(d.amount, d.stage, d.closeDate ?? new Date().toISOString());
              const contributionFactor = d.contributionFactor ?? (d.amount > 0 ? dealContrib / d.amount : 0);
              return (
                <tr
                  key={`${d.deal ?? d.dealName}-${i}`}
                  className={`transition-all ${isNewRow ? 'bg-green-50 border-l-4 border-l-green-400' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      {d.hubspotId ? (
                        <a 
                          href={`https://app.hubspot.com/contacts/demo/deal/${d.hubspotId}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {d.deal ?? d.dealName}
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <span className="font-medium text-gray-800">{d.deal ?? d.dealName}</span>
                      )}
                      {d._isNew && (
                        <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">NEW</span>
                      )}
                    </div>
                    {d.accountName && <p className="text-[10px] text-gray-400 mt-0.5">{d.accountName}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{d.stage}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-800">₹{formatL(d.amount)}L</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold text-xs ${cls}`}>{label}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{d.close ?? (d.closeDate ? new Date(d.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-')}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">{(contributionFactor * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-blue-700">₹{formatL(dealContrib)}L</td>
                </tr>
              );
            })}
          </tbody>
          {pendingDeals.length > 0 && (
            <tfoot>
              <tr className="bg-blue-50 border-t-2 border-blue-100">
                <td colSpan={6} className="px-6 py-2.5 text-xs font-bold text-blue-800">
                  New deals contribution to projection (pending backend sync)
                </td>
                <td className="px-4 py-2.5 text-right text-sm font-black text-blue-800">
                  +₹{formatCr(newDealsContribution)}Cr
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Add Deal Modal */}
      <AddDealModal
        isOpen={isAddDealOpen}
        onClose={() => setIsAddDealOpen(false)}
        onAdd={handleAddDeal}
      />
    </div>
  );
}
