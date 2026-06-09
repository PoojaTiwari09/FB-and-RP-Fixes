import { SendHorizontal } from 'lucide-react';

interface SessionInputBarProps {
  value: string;
  isDisabled: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}

export default function SessionInputBar({
  value,
  isDisabled,
  onChange,
  onSend,
}: SessionInputBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your response..."
          className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
        />
        <button
          onClick={onSend}
          disabled={!value.trim() || isDisabled}
          className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          aria-label="Send message"
        >
          <SendHorizontal size={18} />
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-1.5 px-1">
        ↵ Enter to send • Click mic button to mute
      </p>
    </div>
  );
}
