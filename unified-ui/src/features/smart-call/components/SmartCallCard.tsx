import type { SmartCall, CallStatus, CallSentiment } from '@smart-call/types/smart-call.types';

interface SmartCallCardProps {
  call: SmartCall;
}

const STATUS_STYLES: Record<CallStatus, string> = {
  completed: 'bg-green-50 text-green-700',
  scheduled: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-yellow-50 text-yellow-700',
  missed: 'bg-red-50 text-red-600',
};

const STATUS_LABELS: Record<CallStatus, string> = {
  completed: 'Completed',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  missed: 'Missed',
};

const SENTIMENT_STYLES: Record<CallSentiment, string> = {
  positive: 'text-green-600',
  neutral: 'text-gray-500',
  negative: 'text-red-500',
};

const SENTIMENT_LABELS: Record<CallSentiment, string> = {
  positive: '↑ Positive',
  neutral: '→ Neutral',
  negative: '↓ Negative',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-green-600';
  if (score >= 55) return 'text-yellow-600';
  return 'text-red-500';
}

export default function SmartCallCard({ call }: SmartCallCardProps) {
  const isCompleted = call.status === 'completed';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      {/* Top row: title + status badge */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">{call.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {call.prospect} · {call.company}
          </p>
        </div>
        <span
          className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[call.status]}`}
        >
          {STATUS_LABELS[call.status]}
        </span>
      </div>

      {/* Date + duration */}
      <p className="text-xs text-gray-400">
        {formatDate(call.scheduledAt)}
        {call.durationMin !== null && ` · ${call.durationMin} min`}
      </p>

      {/* AI metrics — only visible for completed calls */}
      {isCompleted && (
        <div className="flex items-center gap-6 pt-2 border-t border-gray-100">
          {call.aiScore !== null && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                AI Score
              </span>
              <span className={`text-sm font-bold ${scoreColor(call.aiScore)}`}>
                {call.aiScore}/100
              </span>
            </div>
          )}

          {call.talkRatio !== null && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                Talk Ratio
              </span>
              <span className="text-sm font-bold text-gray-700">{call.talkRatio}%</span>
            </div>
          )}

          {call.sentiment !== null && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">
                Sentiment
              </span>
              <span className={`text-sm font-semibold ${SENTIMENT_STYLES[call.sentiment]}`}>
                {SENTIMENT_LABELS[call.sentiment]}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Key moments */}
      {call.keyMoments.length > 0 && (
        <ul className="flex flex-col gap-1 pt-1">
          {call.keyMoments.map((moment, i) => (
            <li key={i} className="text-xs text-gray-500 flex gap-1.5 items-start">
              <span className="text-blue-400 mt-px shrink-0">›</span>
              {moment}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
