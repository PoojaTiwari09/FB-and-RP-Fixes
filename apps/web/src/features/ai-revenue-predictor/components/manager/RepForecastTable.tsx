"use client";

import type { RepForecast } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ConfidenceBadge } from './ui/ConfidenceBadge';

interface RepForecastTableProps {
  members: RepForecast[];
  onReviewRep: (repId: string) => void;
}

export function RepForecastTable({ members, onReviewRep }: RepForecastTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="border-b border-[#E5E7EB] px-6 py-4">
        <h3 className="text-sm font-semibold text-[#111827]">Individual Rep Forecasts</h3>
      </div>
      <table className="w-full">
        <thead className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
          <tr>
            {['REP', 'AI PREDICTION', 'MANAGER OVERRIDE', 'FINAL FORECAST', 'CONFIDENCE', 'LAST UPDATED'].map((h) => (
              <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7280]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b border-[#F3F4F6] transition-colors hover:bg-[#F9FAFB]">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white" style={{ backgroundColor: member.avatarColor }}>{member.repInitials}</div>
                  <button className="text-sm font-medium text-[#111827] underline-offset-2 hover:text-[#10338D] hover:underline" onClick={() => onReviewRep(member.id)}>{member.repName}</button>
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-medium text-[#6B7280]">{formatCurrency(member.aiPrediction)}</td>
              <td className="px-6 py-4 text-sm">
                {member.managerOverride ? (
                  <span className="font-semibold text-[#10338D]">{formatCurrency(member.managerOverride)}</span>
                ) : (
                  <span className="text-[#9CA3AF]">—</span>
                )}
              </td>
              <td className="px-6 py-4 text-sm font-bold text-[#111827]">{formatCurrency(member.managerOverride ?? member.aiPrediction)}</td>
              <td className="px-6 py-4"><ConfidenceBadge level={member.confidenceLevel} /></td>
              <td className="px-6 py-4 text-xs text-[#9CA3AF]">{member.lastUpdated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
