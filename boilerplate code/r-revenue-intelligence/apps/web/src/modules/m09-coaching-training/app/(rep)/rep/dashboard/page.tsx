'use client';

import { Award, BarChart2, BookOpen, TrendingUp } from 'lucide-react';
import { useMyAnalytics } from '@/hooks/useAnalytics';
import { StatCard } from '@/components/cards/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { RepAnalyticsContent } from '../analytics/rep-analytics-content';

import { analyticsService } from '@/services/analytics.service';
import { useQuery } from '@tanstack/react-query';

export default function RepDashboardPage() {
  const query = useMyAnalytics();
  const benchmarksQ = useQuery({ queryKey: ['rep', 'benchmarks'], queryFn: () => analyticsService.getBenchmarks(), staleTime: 1000 * 60 * 5 });
  if (query.isLoading || benchmarksQ.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorCard message={(query.error as Error)?.message} onRetry={() => query.refetch()} />;
  if (!query.data || (Array.isArray(query.data) && !query.data.length)) return <EmptyState title="No analytics yet" description="Complete a practice session to populate your dashboard." />;
  const data = Array.isArray(query.data) ? query.data : [query.data];
  const latest = data[data.length - 1] as Record<string, any>;
  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1><p className="text-sm text-gray-500">Your latest coaching signal from completed sessions.</p></div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Award} label="Avg Score" value={Math.round(Number(latest?.overall_score ?? latest?.score ?? 0))} />
        <StatCard icon={BookOpen} label="Sessions" value={data.length} />
        <StatCard icon={TrendingUp} label="Improvement" value={`${Math.round(Number(latest?.improvement ?? 0))}%`} />
        <StatCard icon={BarChart2} label="Talk Ratio" value={`${Math.round(Number(latest?.feedback_json?.objective_metrics?.talk_ratio_pct ?? 0))}%`} />
      </div>

      {benchmarksQ.data && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900">Your Metrics vs Team Targets</h2>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">Opening Score Target</p>
              <p className="mt-2 text-2xl font-bold text-indigo-600">{benchmarksQ.data.openingTarget}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">Discovery Target</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{benchmarksQ.data.discoveryTarget}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-sm text-gray-500">Closing Target</p>
              <p className="mt-2 text-2xl font-bold text-purple-600">{benchmarksQ.data.closingTarget}</p>
            </div>
          </div>
        </div>
      )}
      <RepAnalyticsContent data={query.data} compact />
    </section>
  );
}
