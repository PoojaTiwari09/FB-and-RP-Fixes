'use client';

import { useState, useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { TeamSummary } from '../../types';
import { RepMathModal } from './modals/RepMathModal';

interface ForecastSummaryCardProps {
  teamSummary: TeamSummary;
  quarter: string;
  team: string;
  lobFilter: string;
  setLobFilter: (v: string) => void;
  baseline: string;
  setBaseline: (v: string) => void;
}

export function ForecastSummaryCard({
  teamSummary,
  quarter,
  team,
  lobFilter,
  setLobFilter,
  baseline,
  setBaseline,
}: ForecastSummaryCardProps) {
  const [showMathModal, setShowMathModal] = useState(false);

  const currentAiProjection = teamSummary.aiProjection;
  const currentClosedWon = teamSummary.closedWon;
  const currentWeighted = teamSummary.weightedPipeline;
  const currentExpected = teamSummary.expectedDeals;

  const totalSegments = currentClosedWon + currentWeighted + currentExpected;
  const closedPct = totalSegments > 0 ? (currentClosedWon / totalSegments) * 100 : 0;
  const weightedPct = totalSegments > 0 ? (currentWeighted / totalSegments) * 100 : 0;
  const expectedPct = totalSegments > 0 ? (currentExpected / totalSegments) * 100 : 0;

  return (
    <div className="mb-6 rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">OVERALL TEAM AI REVENUE PROJECTION • {quarter}</h3>
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

      <div className="mb-2 flex items-baseline gap-4">
        <span className="text-4xl font-normal text-[#111827]">{formatCurrency(currentAiProjection)}</span>
        <div className="flex flex-col">
          <span className="text-xs text-[#6B7280] font-medium uppercase tracking-wider">Manual Forecast</span>
          <span className="text-lg font-semibold text-[#374151]">{formatCurrency(teamSummary.manualForecast)}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-8">
        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div>{teamSummary.lastUpdated}</span>
        <span>•</span>
        <span>Range: {formatCurrency(teamSummary.rangeMin)} - {formatCurrency(teamSummary.rangeMax)}</span>
        <span>•</span>
        <span>Current period closes {teamSummary.closesOn}</span>
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
      <RepMathModal open={showMathModal} onOpenChange={setShowMathModal} detail={teamSummary} />
    </div>
  );
}
