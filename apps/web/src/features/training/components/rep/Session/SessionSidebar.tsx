import { SessionContext, ScorecardSectionStatus } from '@training/types/trainingSession.types';
import { SidebarTab } from '@training/hooks/useTrainingSession';
import BackgroundTab from './BackgroundTab';
import ScorecardTab from './ScorecardTab';

interface SessionSidebarProps {
  context: SessionContext;
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  sectionStatuses: Record<string, ScorecardSectionStatus>;
}

export default function SessionSidebar({
  context,
  activeTab,
  onTabChange,
  sectionStatuses,
}: SessionSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Tab header */}
      <div className="flex border-b border-gray-200 shrink-0">
        <button
          onClick={() => onTabChange('background')}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
            activeTab === 'background'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Background
        </button>
        <button
          onClick={() => onTabChange('scorecard')}
          className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
            activeTab === 'scorecard'
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Scorecard
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'background' ? (
          <BackgroundTab context={context} />
        ) : (
          <ScorecardTab sections={context.playbookSections} sectionStatuses={sectionStatuses} />
        )}
      </div>
    </div>
  );
}
