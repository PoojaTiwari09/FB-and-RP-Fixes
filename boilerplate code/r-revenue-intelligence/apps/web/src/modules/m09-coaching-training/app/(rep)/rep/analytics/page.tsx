'use client';

import { Award, BarChart2, CheckCircle2, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/cards/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useMyAnalytics } from '@/hooks/useAnalytics';
import { RepAnalyticsContent } from './rep-analytics-content';

export default function MyAnalyticsPage() {
  const query = useMyAnalytics();
  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorCard message={(query.error as Error)?.message} onRetry={() => query.refetch()} />;
  if (!query.data || (Array.isArray(query.data) && !query.data.length)) return <EmptyState title="No analytics yet" description="Complete a session to generate analytics." />;
  const rows = Array.isArray(query.data) ? query.data as Record<string, any>[] : [query.data as Record<string, any>];
  const avg = rows.reduce((sum, item) => sum + Number(item.overall_score ?? item.score ?? item.feedback_json?.overall_score ?? 0), 0) / rows.length;
  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">My Analytics</h1><p className="text-sm text-gray-500">Trends, talk ratio, and skill performance from real sessions.</p></div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Award} label="Avg Score" value={Math.round(avg)} />
        <StatCard icon={BarChart2} label="Sessions Completed" value={rows.length} />
        <StatCard icon={CheckCircle2} label="Assignments Done" value={rows.filter((item) => item.assignment_id || item.feedback_json?.is_assignment).length} />
        <StatCard icon={TrendingUp} label="Improvement %" value={`${Math.round(Number(rows.at(-1)?.improvement ?? 0))}%`} />
      </div>
      <RepAnalyticsContent data={query.data} />
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">Benchmark Comparison</h2><p className="mt-2 text-sm text-gray-500">My score: {Math.round(avg)}. Team benchmark appears when the backend includes comparison data in this endpoint.</p></div>
    </section>
  );
}
