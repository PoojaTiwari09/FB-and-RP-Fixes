import type { InsightPattern } from '@revenue/types/coaching-rep.types';

interface InsightListsPanelProps {
  patterns: InsightPattern[];
  recommendations: InsightPattern[];
}

const WarningIcon = () => (
  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
    <span className="text-sm font-bold leading-none">!</span>
  </div>
);

const SuccessIcon = () => (
  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  </div>
);

export default function InsightListsPanel({ patterns, recommendations }: InsightListsPanelProps) {
  return (
    <div className="flex gap-6 mb-6">
      {/* Observed Patterns */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Observed Patterns</h2>
        <div className="flex flex-col gap-3">
          {patterns.map((item) => (
            <div key={item.id} className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-center gap-3">
              <WarningIcon />
              <p className="text-sm font-medium text-amber-900">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Coaching Actions */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Recommended Coaching Actions</h2>
        <div className="flex flex-col gap-3">
          {recommendations.map((item) => (
            <div key={item.id} className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-center gap-3">
              <SuccessIcon />
              <p className="text-sm font-medium text-emerald-900">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
