import { ArrowUp } from 'lucide-react';
import type { PipelineSummary } from '../types/deal.types';

interface PipelineSummaryCardProps extends PipelineSummary {
  isActive?: boolean;
  onClick?: () => void;
}

export default function PipelineSummaryCard({
  label,
  amount,
  count,
  change,
  isActive,
  onClick,
}: PipelineSummaryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-lg p-4 flex-1 min-w-[180px] transition-all cursor-pointer ${
        isActive
          ? 'bg-[#1E3A5F] text-white shadow-md'
          : 'bg-[#F5F6F8] hover:bg-gray-100'
      }`}
    >
      <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-bold ${isActive ? 'text-white' : 'text-gray-900'}`}>{amount}</span>
        <span className={`text-sm ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>({count})</span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <ArrowUp size={12} className={isActive ? 'text-amber-300' : 'text-[#F59E0B]'} />
        <span className={`text-xs font-medium ${isActive ? 'text-amber-300' : 'text-[#F59E0B]'}`}>{change}</span>
      </div>
    </button>
  );
}
