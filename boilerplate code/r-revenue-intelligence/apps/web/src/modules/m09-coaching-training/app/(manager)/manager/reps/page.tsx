'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { analyticsService } from '@/services/analytics.service';

export default function RepsPage() {
  const [sort, setSort] = useState<'name' | 'score'>('score');
  const query = useQuery({ queryKey: ['manager', 'reps'], queryFn: () => analyticsService.getReps(), staleTime: 1000 * 60 * 5, retry: 2 });
  const rows = useMemo(() => [...(query.data ?? [])].sort((a, b) => sort === 'score' ? Number(b.overall_score ?? b.avgScore ?? 0) - Number(a.overall_score ?? a.avgScore ?? 0) : a.name.localeCompare(b.name)), [query.data, sort]);
  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorCard message={(query.error as Error)?.message} onRetry={() => query.refetch()} />;
  if (!rows.length) return <EmptyState title="No rep stats" description="Rep performance appears when the backend has sessions." />;
  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Rep Performance</h1><p className="text-sm text-gray-500">Leaderboard and benchmark comparison.</p></div>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="p-4">Rank</th><th><button onClick={() => setSort('name')}>Name</button></th><th><button onClick={() => setSort('score')}>Avg Score</button></th><th>Sessions</th><th>Completion %</th><th>Trend</th><th /></tr></thead><tbody>{rows.map((rep, index) => <tr key={rep.id} className="border-t border-gray-100"><td className="p-4 font-semibold">{index < 3 ? ['1st', '2nd', '3rd'][index] : index + 1}</td><td>{rep.name}</td><td>{Math.round(Number(rep.overall_score ?? rep.avgScore ?? 0))}</td><td>{rep.session_count ?? rep.sessions ?? 0}</td><td>{rep.completionRate ?? '-'}</td><td className={rep.trend === 'down' ? 'text-red-600' : 'text-green-600'}>{rep.trend ?? 'stable'}</td><td><Button asChild variant="outline" className="rounded-xl"><Link href={`/manager/reps/${rep.id}`}>Drilldown</Link></Button></td></tr>)}</tbody></table></div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">Benchmark Comparison</h2><div className="mt-4 h-80"><ResponsiveContainer><BarChart data={rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="overall_score" fill="#4f46e5" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
    </section>
  );
}
