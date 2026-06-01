'use client';

import { useEffect, useState } from 'react';

const STEPS = [
  'Transcribing conversation...',
  'Analysing objection handling...',
  'Scoring discovery & closing...',
  'Identifying key moments...',
  'Building your summary...',
];

export default function GeneratingSummaryScreen() {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIdx((i) => (i < STEPS.length - 1 ? i + 1 : i));
    }, 3000); // advances every 3s — typical summary takes 5-15s
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white gap-8">

      {/* Animated brain / pulse rings */}
      <div className="relative flex items-center justify-center w-20 h-20">
        <span className="absolute w-20 h-20 rounded-full bg-violet-100 animate-ping opacity-40" />
        <span className="absolute w-14 h-14 rounded-full bg-violet-200 animate-ping opacity-50" style={{ animationDelay: '0.2s' }} />
        <div className="relative w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center shadow-lg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
            <path
              d="M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"
              fill="currentColor" opacity="0.3"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div className="text-center space-y-2">
        <p className="text-base font-semibold text-gray-800">Generating Call Summary</p>
        <p className="text-sm text-violet-600 font-medium transition-all duration-500">
          {STEPS[stepIdx]}
        </p>
        <p className="text-xs text-gray-400 max-w-xs">
          AI is reviewing the full conversation. This usually takes 5–15 seconds.
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-500 ${
              i <= stepIdx ? 'bg-violet-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
