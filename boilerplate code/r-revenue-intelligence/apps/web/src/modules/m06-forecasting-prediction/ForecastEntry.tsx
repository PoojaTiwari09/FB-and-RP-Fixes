'use client';
import React, { useState, useEffect } from 'react';

const LOBS = ['Enterprise Software', 'Consulting Services', 'Hardware', 'Cloud Services'];

function formatCr(val: number) { return (val / 10000000).toFixed(1); }
function formatL(val: number) { return (val / 100000).toFixed(1); }

function AIComparisonPanel({ aiPrediction, commitForecast, managerOverride, lob, quotaAmount }: { aiPrediction: any; commitForecast: number; managerOverride?: number | null; lob: string; quotaAmount: number }) {
  if (!aiPrediction || !commitForecast) return null;
  
  const predicted = aiPrediction.predictedAmount ?? 0;
  const effectiveCommit = managerOverride ?? commitForecast;
  // Use actual quota from DB if available, otherwise fallback
  const quota = quotaAmount || (predicted * 1.1);
  const variance = effectiveCommit - predicted;
  const variancePct = predicted > 0 ? ((variance / predicted) * 100).toFixed(1) : '0.0';
  const riskScore = effectiveCommit < predicted * 0.70 ? 'High' : effectiveCommit < predicted * 0.85 ? 'Medium' : 'Low';

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mt-4">
      <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-widest mb-3">AI Comparison · {lob}</p>

      {/* Manager override callout */}
      {managerOverride != null && managerOverride !== commitForecast && (
        <div className="mb-3 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
          <span className="text-orange-500 text-sm mt-0.5">⚠</span>
          <div className="text-xs text-orange-800 leading-relaxed">
            <span className="font-semibold">Manager adjusted your commit:</span>{' '}
            ₹{formatL(commitForecast)}L → <span className="font-bold">₹{formatL(managerOverride)}L</span>
            <span className="ml-1 text-orange-600">(Δ {managerOverride > commitForecast ? '+' : ''}₹{formatL(managerOverride - commitForecast)}L)</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Your Quota', value: `₹${formatCr(quota)}Cr`, color: 'text-gray-700' },
          { label: 'AI Projection', value: `₹${formatCr(predicted)}Cr`, color: 'text-blue-700' },
          { label: managerOverride ? 'Effective Commit (after override)' : 'Your Commit', value: `₹${formatCr(effectiveCommit)}Cr`, color: managerOverride ? 'text-orange-700' : 'text-gray-800' },
          { label: 'Variance vs AI', value: `${variance >= 0 ? '+' : ''}₹${formatCr(Math.abs(variance))}Cr (${variancePct}%)`, color: variance >= 0 ? 'text-green-600' : 'text-red-600' },
          { label: 'Risk Score', value: riskScore, color: riskScore === 'Low' ? 'text-green-600' : riskScore === 'Medium' ? 'text-amber-600' : 'text-red-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-lg p-3 border border-blue-100">
            <p className="text-[10px] text-gray-500 mb-1">{item.label}</p>
            <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
            {item.label === 'Your Quota' && quota > 0 && (
              <p className="text-[9px] text-gray-400 mt-1">Attainment: {((effectiveCommit / quota) * 100).toFixed(1)}%</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LifecycleTracker({ status }: { status: string }) {
  const stages = [
    { key: 'draft', label: 'Draft Created' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'reopened', label: 'Reopened' },
    { key: 'resubmitted', label: 'Resubmitted' },
    { key: 'approved', label: 'Approved' },
  ];
  const stageOrder = ['draft', 'submitted', 'under_review', 'reopened', 'resubmitted', 'approved'];
  const currentIdx = stageOrder.indexOf(status === 'submitted' ? 'under_review' : status);

  return (
    <div className="mt-6 pt-5 border-t border-gray-100">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">Forecast Lifecycle</p>
      <div className="relative flex items-start gap-0">
        {stages.map((stage, i) => {
          const isDone = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={stage.key} className="flex-1 flex flex-col items-center">
              <div className="relative flex items-center w-full">
                {i > 0 && <div className={`h-0.5 flex-1 ${i <= currentIdx ? 'bg-blue-500' : 'bg-gray-200'}`} />}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 flex-shrink-0 transition-all ${
                  isDone ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200'
                } ${isCurrent ? 'ring-2 ring-blue-200 ring-offset-1' : ''}`}>
                  {isDone ? (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  )}
                </div>
                {i < stages.length - 1 && <div className={`h-0.5 flex-1 ${i < currentIdx ? 'bg-blue-500' : 'bg-gray-200'}`} />}
              </div>
              <p className={`text-[9px] mt-1.5 text-center leading-tight font-medium ${isDone ? 'text-blue-700' : 'text-gray-400'}`}>
                {stage.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ForecastEntry({
  submission,
  aiPrediction,
  onSubmit,
  hasActiveDeals = true,
  isPeriodLocked = false,
  forecastEntryLocked = false,
  drafts = [],
  quotaAmount = 0,
}: {
  submission: any;
  aiPrediction: any;
  onSubmit: (data: any) => void;
  hasActiveDeals?: boolean;
  isPeriodLocked?: boolean;
  forecastEntryLocked?: boolean;
  drafts?: any[];
  quotaAmount?: number;
}) {
  const [lob, setLob] = useState(submission?.lob || 'Enterprise Software');
  const [commit, setCommit] = useState(String(submission?.commitForecast ?? ''));
  const [bestCase, setBestCase] = useState(String(submission?.bestCaseForecast ?? ''));
  const [notes, setNotes] = useState(submission?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

  // Keep form in sync whenever submission changes (e.g. after manager override reloads)
  useEffect(() => {
    if (submission) {
      setLob(submission.lob || 'Enterprise Software');
      setCommit(String(submission.commitForecast ?? ''));
      setBestCase(String(submission.bestCaseForecast ?? ''));
      setNotes(submission.notes ?? '');
    }
  }, [submission]);

  const isReopened = submission?.status === 'reopened';
  const fieldsDisabled = forecastEntryLocked || !hasActiveDeals || isPeriodLocked;

  const managerOverride: number | null = submission?.managerOverride ?? null;
  const hasOverride = managerOverride != null && managerOverride !== Number(commit);

  // Effective commit shown to rep = manager override if present
  const effectiveCommit = managerOverride ?? Number(commit);

  const handleSave = async () => {
    setSaving(true);
    await onSubmit({ lob, commitForecast: Number(commit), bestCaseForecast: bestCase ? Number(bestCase) : undefined, notes, status: 'draft' });
    setSaving(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({ lob, commitForecast: Number(commit), bestCaseForecast: bestCase ? Number(bestCase) : undefined, notes, status: 'submitted' });
    setSubmitting(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">

      {/* Manager Override Banner inside the card */}
      {hasOverride && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-orange-800">Manager has adjusted your commit</p>
            <p className="text-xs text-orange-700 mt-0.5 leading-relaxed">
              Your original commit of <strong>₹{formatL(Number(commit))}L</strong> has been adjusted to{' '}
              <strong>₹{formatL(managerOverride!)}L</strong> by your manager.
              {submission?.managerComment && (
                <span className="block mt-1 italic">"{submission.managerComment}"</span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Manager Feedback on Reopen */}
      {isReopened && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">RS</div>
            <span className="text-sm font-semibold text-orange-800">Manager Feedback</span>
          </div>
          <p className="text-sm text-orange-800 italic leading-relaxed">
            "{submission?.managerComment || 'Commit appears aggressive compared to pipeline quality. Please revise your commit to better align with the deals currently in late-stage negotiation.'}"
          </p>
        </div>
      )}

      {/* Approved Banner */}
      {submission?.status === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-green-800">Forecast Approved</p>
            <p className="text-xs text-green-600">
              Effective commit: ₹{formatL(effectiveCommit)}L
              {hasOverride && <span className="text-orange-600 ml-2">(manager adjusted from ₹{formatL(Number(commit))}L)</span>}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            {isReopened ? 'Revise Your Forecast' : 'Forecast Entry'}
            {!isPeriodLocked && drafts.length > 0 && (
              <button onClick={() => setShowDrafts(!showDrafts)} className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Saved Drafts ({drafts.length})
              </button>
            )}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Enter your commit and best case forecast for the quarter</p>
        </div>
        {forecastEntryLocked && (
          <div className="group relative inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full cursor-help">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {submission?.status === 'approved' ? 'Approved — Read Only' : 'Submitted — Read Only'}
            {!isPeriodLocked && (
              <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 text-center p-2 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-normal z-50 left-1/2 transform -translate-x-1/2">
                Submitted — add a new deal to edit
              </div>
            )}
          </div>
        )}
      </div>

      {isPeriodLocked ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5 text-sm text-gray-700">
          This period is closed. Forecast entry and deal creation are no longer available.
        </div>
      ) : !hasActiveDeals && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-800">
          Create a deal first to enable forecast entry.
        </div>
      )}

      {showDrafts && (
        <div className="mb-6 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-600">Saved Drafts</span>
            <button onClick={() => setShowDrafts(false)} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
          <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {drafts.map((d: any) => (
              <div key={d.id} className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center" onClick={() => {
                setLob(d.lob || 'Enterprise Software');
                setCommit(String(d.commitForecast ?? ''));
                setBestCase(String(d.bestCaseForecast ?? ''));
                setNotes(d.notes ?? '');
                setShowDrafts(false);
              }}>
                <div>
                  <p className="text-xs font-semibold text-gray-800">₹{formatL(d.commitForecast)}L</p>
                  <p className="text-[10px] text-gray-400">{new Date(d.createdAt).toLocaleString()} · {d.lob}</p>
                </div>
                <span className="text-[10px] font-medium text-blue-600 bg-white border border-blue-200 px-2 py-1 rounded">Restore</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {/* LOB */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Line of Business</label>
          <select
            disabled={fieldsDisabled}
            value={lob}
            onChange={(e) => setLob(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {LOBS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>

        {/* Commit Forecast */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {isReopened ? 'Revised Commit Forecast *' : 'Commit Forecast *'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <input
              type="text"
              disabled={fieldsDisabled}
              value={commit ? Number(commit).toLocaleString('en-IN') : ''}
              onChange={(e) => setCommit(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
            />
          </div>
          {commit && <p className="text-[10px] text-gray-400 mt-1">≈ ₹{formatCr(Number(commit))} Cr</p>}
          {hasOverride && (
            <p className="text-[10px] text-orange-600 mt-1 font-medium">
              Manager adjusted to ₹{formatL(managerOverride!)}L
            </p>
          )}
        </div>

        {/* Best Case Forecast */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Best Case Forecast (optional)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
            <input
              type="text"
              disabled={fieldsDisabled}
              value={bestCase ? Number(bestCase).toLocaleString('en-IN') : ''}
              onChange={(e) => setBestCase(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed font-medium"
            />
          </div>
          {bestCase && <p className="text-[10px] text-gray-400 mt-1">≈ ₹{formatCr(Number(bestCase))} Cr</p>}
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {isReopened ? 'Revised Justification' : 'Notes / Justification'}
          </label>
          <textarea
            rows={3}
            disabled={fieldsDisabled}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. HDFC renewal pending legal sign-off. Infosys expansion highly likely to close by June 22..."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed resize-none"
          />
        </div>
      </div>

      {/* AI Comparison Panel — Approval-Gated Display */}
      {submission?.status === 'approved' ? (
        <AIComparisonPanel
          aiPrediction={aiPrediction}
          commitForecast={Number(commit)}
          managerOverride={managerOverride}
          lob={lob}
          quotaAmount={quotaAmount}
        />
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mt-6 text-center">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">AI Comparison</p>
          <p className="text-xs text-gray-500">AI comparison will be available after manager approval.</p>
        </div>
      )}

      {/* Action Buttons */}
      {!forecastEntryLocked && (
        <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving || submitting || !hasActiveDeals}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!commit || submitting || saving || !hasActiveDeals}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {submitting ? 'Submitting...' : isReopened ? 'Resubmit Forecast' : 'Submit Forecast'}
          </button>
        </div>
      )}

      {/* Lifecycle Tracker */}
      <LifecycleTracker status={submission?.status || 'draft'} />
    </div>
  );
}
