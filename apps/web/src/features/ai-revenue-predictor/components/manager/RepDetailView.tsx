'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, RotateCcw } from 'lucide-react';
import type { RepDetail, ActiveDeal, ConfidenceLevel } from '../../types';
import { ConfidenceBadge } from './ui/ConfidenceBadge';
import { formatCurrency } from '../../utils/formatters';
import { RepMathModal } from './modals/RepMathModal';

interface RepDetailViewProps {
  rep: {
    repName: string;
    repInitials: string;
    avatarColor: string;
  };
  repDetail: RepDetail;
  quarter: string;
  onBack: () => void;
  lobFilter: string;
  setLobFilter: (v: string) => void;
  baseline: string;
  setBaseline: (v: string) => void;
}

export function RepDetailView({
  rep,
  repDetail,
  quarter,
  onBack,
  lobFilter,
  setLobFilter,
  baseline,
  setBaseline,
}: RepDetailViewProps) {
  const [showMathModal, setShowMathModal] = useState(false);

  const currentAiProjection = repDetail.aiProjection;
  const currentClosedWon = repDetail.closedWon;
  const currentWeighted = repDetail.weightedPipeline;
  const currentExpected = repDetail.expectedDeals;
  const activeDeals = repDetail.activeDeals;

  const totalSegments = currentClosedWon + currentWeighted + currentExpected;
  const closedPct = totalSegments > 0 ? (currentClosedWon / totalSegments) * 100 : 0;
  const weightedPct = totalSegments > 0 ? (currentWeighted / totalSegments) * 100 : 0;
  const expectedPct = totalSegments > 0 ? (currentExpected / totalSegments) * 100 : 0;

  return (
    <div className="space-y-6">
      <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F9FAFB]" onClick={onBack}>
        <RotateCcw className="h-4 w-4" />
        Back to Team Overview
      </button>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white" style={{ backgroundColor: rep.avatarColor }}>{rep.repInitials}</div>
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">{rep.repName}</h2>
          <p className="text-sm text-[#6B7280]">{quarter} Forecast Review</p>
        </div>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">AI REVENUE PROJECTION • {repDetail.quarter}</h3>
          <div className="flex items-center gap-2 text-sm text-[#6B7280]">
            Filter by LOB
            <select
              value={lobFilter}
              onChange={(e) => setLobFilter(e.target.value)}
              className="ml-2 border border-[#D1D5DB] rounded-md px-3 py-1.5 text-sm font-medium text-[#111827] bg-white outline-none"
            >
              <option value="All">All</option>
              <option value="Enterprise Software">Enterprise Software</option>
              <option value="Consulting Services">Consulting Services</option>
              <option value="Hardware">Hardware</option>
              <option value="Cloud Services">Cloud Services</option>
            </select>
          </div>
        </div>

        <div className="mb-2">
          <span className="text-4xl font-normal text-[#111827]">{formatCurrency(currentAiProjection)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-8">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div>{repDetail.lastUpdated}</span>
          <span>•</span>
          <span>Range: {formatCurrency(repDetail.rangeMin)} - {formatCurrency(repDetail.rangeMax)}</span>
          <span>•</span>
          <span>Current period closes {repDetail.closesOn}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6B7280] mr-2">Projection baseline:</span>
            {['Current baseline', 'Avg of last 2 periods', 'Last period (Q1 FY26)', 'Same period last year (Q2 FY25)'].map((opt) => (
              <button 
                key={opt}
                onClick={() => setBaseline(opt)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                  baseline === opt 
                    ? 'bg-[#2563EB] text-white border border-[#2563EB]' 
                    : 'border border-[#E5E7EB] text-[#374151] bg-white hover:bg-[#F9FAFB]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <button 
            className="flex items-center gap-1 text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8]"
            onClick={() => setShowMathModal(true)}
          >
            Detailed analysis <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-[#6B7280] mb-3">Uses current period conversion rates.</div>

        <div className="flex h-3 w-full rounded-full overflow-hidden mb-4">
          <div style={{ width: `${closedPct}%` }} className="bg-[#2563EB]"></div>
          <div style={{ width: `${weightedPct}%` }} className="bg-[#60A5FA] border-l border-white"></div>
          <div style={{ width: `${expectedPct}%` }} className="bg-[#BFDBFE] border-l border-white"></div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]"></div>
            <span className="text-sm text-[#374151]">Closed-won <span className="font-semibold text-[#111827]">{formatCurrency(currentClosedWon)}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#60A5FA]"></div>
            <span className="text-sm text-[#374151]">Weighted pipeline <span className="font-semibold text-[#111827]">{formatCurrency(currentWeighted)}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#BFDBFE]"></div>
            <span className="text-sm text-[#374151]">Expected deals <span className="font-semibold text-[#111827]">{formatCurrency(currentExpected)}</span></span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#111827]">Pipeline Overview</h3>
            <p className="text-sm text-[#6B7280]">Active deals contributing to your AI projection</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#6B7280] bg-[#F3F4F6] px-2 py-1 rounded-full">{activeDeals.length} deals</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
              <tr>
                {['DEAL', 'STAGE', 'AMOUNT', 'AI CONFIDENCE', 'EXPECTED CLOSE', 'FACTOR', 'CONTRIBUTION'].map((header) => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-[#6B7280] uppercase tracking-wider">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {activeDeals.map((deal) => (
                <tr key={deal.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#111827]">{deal.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-[#E5E7EB] text-[#374151] bg-[#F9FAFB]">
                      {deal.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#111827]">{formatCurrency(deal.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap"><ConfidenceBadge level={deal.aiConfidence} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7280]">{deal.expectedClose}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7280]">{deal.factor}%</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#2563EB]">{formatCurrency(deal.contribution)}</td>
                </tr>
              ))}
              {activeDeals.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-[#6B7280]">No active deals for this filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RepMathModal open={showMathModal} onOpenChange={setShowMathModal} detail={repDetail} />
    </div>
  );
}
