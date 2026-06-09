import { PlaybookSection as PlaybookSectionType } from '@shared/types/shared.types';
import PlaybookSection from './PlaybookSection';

interface CoachingPlaybookProps {
  sections: PlaybookSectionType[];
  trainingTitle: string;
}

export default function CoachingPlaybook({ sections, trainingTitle }: CoachingPlaybookProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">
        Coaching Playbook
      </h2>
      <p className="text-sm text-gray-500 mb-5">
        Master these questions to improve your {trainingTitle.toLowerCase()} performance
      </p>

      <div className="space-y-3">
        {sections.map((section, index) => (
          <PlaybookSection
            key={section.id}
            section={section}
            /* Objection Handling (index 1) is expanded by default */
            defaultOpen={index === 1}
          />
        ))}
      </div>
    </div>
  );
}
