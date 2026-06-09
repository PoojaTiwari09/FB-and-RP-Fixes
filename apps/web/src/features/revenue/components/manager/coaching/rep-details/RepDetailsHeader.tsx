import Link from 'next/link';
import type { RepDetailsHeaderData } from '@revenue/types/coaching-rep.types';

interface RepDetailsHeaderProps {
  header: RepDetailsHeaderData;
}

export default function RepDetailsHeader({ header }: RepDetailsHeaderProps) {
  return (
    <div className="flex flex-col gap-6 mb-6">
      <div>
        <Link
          href="/revenue/coaching-insights"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span className="mr-1">←</span> Back to Coaching Insights
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
            style={{ backgroundColor: header.avatarColor }}
          >
            {header.initials}
          </div>
          <h1 className="text-xl font-semibold text-slate-900">
            {header.name} <span className="text-slate-400 font-normal">—</span> {header.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            Last 8 weeks
          </div>
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            {header.callsAnalyzed} calls analyzed
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
            Schedule Coaching Session
          </button>
        </div>
      </div>
      
      <p className="text-sm text-slate-500">
        Review conversational behavior trends, coaching signals, and recent call patterns.
      </p>
    </div>
  );
}
