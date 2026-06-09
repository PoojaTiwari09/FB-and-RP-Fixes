'use client';

import { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { ScoredPlaybookSection as ScoredPlaybookSectionType } from '@training/types/trainingResults.types';
import ScoredQuestionItem from './ScoredQuestionItem';

interface ScoredPlaybookSectionProps {
  section: ScoredPlaybookSectionType;
  defaultOpen?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  'needs-practice': {
    label: 'Needs Practice',
    bg: 'var(--status-in-progress-bg)',
    text: 'var(--status-in-progress-text)',
  },
  'on-track': {
    label: 'On Track',
    bg: '#dbeafe',
    text: '#2563eb',
  },
  mastered: {
    label: 'Mastered',
    bg: 'var(--status-completed-bg)',
    text: 'var(--status-completed-text)',
  },
};

export default function ScoredPlaybookSection({
  section,
  defaultOpen = false,
}: ScoredPlaybookSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const statusConfig = STATUS_CONFIG[section.status] ?? STATUS_CONFIG['needs-practice'];

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Section header */}
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

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500">
            Score: {section.score}/{section.maxScore}
          </span>
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
          >
            {statusConfig.label}
          </span>
        </div>
      </button>

      {/* Collapsible questions */}
      {isOpen && (
        <div className="divide-y divide-gray-100 bg-white">
          {section.questions.map((question) => (
            <ScoredQuestionItem key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
}
