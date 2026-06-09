'use client';
import React from 'react';

function formatCr(val: number) {
  return (val / 10000000).toFixed(1);
}

export default function MathDrawer({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: { math: any; period?: any };
}) {
  if (!isOpen || !data?.math) return null;
  const { closedWonDetails, pipelineByStage, expectedDeals, deals } = data.math;
  const periodName = data.period?.name || 'Q2 FY26';
  const safeDeals: any[] = deals ?? [];
  const safePipelineByStage: any[] = pipelineByStage ?? [];
  const safeClosedWonDetails = closedWonDetails ?? { total: 0, deals: [] };
  const safeExpectedDeals = expectedDeals ?? { rate: 0, addressablePipeline: 0, contribution: 0 };

  const pipelineTotal = safePipelineByStage.reduce((s: number, p: any) => s + p.contribution, 0);
  const grandTotal = safeClosedWonDetails.total + pipelineTotal + safeExpectedDeals.contribution;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-sm">How the AI calculated your projection</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Breakdown of ₹{formatCr(grandTotal)}Cr — {periodName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Reconciliation Banner */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <span className="text-[11px] text-blue-600 font-medium">Reconciles to:</span>
        <span className="text-xs font-bold text-blue-800">
            ₹{formatCr(safeClosedWonDetails.total)}Cr + ₹{formatCr(pipelineTotal)}Cr + ₹{formatCr(safeExpectedDeals.contribution)}Cr = ₹{formatCr(grandTotal)}Cr
          </span>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

          {/* Section 1: Closed Won */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                Closed-won deals
              </div>
              <span className="text-sm font-bold text-gray-900">₹{formatCr(safeClosedWonDetails.total)}Cr</span>
            </div>
            <ul className="divide-y divide-gray-50">
              {safeClosedWonDetails.deals.map((d: any, i: number) => (
                <li key={i} className="flex justify-between items-center px-4 py-2.5 text-sm">
                  <span className="text-gray-600">{d.name}</span>
                  <span className="font-medium text-gray-900">₹{formatCr(d.amount)}Cr</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 2: Weighted Pipeline */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-400" />
                Weighted pipeline by stage
              </div>
              <span className="text-sm font-bold text-gray-900">₹{formatCr(pipelineTotal)}Cr</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                  <th className="px-4 py-2.5 text-left">Stage</th>
                  <th className="px-4 py-2.5 text-right">Pipeline</th>
                  <th className="px-4 py-2.5 text-center">Conv. %</th>
                  <th className="px-4 py-2.5 text-right">Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {safePipelineByStage.map((p: any, i: number) => (
                  <tr key={i} className="text-sm">
                    <td className="px-4 py-2.5 text-gray-700">{p.stage}</td>
                    <td className="px-4 py-2.5 text-right text-gray-600">₹{formatCr(p.pipeline)}Cr</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-blue-600 font-semibold text-xs">{(p.convRate * 100).toFixed(0)}%</span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">₹{formatCr(p.contribution)}Cr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: Expected Deals */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-200" />
                Expected deals (historical rate)
              </div>
              <span className="text-sm font-bold text-gray-900">₹{formatCr(safeExpectedDeals.contribution)}Cr</span>
            </div>
            <div className="px-4 py-3 text-sm flex flex-col gap-2">
              <div className="flex justify-between text-gray-600">
                <span>Historical expected-deal rate</span>
                <span className="font-semibold text-blue-600">{(safeExpectedDeals.rate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Addressable pipeline this period</span>
                <span className="font-medium text-gray-900">₹{formatCr(safeExpectedDeals.addressablePipeline)}Cr</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-800">Projected contribution</span>
                <span className="font-bold text-blue-600">₹{formatCr(safeExpectedDeals.contribution)}Cr</span>
              </div>
            </div>
          </div>

          {/* Pipeline Overview Inside Math Drawer */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Active Deal Contributions</p>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{safeDeals.length} deals</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50">
                <tr className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold border-b border-gray-100">
                  <th className="px-4 py-2.5 text-left">Deal</th>
                  <th className="px-4 py-2.5 text-left">Stage</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5 text-center">AI Conf.</th>
                  <th className="px-4 py-2.5 text-left">Close</th>
                  <th className="px-4 py-2.5 text-right">Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {safeDeals.map((d: any, i: number) => {
                  const factor = d.contributionFactor ?? (d.stageRate && d.timeDecay ? d.stageRate * d.timeDecay : undefined);
                  return (
                    <tr key={i}>
                      <td className="px-4 py-2.5 font-medium text-gray-800 text-xs">{d.deal}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{d.stage}</td>
                      <td className="px-4 py-2.5 text-right text-gray-800 text-xs font-semibold">₹{(d.amount / 100000).toFixed(1)}L</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-xs font-semibold ${
                          d.aiConf === 'High' ? 'text-green-600' :
                          d.aiConf === 'Med' ? 'text-amber-500' : 'text-red-500'
                        }`}>{d.aiConf}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{d.close}</td>
                      <td className="px-4 py-2.5 text-right text-gray-800 text-xs font-semibold">
                        {factor ? `${(factor * 100).toFixed(0)}%` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Formula Note */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">AI Calculation Formula</p>
            <p className="text-xs text-gray-600 font-mono leading-relaxed bg-white border border-gray-100 rounded-lg p-3">
              Expected Revenue =<br />
              Closed-won + Σ(Pipeline_s × C_s) + (Rate × Addressable Pipeline)
            </p>
            <p className="text-[10px] text-gray-400 mt-2">Where C_s = historical conversion rate for stage s. Time decay factor applied for stagnant deals.</p>
            <p className="text-[10px] text-gray-400 mt-2">AI confidence also considers stage strength, meetings activity, email engagement, sentiment, stakeholder presence, deal movement, close-date stability, competitor mentions, forecast history, and activity recency.</p>
          </div>
        </div>
      </div>
    </>
  );
}
