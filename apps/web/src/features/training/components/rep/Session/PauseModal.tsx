import { Clock, MessageSquare, Play, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PauseModalProps {
  elapsedSeconds: number;
  messageCount: number;
  onResume: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PauseModal({ elapsedSeconds, messageCount, onResume }: PauseModalProps) {
  const router = useRouter();

  const handleExit = () => {
    router.push('/training');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Training Paused</h2>
          <p className="text-gray-600 mb-6">
            Your progress has been saved. You can resume this session anytime.
          </p>
          
          <div className="flex gap-4 mb-8">
            <div className="flex-1 bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border border-gray-100">
              <Clock className="w-5 h-5 text-gray-400 mb-2" />
              <div className="text-xl font-semibold text-gray-900 tabular-nums">
                {formatTime(elapsedSeconds)}
              </div>
              <div className="text-xs text-gray-500 uppercase font-medium tracking-wide mt-1">
                Time
              </div>
            </div>
            
            <div className="flex-1 bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center border border-gray-100">
              <MessageSquare className="w-5 h-5 text-gray-400 mb-2" />
              <div className="text-xl font-semibold text-gray-900 tabular-nums">
                {messageCount}
              </div>
              <div className="text-xs text-gray-500 uppercase font-medium tracking-wide mt-1">
                Messages
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={onResume}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              Resume Now
            </button>
            <button
              onClick={handleExit}
              className="flex items-center justify-center gap-2 w-full py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Exit to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
