'use client';

import type { AiInsightsResponse, TeamVsBenchmarkResponse } from '@revenue/types/coaching.types';

interface Props {
  insights: AiInsightsResponse | null;
  benchmark: TeamVsBenchmarkResponse | null;
  isLoadingInsights: boolean;
  isLoadingBenchmark: boolean;
}

const METRIC_LABELS: Record<string, string> = {
  talkRatio:    'Talk Ratio',
  questionRate: 'Question Rate',
  monologue:    'Avg Monologue',
};

function BenchmarkBar({ item }: { item: TeamVsBenchmarkResponse[number] }) {
  const teamPct = Math.min((item.teamAvg / (item.benchmarkValue * 1.6)) * 100, 100);
  const benchPct = Math.min((item.benchmarkValue / (item.benchmarkValue * 1.6)) * 100, 100);
  const isBehind = item.delta < 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 font-medium">{METRIC_LABELS[item.metric] ?? item.metric}</span>
        <span className={`font-semibold ${isBehind ? 'text-red-600' : 'text-green-600'}`}>
          {isBehind ? '' : '+'}{item.delta.toFixed(1)}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full bg-blue-500 opacity-80" style={{ width: `${teamPct}%` }} />
      </div>
      <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full bg-gray-400" style={{ width: `${benchPct}%` }} />
      </div>
      <div className="flex gap-3 text-[10px] text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/>Team avg: {item.teamAvg}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block"/>Benchmark: {item.benchmarkValue}</span>
      </div>
    </div>
  );
}

export default function AiInsightsPanel({
  insights,
  benchmark,
  isLoadingInsights,
  isLoadingBenchmark,
}: Props) {
  return (
    <div className="flex flex-col gap-5">
      {/* AI Coaching Insights */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pt-4 pb-2">
          AI Coaching Insights
        </h3>
        {isLoadingInsights ? (
          <div className="px-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : (insights ?? []).length === 0 ? (
          <p className="px-4 text-sm text-gray-400 text-center py-4">No AI insights available.</p>
        ) : (
          <div className="px-4 space-y-3">
            {(insights ?? []).map((item, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                    style={{ backgroundColor: item.avatarColor }}
                  >
                    {item.repName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{item.repName}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.insight}</p>
                <div className="mt-2 rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-2">
                  <p className="text-[11px] font-semibold text-blue-700 mb-0.5">Recommendation</p>
                  <p className="text-xs text-blue-800 leading-relaxed">{item.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Team vs Benchmark */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 pb-2">
          Team vs Benchmark
        </h3>
        {isLoadingBenchmark ? (
          <div className="px-4 space-y-4">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton h-14 w-full rounded-lg" />)}
          </div>
        ) : (benchmark ?? []).length === 0 ? (
          <p className="px-4 text-sm text-gray-400 text-center py-4">No benchmark data.</p>
        ) : (
          <div className="px-4 space-y-4 pb-4">
            {(benchmark ?? []).map((item, i) => (
              <BenchmarkBar key={i} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
