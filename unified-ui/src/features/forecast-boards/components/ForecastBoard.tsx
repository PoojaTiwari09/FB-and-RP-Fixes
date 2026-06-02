'use client';

import React, { useMemo, useState } from 'react';
import type { ForecastBoardPayload } from '../../api';
import PipelineCoverageCard from './PipelineCoverageCard';

function formatCr(val: number) {
  return (val / 10000000).toFixed(2);
}

export default function ForecastBoard({
  board,
  userId,
  onSubmit,
}: {
  board: ForecastBoardPayload;
  userId: string;
  onSubmit: (amount: number, dealIds: string[], bestCaseAmount?: number, notes?: string) => Promise<void>;
}) {
  const mySubmission = useMemo(
    () => board.submissions.find((s) => s.userId === userId),
    [board.submissions, userId],
  );

  const [amount, setAmount] = useState(
    mySubmission ? String(mySubmission.submittedAmount) : '',
  );
  const [dealIds, setDealIds] = useState('');
  const [bestCaseAmount, setBestCaseAmount] = useState(
    mySubmission?.bestCaseAmount ? String(mySubmission.bestCaseAmount) : '',
  );
  const [notes, setNotes] = useState(mySubmission?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitDisabled = board.isLocked;

  const handleSubmit = async () => {
    setError(null);
    const parsed = Number(amount);
    if (Number.isNaN(parsed) || parsed < 0) {
      setError('Enter a valid non-negative forecast amount.');
      return;
    }
    const parsedBestCase = bestCaseAmount ? Number(bestCaseAmount) : undefined;
    if (parsedBestCase !== undefined && (Number.isNaN(parsedBestCase) || parsedBestCase < 0)) {
      setError('Enter a valid non-negative best case amount.');
      return;
    }
    const committedDealIds = dealIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      await onSubmit(parsed, committedDealIds, parsedBestCase, notes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
              Forecast board · {board.name}
            </p>
            <h2 className="text-2xl font-semibold text-gray-900">
              Revenue target ₹{formatCr(board.revenueTarget)}Cr
            </h2>
            {board.isLocked && (
              <p className="text-sm text-red-600 mt-2 font-medium">
                Period is locked — submissions are disabled.
              </p>
            )}
          </div>
          {board.aiPrediction ? (
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">AI projection</p>
              <p className="text-3xl font-light text-blue-700">
                ₹{formatCr(board.aiPrediction.predictedAmount)}Cr
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Range ₹{formatCr(board.aiPrediction.confidenceRangeLow)}–
                {formatCr(board.aiPrediction.confidenceRangeHigh)}Cr
              </p>
            </div>
          ) : (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
              AI prediction pending — other board data is still available.
            </p>
          )}
        </div>
      </div>

      <PipelineCoverageCard metrics={board.coverageMetrics} revenueTarget={board.revenueTarget} />

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Team submissions (latest version)</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-widest">
              <th className="px-6 py-3 text-left">User</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Version</th>
              <th className="px-4 py-3 text-left">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {board.submissions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                  No manual submissions yet for this period.
                </td>
              </tr>
            ) : (
              board.submissions.map((s) => (
                <tr key={s.submissionId} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800">{s.userId}</td>
                  <td className="px-4 py-3 text-right">₹{formatCr(s.submittedAmount)}Cr</td>
                  <td className="px-4 py-3 text-center text-gray-600">v{s.version}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(s.submittedAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 text-sm mb-4">Your manual forecast</h3>
        {mySubmission && (
          <p className="text-xs text-gray-500 mb-3">
            Current: ₹{formatCr(mySubmission.submittedAmount)}Cr (v{mySubmission.version}) — submitting
            creates a new version.
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block" htmlFor="m06-submit-amount">
            <span className="text-xs text-gray-600">Submitted amount</span>
            <input
              id="m06-submit-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={submitDisabled}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </label>
          <label className="block" htmlFor="m06-deal-ids">
            <span className="text-xs text-gray-600">Committed deal IDs (comma-separated UUIDs)</span>
            <input
              id="m06-deal-ids"
              type="text"
              value={dealIds}
              onChange={(e) => setDealIds(e.target.value)}
              disabled={submitDisabled}
              placeholder="uuid-1, uuid-2"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </label>
          <label className="block" htmlFor="m06-best-case">
            <span className="text-xs text-gray-600">Best case amount (optional)</span>
            <input
              id="m06-best-case"
              type="number"
              min={0}
              value={bestCaseAmount}
              onChange={(e) => setBestCaseAmount(e.target.value)}
              disabled={submitDisabled}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </label>
          <label className="block md:col-span-2" htmlFor="m06-notes">
            <span className="text-xs text-gray-600">Notes (optional)</span>
            <textarea
              id="m06-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitDisabled}
              rows={2}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 resize-none"
            />
          </label>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitDisabled || submitting}
          className="mt-4 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting…' : 'Submit forecast'}
        </button>
      </div>
    </div>
  );
}
