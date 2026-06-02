import type { TrendChartData, KpiStatus } from '@revenue/types/coaching-rep.types';

interface TrendChartPanelProps {
  trend: TrendChartData;
}

const getBarColor = (status: KpiStatus) => {
  switch (status) {
    case 'critical': return 'bg-red-500';
    case 'warning': return 'bg-amber-400';
    case 'optimal': return 'bg-emerald-500';
    default: return 'bg-slate-300';
  }
};

export default function TrendChartPanel({ trend }: TrendChartPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-900 mb-1">{trend.title}</h2>
        <div className="flex items-center text-xs text-slate-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
          Blue marker = {trend.benchmark}% benchmark
        </div>
      </div>

      <div className="relative mb-8">
        {/* Benchmark Vertical Line */}
        <div 
          className="absolute top-0 bottom-0 w-px bg-blue-500 z-10"
          style={{ left: `${trend.benchmark}%` }}
        />

        <div className="flex flex-col gap-3">
          {trend.weeks.map((week) => (
            <div key={week.label} className="flex items-center gap-4">
              <div className="w-6 text-xs font-medium text-slate-400 text-right">
                {week.label}
              </div>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                <div 
                  className={`absolute top-0 left-0 bottom-0 rounded-full ${getBarColor(week.status)}`}
                  style={{ width: `${week.value}%` }}
                />
              </div>
              <div className="w-8 text-xs font-medium text-slate-600 text-right">
                {week.value}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 flex items-start gap-3 border border-blue-100">
        <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className="text-sm text-blue-800 font-medium">
          {trend.insightText}
        </p>
      </div>
    </div>
  );
}
