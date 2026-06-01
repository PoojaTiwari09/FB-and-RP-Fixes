import { TranscriptMessage as TranscriptMessageType } from '@training/types/trainingSession.types';

interface TranscriptMessageProps {
  message: TranscriptMessageType;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TranscriptMessage({ message }: TranscriptMessageProps) {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex gap-3 py-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
          isUser
            ? 'bg-gray-900 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
        <p
          className={`text-[10px] mt-1 tabular-nums ${
            isUser ? 'text-gray-400' : 'text-gray-400'
          }`}
        >
          {formatTime(message.timestampSeconds)}
        </p>
      </div>
    </div>
  );
}
