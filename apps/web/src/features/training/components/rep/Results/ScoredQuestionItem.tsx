import { ScoredQuestion } from '@training/types/trainingResults.types';
import { Lightbulb } from 'lucide-react';
import QuestionTagBadge from '@training/components/rep/Setup/QuestionTagBadge';

interface ScoredQuestionItemProps {
  question: ScoredQuestion;
}

export default function ScoredQuestionItem({ question }: ScoredQuestionItemProps) {
  return (
    <div className="flex items-start gap-3 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="mt-0.5 shrink-0">
        <Lightbulb size={18} className="text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 leading-relaxed">
          {question.text}
        </p>
        {question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {question.tags.map((tag) => (
              <QuestionTagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
