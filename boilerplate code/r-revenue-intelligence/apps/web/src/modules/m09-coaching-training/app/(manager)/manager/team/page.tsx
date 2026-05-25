'use client';

import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { analyticsService } from '@/services/analytics.service';

export default function TeamAnalyticsPage() {
  const query = useQuery({ queryKey: ['manager', 'team'], queryFn: () => analyticsService.getTeam(), staleTime: 1000 * 60 * 5, retry: 2 });
  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorCard message={(query.error as Error)?.message} onRetry={() => query.refetch()} />;
  if (!query.data) return <EmptyState title="No team analytics" description="Team analytics appears once sessions exist." />;
  const d = query.data;
  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Team Analytics</h1><p className="text-sm text-gray-500">Engagement, activity, and completion trends.</p></div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Chart title="Completion Trends" data={d.trendData ?? []} type="area" />
        <Chart title="Performance Distribution" data={d.scenarioData ?? []} type="bar" />
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">Weekly Activity Heatmap</h2><div className="mt-4 grid grid-cols-7 gap-2">{(d.heatmapData ?? []).map((cell, index) => <div key={index} className="h-12 rounded bg-indigo-100" style={{ opacity: Math.max(0.2, Number(cell.value ?? cell.count ?? 1) / 10) }} />)}</div></div>
    </section>
  );
}

function Chart({ title, data, type }: { title: string; data: Array<Record<string, string | number>>; type: 'bar' | 'area' }) {
  const valueKey = Object.keys(data[0] ?? {}).find((key) => key !== 'date' && key !== 'name' && key !== 'type') || 'score';
  const nameKey = Object.keys(data[0] ?? {}).find((key) => key === 'date' || key === 'name' || key === 'type') || 'date';
  return <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">{title}</h2><div className="mt-4 h-80"><ResponsiveContainer>{type === 'area' ? <AreaChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={nameKey} /><YAxis /><Tooltip /><Area dataKey={valueKey} fill="#c7d2fe" stroke="#4f46e5" /></AreaChart> : <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={nameKey} /><YAxis /><Tooltip /><Bar dataKey={valueKey} fill="#4f46e5" radius={[8, 8, 0, 0]} /></BarChart>}</ResponsiveContainer></div></div>;
}
