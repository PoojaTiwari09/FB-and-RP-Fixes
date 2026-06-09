import { TrendingUp } from 'lucide-react';
import { TrainingResultsPage } from '@training/types/trainingResults.types';
import ScoreCircle from './ScoreCircle';
import PerformanceTagPill from './PerformanceTagPill';

interface OverallScoreCardProps {
  data: TrainingResultsPage;
}

export default function OverallScoreCard({ data }: OverallScoreCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Left — Score gauge */}
        <div className="shrink-0">
          <ScoreCircle
            score={data.overallScore}
            maxScore={data.maxScore}
            tier={data.performanceTier}
            tierLabel={data.tierLabel}
          />
        </div>

        {/* Right — Summary */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">
              Overall Performance
            </h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            {data.summaryText}
          </p>
          <div className="flex flex-wrap gap-2">
            {data.performanceTags.map((tag) => (
              <PerformanceTagPill key={tag.id} tag={tag} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
