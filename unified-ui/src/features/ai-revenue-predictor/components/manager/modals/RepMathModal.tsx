'use client';

import { X } from 'lucide-react';
import type { RepDetail, TeamSummary } from '../../../types';
import { ConfidenceBadge } from '../ui/ConfidenceBadge';
import { formatCurrency } from '../../../utils/formatters';

interface RepMathModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: RepDetail | TeamSummary | null;
}

export function RepMathModal({ open, onOpenChange, detail }: RepMathModalProps) {
  if (!open || !detail) return null;

  const { mathData } = detail;
  
  const isTeam = 'teamName' in detail;
  const subtitleName = isTeam ? detail.teamName : `${(detail as RepDetail).repInitials}'s`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6">
      <div className="w-full max-w-3xl max-h-full overflow-y-auto rounded-2xl bg-white shadow-2xl relative">
        <div className="sticky top-0 z-10 bg-white border-b border-[#E5E7EB] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">Detailed Analysis: AI Projection</h2>
            <p className="text-sm text-[#6B7280]">Breakdown of {subtitleName} — {detail.quarter}</p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 text-[#9CA3AF] hover:text-[#111827] hover:bg-[#F3F4F6] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 bg-[#F8FAFC]">
          
          <div className="flex items-center justify-between rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3">
            <span className="text-sm font-semibold text-[#1E40AF]">Reconciles to:</span>
            <span className="text-sm font-bold text-[#1E3A8A]">
              {formatCurrency(mathData.closedWon.total)} + {formatCurrency(mathData.weightedPipeline.total)} + {formatCurrency(mathData.expectedDeals.total)} = {formatCurrency(detail.aiProjection)}
            </span>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]"></div>
                <h3 className="text-sm font-semibold text-[#111827] uppercase tracking-wider">CLOSED-WON DEALS</h3>
              </div>
              <span className="text-sm font-bold text-[#111827]">{formatCurrency(mathData.closedWon.total)}</span>
            </div>
            <div className="p-5 space-y-3">
              {mathData.closedWon.deals.map((deal, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm font-medium border-b border-[#F3F4F6] pb-2 last:border-0 last:pb-0">
                  <span className="text-[#6B7280]">{deal.name}</span>
                  <span className="text-[#111827]">{formatCurrency(deal.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#60A5FA]"></div>
                <h3 className="text-sm font-semibold text-[#111827] uppercase tracking-wider">WEIGHTED PIPELINE BY STAGE</h3>
              </div>
              <span className="text-sm font-bold text-[#111827]">{formatCurrency(mathData.weightedPipeline.total)}</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-white border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-[#6B7280] uppercase tracking-wider text-xs">STAGE</th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280] uppercase tracking-wider text-xs">PIPELINE</th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280] uppercase tracking-wider text-xs">CONV. %</th>
                  <th className="px-5 py-3 text-right font-semibold text-[#6B7280] uppercase tracking-wider text-xs">CONTRIBUTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {mathData.weightedPipeline.stages.map((stage, idx) => (
                  <tr key={idx}>
                    <td className="px-5 py-3 text-[#374151] font-medium">{stage.name}</td>
                    <td className="px-5 py-3 text-right text-[#374151]">{formatCurrency(stage.pipeline)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-[#2563EB]">{stage.conv}%</td>
                    <td className="px-5 py-3 text-right font-bold text-[#111827]">{formatCurrency(stage.contribution)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#BFDBFE]"></div>
                <h3 className="text-sm font-semibold text-[#111827] uppercase tracking-wider">EXPECTED DEALS (HISTORICAL RATE)</h3>
              </div>
              <span className="text-sm font-bold text-[#111827]">{formatCurrency(mathData.expectedDeals.total)}</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center text-sm text-[#374151]">
                <span>Historical expected-deal rate</span>
                <span className="font-semibold text-[#2563EB]">{mathData.expectedDeals.historicalRate}%</span>
              </div>
              <div className="flex justify-between items-center text-sm text-[#374151]">
                <span>Addressable pipeline this period</span>
                <span className="font-semibold">{formatCurrency(mathData.expectedDeals.addressablePipeline)}</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-[#E5E7EB]">
                <span className="text-sm font-bold text-[#111827]">Projected contribution</span>
                <span className="text-sm font-bold text-[#2563EB]">{formatCurrency(mathData.expectedDeals.total)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F9FAFB]">
              <h3 className="text-sm font-semibold text-[#111827] uppercase tracking-wider">ACTIVE DEAL CONTRIBUTIONS</h3>
              <span className="text-xs font-medium text-[#6B7280] bg-[#F3F4F6] px-2 py-1 rounded-full">{detail.activeDeals.length} deals</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white border-b border-[#E5E7EB]">
                  <tr>
                    {['DEAL', 'STAGE', 'AMOUNT', 'AI CONF.', 'CLOSE', 'FACTOR'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-semibold text-[#6B7280] uppercase tracking-wider text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {detail.activeDeals.map((deal) => (
                    <tr key={deal.id}>
                      <td className="px-4 py-3 font-medium text-[#111827]">{deal.name}</td>
                      <td className="px-4 py-3 text-[#6B7280] text-xs">{deal.stage}</td>
                      <td className="px-4 py-3 font-semibold text-[#111827]">{formatCurrency(deal.amount)}</td>
                      <td className="px-4 py-3"><ConfidenceBadge level={deal.aiConfidence} /></td>
                      <td className="px-4 py-3 text-[#6B7280] text-xs">{deal.expectedClose}</td>
                      <td className="px-4 py-3 text-[#6B7280] text-xs">{deal.factor}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm p-5">
            <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">AI CALCULATION FORMULA</h3>
            <div className="rounded-lg border border-[#E5E7EB] p-4 text-sm font-mono text-[#374151] bg-[#F9FAFB] mb-4">
              {mathData.formula}
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Where C_s = historical conversion rate for stage s. Time-decay factor applied for stagnant deals.
              <br /><br />
              <span className="italic">AI confidence also considers stage strength, meetings activity, email engagement, sentiment, stakeholder presence, deal movement, close date stability, competitor mention, forecast history, and activity recency.</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
