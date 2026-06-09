import { Bot, Mic, User } from 'lucide-react';

interface AIAvatarPanelProps {
  personaName: string;
  isMicActive: boolean;
  onToggleMic: () => void;
}

export default function AIAvatarPanel({
  personaName,
  isMicActive,
  onToggleMic,
}: AIAvatarPanelProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-8 rounded-xl relative"
      style={{ backgroundColor: 'var(--sidebar-bg)' }}
    >
      {/* AI Avatar */}
      <div className="w-28 h-28 rounded-full bg-purple-200/20 flex items-center justify-center mb-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-primary-light)' }}>
          <Bot size={36} className="text-white" />
        </div>
      </div>

      {/* Name */}
      <p className="text-white text-base font-semibold mb-8">{personaName}</p>

      {/* Participant row */}
      <div className="flex items-center gap-8">

        {/* ── Mic button — always blue, large circle, pulse ring when active ── */}
        <div className="relative flex flex-col items-center gap-2">
          {isMicActive && (
            <span className="absolute inset-0 rounded-full animate-ping bg-blue-400/40" />
          )}
          <button
            onClick={onToggleMic}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
              isMicActive
                ? 'bg-blue-500 hover:bg-blue-600'
                : 'bg-blue-500/70 hover:bg-blue-500'
            }`}
            aria-label={isMicActive ? 'Stop recording' : 'Start recording'}
          >
            <Mic size={24} className="text-white" />
          </button>
          <span className="text-white/60 text-[11px]">
            {isMicActive ? 'Listening…' : 'Mic'}
          </span>
        </div>

        {/* ── You chip ── */}
        <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <span className="text-white text-sm font-medium">You (Sales Rep)</span>
        </div>

      </div>
    </div>
  );
}
