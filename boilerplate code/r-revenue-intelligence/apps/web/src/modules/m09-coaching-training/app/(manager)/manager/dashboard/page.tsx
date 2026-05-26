'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Activity, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { StatCard } from '@/components/cards/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { analyticsService } from '@/services/analytics.service';

export default function ManagerDashboardPage() {
  const query = useQuery({ queryKey: ['manager', 'dashboard'], queryFn: () => analyticsService.getDashboard(), staleTime: 1000 * 60 * 5, retry: 2 });
  const activityQ = useQuery({ queryKey: ['manager', 'activity'], queryFn: () => analyticsService.getActivityMetrics(), staleTime: 1000 * 60 * 5 });
  const interactionsQ = useQuery({ queryKey: ['manager', 'interactions'], queryFn: () => analyticsService.getInteractionAnalytics(), staleTime: 1000 * 60 * 5 });
  const topicsQ = useQuery({ queryKey: ['manager', 'topics'], queryFn: () => analyticsService.getTopicInsights(), staleTime: 1000 * 60 * 5 });
  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorCard message={(query.error as Error)?.message} onRetry={() => query.refetch()} />;
  if (!query.data) return <EmptyState title="No dashboard data" description="Team analytics will appear when the backend returns data." />;
  const d = query.data;
  const trend = d.scoreTrend ?? (d.trends ? Object.entries(d.trends).map(([date, score]) => ({ date, score })) : []);
  const completion = d.assignmentCompletion ?? [{ name: 'Completed', value: d.completionRate ?? 0 }, { name: 'Remaining', value: Math.max(0, 100 - Number(d.completionRate ?? 0)) }];
  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Team Dashboard</h1><p className="text-sm text-gray-500">Live team coaching performance.</p></div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={TrendingUp} label="Team Avg Score" value={Math.round(Number(d.avgTeamScore ?? 0))} />
        <StatCard icon={Users} label="Active Reps" value={Number(d.totalReps ?? 0)} />
        <StatCard icon={CheckCircle2} label="Completion Rate" value={`${Math.round(Number(d.completionRate ?? 0))}%`} />
        <StatCard icon={Activity} label="Engagement Rate" value={`${Math.round(Number(activityQ.data?.engagementRate ?? 0))}`} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2"><h2 className="font-bold text-gray-900">Score Trend</h2><div className="mt-4 h-72"><ResponsiveContainer><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line dataKey="score" stroke="#4f46e5" strokeWidth={3} /></LineChart></ResponsiveContainer></div></div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">Assignment Completion</h2><div className="mt-4 h-72"><ResponsiveContainer><PieChart><Pie data={completion} dataKey="value" nameKey="name" innerRadius={70}>{completion.map((_, i) => <Cell key={i} fill={i === 0 ? '#4f46e5' : '#cbd5e1'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <TeamTable title="Top Performers" rows={d.topPerformers ?? []} />
        <TeamTable title="At-risk Reps" rows={d.atRiskReps ?? []} />
      </div>

      {topicsQ.data && (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-gray-900">Topic & Objection Insights</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer>
                <BarChart data={topicsQ.data} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="topic" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-gray-900">Interaction Analytics</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500">Avg Talk Ratio</p>
                <p className="mt-2 text-3xl font-bold text-indigo-600">{interactionsQ.data?.avgTalkRatio ?? 0}%</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500">Avg Discovery Qs</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">{interactionsQ.data?.avgQuestionsAsked ?? 0}</p>
              </div>
              <div className="col-span-2 rounded-xl bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500">Avg Closing Attempts</p>
                <p className="mt-2 text-3xl font-bold text-purple-600">{interactionsQ.data?.avgClosingAttempts ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function TeamTable({ title, rows }: { title: string; rows: Array<Record<string, string | number>> }) {
  return <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">{title}</h2>{rows.length ? <div className="mt-4 space-y-3">{rows.slice(0, 5).map((row, index) => <Link key={index} href={`/manager/calls/${row.sessionId || row.id || ''}`} className="flex justify-between rounded-xl bg-gray-50 p-3 text-sm"><span>{row.name || row.repName || row.email}</span><strong>{row.score || row.avgScore || row.overall_score}</strong></Link>)}</div> : <p className="mt-4 text-sm text-gray-500">No rows returned.</p>}</div>;
}
