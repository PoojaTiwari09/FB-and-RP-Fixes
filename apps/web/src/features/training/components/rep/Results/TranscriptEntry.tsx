import { TranscriptEntry as TranscriptEntryType } from '@training/types/trainingResults.types';

interface TranscriptEntryProps {
  entry: TranscriptEntryType;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TranscriptEntry({ entry }: TranscriptEntryProps) {
  const isUser = entry.sender === 'user';

  return (
    <div
      className={`flex gap-4 py-3 px-4 rounded-lg ${
        isUser ? 'border-l-3' : ''
      }`}
      style={{
        borderLeftColor: isUser ? 'var(--status-completed-text)' : undefined,
        borderLeftWidth: isUser ? '3px' : undefined,
      }}
    >
      {/* Timestamp */}
      <div className="shrink-0 w-10">
        <span className="text-xs font-mono text-gray-400 tabular-nums">
          {formatTime(entry.timestampSeconds)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-sm font-semibold ${
              isUser ? 'text-gray-900' : 'text-gray-600'
            }`}
          >
            {entry.senderLabel}
          </span>
          {entry.quality === 'good-example' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600">
              Good Example
            </span>
          )}
          {entry.quality === 'missed-opportunity' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-600">
              Missed Opportunity
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">&ldquo;{entry.text}&rdquo;</p>
      </div>
    </div>
  );
}
