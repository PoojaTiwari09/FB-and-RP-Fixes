'use client';

import type { CoachingParams } from '@revenue/types/coaching.types';
import { useCoachingActivity, useCoachingInteraction, useCoachingResponsiveness, useCoachingScorecards } from '@revenue/hooks/useCoachingData';
import ActivityTab from './ActivityTab';
import InteractionTab from './InteractionTab';
import ResponsivenessTab from './ResponsivenessTab';
import ScorecardsTab from './ScorecardsTab';

type TabId = 'activity' | 'interaction' | 'responsiveness' | 'scorecards';

const TABS: { id: TabId; label: string }[] = [
  { id: 'activity',      label: 'Activity'      },
  { id: 'interaction',   label: 'Interaction'   },
  { id: 'responsiveness',label: 'Responsiveness'},
  { id: 'scorecards',    label: 'Scorecards'    },
];

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  params: CoachingParams;
}

function TabContent({ activeTab, params }: { activeTab: TabId; params: CoachingParams }) {
  const activity      = useCoachingActivity(params);
  const interaction   = useCoachingInteraction(params);
  const responsiveness = useCoachingResponsiveness(params);
  const scorecards    = useCoachingScorecards(params);

  switch (activeTab) {
    case 'activity':
      return <ActivityTab data={activity.data} isLoading={activity.isLoading} />;
    case 'interaction':
      return <InteractionTab data={interaction.data} isLoading={interaction.isLoading} />;
    case 'responsiveness':
      return <ResponsivenessTab data={responsiveness.data} isLoading={responsiveness.isLoading} />;
    case 'scorecards':
      return <ScorecardsTab data={scorecards.data} isLoading={scorecards.isLoading} />;
  }
}

export default function CoachingTabs({ activeTab, onTabChange, params }: Props) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-white px-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <TabContent activeTab={activeTab} params={params} />
      </div>
    </div>
  );
}

export type { TabId };
