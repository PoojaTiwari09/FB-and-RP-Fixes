'use client';

import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { PlaybookSection as PlaybookSectionType } from '@shared/types/shared.types';
import PlaybookQuestionItem from './PlaybookQuestionItem';

interface PlaybookSectionProps {
  section: PlaybookSectionType;
  defaultOpen?: boolean;
}

export default function PlaybookSection({
  section,
  defaultOpen = false,
}: PlaybookSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Section header (clickable) */}
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
          <span className="text-sm font-semibold text-gray-800">
            {section.title}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            ({section.questions.length})
          </span>
        </div>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="divide-y divide-gray-100 bg-white">
          {section.questions.map((question) => (
            <PlaybookQuestionItem key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
}
