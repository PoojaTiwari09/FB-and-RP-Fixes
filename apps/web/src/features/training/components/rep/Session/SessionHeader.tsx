import { Clock, Pause, Play, Square } from 'lucide-react';

interface SessionHeaderProps {
  trainingTitle: string;
  elapsedSeconds: number;
  isPaused: boolean;
  trainingId: string;
  sessionId: string;
  onTogglePause: () => void;
  onEndSession: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function SessionHeader({
  trainingTitle,
  elapsedSeconds,
  isPaused,
  onTogglePause,
  onEndSession,
}: SessionHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
      {/* Left: Title + Timer */}
      <div className="flex items-center gap-4">
        <h1 className="text-base font-semibold text-gray-900">{trainingTitle}</h1>
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Clock size={14} />
          <span className="tabular-nums font-medium">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Right: Pause + End buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onTogglePause}
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          {isPaused ? <Play size={14} /> : <Pause size={14} />}
          {isPaused ? 'Resume Training' : 'Pause Training'}
        </button>
        <button
          onClick={onEndSession}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        >
          <Square size={14} fill="currentColor" />
          End Session
        </button>
      </div>
    </header>
  );
}
