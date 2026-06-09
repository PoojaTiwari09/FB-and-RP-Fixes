import { Sparkles } from 'lucide-react';
import {
  ScoredPlaybookSection as ScoredPlaybookSectionType,
  PerformanceBreakdownItem,
} from '@training/types/trainingResults.types';
import ScoredPlaybookSection from './ScoredPlaybookSection';
import PerformanceBreakdown from './PerformanceBreakdown';

interface EvaluationSummaryProps {
  sections: ScoredPlaybookSectionType[];
  performanceBreakdown: PerformanceBreakdownItem[];
  trainingTitle: string;
}

export default function EvaluationSummary({
  sections,
  performanceBreakdown,
  trainingTitle,
}: EvaluationSummaryProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={18} className="text-purple-500" />
        <h3 className="text-base font-semibold text-gray-900">Coaching Playbook</h3>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Master these questions to improve your {trainingTitle.toLowerCase()} performance
      </p>

      <div className="space-y-3">
        {sections.map((section, index) => (
          <ScoredPlaybookSection
            key={section.id}
            section={section}
            /* Discovery (index 0) is expanded by default on results page */
            defaultOpen={index === 0}
          />
        ))}
      </div>

      {/* Detailed Performance Breakdown — separate from coaching playbook */}
      <PerformanceBreakdown items={performanceBreakdown} />
    </div>
  );
}
