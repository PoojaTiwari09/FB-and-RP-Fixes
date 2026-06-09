'use client';

import { useEffect, useState } from 'react';
import { X, Clock } from 'lucide-react';
import type { TranscriptData } from '@smart-call/types/smart-call.types';
import { fetchTranscript } from '@smart-call/services/smart-call.service';

interface Props {
  sessionId: string;
  onClose: () => void;
}

export default function TranscriptModal({ sessionId, onClose }: Props) {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetchTranscript(sessionId)
      .then(setTranscript)
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Full Transcript</h2>
            {transcript && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                <Clock size={11} />
                {transcript.contactName} · {transcript.duration}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Close transcript"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-4 bg-gray-100 rounded mt-1 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-16" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : !transcript ? (
            <p className="text-sm text-gray-400 text-center py-10">
              Transcript not available.
            </p>
          ) : (
            <div className="space-y-4">
              {transcript.segments.map((seg, i) => {
                const isRep = seg.speaker === 'REP';
                return (
                  <div key={i} className={`flex gap-3 ${isRep ? '' : 'flex-row-reverse'}`}>
                    {/* Speaker avatar */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                        isRep
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {isRep ? 'ME' : 'SC'}
                    </div>

                    {/* Bubble + meta */}
                    <div className={`flex flex-col gap-0.5 max-w-[75%] ${isRep ? 'items-start' : 'items-end'}`}>
                      <div className="flex items-center gap-2">
                        {isRep ? (
                          <>
                            <span className="text-xs font-semibold text-gray-700">You</span>
                            <span className="text-[10px] text-gray-400 font-mono">{seg.timestamp}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] text-gray-400 font-mono">{seg.timestamp}</span>
                            <span className="text-xs font-semibold text-gray-700">{transcript.contactName}</span>
                          </>
                        )}
                      </div>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isRep
                            ? 'bg-blue-50 text-gray-800 rounded-tl-sm'
                            : 'bg-gray-100 text-gray-800 rounded-tr-sm'
                        }`}
                      >
                        {seg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
