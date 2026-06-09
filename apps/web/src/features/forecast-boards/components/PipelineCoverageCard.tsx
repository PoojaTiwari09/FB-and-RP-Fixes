'use client';

import React from 'react';

function formatCr(val: number) {
  return (val / 10000000).toFixed(2);
}

export default function PipelineCoverageCard({
  metrics,
  revenueTarget,
}: {
  metrics: {
    openPipelineValue: number;
    weightedPipelineValue: number;
    coverageRatio: number;
    computedAt: string;
  } | null;
  revenueTarget: number;
}) {
  if (!metrics) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        Pipeline coverage metrics are not available yet. The board will still load other sections.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
        Pipeline coverage
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Open pipeline</p>
          <p className="text-lg font-semibold text-gray-900">₹{formatCr(metrics.openPipelineValue)}Cr</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Weighted pipeline</p>
          <p className="text-lg font-semibold text-blue-700">₹{formatCr(metrics.weightedPipelineValue)}Cr</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Coverage ratio</p>
          <p className="text-lg font-semibold text-gray-900">{metrics.coverageRatio.toFixed(2)}×</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 mb-1">Revenue target</p>
          <p className="text-lg font-semibold text-gray-900">₹{formatCr(revenueTarget)}Cr</p>
        </div>
      </div>
      <p className="text-[10px] text-gray-400 mt-3">
        Computed {new Date(metrics.computedAt).toLocaleString()}
      </p>
    </div>
  );
}
