import { QuestionTag } from '@shared/types/shared.types';

interface QuestionTagBadgeProps {
  tag: QuestionTag;
}

const TAG_CONFIG: Record<QuestionTag, { label: string; bg: string; text: string }> = {
  'high-impact': {
    label: 'High Impact',
    bg: 'var(--tag-high-impact-bg)',
    text: 'var(--tag-high-impact-text)',
  },
  'missed-last-attempt': {
    label: 'Missed in last attempt',
    bg: 'var(--tag-missed-bg)',
    text: 'var(--tag-missed-text)',
  },
};

export default function QuestionTagBadge({ tag }: QuestionTagBadgeProps) {
  const config = TAG_CONFIG[tag];

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}
