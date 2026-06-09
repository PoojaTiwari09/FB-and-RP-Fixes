import { PerformanceTier } from '@training/types/trainingResults.types';

interface ScoreCircleProps {
  score: number;
  maxScore: number;
  tier: PerformanceTier;
  tierLabel: string;
}

const TIER_COLORS: Record<PerformanceTier, string> = {
  excellent: 'var(--tier-excellent)',
  good: 'var(--tier-good)',
  'needs-improvement': 'var(--tier-needs-improvement)',
};

export default function ScoreCircle({
  score,
  maxScore,
  tier,
  tierLabel,
}: ScoreCircleProps) {
  const color = TIER_COLORS[tier];
  const percentage = (score / maxScore) * 100;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 144 144"
        >
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900">{score}</span>
          <span className="text-sm text-gray-400">/{maxScore}</span>
        </div>
      </div>
      <span
        className="mt-2 text-sm font-semibold"
        style={{ color }}
      >
        {tierLabel}
      </span>
    </div>
  );
}
