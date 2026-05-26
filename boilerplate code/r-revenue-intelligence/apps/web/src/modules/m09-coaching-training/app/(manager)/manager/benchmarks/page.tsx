'use client';

import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { analyticsService } from '@/services/analytics.service';

export default function BenchmarksPage() {
  const query = useQuery({ queryKey: ['manager', 'benchmarks'], queryFn: () => analyticsService.getBenchmarks(), staleTime: 1000 * 60 * 5, retry: 2 });
  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorCard message={(query.error as Error)?.message} onRetry={() => query.refetch()} />;
  if (!query.data) return <EmptyState title="No benchmarks" description="Benchmarks appear when the backend returns benchmark data." />;
  const categories = query.data.categories ?? [];
  const distribution = query.data.distribution ?? [];
  const comparison = query.data.comparison ?? [];
  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Benchmarks</h1><p className="text-sm text-gray-500">Team performance bands and comparisons.</p></div>
      <div className="grid gap-4 md:grid-cols-3">{categories.map((item, index) => <div key={index} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{item.name || item.category}</p><p className="mt-2 text-3xl font-bold text-gray-900">{item.value || item.score}</p><span className="mt-3 inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">{item.band || 'Performance band'}</span></div>)}</div>
      <div className="grid gap-4 xl:grid-cols-2"><Chart title="Percentile Distribution" data={distribution} type="area" /><Chart title="Team vs Industry" data={comparison} type="bar" /></div>
    </section>
  );
}

function Chart({ title, data, type }: { title: string; data: Array<Record<string, string | number>>; type: 'area' | 'bar' }) {
  const keys = Object.keys(data[0] ?? {});
  const nameKey = keys[0] || 'name';
  const valueKey = keys[1] || 'value';
  return <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">{title}</h2><div className="mt-4 h-80"><ResponsiveContainer>{type === 'area' ? <AreaChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={nameKey} /><YAxis /><Tooltip /><Area dataKey={valueKey} stroke="#4f46e5" fill="#c7d2fe" /></AreaChart> : <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={nameKey} /><YAxis /><Tooltip /><Bar dataKey={valueKey} fill="#4f46e5" radius={[8, 8, 0, 0]} /></BarChart>}</ResponsiveContainer></div></div>;
}
