import { Lightbulb } from 'lucide-react';
import { PlaybookQuestion } from '@shared/types/shared.types';
import QuestionTagBadge from './QuestionTagBadge';

interface PlaybookQuestionItemProps {
  question: PlaybookQuestion;
}

export default function PlaybookQuestionItem({ question }: PlaybookQuestionItemProps) {
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
        {question.whyItMatters && (
          <details className="mt-2 group">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors select-none">
              Why this question matters
            </summary>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed pl-0.5">
              {question.whyItMatters}
            </p>
          </details>
        )}
      </div>
    </div>
  );
}
