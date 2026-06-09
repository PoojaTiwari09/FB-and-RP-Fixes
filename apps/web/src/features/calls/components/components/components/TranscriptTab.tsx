import React, { useRef } from 'react';
import type { TranscriptEntry } from '../types/calls.types';

interface TranscriptTabProps {
  transcript: TranscriptEntry[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showLowConfidenceOnly: boolean;
  setShowLowConfidenceOnly: (v: boolean) => void;
  audioUrl?: string;
}

export default function TranscriptTab({
  transcript,
  searchQuery,
  setSearchQuery,
  showLowConfidenceOnly,
  setShowLowConfidenceOnly,
  audioUrl,
}: TranscriptTabProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleTimeClick = (timestampStr: string) => {
    if (!audioRef.current) return;
    const parts = timestampStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
    audioRef.current.currentTime = seconds;
    audioRef.current.play();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Audio Player Header */}
      {audioUrl && (
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
          <audio ref={audioRef} controls className="w-full max-w-2xl h-10" src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Transcript Controls */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
        <div className="w-full max-w-sm">
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={showLowConfidenceOnly}
            onChange={(e) => setShowLowConfidenceOnly(e.target.checked)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Show low confidence only
        </label>
      </div>

      {/* Transcript Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {transcript.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No transcript matches found.</div>
        ) : (
          transcript.map((entry) => (
            <div key={entry.entryId} className="flex gap-4">
              <div 
                className="w-16 flex-shrink-0 text-sm font-medium text-indigo-600 cursor-pointer hover:underline"
                onClick={() => handleTimeClick(entry.timestamp)}
              >
                {entry.timestamp}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{entry.speakerName}</span>
                  {entry.confidence === 'low' && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">Low Confidence</span>
                  )}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{entry.text}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
