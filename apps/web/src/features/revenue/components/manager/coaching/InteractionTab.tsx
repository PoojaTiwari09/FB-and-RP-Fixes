'use client';

import { useRouter } from 'next/navigation';
import type { InteractionResponse, InteractionStatus } from '@revenue/types/coaching.types';

interface Props {
  data: InteractionResponse | null;
  isLoading: boolean;
}

const STATUS_BADGE: Record<InteractionStatus, string> = {
  optimal:  'bg-green-100 text-green-700',
  warning:  'bg-amber-100 text-amber-700',
  critical: 'bg-red-100 text-red-700',
};

function StatusBadge({ value, label, status }: { value: string; label: string; status: InteractionStatus }) {
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${STATUS_BADGE[status]}`}>
        {label}
      </span>
      <span className="text-[10px] text-gray-400 capitalize">{status}</span>
    </div>
  );
}

function AvatarBubble({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

export default function InteractionTab({ data, isLoading }: Props) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[0,1,2,3,4].map(i => <div key={i} className="skeleton h-14 w-full rounded-lg" />)}
      </div>
    );
  }

  const reps = data?.reps ?? [];
  const benchmarks = data?.benchmarks;

  if (reps.length === 0) {
    return <p className="p-8 text-center text-sm text-gray-400">No interaction data for this period.</p>;
  }

  return (
    <div>
      {/* Benchmark reference row */}
      {benchmarks && (
        <div className="mx-4 mt-3 mb-2 flex gap-4 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700">
          <span>Talk ratio: <strong>{benchmarks.talkRatioOptimal}</strong></span>
          <span>Questions: <strong>{benchmarks.questionRateOptimal}</strong></span>
          <span>Monologue: <strong>{benchmarks.monologueOptimal}</strong></span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {['Rep', 'Talk Ratio', 'Question Rate', 'Interactivity', 'Monologue'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reps.map((rep) => (
              <tr 
                key={rep.repId} 
                onClick={() => router.push(`/revenue/coaching-insights/${rep.repId}`)}
                className="hover:bg-blue-50 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <AvatarBubble initials={rep.initials} color={rep.avatarColor} />
                    <span className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors">{rep.repName}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={`${rep.talkRatio}%`} label={`${rep.talkRatio}%`} status={rep.talkRatioStatus} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={`${rep.questionRate}/hr`} label={`${rep.questionRate}/hr`} status={rep.questionRateStatus} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${rep.interactivity * 10}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{rep.interactivity}/10</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge value={rep.monologue} label={rep.monologue} status={rep.monologueStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
