import { ReactNode } from 'react';
import { PlaybookSection } from '@shared/types/shared.types';
import { ScorecardSectionStatus } from '@training/types/trainingSession.types';
import { BarChart3, CheckCircle2, Circle, Clock } from 'lucide-react';

interface ScorecardTabProps {
  sections: PlaybookSection[];
  sectionStatuses: Record<string, ScorecardSectionStatus>;
}

const STATUS_CONFIG: Record<ScorecardSectionStatus, {
  label: string;
  badgeBg: string;
  badgeText: string;
  icon: ReactNode;
  rowBg: string;
}> = {
  'not-started': {
    label: 'Not Started',
    badgeBg: 'bg-gray-100',
    badgeText: 'text-gray-400',
    icon: <Circle size={14} className="text-gray-300" />,
    rowBg: 'bg-gray-50',
  },
  'in-progress': {
    label: 'In Progress',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-600',
    icon: <Clock size={14} className="text-amber-500" />,
    rowBg: 'bg-amber-50/40',
  },
  'completed': {
    label: 'Completed',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-600',
    icon: <CheckCircle2 size={14} className="text-emerald-500" />,
    rowBg: 'bg-emerald-50/40',
  },
};

export default function ScorecardTab({ sections, sectionStatuses }: ScorecardTabProps) {
  return (
    <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 size={16} className="text-gray-400" />
        <h4 className="text-sm font-semibold text-gray-700">Live Scorecard</h4>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Updates as you cover each coaching area.
      </p>

      <div className="space-y-3">
        {(sections || []).map((section) => {
          const status = sectionStatuses[section.id] ?? 'not-started';
          const config = STATUS_CONFIG[status];
          const questions = section.questions || [];

          return (
            <div
              key={section.id}
              className={`rounded-lg border border-gray-100 overflow-hidden transition-colors duration-300 ${config.rowBg}`}
            >
              {/* Section header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  {config.icon}
                  <p className="text-sm font-medium text-gray-700">{section.title}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${config.badgeBg} ${config.badgeText}`}>
                  {config.label}
                </span>
              </div>

              {/* Show questions as suggestions when in-progress or completed */}
              {(status === 'in-progress' || status === 'completed') && questions.length > 0 && (
                <div className="px-4 pb-3 border-t border-gray-100/80">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-2 mb-1.5 font-semibold">
                    {status === 'completed' ? 'Covered' : 'Suggestions'}
                  </p>
                  <ul className="space-y-1">
                    {questions.map((q) => (
                      <li key={q.id} className="flex items-start gap-1.5">
                        <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`} />
                        <span className="text-xs text-gray-600 leading-snug">{q.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Show question count hint when not started */}
              {status === 'not-started' && (
                <div className="px-4 pb-2.5">
                  <p className="text-xs text-gray-400">{questions.length} questions to cover</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
