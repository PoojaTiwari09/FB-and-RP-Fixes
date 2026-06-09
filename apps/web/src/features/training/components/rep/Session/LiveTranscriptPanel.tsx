import { useEffect, useRef } from 'react';
import { TranscriptMessage as TranscriptMessageType } from '@training/types/trainingSession.types';
import TranscriptMessage from './TranscriptMessage';

interface LiveTranscriptPanelProps {
  transcript: TranscriptMessageType[];
  isAISpeaking: boolean;
}

export default function LiveTranscriptPanel({
  transcript,
  isAISpeaking,
}: LiveTranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript.length, isAISpeaking]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col mt-4" style={{ height: '240px' }}>
      <div className="px-4 py-2 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Live Transcript
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {transcript.length === 0 && !isAISpeaking && (
          <p className="text-sm text-gray-400 text-center py-8">
            Transcript will appear here as you converse...
          </p>
        )}
        {transcript.map((msg) => (
          <TranscriptMessage key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isAISpeaking && (
          <div className="flex gap-3 py-2 justify-start">
            <div className="bg-gray-100 rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
              <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
              <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
