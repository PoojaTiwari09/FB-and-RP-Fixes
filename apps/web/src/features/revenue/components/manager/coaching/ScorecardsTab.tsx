'use client';

import type { ScorecardsResponse } from '@revenue/types/coaching.types';

interface Props {
  data: ScorecardsResponse | null;
  isLoading: boolean;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold min-w-[28px] text-right ${
        score >= 80 ? 'text-green-700' : score >= 60 ? 'text-amber-700' : 'text-red-600'
      }`}>{score}</span>
    </div>
  );
}

export default function ScorecardsTab({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[0,1,2,3,4].map(i => <div key={i} className="skeleton h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  const reps = data ?? [];

  if (reps.length === 0) {
    return <p className="p-8 text-center text-sm text-gray-400">No scorecard data for this period.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Rep</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Overall Score</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Categories</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {reps.map((rep) => (
            <tr key={rep.repId} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-800">{rep.repName}</td>
              <td className="px-4 py-3 w-36">
                <ScoreBar score={rep.overallScore} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {rep.categories.map((cat) => (
                    <div key={cat.name} className="text-xs text-gray-500 min-w-[110px]">
                      <span className="block text-gray-400 mb-0.5">{cat.name}</span>
                      <ScoreBar score={cat.score} />
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
