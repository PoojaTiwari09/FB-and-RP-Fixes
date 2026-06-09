import { SessionContext } from '@training/types/trainingSession.types';
import SessionSidebarSection from './SessionSidebarSection';
import PlaybookSection from '@training/components/rep/Setup/PlaybookSection';

interface BackgroundTabProps {
  context: SessionContext;
}

export default function BackgroundTab({ context }: BackgroundTabProps) {
  return (
    <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      {/* Contact Persona */}
      <SessionSidebarSection title="Contact Persona">
        <p className="text-sm font-semibold text-gray-900">{context.persona.name}</p>
        <p className="text-xs text-gray-500">
          {context.persona.jobTitle} at {context.persona.company}
        </p>
      </SessionSidebarSection>

      {/* Motivations */}
      <SessionSidebarSection title="Motivations">
        <p className="text-sm text-gray-600 leading-relaxed">
          {context.persona.motivations}
        </p>
      </SessionSidebarSection>

      {/* Communication Style */}
      <SessionSidebarSection title="Communication Style">
        <p className="text-sm text-gray-600 leading-relaxed">
          {context.persona.communicationStyle}
        </p>
      </SessionSidebarSection>

      {/* Meeting Context */}
      <SessionSidebarSection title="Meeting Context">
        <div className="space-y-2">
          <div>
            <span className="text-xs font-semibold text-gray-500">Scenario</span>
            <p className="text-sm text-gray-700">{context.meetingContext.scenario}</p>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-500">Your Objective</span>
            <p className="text-sm text-gray-700 leading-relaxed">
              {context.meetingContext.objective}
            </p>
          </div>
          {context.meetingContext.backgroundForTrainee && (
            <div>
              <span className="text-xs font-semibold text-gray-500">Background</span>
              <p className="text-sm text-gray-700 leading-relaxed">
                {context.meetingContext.backgroundForTrainee}
              </p>
            </div>
          )}
        </div>
      </SessionSidebarSection>

      {/* Coaching Playbook (read-only reference) */}
      <SessionSidebarSection title="Coaching Playbook">
        <div className="space-y-2">
          {context.playbookSections.map((section, index) => (
            <PlaybookSection
              key={section.id}
              section={section}
              defaultOpen={index === 1}
            />
          ))}
        </div>
      </SessionSidebarSection>
    </div>
  );
}
