'use client';

import { useCoachingRepData } from '@revenue/hooks/useCoachingRepData';
import RepDetailsHeader from './coaching/rep-details/RepDetailsHeader';
import RepKpiCards from './coaching/rep-details/RepKpiCards';
import TrendChartPanel from './coaching/rep-details/TrendChartPanel';
import RecentCallsTable from './coaching/rep-details/RecentCallsTable';
import InsightListsPanel from './coaching/rep-details/InsightListsPanel';
import CoachingHistoryList from './coaching/rep-details/CoachingHistoryList';

interface CoachingRepManagerViewProps {
  repId: string;
}

export default function CoachingRepManagerView({ repId }: CoachingRepManagerViewProps) {
  const { data, isLoading } = useCoachingRepData(repId);

  if (isLoading || !data) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-50/50">
      <div className="max-w-[1400px] mx-auto p-6 md:p-8">
        <RepDetailsHeader header={data.header} />
        <RepKpiCards kpis={data.kpis} />
        <TrendChartPanel trend={data.trend} />
        <RecentCallsTable calls={data.recentCalls} />
        <InsightListsPanel patterns={data.observedPatterns} recommendations={data.recommendedActions} />
        <CoachingHistoryList history={data.coachingHistory} />
      </div>
    </div>
  );
}
