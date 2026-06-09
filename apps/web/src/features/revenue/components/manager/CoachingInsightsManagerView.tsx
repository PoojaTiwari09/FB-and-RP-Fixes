'use client';

import { useState } from 'react';
import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';
import CoachingFilterBar from './coaching/CoachingFilterBar';
import CoachingTabs, { type TabId } from './coaching/CoachingTabs';
import AiInsightsPanel from './coaching/AiInsightsPanel';
import {
  useCoachingFilters,
  useAiInsights,
  useTeamVsBenchmark,
} from '@revenue/hooks/useCoachingData';
import type { CoachingParams } from '@revenue/types/coaching.types';

export default function CoachingInsightsManagerView() {
  const [params, setParams] = useState<CoachingParams>({
    period: 'Last 30 days',
    teamId: undefined,
  });
  const [activeTab, setActiveTab] = useState<TabId>('interaction');

  const filters   = useCoachingFilters();
  const aiInsights = useAiInsights(params);
  const benchmark  = useTeamVsBenchmark(params);

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50">
      {/* Page Header */}
      <PageHeader
        title="Coaching Insights"
        badge={<RoleBadge role="sales_manager" />}
        subtitle="AI-generated coaching recommendations based on team call patterns and deal outcomes."
      />

      {/* Filter Bar */}
      <CoachingFilterBar
        filters={filters.data}
        params={params}
        onChange={setParams}
        isLoading={filters.isLoading}
      />

      {/* Main content: 2-column layout */}
      <div className="flex flex-1 min-h-0 gap-0">
        {/* Left: Tabs */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0">
          <CoachingTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            params={params}
          />
        </div>

        {/* Right: AI Insights Panel */}
        <div className="w-80 shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
          <AiInsightsPanel
            insights={aiInsights.data}
            benchmark={benchmark.data}
            isLoadingInsights={aiInsights.isLoading}
            isLoadingBenchmark={benchmark.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
